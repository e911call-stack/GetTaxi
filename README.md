# 🚕 YellowWant.jo — يلو وانت

> **Fastest Yellow Taxi in Amman | أسرع تاكسي أصفر في عمّان**

A 100% browser-based platform connecting passengers directly to licensed yellow taxis in Amman, Jordan. No native apps required for passengers.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🌍 **Bilingual** | Arabic default (RTL) + English switcher |
| 📍 **2 km Radius** | PostGIS-powered proximity matching |
| 🔒 **Privacy Mode** | "إخفاء رقمي" — anonymous channel toggle |
| 💬 **Gated Chat** | WhatsApp/temp chat unlocks ONLY on "I'm Here" |
| 👤 **Driver Anonymity** | Driver sees "Anonymous Passenger" until arrival |
| 📱 **WhatsApp Signup** | Drivers register via WhatsApp — no email required |
| 🆓 **Free at Launch** | Zero commission, zero fees |
| 🗺️ **OpenStreetMap** | Leaflet.js + OSM — no Google Maps API needed |
| ⚙️ **Single Admin** | Owner-only admin panel |

---

## 🛠 Tech Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS
- **Backend/DB**: Supabase (Auth, Postgres + PostGIS, Realtime, Storage)
- **Maps**: Leaflet.js + OpenStreetMap
- **i18n**: i18next (Arabic default)
- **State**: Zustand (persisted)
- **Deployment**: Vercel

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- A free [Supabase](https://supabase.com) account

### 1. Clone & Install

```bash
git clone https://github.com/your-username/yellowwant-jo.git
cd yellowwant-jo
npm install
```

### 2. Set Up Supabase

1. Go to [app.supabase.com](https://app.supabase.com) → **New project**
2. Choose a name (e.g., `yellowwant-jo`), set a strong DB password, select region **Middle East (Bahrain)**
3. Once created, go to **SQL Editor** → **New query**
4. Paste the entire contents of `supabase/schema.sql` and click **Run**
5. This will:
   - Enable PostGIS extension
   - Create all tables (profiles, taxis, requests, chat_messages)
   - Create PostGIS spatial indexes
   - Register all RPC functions
   - Apply all RLS policies
   - Create storage bucket for license photos
   - Enable Realtime on key tables

### 3. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_WHATSAPP_DRIVER_NUMBER=96270XXXXXXX
```

Get your keys from: Supabase Dashboard → **Settings** → **API**

### 4. Enable Supabase Phone Auth

1. Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Phone** provider
3. Configure Twilio (or use Supabase's built-in SMS for testing):
   - For testing: enable "SMS OTP" in test mode — no Twilio needed
   - For production: add Twilio Account SID, Auth Token, and a Jordanian SMS sender

### 5. Create Admin User

After the app is running:
1. Sign in with your admin phone number via the app
2. In Supabase SQL Editor, run:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE phone = '+962XXXXXXXXX';  -- your phone number
```

### 6. Run Locally

```bash
npm run dev
```

Visit: **http://localhost:5173**

---

## 📁 Project Structure

```
yellowwant-jo/
├── public/
│   └── taxi-icon.svg
├── src/
│   ├── components/
│   │   └── LanguageSwitcher.tsx
│   ├── i18n/
│   │   └── index.ts          # AR + EN translations
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client + helpers
│   │   └── store.ts          # Zustand global state
│   ├── pages/
│   │   ├── LandingPage.tsx   # Main landing + hero
│   │   ├── AuthPage.tsx      # Phone OTP login
│   │   ├── PassengerPage.tsx # Map + taxi request
│   │   ├── DriverPage.tsx    # Driver portal
│   │   └── AdminPage.tsx     # Owner admin panel
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   ├── App.tsx               # Router
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles + Tailwind
├── supabase/
│   └── schema.sql            # Full DB schema + RLS + RPCs
├── .env.example
├── .gitignore
├── vercel.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 🌐 Deploy to Vercel

### Option A: Vercel CLI (recommended)

```bash
npm install -g vercel
vercel login
vercel --prod
```

When prompted, set environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_WHATSAPP_DRIVER_NUMBER`

### Option B: Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Framework: **Vite** (auto-detected)
4. Add environment variables in the **Environment Variables** section
5. Click **Deploy**

> The included `vercel.json` handles SPA routing (all paths → `index.html`).

---

## 🗄 Database Schema

```
profiles        — Auth users with role (passenger/driver/admin)
taxis           — Driver profiles with PostGIS location
requests        — Ride requests with status lifecycle
chat_messages   — Gated temporary chat (unlocks on driver_arrived)
```

### Request Status Flow

```
pending → accepted → driver_arrived → in_progress → completed
                                    ↘ no_show
       ↘ cancelled
```

### RLS Summary

| Table | Passenger | Driver | Admin |
|---|---|---|---|
| profiles | Own only | Own only | All |
| taxis | Read online+verified | Own record | All |
| requests | Own only | Assigned only | All |
| chat_messages | Active requests | Active requests | All |

---

## 🔧 Key RPCs (Supabase Functions)

| Function | Purpose |
|---|---|
| `get_nearby_taxis(lat, lng, km)` | PostGIS radius search |
| `update_taxi_location(id, lat, lng)` | Atomic GPS update |
| `increment_no_show(request_id)` | Increment no-show counter |
| `generate_temp_channel(request_id)` | Create anon chat token |
| `get_admin_stats()` | Dashboard aggregates |

---

## 📱 App Routes

| Route | Description |
|---|---|
| `/` | Landing page (bilingual hero) |
| `/auth` | Phone OTP login |
| `/request` | Passenger map + request flow |
| `/driver` | Driver portal (online toggle, requests) |
| `/admin` | Admin panel (owner only) |

---

## 🔒 Privacy & Security

- **Driver anonymity**: Driver sees only "Anonymous Passenger" until arrival
- **إخفاء رقمي**: Passenger's real number hidden behind a temporary channel token
- **Chat gating**: `chat_messages` RLS enforces `status IN ('driver_arrived', 'in_progress')`
- **Verified drivers only**: `get_nearby_taxis()` filters `verified = TRUE`
- **No-show tracking**: Automatic counter for unresponsive passengers
- **HTTPS only**: Enforced via Vercel headers
- **RLS everywhere**: No table is left without row-level security

---

## 🌍 Localization

- Default language: **Arabic (RTL)**
- Language switcher: persisted in localStorage via Zustand
- All strings in `src/i18n/index.ts`
- `document.dir` auto-switches on language change

---

## 📋 Next Steps (Post-Launch)

- [ ] Integrate Twilio for production SMS OTP
- [ ] Add fare estimation (distance × JOD rate)
- [ ] Driver earnings dashboard
- [ ] Passenger ride history
- [ ] Push notifications via Web Push API
- [ ] Progressive Web App (PWA) manifest
- [ ] Driver license photo upload flow
- [ ] Rating system (post-trip)

---

## 📞 Contact

- **WhatsApp Signup**: Configured in `.env` (`VITE_WHATSAPP_DRIVER_NUMBER`)
- **Admin**: Single owner account (phone-based)

---

*Built for Amman 🇯🇴 — يلو وانت*
