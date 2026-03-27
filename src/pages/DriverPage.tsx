import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase, updateTaxiLocation } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import type { RideRequest } from '@/types'
import toast from 'react-hot-toast'

export function DriverPage() {
  const { t } = useTranslation()
  const { myTaxi, language } = useAppStore()
  const isRTL = language === 'ar'

  const [isOnline, setIsOnline] = useState(false)
  const [incomingRequest, setIncomingRequest] = useState<RideRequest | null>(null)
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null)
  const [locationWatcher, setLocationWatcher] = useState<number | null>(null)

  // ── Go online / offline ─────────────────────────────────────────────────────
  const toggleOnline = async () => {
    if (!myTaxi) return
    const next = !isOnline
    setIsOnline(next)
    await supabase.from('taxis').update({ is_online: next }).eq('id', myTaxi.id)

    if (next) {
      // Start GPS tracking
      const wid = navigator.geolocation.watchPosition(
        async (pos) => {
          await updateTaxiLocation(myTaxi.id, pos.coords.latitude, pos.coords.longitude)
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      )
      setLocationWatcher(wid)
      subscribeToRequests()
      toast.success(isRTL ? 'أنت متاح الآن!' : 'You are now online!')
    } else {
      if (locationWatcher !== null) {
        navigator.geolocation.clearWatch(locationWatcher)
        setLocationWatcher(null)
      }
      toast(isRTL ? 'أصبحت غير متاح' : 'You went offline')
    }
  }

  // ── Subscribe to new ride requests ──────────────────────────────────────────
  const subscribeToRequests = () => {
    if (!myTaxi) return
    supabase
      .channel('driver-requests')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'requests', filter: `taxi_id=eq.${myTaxi.id}` },
        (payload) => {
          setIncomingRequest(payload.new as RideRequest)
          // Vibrate for notification
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
        }
      )
      .subscribe()
  }

  const acceptRequest = async () => {
    if (!incomingRequest) return
    await supabase
      .from('requests')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', incomingRequest.id)
    setActiveRequest(incomingRequest)
    setIncomingRequest(null)
    toast.success(isRTL ? 'قبلت الرحلة!' : 'Ride accepted!')
  }

  const rejectRequest = async () => {
    if (!incomingRequest) return
    await supabase.from('requests').update({ status: 'cancelled' }).eq('id', incomingRequest.id)
    setIncomingRequest(null)
  }

  const iAmHere = async () => {
    if (!activeRequest) return
    await supabase
      .from('requests')
      .update({ status: 'driver_arrived', arrived_at: new Date().toISOString() })
      .eq('id', activeRequest.id)
    setActiveRequest({ ...activeRequest, status: 'driver_arrived' })
    toast.success(isRTL ? 'تم إخطار الراكب بوصولك' : 'Passenger notified of arrival!')
  }

  const startTrip = async () => {
    if (!activeRequest) return
    await supabase.from('requests').update({ status: 'in_progress' }).eq('id', activeRequest.id)
    setActiveRequest({ ...activeRequest, status: 'in_progress' })
  }

  const endTrip = async () => {
    if (!activeRequest) return
    await supabase
      .from('requests')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', activeRequest.id)
    setActiveRequest(null)
    toast.success(isRTL ? 'انتهت الرحلة بسلامة!' : 'Trip completed!')
  }

  const reportNoShow = async () => {
    if (!activeRequest || !myTaxi) return
    await supabase.from('requests').update({ status: 'no_show' }).eq('id', activeRequest.id)
    await supabase.rpc('increment_no_show', { p_request_id: activeRequest.id })
    setActiveRequest(null)
    toast(isRTL ? 'تم تسجيل عدم حضور الراكب' : 'No-show reported')
  }

  const statusLabel: Record<string, string> = {
    driver_arrived: isRTL ? 'وصلت — ابدأ الرحلة' : 'Arrived — Start Trip',
    in_progress: isRTL ? 'الرحلة جارية' : 'Trip in progress',
    accepted: isRTL ? 'متجه للراكب' : 'Heading to passenger',
  }

  return (
    <div
      className="min-h-screen bg-taxi-black text-taxi-white-pure flex flex-col"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-taxi-black-soft border-b border-taxi-yellow/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚕</span>
          <span className="font-arabic text-taxi-yellow font-bold">
            {isRTL ? 'لوحة السائق' : 'Driver Panel'}
          </span>
        </div>
        {myTaxi && (
          <div className="font-body text-taxi-gray-light text-sm">{myTaxi.plate}</div>
        )}
      </div>

      <div className="flex-1 px-4 py-6 space-y-5 max-w-md mx-auto w-full">
        {/* Online toggle */}
        <div className={`rounded-3xl p-6 border-2 transition-all ${isOnline ? 'border-taxi-green bg-taxi-green/5' : 'border-taxi-yellow/20 bg-taxi-black-soft'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-arabic text-lg font-bold text-taxi-white-pure">
                {isOnline ? (isRTL ? 'أنت متاح' : 'You\'re Online') : (isRTL ? 'غير متاح' : 'You\'re Offline')}
              </div>
              <div className={`text-sm font-body ${isOnline ? 'text-taxi-green' : 'text-taxi-gray-light'}`}>
                {isOnline
                  ? (isRTL ? 'تستقبل طلبات الركاب' : 'Receiving passenger requests')
                  : (isRTL ? 'لن تصلك طلبات' : 'Not receiving requests')}
              </div>
            </div>
            <button
              onClick={toggleOnline}
              className={`w-20 h-10 rounded-full transition-colors duration-300 flex items-center px-1 ${
                isOnline ? 'bg-taxi-green justify-end' : 'bg-taxi-gray justify-start'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-white shadow-md" />
            </button>
          </div>
          {isOnline && (
            <div className="flex items-center gap-2 text-taxi-green text-sm">
              <span className="w-2 h-2 rounded-full bg-taxi-green animate-pulse" />
              <span className="font-body">{isRTL ? 'الموقع يُحدَّث تلقائيًا' : 'Location updating live'}</span>
            </div>
          )}
        </div>

        {/* Incoming request notification */}
        {incomingRequest && (
          <div className="rounded-3xl bg-taxi-yellow/10 border-2 border-taxi-yellow p-6 animate-pulse-yellow">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🔔</div>
              <div className="font-arabic text-taxi-yellow text-2xl font-black">{t('new_request')}</div>
              <div className="font-body text-taxi-gray-light text-sm mt-1">
                {isRTL ? 'راكب مجهول' : 'Anonymous Passenger'}
              </div>
            </div>
            <div className="bg-taxi-black-mid rounded-2xl p-4 mb-5 text-sm font-body text-taxi-gray-light text-center">
              📍 {incomingRequest.pickup_lat.toFixed(4)}, {incomingRequest.pickup_lng.toFixed(4)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={rejectRequest}
                className="py-3 rounded-2xl border border-taxi-red/40 text-taxi-red font-arabic font-bold hover:bg-taxi-red/10 transition-colors"
              >
                {t('reject_ride')}
              </button>
              <button
                onClick={acceptRequest}
                className="py-3 rounded-2xl bg-taxi-yellow text-taxi-black font-arabic font-bold hover:bg-taxi-yellow-glow transition-colors"
              >
                {t('accept_ride')}
              </button>
            </div>
          </div>
        )}

        {/* Active ride */}
        {activeRequest && (
          <div className="rounded-3xl bg-taxi-black-soft border border-taxi-yellow/20 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-taxi-yellow/10 border border-taxi-yellow/30 flex items-center justify-center text-xl">
                👤
              </div>
              <div>
                <div className="font-arabic text-taxi-yellow font-bold">{t('anonymous_passenger')}</div>
                <div className="font-body text-taxi-gray-light text-xs">
                  {statusLabel[activeRequest.status] || activeRequest.status}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {activeRequest.status === 'accepted' && (
                <button onClick={iAmHere} className="w-full py-4 rounded-2xl bg-taxi-yellow text-taxi-black font-arabic text-xl font-black hover:bg-taxi-yellow-glow active:scale-95 transition-all">
                  ✅ {t('im_here')}
                </button>
              )}
              {activeRequest.status === 'driver_arrived' && (
                <>
                  <button onClick={startTrip} className="w-full py-4 rounded-2xl bg-taxi-green text-white font-arabic text-xl font-black active:scale-95 transition-all">
                    🚀 {t('start_trip')}
                  </button>
                  <button onClick={reportNoShow} className="w-full py-3 rounded-2xl border border-taxi-red/40 text-taxi-red font-arabic font-semibold">
                    {t('report_no_show')}
                  </button>
                </>
              )}
              {activeRequest.status === 'in_progress' && (
                <button onClick={endTrip} className="w-full py-4 rounded-2xl bg-taxi-yellow text-taxi-black font-arabic text-xl font-black active:scale-95 transition-all">
                  🏁 {t('end_trip')}
                </button>
              )}
            </div>

            {/* Chat unlock indicator */}
            {(activeRequest.status === 'driver_arrived' || activeRequest.status === 'in_progress') && (
              <div className="p-3 rounded-xl bg-taxi-green/10 border border-taxi-green/30 text-center">
                <div className="font-arabic text-taxi-green text-sm">
                  💬 {isRTL ? 'يمكنك التواصل مع الراكب الآن' : 'Chat with passenger is now active'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {isOnline && !incomingRequest && !activeRequest && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4 animate-float">🚕</div>
            <div className="font-arabic text-taxi-gray-light text-lg">
              {isRTL ? 'في انتظار الطلبات...' : 'Waiting for requests...'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
