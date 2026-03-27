-- ============================================================
-- YellowWant.jo — Supabase SQL Setup Script
-- Run this in the Supabase SQL Editor (in order)
-- ============================================================

-- ─── 0. Enable PostGIS extension ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. PROFILES table ───────────────────────────────────────────────────────
-- Extends Supabase auth.users with role and display info
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'passenger'
                CHECK (role IN ('passenger', 'driver', 'admin')),
  display_name TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, role)
  VALUES (
    NEW.id,
    NEW.phone,
    'passenger'   -- default role; admin upgrades drivers manually
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── 2. TAXIS table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.taxis (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid                UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plate              TEXT NOT NULL UNIQUE,
  driver_name        TEXT NOT NULL,
  location           GEOGRAPHY(POINT, 4326),        -- PostGIS geography column
  is_online          BOOLEAN NOT NULL DEFAULT FALSE,
  no_show_count      INTEGER NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'offline'
                       CHECK (status IN ('idle', 'on_trip', 'offline')),
  license_plate_url  TEXT,                           -- Supabase Storage URL
  car_make_model     TEXT NOT NULL DEFAULT 'Toyota Corolla',
  company            TEXT,
  verified           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for fast geo queries
CREATE INDEX IF NOT EXISTS taxis_location_idx
  ON public.taxis USING GIST (location);

CREATE INDEX IF NOT EXISTS taxis_is_online_idx
  ON public.taxis (is_online);

-- ─── 3. REQUESTS table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.requests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_uid       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  taxi_id             UUID REFERENCES public.taxis(id) ON DELETE SET NULL,
  pickup_lat          DOUBLE PRECISION NOT NULL,
  pickup_lng          DOUBLE PRECISION NOT NULL,
  pickup_address      TEXT,
  destination_address TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN (
                          'pending', 'accepted', 'driver_arrived',
                          'in_progress', 'completed', 'cancelled', 'no_show'
                        )),
  anonymous_channel   BOOLEAN NOT NULL DEFAULT FALSE,
  temp_channel_token  TEXT,                          -- UUID token for anon chat
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at         TIMESTAMPTZ,
  arrived_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS requests_passenger_uid_idx ON public.requests (passenger_uid);
CREATE INDEX IF NOT EXISTS requests_taxi_id_idx        ON public.requests (taxi_id);
CREATE INDEX IF NOT EXISTS requests_status_idx         ON public.requests (status);

-- ─── 4. CHAT MESSAGES table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id   UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  sender_role  TEXT NOT NULL CHECK (sender_role IN ('passenger', 'driver')),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_request_id_idx ON public.chat_messages (request_id);

-- ─── 5. STORED FUNCTIONS / RPCs ──────────────────────────────────────────────

-- 5a. Get nearby taxis within radius_km using PostGIS ST_DWithin
CREATE OR REPLACE FUNCTION public.get_nearby_taxis(
  passenger_lat DOUBLE PRECISION,
  passenger_lng DOUBLE PRECISION,
  radius_km     DOUBLE PRECISION DEFAULT 2.0
)
RETURNS TABLE (
  id              UUID,
  uid             UUID,
  plate           TEXT,
  driver_name     TEXT,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  is_online       BOOLEAN,
  no_show_count   INTEGER,
  status          TEXT,
  car_make_model  TEXT,
  company         TEXT,
  verified        BOOLEAN,
  distance_m      DOUBLE PRECISION
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.uid,
    t.plate,
    t.driver_name,
    ST_Y(t.location::geometry)::DOUBLE PRECISION AS lat,
    ST_X(t.location::geometry)::DOUBLE PRECISION AS lng,
    t.is_online,
    t.no_show_count,
    t.status,
    t.car_make_model,
    t.company,
    t.verified,
    ST_Distance(
      t.location,
      ST_SetSRID(ST_MakePoint(passenger_lng, passenger_lat), 4326)::geography
    ) AS distance_m
  FROM public.taxis t
  WHERE
    t.is_online = TRUE
    AND t.status = 'idle'
    AND t.verified = TRUE
    AND ST_DWithin(
      t.location,
      ST_SetSRID(ST_MakePoint(passenger_lng, passenger_lat), 4326)::geography,
      radius_km * 1000   -- convert km → metres
    )
  ORDER BY distance_m ASC
  LIMIT 20;
END;
$$;

-- 5b. Update taxi GPS location atomically
CREATE OR REPLACE FUNCTION public.update_taxi_location(
  p_taxi_id UUID,
  p_lat     DOUBLE PRECISION,
  p_lng     DOUBLE PRECISION
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.taxis
  SET location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  WHERE id = p_taxi_id;
END;
$$;

-- 5c. Increment no-show counter for passenger and taxi
CREATE OR REPLACE FUNCTION public.increment_no_show(p_request_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_taxi_id UUID;
BEGIN
  SELECT taxi_id INTO v_taxi_id FROM public.requests WHERE id = p_request_id;
  IF v_taxi_id IS NOT NULL THEN
    UPDATE public.taxis SET no_show_count = no_show_count + 1 WHERE id = v_taxi_id;
  END IF;
END;
$$;

-- 5d. Admin stats aggregate
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_drivers',          (SELECT COUNT(*) FROM public.taxis),
    'active_drivers',         (SELECT COUNT(*) FROM public.taxis WHERE is_online = TRUE),
    'pending_verifications',  (SELECT COUNT(*) FROM public.taxis WHERE verified = FALSE),
    'total_rides',            (SELECT COUNT(*) FROM public.requests WHERE status = 'completed')
  ) INTO result;
  RETURN result;
END;
$$;

-- 5e. Generate temp channel token when driver presses "I'm Here"
CREATE OR REPLACE FUNCTION public.generate_temp_channel(p_request_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token TEXT;
BEGIN
  v_token := encode(gen_random_bytes(16), 'hex');
  UPDATE public.requests
  SET temp_channel_token = v_token
  WHERE id = p_request_id;
  RETURN v_token;
END;
$$;

-- ─── 6. ROW-LEVEL SECURITY (RLS) ─────────────────────────────────────────────

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxis           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages   ENABLE ROW LEVEL SECURITY;

-- ── profiles ──
-- Users can read/update their own profile
CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "profiles: admin read all"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ── taxis ──
-- Anyone (incl. anon) can read online verified taxis (for the map)
CREATE POLICY "taxis: public read online"
  ON public.taxis FOR SELECT
  USING (is_online = TRUE AND verified = TRUE);

-- Drivers can read/update their own taxi record
CREATE POLICY "taxis: driver read own"
  ON public.taxis FOR SELECT
  USING (uid = auth.uid());

CREATE POLICY "taxis: driver update own"
  ON public.taxis FOR UPDATE
  USING (uid = auth.uid());

-- Admin can do everything
CREATE POLICY "taxis: admin all"
  ON public.taxis FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ── requests ──
-- Passenger can read/insert their own requests
CREATE POLICY "requests: passenger read own"
  ON public.requests FOR SELECT
  USING (passenger_uid = auth.uid());

CREATE POLICY "requests: passenger insert"
  ON public.requests FOR INSERT
  WITH CHECK (passenger_uid = auth.uid());

CREATE POLICY "requests: passenger cancel"
  ON public.requests FOR UPDATE
  USING (
    passenger_uid = auth.uid()
    AND status IN ('pending', 'accepted')
  );

-- Driver can read requests assigned to them
CREATE POLICY "requests: driver read assigned"
  ON public.requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.taxis t
      WHERE t.id = requests.taxi_id AND t.uid = auth.uid()
    )
  );

-- Driver can update status on assigned requests
CREATE POLICY "requests: driver update assigned"
  ON public.requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.taxis t
      WHERE t.id = requests.taxi_id AND t.uid = auth.uid()
    )
  );

-- Admin full access
CREATE POLICY "requests: admin all"
  ON public.requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ── chat_messages ──
-- Both parties of an active request can read messages
CREATE POLICY "chat: read by parties"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = chat_messages.request_id
        AND (
          r.passenger_uid = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.taxis t WHERE t.id = r.taxi_id AND t.uid = auth.uid()
          )
        )
        AND r.status IN ('driver_arrived', 'in_progress')
    )
  );

-- Both parties can insert — but only when status allows
CREATE POLICY "chat: insert by parties"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = chat_messages.request_id
        AND (
          r.passenger_uid = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.taxis t WHERE t.id = r.taxi_id AND t.uid = auth.uid()
          )
        )
        AND r.status IN ('driver_arrived', 'in_progress')
    )
  );

-- ─── 7. SUPABASE REALTIME ─────────────────────────────────────────────────────
-- Enable realtime on these tables (run in Supabase Dashboard → Database → Replication
-- OR via SQL):
ALTER PUBLICATION supabase_realtime ADD TABLE public.taxis;
ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- ─── 8. STORAGE BUCKET for license photos ────────────────────────────────────
-- Run this from the Supabase dashboard (Storage → New bucket)
-- OR use the management API. SQL equivalent:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'license-photos',
  'license-photos',
  FALSE,                             -- private bucket
  5242880,                           -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: only the driver who owns the record can upload
CREATE POLICY "license photos: driver upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'license-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "license photos: admin read all"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'license-photos'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ─── 9. SEED: Create admin user ──────────────────────────────────────────────
-- After creating the admin user via Supabase Auth (phone/email),
-- run this to elevate them:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE phone = '+962XXXXXXXXX';   -- replace with your admin phone
--
-- ─────────────────────────────────────────────────────────────────────────────
-- DONE. Your YellowWant.jo database is ready.
-- ─────────────────────────────────────────────────────────────────────────────
