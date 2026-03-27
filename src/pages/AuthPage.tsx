import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import toast from 'react-hot-toast'

type Step = 'phone' | 'otp'

export function AuthPage() {
  const { t } = useTranslation()
  const { language } = useAppStore()
  const isRTL = language === 'ar'

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const sendOtp = async () => {
    if (!phone) return
    setLoading(true)
    try {
      const formatted = phone.startsWith('+') ? phone : `+962${phone.replace(/^0/, '')}`
      const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
      if (error) throw error
      setStep('otp')
      toast.success(isRTL ? 'تم إرسال الرمز' : 'Code sent!')
    } catch {
      toast.error(t('generic_error'))
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!otp) return
    setLoading(true)
    try {
      const formatted = phone.startsWith('+') ? phone : `+962${phone.replace(/^0/, '')}`
      const { error } = await supabase.auth.verifyOtp({
        phone: formatted,
        token: otp,
        type: 'sms',
      })
      if (error) throw error
      toast.success(isRTL ? 'تم تسجيل الدخول!' : 'Logged in!')
      window.location.href = '/'
    } catch {
      toast.error(t('generic_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-taxi-black flex items-center justify-center px-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🚕</div>
          <h1 className="font-arabic text-taxi-yellow text-3xl font-bold">{t('app_name')}</h1>
          <p className="font-body text-taxi-gray-light text-sm mt-1">{t('amman_only')}</p>
        </div>

        {/* Card */}
        <div className="bg-taxi-black-soft rounded-3xl border border-taxi-yellow/20 p-8">
          {step === 'phone' ? (
            <>
              <label className="block font-arabic text-taxi-yellow text-lg font-semibold mb-4">
                {t('phone_number')}
              </label>
              <div className="flex gap-2 mb-6">
                <div className="flex items-center px-3 rounded-xl bg-taxi-black-mid border border-taxi-yellow/20 text-taxi-gray-light font-body text-sm whitespace-nowrap">
                  🇯🇴 +962
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="7xxxxxxxx"
                  className="flex-1 bg-taxi-black-mid border border-taxi-yellow/20 rounded-xl px-4 py-3 text-taxi-white-pure font-body focus:outline-none focus:border-taxi-yellow transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                />
              </div>
              <button
                onClick={sendOtp}
                disabled={loading || !phone}
                className="w-full py-4 rounded-2xl bg-taxi-yellow text-taxi-black font-arabic text-xl font-bold disabled:opacity-50 hover:bg-taxi-yellow-glow transition-colors active:scale-95"
              >
                {loading ? '...' : t('continue')}
              </button>
            </>
          ) : (
            <>
              <label className="block font-arabic text-taxi-yellow text-lg font-semibold mb-4">
                {t('enter_otp')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full bg-taxi-black-mid border border-taxi-yellow/20 rounded-xl px-4 py-4 text-taxi-white-pure text-center text-3xl tracking-[0.5em] font-body focus:outline-none focus:border-taxi-yellow mb-6"
                onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
              />
              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 4}
                className="w-full py-4 rounded-2xl bg-taxi-yellow text-taxi-black font-arabic text-xl font-bold disabled:opacity-50 hover:bg-taxi-yellow-glow transition-colors active:scale-95 mb-3"
              >
                {loading ? '...' : t('verify')}
              </button>
              <button
                onClick={() => setStep('phone')}
                className="w-full py-3 rounded-2xl border border-taxi-yellow/20 text-taxi-gray-light font-body text-sm hover:border-taxi-yellow/40 transition-colors"
              >
                {t('back')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
