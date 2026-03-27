import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[YellowWant] Missing Supabase env vars. Copy .env.example → .env and fill in values.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// ─── Helper: get current user profile ─────────────────────────────────────────
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

// ─── Helper: get nearby taxis via PostGIS RPC ──────────────────────────────────
export async function getNearbyTaxis(lat: number, lng: number, radiusKm = 2) {
  const { data, error } = await supabase.rpc('get_nearby_taxis', {
    passenger_lat: lat,
    passenger_lng: lng,
    radius_km: radiusKm,
  })
  if (error) throw error
  return data
}

// ─── Helper: update taxi location ─────────────────────────────────────────────
export async function updateTaxiLocation(taxiId: string, lat: number, lng: number) {
  const { error } = await supabase.rpc('update_taxi_location', {
    p_taxi_id: taxiId,
    p_lat: lat,
    p_lng: lng,
  })
  if (error) throw error
}
