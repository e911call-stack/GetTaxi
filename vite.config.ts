import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'map-vendor':   ['leaflet', 'react-leaflet'],
          'supabase':     ['@supabase/supabase-js'],
          'i18n':         ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          'state':        ['zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
