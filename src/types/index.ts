// ─── Database Types ────────────────────────────────────────────────────────────

export type UserRole = 'passenger' | 'driver' | 'admin'
export type TaxiStatus = 'idle' | 'on_trip' | 'offline'
export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export interface Profile {
  id: string
  role: UserRole
  display_name: string | null
  phone: string | null
  created_at: string
}

export interface Taxi {
  id: string
  uid: string // FK → profiles.id
  plate: string
  driver_name: string
  // PostGIS geography stored as {lat, lng} after RPC
  lat: number
  lng: number
  is_online: boolean
  no_show_count: number
  status: TaxiStatus
  license_plate_url: string | null
  car_make_model: string
  company: string | null
  verified: boolean
  created_at: string
}

export interface RideRequest {
  id: string
  passenger_uid: string
  taxi_id: string | null
  pickup_lat: number
  pickup_lng: number
  pickup_address: string | null
  destination_address: string | null
  status: RequestStatus
  anonymous_channel: boolean // "إخفاء رقمي"
  temp_channel_token: string | null
  created_at: string
  accepted_at: string | null
  arrived_at: string | null
  completed_at: string | null
  // Joined data (not DB columns)
  taxi?: Taxi
}

export interface ChatMessage {
  id: string
  request_id: string
  sender_role: 'passenger' | 'driver'
  content: string
  created_at: string
}

// ─── App State Types ───────────────────────────────────────────────────────────

export interface GeoPoint {
  lat: number
  lng: number
}

export interface AppLanguage {
  code: 'ar' | 'en'
  dir: 'rtl' | 'ltr'
  label: string
}

export const LANGUAGES: AppLanguage[] = [
  { code: 'ar', dir: 'rtl', label: 'العربية' },
  { code: 'en', dir: 'ltr', label: 'English' },
]

// ─── Constants ─────────────────────────────────────────────────────────────────

export const AMMAN_CENTER: GeoPoint = { lat: 31.9539, lng: 35.9106 }
export const MAX_RADIUS_KM = 2
export const WHATSAPP_DRIVER_SIGNUP = 'https://wa.me/96200000000?text=%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A7%D9%84%D8%AA%D8%B3%D8%AC%D9%8A%D9%84%20%D9%83%D8%B3%D8%A7%D8%A6%D9%82%20%D8%AA%D8%A7%D9%83%D8%B3%D9%8A'
