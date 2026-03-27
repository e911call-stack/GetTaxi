import { useTranslation } from 'react-i18next'
import type { RequestStatus } from '@/types'

interface Props {
  status: RequestStatus
}

const statusConfig: Record<
  RequestStatus,
  { icon: string; arLabel: string; enLabel: string; color: string; bg: string }
> = {
  pending:        { icon: '🔍', arLabel: 'يبحث عن تاكسي...', enLabel: 'Finding taxi...', color: 'text-taxi-yellow', bg: 'bg-taxi-yellow/10' },
  accepted:       { icon: '🚕', arLabel: 'السائق في الطريق', enLabel: 'Driver on the way', color: 'text-taxi-green', bg: 'bg-taxi-green/10' },
  driver_arrived: { icon: '📍', arLabel: 'السائق وصل!', enLabel: 'Driver arrived!', color: 'text-taxi-yellow', bg: 'bg-taxi-yellow/10' },
  in_progress:    { icon: '🛣️', arLabel: 'الرحلة جارية', enLabel: 'Trip in progress', color: 'text-taxi-green', bg: 'bg-taxi-green/10' },
  completed:      { icon: '✅', arLabel: 'وصلت بسلامة!', enLabel: 'Arrived safely!', color: 'text-taxi-green', bg: 'bg-taxi-green/10' },
  cancelled:      { icon: '✕', arLabel: 'تم الإلغاء', enLabel: 'Cancelled', color: 'text-taxi-red', bg: 'bg-taxi-red/10' },
  no_show:        { icon: '⚠️', arLabel: 'الراكب لم يحضر', enLabel: 'Passenger no-show', color: 'text-taxi-red', bg: 'bg-taxi-red/10' },
}

export function StatusBar({ status }: Props) {
  const { i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const cfg = statusConfig[status]

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${cfg.bg} border-current/20`}>
      <span className="text-xl animate-pulse">{cfg.icon}</span>
      <span className={`font-arabic font-semibold text-sm ${cfg.color}`}>
        {isRTL ? cfg.arLabel : cfg.enLabel}
      </span>
    </div>
  )
}
