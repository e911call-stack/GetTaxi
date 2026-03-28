import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase, updateTaxiLocation } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import type { RideRequest } from '@/types'
import toast from 'react-hot-toast'
import { AMMAN_CENTER } from '@/types'

const driverMapIcon = L.divIcon({
  className: '',
  html: `<div style="width:44px;height:44px;border-radius:12px;background:#f5c518;border:3px solid #06060c;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 0 20px rgba(245,197,24,0.5);">🚕</div>`,
  iconSize: [44, 44], iconAnchor: [22, 22],
})

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lng], 15) }, [lat, lng, map])
  return null
}

const S: Record<string, React.CSSProperties> = {
  root: { position: 'fixed', inset: 0, fontFamily: "'Cairo', sans-serif", background: '#06060c', color: '#f0f0f5', overflow: 'hidden' },
  map: { position: 'absolute', inset: 0, zIndex: 0 },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(17,17,24,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 100, padding: '8px 14px', fontSize: 12, fontWeight: 700 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(17,17,24,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', color: '#f0f0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 },
  statsRow: { position: 'absolute', top: 76, left: 16, right: 16, zIndex: 15, display: 'flex', gap: 10 },
  statCard: { flex: 1, background: 'rgba(17,17,24,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '10px 12px', textAlign: 'center' as const },
  driverControl: { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, padding: '0 16px 20px' },
  driverPanel: { background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: 16 },
  toggleWrap: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 100, padding: 4, display: 'flex', alignItems: 'center', gap: 4 },
  toggleOpt: { flex: 1, padding: '8px 16px', borderRadius: 100, fontFamily: "'Cairo',sans-serif", fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.25s', color: '#6b6b80', background: 'transparent' },
  requestModal: { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 80, background: '#111118', borderRadius: '28px 28px 0 0', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '20px 20px 28px', transition: 'transform 0.38s cubic-bezier(0.16,1,0.3,1)' },
  routeBlock: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 14, marginBottom: 14 },
  routeStop: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 },
  routeDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  btnReject: { flex: 1, background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.25)', color: '#ff4757', borderRadius: 14, padding: 14, fontFamily: "'Cairo',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  btnAccept: { flex: 2, background: '#1dcd9f', border: 'none', color: '#000', borderRadius: 14, padding: 14, fontFamily: "'Cairo',sans-serif", fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 20px rgba(29,205,159,0.35)' },
  btnYellow: { width: '100%', background: '#f5c518', border: 'none', borderRadius: 14, padding: '14px', fontFamily: "'Cairo',sans-serif", fontSize: 15, fontWeight: 900, color: '#000', cursor: 'pointer', marginBottom: 10 },
  btnGreen: { width: '100%', background: '#1dcd9f', border: 'none', borderRadius: 14, padding: '14px', fontFamily: "'Cairo',sans-serif", fontSize: 15, fontWeight: 900, color: '#000', cursor: 'pointer', marginBottom: 10 },
  btnRed: { width: '100%', background: 'transparent', border: '1px solid rgba(255,71,87,0.4)', borderRadius: 14, padding: '12px', fontFamily: "'Cairo',sans-serif", fontSize: 13, fontWeight: 700, color: '#ff4757', cursor: 'pointer' },
}

export function DriverPage() {
  const { t } = useTranslation()
  const { myTaxi, language } = useAppStore()
  const isRTL = language === 'ar'

  const [isOnline, setIsOnline] = useState(false)
  const [incomingRequest, setIncomingRequest] = useState<RideRequest | null>(null)
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null)
  const [locationWatcher, setLocationWatcher] = useState<number | null>(null)
  const [driverPos, setDriverPos] = useState(AMMAN_CENTER)
  const [timerSec, setTimerSec] = useState(20)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [earnings] = useState(45)
  const [trips] = useState(7)

  const circumference = 138

  useEffect(() => {
    if (incomingRequest) {
      setTimerSec(20)
      timerRef.current = setInterval(() => {
        setTimerSec(s => {
          if (s <= 1) { clearInterval(timerRef.current!); setIncomingRequest(null); return 0 }
          return s - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [incomingRequest])

  const toggleOnline = async () => {
    if (!myTaxi) return
    const next = !isOnline
    setIsOnline(next)
    await supabase.from('taxis').update({ is_online: next }).eq('id', myTaxi.id)
    if (next) {
      const wid = navigator.geolocation.watchPosition(
        async (pos) => {
          setDriverPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          await updateTaxiLocation(myTaxi.id, pos.coords.latitude, pos.coords.longitude)
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      )
      setLocationWatcher(wid)
      subscribeToRequests()
      toast.success(isRTL ? 'أنت متاح الآن!' : 'You are now online!')
    } else {
      if (locationWatcher !== null) { navigator.geolocation.clearWatch(locationWatcher); setLocationWatcher(null) }
      toast(isRTL ? 'أصبحت غير متاح' : 'You went offline')
    }
  }

  const subscribeToRequests = () => {
    if (!myTaxi) return
    supabase.channel('driver-requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests', filter: `taxi_id=eq.${myTaxi.id}` },
        (payload) => {
          setIncomingRequest(payload.new as RideRequest)
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
          playSound()
        })
      .subscribe()
  }

  function playSound() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      ;[523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const g = ctx.createGain()
        osc.connect(g); g.connect(ctx.destination)
        osc.type = 'sine'; osc.frequency.value = freq
        g.gain.setValueAtTime(0, ctx.currentTime + i * 0.12)
        g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + i * 0.12 + 0.05)
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.3)
        osc.start(ctx.currentTime + i * 0.12); osc.stop(ctx.currentTime + i * 0.12 + 0.3)
      })
    } catch { /* silent */ }
  }

  const acceptRequest = async () => {
    if (!incomingRequest) return
    await supabase.from('requests').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', incomingRequest.id)
    setActiveRequest(incomingRequest); setIncomingRequest(null)
    toast.success(isRTL ? 'قبلت الرحلة!' : 'Ride accepted!')
  }

  const rejectRequest = async () => {
    if (!incomingRequest) return
    await supabase.from('requests').update({ status: 'cancelled' }).eq('id', incomingRequest.id)
    setIncomingRequest(null)
  }

  const iAmHere = async () => {
    if (!activeRequest) return
    await supabase.from('requests').update({ status: 'driver_arrived', arrived_at: new Date().toISOString() }).eq('id', activeRequest.id)
    setActiveRequest({ ...activeRequest, status: 'driver_arrived' })
    toast.success(isRTL ? 'تم إخطار الراكب بوصولك' : 'Passenger notified!')
  }

  const startTrip = async () => {
    if (!activeRequest) return
    await supabase.from('requests').update({ status: 'in_progress' }).eq('id', activeRequest.id)
    setActiveRequest({ ...activeRequest, status: 'in_progress' })
  }

  const endTrip = async () => {
    if (!activeRequest) return
    await supabase.from('requests').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', activeRequest.id)
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

  const timerOffset = circumference * (1 - timerSec / 20)

  return (
    <div style={S.root} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Map */}
      <div style={S.map}>
        <MapContainer center={[driverPos.lat, driverPos.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="" />
          <RecenterMap lat={driverPos.lat} lng={driverPos.lng} />
          <Marker position={[driverPos.lat, driverPos.lng]} icon={driverMapIcon} />
        </MapContainer>
      </div>

      {/* Top Bar */}
      <div style={S.topBar}>
        <div style={S.statusBadge}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#1dcd9f' : '#ff4757', boxShadow: isOnline ? '0 0 6px #1dcd9f' : 'none' }} />
          <span>{isOnline ? (isRTL ? 'متصل — جاري البحث...' : 'Online — Searching...') : (isRTL ? 'غير متصل' : 'Offline')}</span>
        </div>
        <button style={S.iconBtn} onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}>⏻</button>
      </div>

      {/* Stats Row (online only) */}
      {isOnline && (
        <div style={S.statsRow}>
          {[
            { val: `${earnings} JD`, lbl: isRTL ? 'أرباح اليوم' : "Today's Earnings" },
            { val: String(trips), lbl: isRTL ? 'رحلات' : 'Trips' },
            { val: '4.9 ⭐', lbl: isRTL ? 'تقييمك' : 'Rating' },
          ].map((s) => (
            <div key={s.lbl} style={S.statCard}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1dcd9f' }}>{s.val}</div>
              <div style={{ fontSize: 10, color: '#6b6b80', marginTop: 2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      )}

      {/* Driver Bottom Panel */}
      {!incomingRequest && (
        <div style={S.driverControl}>
          {activeRequest && (
            <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,197,24,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{isRTL ? 'راكب مجهول' : 'Anonymous Passenger'}</div>
                  <div style={{ fontSize: 11, color: '#6b6b80', marginTop: 2 }}>
                    {{ accepted: isRTL ? 'متجه للراكب' : 'Heading to passenger', driver_arrived: isRTL ? 'وصلت' : 'Arrived', in_progress: isRTL ? 'الرحلة جارية' : 'In progress' }[activeRequest.status] || activeRequest.status}
                  </div>
                </div>
              </div>
              {activeRequest.status === 'accepted' && (
                <button style={S.btnYellow} onClick={iAmHere}>✅ {isRTL ? 'وصلت للراكب' : "I'm Here"}</button>
              )}
              {activeRequest.status === 'driver_arrived' && (
                <>
                  <button style={S.btnGreen} onClick={startTrip}>🚀 {isRTL ? 'ابدأ الرحلة' : 'Start Trip'}</button>
                  <button style={S.btnRed} onClick={reportNoShow}>{isRTL ? 'الراكب لم يحضر' : 'Passenger No-Show'}</button>
                </>
              )}
              {activeRequest.status === 'in_progress' && (
                <button style={S.btnYellow} onClick={endTrip}>🏁 {isRTL ? 'إنهاء الرحلة' : 'End Trip'}</button>
              )}
            </div>
          )}

          <div style={S.driverPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>{isRTL ? `مرحباً، ${myTaxi?.driver_name || 'سائق'} 👋` : `Hi, ${myTaxi?.driver_name || 'Driver'} 👋`}</div>
                <div style={{ fontSize: 11, color: '#6b6b80', marginTop: 2 }}>{myTaxi ? `${myTaxi.car_make_model} · ${myTaxi.plate}` : (isRTL ? 'لا يوجد تاكسي مسجل' : 'No taxi registered')}</div>
              </div>
              <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
                <div style={{ fontSize: 10, color: '#6b6b80' }}>{isRTL ? 'الأرباح' : 'Earnings'}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1dcd9f' }}>{earnings}.00 JD</div>
              </div>
            </div>
            <div style={S.toggleWrap}>
              <button
                style={{ ...S.toggleOpt, ...(isOnline ? {} : { background: 'rgba(255,71,87,0.15)', color: '#ff4757' }) }}
                onClick={() => isOnline && toggleOnline()}
              >
                🚫 {isRTL ? 'غير متصل' : 'Offline'}
              </button>
              <button
                style={{ ...S.toggleOpt, ...(isOnline ? { background: '#1dcd9f', color: '#000' } : {}) }}
                onClick={() => !isOnline && toggleOnline()}
              >
                ▶ {isRTL ? 'متصل' : 'Online'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Request Modal */}
      <div style={{ ...S.requestModal, transform: incomingRequest ? 'translateY(0)' : 'translateY(120%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900 }}>{isRTL ? 'طلب جديد!' : 'New Request!'}</h2>
            <div style={{ fontSize: 12, color: '#6b6b80', marginTop: 2 }}>{isRTL ? '~3.2 كم من موقعك' : '~3.2 km from you'}</div>
          </div>
          <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#1dcd9f' }}>5.50 JD</div>
            <div style={{ fontSize: 11, color: '#6b6b80', marginTop: 1 }}>{isRTL ? 'نقدي · ~12 دقيقة' : 'Cash · ~12 min'}</div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
            <svg viewBox="0 0 50 50" width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(255,71,87,0.15)" strokeWidth="4" />
              <circle cx="25" cy="25" r="22" fill="none" stroke="#ff4757" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={timerOffset} style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#ff4757' }}>{timerSec}</div>
          </div>
          <div style={{ flex: 1, fontSize: 12, color: '#6b6b80' }}>
            {isRTL ? 'يُلغى الطلب تلقائياً إذا لم يُقبل' : 'Request cancels automatically if not accepted'}<br />
            <span style={{ color: '#ff4757', fontWeight: 700 }}>{isRTL ? 'في غضون 20 ثانية' : 'within 20 seconds'}</span>
          </div>
        </div>

        <div style={S.routeBlock}>
          <div style={S.routeStop}>
            <div style={{ ...S.routeDot, background: '#1dcd9f' }} />
            <div>
              <div style={{ fontSize: 12, color: '#6b6b80' }}>{isRTL ? 'الانطلاق' : 'Pickup'}</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {incomingRequest ? `${incomingRequest.pickup_lat.toFixed(4)}, ${incomingRequest.pickup_lng.toFixed(4)}` : (isRTL ? 'شارع الرشيد، وسط البلد' : 'Rashid St, Downtown')}
              </div>
            </div>
          </div>
          <div style={{ ...S.routeStop, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ ...S.routeDot, background: '#ff4757' }} />
            <div>
              <div style={{ fontSize: 12, color: '#6b6b80' }}>{isRTL ? 'الوصول' : 'Dropoff'}</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{incomingRequest?.pickup_address || (isRTL ? 'الوجهة...' : 'Destination...')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {[isRTL ? '~3.2 كم' : '~3.2 km', isRTL ? 'نقدي' : 'Cash', isRTL ? '~12 دقيقة' : '~12 min'].map((v, i) => (
              <span key={i} style={{ fontSize: 11, color: '#6b6b80', fontWeight: 600 }}>{v}</span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button style={S.btnReject} onClick={rejectRequest}>✕ {isRTL ? 'رفض' : 'Reject'}</button>
          <button style={S.btnAccept} onClick={acceptRequest}>✓ {isRTL ? 'قبول الطلب' : 'Accept'}</button>
        </div>
      </div>
    </div>
  )
}
