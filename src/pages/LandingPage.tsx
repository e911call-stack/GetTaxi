import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { WHATSAPP_DRIVER_SIGNUP } from '@/types'
import { useAppStore } from '@/lib/store'

// ─── Animated Checker Pattern ─────────────────────────────────────────────────
function CheckerBorder() {
  return (
    <div className="w-full h-4 overflow-hidden">
      <div
        className="h-full w-[200%]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, #FFD700 0px, #FFD700 16px, #0A0A0A 16px, #0A0A0A 32px)',
          animation: 'checker-move 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes checker-move {
          from { transform: translateX(0); }
          to { transform: translateX(-32px); }
        }
      `}</style>
    </div>
  )
}

// ─── Floating Taxi Emoji ──────────────────────────────────────────────────────
function FloatingTaxi() {
  return (
    <div className="relative w-40 h-40 mx-auto mb-6">
      {/* Glow rings */}
      <div className="absolute inset-0 rounded-full bg-taxi-yellow/20 animate-ping" style={{ animationDuration: '3s' }} />
      <div className="absolute inset-4 rounded-full bg-taxi-yellow/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
      {/* Taxi icon */}
      <div
        className="relative z-10 flex items-center justify-center w-full h-full text-8xl"
        style={{ animation: 'float 3s ease-in-out infinite' }}
      >
        🚕
      </div>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
      `}</style>
    </div>
  )
}

// ─── How It Works Step ────────────────────────────────────────────────────────
function Step({
  number,
  icon,
  title,
  desc,
  delay,
}: {
  number: number
  icon: string
  title: string
  desc: string
  delay: string
}) {
  return (
    <div
      className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-taxi-black-soft/80 border border-taxi-yellow/10 hover:border-taxi-yellow/40 transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: delay }}
    >
      <div className="w-12 h-12 rounded-full bg-taxi-yellow/10 border border-taxi-yellow/30 flex items-center justify-center">
        <span className="text-taxi-yellow font-latin text-xl font-bold">{number}</span>
      </div>
      <div className="text-4xl">{icon}</div>
      <h3 className="font-arabic text-taxi-yellow font-bold text-lg">{title}</h3>
      <p className="font-body text-taxi-gray-light text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

// ─── Stat Badge ───────────────────────────────────────────────────────────────
function StatBadge({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4 rounded-2xl bg-taxi-yellow/5 border border-taxi-yellow/20">
      <span className="text-3xl">{icon}</span>
      <span className="font-latin text-taxi-yellow text-2xl font-bold">{value}</span>
      <span className="font-body text-taxi-gray-light text-xs">{label}</span>
    </div>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export function LandingPage() {
  const { t } = useTranslation()
  const { language } = useAppStore()
  const [pulse, setPulse] = useState(false)
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])
  const btnRef = useRef<HTMLButtonElement>(null)
  const rippleId = useRef(0)

  const isRTL = language === 'ar'

  // Navigate to passenger flow (placeholder — router would handle this)
  const handleWantTaxi = (e: React.MouseEvent<HTMLButtonElement>) => {
    setPulse(true)
    setTimeout(() => setPulse(false), 600)

    // Ripple effect
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = ++rippleId.current
      setRipples((r) => [...r, { id, x, y }])
      setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 800)
    }

    // TODO: navigate('/request') — requires auth check first
    window.dispatchEvent(new CustomEvent('want-taxi'))
  }

  return (
    <div
      className="min-h-screen bg-taxi-black text-taxi-white-pure overflow-x-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* ── Checker top border ── */}
      <CheckerBorder />

      {/* ── Noise texture overlay ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* ── Yellow radial glow ── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-taxi-yellow/5 blur-3xl pointer-events-none" />

      {/* ────────────────────────── NAVBAR ─────────────────────────────────── */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-taxi-yellow flex items-center justify-center shadow-yellow-md">
            <span className="text-xl">🚕</span>
          </div>
          <div>
            <div className="font-arabic text-taxi-yellow font-bold text-lg leading-tight">
              {isRTL ? 'يلو وانت' : 'YellowWant'}
            </div>
            <div className="font-body text-taxi-gray-light text-xs">.jo</div>
          </div>
        </div>

        {/* Nav actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <a
            href="/auth"
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-taxi-black bg-taxi-yellow font-body text-sm font-semibold hover:bg-taxi-yellow-glow transition-colors duration-200"
          >
            {t('login')}
          </a>
        </div>
      </nav>

      {/* ────────────────────────── HERO ───────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-8 pb-16">
        <FloatingTaxi />

        {/* Headline */}
        <div className="space-y-3 mb-10 animate-slide-up">
          <h1
            className="font-arabic text-5xl md:text-7xl font-black leading-tight"
            style={{
              background: 'linear-gradient(135deg, #FFE55C 0%, #FFD700 40%, #E6A800 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('tagline')}
          </h1>
          <p className="font-body text-taxi-gray-light text-lg md:text-xl max-w-lg mx-auto">
            {t('tagline_sub')}
          </p>
          {/* Free badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-taxi-green/10 border border-taxi-green/30 mt-2">
            <span className="w-2 h-2 rounded-full bg-taxi-green animate-pulse" />
            <span className="font-body text-taxi-green text-sm font-medium">{t('free_service')}</span>
            <span className="text-taxi-gray-light text-sm">·</span>
            <span className="font-body text-taxi-gray-light text-sm">{t('amman_only')}</span>
          </div>
        </div>

        {/* ── BIG "أريد تاكسي" BUTTON ── */}
        <div className="relative mb-8">
          {/* Outer glow */}
          <div
            className={`absolute inset-0 rounded-3xl bg-taxi-yellow blur-xl transition-all duration-300 ${
              pulse ? 'opacity-80 scale-110' : 'opacity-30'
            }`}
          />
          <button
            ref={btnRef}
            onClick={handleWantTaxi}
            className="
              relative overflow-hidden
              px-16 py-7 rounded-3xl
              bg-gradient-to-b from-taxi-yellow-glow via-taxi-yellow to-taxi-yellow-deep
              text-taxi-black
              font-arabic text-3xl md:text-4xl font-black
              shadow-yellow-xl
              transform transition-all duration-150
              active:scale-95 hover:scale-105
              border-b-4 border-taxi-yellow-deep/60
            "
            style={{
              textShadow: '0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            {/* Ripples */}
            {ripples.map((r) => (
              <span
                key={r.id}
                className="absolute rounded-full bg-white/30 pointer-events-none"
                style={{
                  left: r.x - 10,
                  top: r.y - 10,
                  width: 20,
                  height: 20,
                  animation: 'ripple-expand 0.8s ease-out forwards',
                }}
              />
            ))}
            <span className="relative z-10 flex items-center gap-4">
              <span>🚕</span>
              <span>{t('want_taxi')}</span>
            </span>
          </button>
          <style>{`
            @keyframes ripple-expand {
              to { transform: scale(20); opacity: 0; }
            }
          `}</style>
        </div>

        {/* ── Driver signup button ── */}
        <a
          href={WHATSAPP_DRIVER_SIGNUP}
          target="_blank"
          rel="noopener noreferrer"
          className="
            flex items-center gap-3 px-8 py-4 rounded-2xl
            border-2 border-[#25D366]/40 bg-[#25D366]/5
            text-[#25D366] font-arabic text-xl font-bold
            hover:border-[#25D366] hover:bg-[#25D366]/15
            transition-all duration-200 hover:scale-102
          "
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {t('register_driver')}
        </a>
      </section>

      {/* ────────────────────────── STATS ──────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-8">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4">
          <StatBadge icon="🚕" value="100+" label={isRTL ? 'سائق مسجّل' : 'Registered Drivers'} />
          <StatBadge icon="⚡" value="2km" label={isRTL ? 'أقصى مسافة' : 'Max Radius'} />
          <StatBadge icon="🆓" value="0 JD" label={isRTL ? 'رسوم الخدمة' : 'Service Fee'} />
        </div>
      </section>

      {/* ────────────────────────── HOW IT WORKS ───────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-arabic text-3xl font-bold text-taxi-yellow text-center mb-10">
            {t('how_it_works')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Step number={1} icon="📍" title={t('step1_title')} desc={t('step1_desc')} delay="0ms" />
            <Step number={2} icon="✅" title={t('step2_title')} desc={t('step2_desc')} delay="100ms" />
            <Step number={3} icon="🗺️" title={t('step3_title')} desc={t('step3_desc')} delay="200ms" />
            <Step number={4} icon="💵" title={t('step4_title')} desc={t('step4_desc')} delay="300ms" />
          </div>
        </div>
      </section>

      {/* ────────────────────────── PRIVACY SECTION ─────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-10">
        <div className="max-w-2xl mx-auto rounded-3xl bg-taxi-black-soft border border-taxi-yellow/10 p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-taxi-yellow/10 flex items-center justify-center flex-shrink-0 text-2xl">
              🔒
            </div>
            <div>
              <h3 className="font-arabic text-taxi-yellow text-xl font-bold mb-2">
                {t('hide_number')}
              </h3>
              <p className="font-body text-taxi-gray-light text-sm leading-relaxed mb-4">
                {isRTL
                  ? 'ميزة "إخفاء رقمي" تحمي رقم هاتفك — السائق يتواصل معك عبر قناة مؤقتة آمنة بدون رؤية رقمك الحقيقي.'
                  : 'The "Hide My Number" feature protects your phone — drivers contact you through a secure temporary channel without seeing your real number.'}
              </p>
              <div className="flex items-center gap-2 text-taxi-green text-sm font-body">
                <span>✓</span>
                <span>{isRTL ? 'التواصل يفتح فقط عند وصول السائق' : 'Chat unlocks only when driver arrives'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────── DRIVER CTA ──────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-12">
        <div
          className="max-w-3xl mx-auto rounded-3xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, #1A1A0A 0%, #0A0A0A 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          {/* Checker stripe accent */}
          <div className="h-2 w-full" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #FFD700 0px, #FFD700 20px, #0A0A0A 20px, #0A0A0A 40px)',
          }} />
          <div className="p-8 md:p-12 text-center">
            <div className="text-5xl mb-4">🚕</div>
            <h2 className="font-arabic text-3xl font-bold text-taxi-yellow mb-3">
              {t('driver_signup_title')}
            </h2>
            <p className="font-body text-taxi-gray-light mb-8 max-w-lg mx-auto">
              {t('driver_signup_desc')}
            </p>
            <a
              href={WHATSAPP_DRIVER_SIGNUP}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex items-center gap-3
                px-10 py-4 rounded-2xl
                bg-[#25D366] text-white
                font-arabic text-xl font-bold
                shadow-lg hover:shadow-xl
                transform hover:scale-105 active:scale-95
                transition-all duration-200
              "
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {t('driver_signup_wa')}
            </a>
            <p className="font-body text-taxi-gray-light/60 text-xs mt-4">
              {isRTL ? '* لا تحتاج بريد إلكتروني — واتساب فقط' : '* No email required — WhatsApp only'}
            </p>
          </div>
        </div>
      </section>

      {/* ────────────────────────── FOOTER ──────────────────────────────────── */}
      <footer className="relative z-10 px-6 py-8 text-center border-t border-taxi-yellow/10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xl">🚕</span>
          <span className="font-arabic text-taxi-yellow font-bold">YellowWant.jo</span>
        </div>
        <p className="font-body text-taxi-gray-light/60 text-xs">
          {isRTL ? '© 2024 يلو وانت — عمّان، الأردن' : '© 2024 YellowWant — Amman, Jordan'}
        </p>
      </footer>

      {/* Bottom checker border */}
      <CheckerBorder />
    </div>
  )
}
