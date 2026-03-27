import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/lib/store'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const { language, setLanguage } = useAppStore()

  const toggle = () => {
    const next = language === 'ar' ? 'en' : 'ar'
    setLanguage(next)
    i18n.changeLanguage(next)
    document.documentElement.lang = next
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr'
  }

  return (
    <button
      onClick={toggle}
      className="
        group relative flex items-center gap-2 px-4 py-2 rounded-full
        border border-taxi-yellow/40 bg-taxi-black/60 backdrop-blur-sm
        text-taxi-yellow font-body text-sm font-medium
        hover:border-taxi-yellow hover:bg-taxi-yellow/10
        transition-all duration-200
      "
      aria-label="Switch language"
    >
      <span className="text-base">{language === 'ar' ? '🇯🇴' : '🌐'}</span>
      <span className="tracking-wide">
        {language === 'ar' ? 'EN' : 'عربي'}
      </span>
    </button>
  )
}
