import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import toast from 'react-hot-toast'

type Step = 'email' | 'sent'

export function AuthPage() {
  const { language } = useAppStore()
  const isRTL = language === 'ar'

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMagicLink = async () => {
    if (!email || !email.includes('@')) {
      toast.error(isRTL ? 'أدخل بريدًا إلكترونيًا صحيحًا' : 'Enter a valid email')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) throw error
      setStep('sent')
      toast.success(isRTL ? 'تم إرسال الرابط!' : 'Link sent!')
    } catch {
      toast.error(isRTL ? 'حدث خطأ، حاول مجددًا' : 'Something went wrong, try again')
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
          <h1 className="font-arabic text-taxi-yellow text-3xl font-bold">
            {isRTL ? 'يلو وانت' : 'YellowWant'}
          </h1>
          <p className="font-body text-taxi-gray-light text-sm mt-1">
            {isRTL ? 'عمّان، الأردن' : 'Amman, Jordan'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-taxi-black-soft rounded-3xl border border-taxi-yellow/20 p-8">

          {step === 'email' ? (
            <>
              <label className="block font-arabic text-taxi-yellow text-lg font-semibold mb-4">
                {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <p className="font-body text-taxi-gray-light text-sm mb-5">
                {isRTL
                  ? 'سنرسل لك رابطًا سريعًا لتسجيل الدخول — بدون كلمة مرور'
                  : 'We\'ll send you a quick login link — no password needed'}
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRTL ? 'example@gmail.com' : 'example@gmail.com'}
                className="w-full bg-taxi-black-mid border border-taxi-yellow/20 rounded-xl px-4 py-3 text-taxi-white-pure font-body focus:outline-none focus:border-taxi-yellow transition-colors mb-6 text-left"
                dir="ltr"
                onKeyDown={(e) => e.key === 'Enter' && sendMagicLink()}
              />
              <button
                onClick={sendMagicLink}
                disabled={loading || !email}
                className="w-full py-4 rounded-2xl bg-taxi-yellow text-taxi-black font-arabic text-xl font-bold disabled:opacity-50 hover:bg-taxi-yellow-glow transition-colors active:scale-95"
              >
                {loading
                  ? (isRTL ? 'جاري الإرسال...' : 'Sending...')
                  : (isRTL ? 'أرسل الرابط' : 'Send Link')}
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="font-arabic text-taxi-yellow text-2xl font-bold mb-3">
                {isRTL ? 'تحقق من بريدك!' : 'Check your email!'}
              </h2>
              <p className="font-body text-taxi-gray-light text-sm leading-relaxed mb-6">
                {isRTL
                  ? `أرسلنا رابط تسجيل الدخول إلى ${email} — افتح الرابط وستدخل تلقائيًا`
                  : `We sent a login link to ${email} — open it and you'll be signed in automatically`}
              </p>
              <div className="bg-taxi-black-mid rounded-2xl p-4 mb-6 border border-taxi-yellow/10">
                <p className="font-body text-taxi-gray-light text-xs">
                  {isRTL
                    ? '💡 تحقق من مجلد الرسائل غير المرغوبة (Spam) إذا لم يصلك'
                    : '💡 Check your spam/junk folder if you don\'t see it'}
                </p>
              </div>
              <button
                onClick={() => { setStep('email'); setEmail('') }}
                className="w-full py-3 rounded-2xl border border-taxi-yellow/20 text-taxi-gray-light font-body text-sm hover:border-taxi-yellow/40 transition-colors"
              >
                {isRTL ? 'استخدام بريد آخر' : 'Use a different email'}
              </button>
            </div>
          )}
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="font-body text-taxi-gray-light text-sm hover:text-taxi-yellow transition-colors"
          >
            {isRTL ? '← العودة للرئيسية' : '← Back to home'}
          </a>
        </div>
      </div>
    </div>
  )
}
