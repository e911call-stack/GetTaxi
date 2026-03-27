import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import type { Taxi } from '@/types'
import toast from 'react-hot-toast'

interface AdminStats {
  total_rides: number
  active_drivers: number
  pending_verifications: number
  total_drivers: number
}

export function AdminPage() {
  const { t } = useTranslation()
  const { language } = useAppStore()
  const isRTL = language === 'ar'

  const [taxis, setTaxis] = useState<Taxi[]>([])
  const [stats, setStats] = useState<AdminStats>({ total_rides: 0, active_drivers: 0, pending_verifications: 0, total_drivers: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'drivers' | 'requests'>('drivers')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [taxiRes, statsRes] = await Promise.all([
        supabase.from('taxis').select('*').order('created_at', { ascending: false }),
        supabase.rpc('get_admin_stats'),
      ])
      if (taxiRes.data) setTaxis(taxiRes.data)
      if (statsRes.data) setStats(statsRes.data)
    } catch {
      toast.error(t('generic_error'))
    } finally {
      setLoading(false)
    }
  }

  const verifyDriver = async (id: string, verified: boolean) => {
    await supabase.from('taxis').update({ verified }).eq('id', id)
    setTaxis((prev) => prev.map((t) => (t.id === id ? { ...t, verified } : t)))
    toast.success(isRTL ? (verified ? 'تم التوثيق' : 'تم إلغاء التوثيق') : (verified ? 'Driver verified' : 'Verification removed'))
  }

  const toggleOnline = async (id: string, current: boolean) => {
    await supabase.from('taxis').update({ is_online: !current }).eq('id', id)
    setTaxis((prev) => prev.map((t) => (t.id === id ? { ...t, is_online: !current } : t)))
  }

  return (
    <div className="min-h-screen bg-taxi-black text-taxi-white-pure" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-taxi-black-soft border-b border-taxi-yellow/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚙️</span>
          <div>
            <div className="font-arabic text-taxi-yellow text-xl font-bold">{t('admin_panel')}</div>
            <div className="font-body text-taxi-gray-light text-xs">YellowWant.jo — Owner Only</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🚕', val: stats.total_drivers, label: isRTL ? 'إجمالي السائقين' : 'Total Drivers' },
            { icon: '🟢', val: stats.active_drivers, label: t('active_drivers') },
            { icon: '📋', val: stats.total_rides, label: t('total_rides') },
            { icon: '⏳', val: stats.pending_verifications, label: t('pending_verifications') },
          ].map((s) => (
            <div key={s.label} className="bg-taxi-black-soft border border-taxi-yellow/10 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="font-latin text-taxi-yellow text-3xl font-bold">{s.val}</div>
              <div className="font-body text-taxi-gray-light text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['drivers', 'requests'] as const).map((t_) => (
            <button
              key={t_}
              onClick={() => setTab(t_)}
              className={`px-5 py-2 rounded-full font-arabic text-sm transition-colors ${tab === t_ ? 'bg-taxi-yellow text-taxi-black font-bold' : 'bg-taxi-black-soft text-taxi-gray-light border border-taxi-yellow/20'}`}
            >
              {t_ === 'drivers' ? (isRTL ? 'السائقون' : 'Drivers') : (isRTL ? 'الطلبات' : 'Requests')}
            </button>
          ))}
        </div>

        {/* Drivers table */}
        {tab === 'drivers' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-taxi-gray-light">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
            ) : taxis.map((taxi) => (
              <div key={taxi.id} className="bg-taxi-black-soft border border-taxi-yellow/10 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${taxi.is_online ? 'bg-taxi-green' : 'bg-taxi-gray'}`} />
                    <div>
                      <div className="font-arabic text-taxi-white-pure font-semibold">{taxi.driver_name}</div>
                      <div className="font-body text-taxi-gray-light text-xs">{taxi.plate} · {taxi.car_make_model}</div>
                      {taxi.no_show_count > 0 && (
                        <div className="font-body text-taxi-red text-xs">{taxi.no_show_count}x no-show</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {taxi.verified ? (
                      <span className="px-2 py-1 rounded-full bg-taxi-green/10 text-taxi-green text-xs font-body">✓ موثّق</span>
                    ) : (
                      <button
                        onClick={() => verifyDriver(taxi.id, true)}
                        className="px-3 py-1 rounded-full bg-taxi-yellow text-taxi-black text-xs font-arabic font-bold hover:bg-taxi-yellow-glow"
                      >
                        {t('verify_driver')}
                      </button>
                    )}
                    {taxi.verified && (
                      <button
                        onClick={() => verifyDriver(taxi.id, false)}
                        className="px-3 py-1 rounded-full border border-taxi-red/40 text-taxi-red text-xs font-arabic hover:bg-taxi-red/10"
                      >
                        {t('suspend_driver')}
                      </button>
                    )}
                    <button
                      onClick={() => toggleOnline(taxi.id, taxi.is_online)}
                      className="px-3 py-1 rounded-full border border-taxi-yellow/20 text-taxi-yellow text-xs font-body hover:border-taxi-yellow"
                    >
                      {taxi.is_online ? (isRTL ? 'إيقاف' : 'Force off') : (isRTL ? 'تشغيل' : 'Force on')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
