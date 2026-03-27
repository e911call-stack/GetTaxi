import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAppStore } from '@/lib/store'
import { LandingPage } from '@/pages/LandingPage'
import { AuthPage } from '@/pages/AuthPage'
import { PassengerPage } from '@/pages/PassengerPage'
import { DriverPage } from '@/pages/DriverPage'
import { AdminPage } from '@/pages/AdminPage'
import '@/i18n'

function App() {
  const { language } = useAppStore()

  // Sync HTML dir/lang with stored language
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#F8F4E8',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: '16px',
            fontFamily: '"Cairo", sans-serif',
            fontSize: '14px',
            direction: language === 'ar' ? 'rtl' : 'ltr',
          },
          success: {
            iconTheme: { primary: '#FFD700', secondary: '#0A0A0A' },
          },
          error: {
            iconTheme: { primary: '#E63946', secondary: '#0A0A0A' },
          },
          duration: 3000,
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/request" element={<PassengerPage />} />
        <Route path="/driver" element={<DriverPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
