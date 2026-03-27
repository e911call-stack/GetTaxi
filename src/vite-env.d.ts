/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_WHATSAPP_DRIVER_NUMBER: string
  readonly VITE_APP_NAME: string
  readonly VITE_MAX_RADIUS_KM: string
  readonly VITE_DEFAULT_LANG: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
