import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

interface Props {
  requestId: string
  onClose: () => void
}

export function RatingModal({ requestId, onClose }: Props) {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [rating, setRating] = useState(0)
  const [hovering, setHovering] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const submit = async () => {
    if (!rating) return
    // Store rating — extend schema later with a ratings table
    await supabase
      .from('requests')
      .update({ passenger_rating: rating } as Record<string, unknown>)
      .eq('id', requestId)
      .then(() => {}) // soft fail - column added later
    setSubmitted(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-xs bg-taxi-black-soft rounded-3xl border border-taxi-yellow/20 p-7 text-center">
        {submitted ? (
          <>
            <div className="text-5xl mb-3">🎉</div>
            <div className="font-arabic text-taxi-green text-xl font-bold">
              {isRTL ? 'شكرًا على تقييمك!' : 'Thanks for rating!'}
            </div>
          </>
        ) : (
          <>
            <div className="text-4xl mb-2">🚕</div>
            <h3 className="font-arabic text-taxi-yellow text-xl font-bold mb-1">{t('trip_completed')}</h3>
            <p className="font-body text-taxi-gray-light text-sm mb-6">{t('rate_trip')}</p>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovering(star)}
                  onMouseLeave={() => setHovering(0)}
                  className="text-4xl transition-transform hover:scale-110 active:scale-90"
                >
                  {star <= (hovering || rating) ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <button
              onClick={submit}
              disabled={!rating}
              className="w-full py-3 rounded-2xl bg-taxi-yellow text-taxi-black font-arabic font-bold disabled:opacity-40 hover:bg-taxi-yellow-glow transition-colors"
            >
              {t('confirm')}
            </button>
            <button onClick={onClose} className="w-full mt-3 py-2 text-taxi-gray-light font-body text-sm hover:text-taxi-white-pure transition-colors">
              {isRTL ? 'تخطّ' : 'Skip'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
