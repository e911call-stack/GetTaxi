import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase, getNearbyTaxis } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import type { Taxi, RideRequest } from '@/types'
import { AMMAN_CENTER, MAX_RADIUS_KM } from '@/types'
import toast from 'react-hot-toast'

// ─── Leaflet icons ────────────────────────────────────────────────────────────
const passengerIcon = L.divIcon({
  className: '',
  html: `<div style="width:40px;height:40px;border-radius:50%;background:#f5c518;border:3px solid #06060c;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 20px rgba(245,197,24,0.6);">📍</div>`,
  iconSize: [40, 40], iconAnchor: [20, 20],
})
const taxiIcon = L.divIcon({
  className: '',
  html: `<div style="width:36px;height:36px;border-radius:8px;background:#111118;border:2px solid #f5c518;display:flex;align-items:center;justify-content:center;font-size:18px;">🚕</div>`,
  iconSize: [36, 36], iconAnchor: [18, 18],
})

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lng], 15) }, [lat, lng, map])
  return null
}

const S: Record<string, React.CSSProperties> = {
  root: { position: 'fixed', inset: 0, fontFamily: "'Cairo', sans-serif", background: '#06060c', color: '#f0f0f5', overflow: 'hidden' },
  map: { position: 'absolute', inset: 0, zIndex: 0 },

  // top bar
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  searchBar: { flex: 1, background: 'rgba(17,17,24,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  searchText: { flex: 1, color: '#6b6b80', fontSize: 14, fontWeight: 600, fontFamily: "'Cairo', sans-serif" },
  chipYellow: { background: '#f5c518', color: '#000', borderRadius: 100, padding: '4px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' as const },
  iconBtn: { width: 44, height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(17,17,24,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', color: '#f0f0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, flexShrink: 0 },

  // quick scroll
  quickScroll: { position: 'absolute', bottom: 155, left: 0, right: 0, zIndex: 15, padding: '0 16px', display: 'flex', gap: 10, overflowX: 'auto' as const, paddingBottom: 4 },
  quickCard: { flexShrink: 0, background: 'rgba(17,17,24,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' as const },
  quickIcon: { width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 },

  // bottom dock
  dock: { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, background: 'rgba(17,17,24,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 8px 16px' },
  dockItem: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 12, cursor: 'pointer', border: 'none', background: 'transparent', color: '#6b6b80', fontFamily: "'Cairo', sans-serif", fontSize: 10, fontWeight: 600 },
  dockCta: { width: 58, height: 58, borderRadius: 18, background: '#f5c518', color: '#000', border: 'none', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -18, boxShadow: '0 4px 24px rgba(245,197,24,0.4)' },

  // sheets
  sheet: { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60, borderRadius: '28px 28px 0 0', background: '#111118', borderTop: '1px solid rgba(255,255,255,0.07)', paddingBottom: 20, transition: 'transform 0.38s cubic-bezier(0.16,1,0.3,1)', willChange: 'transform' as const },
  handle: { width: 36, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2, margin: '12px auto 0' },
  sheetHeader: { padding: '12px 20px 0' },

  // route input
  routeInput: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 },
  routeInputActive: { background: 'rgba(255,255,255,0.04)', border: '1px solid #f5c518', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 },
  inputField: { background: 'transparent', border: 'none', outline: 'none', color: '#f0f0f5', fontFamily: "'Cairo', sans-serif", fontSize: 14, fontWeight: 600, width: '100%' },

  // fare cards
  fareCard: { flex: 1, minWidth: 90, border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '10px', textAlign: 'center' as const, cursor: 'pointer', transition: 'border-color 0.2s' },
  fareCardSel: { flex: 1, minWidth: 90, border: '1.5px solid #f5c518', borderRadius: 14, padding: '10px', textAlign: 'center' as const, cursor: 'pointer', background: 'rgba(245,197,24,0.08)' },

  // driver card (ride status)
  driverAvatar: { width: 54, height: 54, borderRadius: 16, background: 'linear-gradient(135deg,#f5c518,#c9a012)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#000', flexShrink: 0 },
  etaPill: { background: 'rgba(29,205,159,0.12)', border: '1px solid rgba(29,205,159,0.3)', color: '#1dcd9f', borderRadius: 12, padding: '10px 16px', textAlign: 'center' as const },

  // action btn
  actionBtn: { flex: 1, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Cairo', sans-serif", fontSize: 13, fontWeight: 700, color: '#f0f0f5', cursor: 'pointer' },

  // trip history
  tripRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  tripIcon: { width: 38, height: 38, borderRadius: 11, background: 'rgba(245,197,24,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f5c518', flexShrink: 0, fontSize: 14 },
}

export function PassengerPage() {
  const { t } = useTranslation()
  const { passengerLocation, setPassengerLocation, nearbyTaxis, setNearbyTaxis, hideNumber, setHideNumber, language } = useAppStore()
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [sheet, setSheet] = useState<'none' | 'trip' | 'status' | 'history'>('none')
  const [selectedFare, setSelectedFare] = useState(0)
  const isRTL = language === 'ar'

  const getLocation = useCallback(() => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setPassengerLocation(loc)
        setLocating(false)
        loadNearbyTaxis(loc.lat, loc.lng)
      },
      () => {
        toast.error(t('location_denied'))
        setLocating(false)
        setPassengerLocation(AMMAN_CENTER)
        loadNearbyTaxis(AMMAN_CENTER.lat, AMMAN_CENTER.lng)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [setPassengerLocation, t])

  const loadNearbyTaxis = async (lat: number, lng: number) => {
    try {
      const taxis = await getNearbyTaxis(lat, lng, MAX_RADIUS_KM)
      setNearbyTaxis(taxis || [])
    } catch { /* silent */ }
  }

  useEffect(() => { if (!passengerLocation) getLocation() }, [])

  const requestTaxi = async () => {
    if (!passengerLocation) return getLocation()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth'; return }
      const { data, error } = await supabase
        .from('requests')
        .insert({ passenger_uid: user.id, pickup_lat: passengerLocation.lat, pickup_lng: passengerLocation.lng, anonymous_channel: hideNumber, status: 'pending' })
        .select().single()
      if (error) throw error
      setActiveRequest(data)
      setSheet('status')
      toast.success(isRTL ? 'جاري البحث عن تاكسي...' : 'Searching for a taxi...')
    } catch { toast.error(t('generic_error')) }
    finally { setLoading(false) }
  }

  const loc = passengerLocation || AMMAN_CENTER
  const fares = [
    { icon: '🚖', name: isRTL ? 'تاكسي' : 'Taxi', price: '3.50 JD' },
    { icon: '🚗', name: isRTL ? 'كومفورت' : 'Comfort', price: '5.00 JD' },
    { icon: '🚙', name: 'SUV', price: '7.00 JD' },
  ]

  return (
    <div style={S.root} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Map */}
      <div style={S.map}>
        {locating && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(6,6,12,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 48 }}>📍</div>
            <div style={{ fontFamily: "'Cairo',sans-serif", color: '#f5c518', fontSize: 16 }}>{isRTL ? 'جاري تحديد موقعك...' : 'Locating you...'}</div>
          </div>
        )}
        <MapContainer center={[loc.lat, loc.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="" />
          <RecenterMap lat={loc.lat} lng={loc.lng} />
          <Marker position={[loc.lat, loc.lng]} icon={passengerIcon}>
            <Popup><span style={{ fontFamily: "'Cairo',sans-serif" }}>{isRTL ? 'موقعك الحالي' : 'Your location'}</span></Popup>
          </Marker>
          <Circle center={[loc.lat, loc.lng]} radius={MAX_RADIUS_KM * 1000} pathOptions={{ color: '#f5c518', fillColor: '#f5c518', fillOpacity: 0.05, weight: 1, dashArray: '6' }} />
          {nearbyTaxis.map((taxi: Taxi) => (
            <Marker key={taxi.id} position={[taxi.lat, taxi.lng]} icon={taxiIcon}>
              <Popup><span style={{ fontFamily: "'Cairo',sans-serif", fontWeight: 700 }}>{taxi.driver_name}</span></Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Top Bar */}
      <div style={S.topBar}>
        <div style={S.searchBar} onClick={() => setSheet('trip')}>
          <span style={{ color: '#6b6b80', fontSize: 14 }}>🔍</span>
          <span style={S.searchText}>{isRTL ? 'إلى أين تتجه اليوم؟' : 'Where to today?'}</span>
          <span style={S.chipYellow}>{isRTL ? 'طلب' : 'Ride'}</span>
        </div>
        <button style={S.iconBtn} onClick={() => setSheet('history')}>🕐</button>
      </div>

      {/* Quick Destinations */}
      {sheet === 'none' && (
        <div style={S.quickScroll}>
          {[
            { icon: '🏠', label: isRTL ? 'المنزل' : 'Home' },
            { icon: '💼', label: isRTL ? 'العمل' : 'Work' },
            { icon: '🛍️', label: isRTL ? 'المول' : 'Mall' },
            { icon: '✈️', label: isRTL ? 'المطار' : 'Airport' },
          ].map((d) => (
            <div key={d.label} style={S.quickCard} onClick={() => setSheet('trip')}>
              <div style={{ ...S.quickIcon, background: 'rgba(245,197,24,0.12)' }}>{d.icon}</div>
              <span>{d.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Dock */}
      <nav style={S.dock}>
        <button style={{ ...S.dockItem, color: sheet === 'trip' ? '#f5c518' : '#6b6b80' }} onClick={() => setSheet('trip')}>
          <span style={{ fontSize: 18 }}>🚗</span>
          <span>{isRTL ? 'رحلة' : 'Ride'}</span>
        </button>
        <button style={{ ...S.dockItem, color: sheet === 'history' ? '#f5c518' : '#6b6b80' }} onClick={() => setSheet('history')}>
          <span style={{ fontSize: 18 }}>🕐</span>
          <span>{isRTL ? 'سجل' : 'History'}</span>
        </button>
        <button style={S.dockCta} onClick={() => setSheet('trip')}>🚕</button>
        <button style={{ ...S.dockItem, color: hideNumber ? '#f5c518' : '#6b6b80' }} onClick={() => setHideNumber(!hideNumber)}>
          <span style={{ fontSize: 18 }}>{hideNumber ? '🔒' : '📱'}</span>
          <span>{isRTL ? 'خصوصية' : 'Privacy'}</span>
        </button>
        <button style={{ ...S.dockItem }} onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}>
          <span style={{ fontSize: 18 }}>⏻</span>
          <span>{isRTL ? 'خروج' : 'Logout'}</span>
        </button>
      </nav>

      {/* ── Trip Sheet ── */}
      <div style={{ ...S.sheet, transform: sheet === 'trip' ? 'translateY(0)' : 'translateY(120%)', maxHeight: '72vh' }}>
        <div style={S.handle} />
        <div style={S.sheetHeader}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900 }}>{isRTL ? 'احجز رحلتك' : 'Book Your Ride'}</h2>
            <button style={{ ...S.iconBtn, width: 34, height: 34, borderRadius: 10, fontSize: 12 }} onClick={() => setSheet('none')}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={S.routeInput}>
              <span style={{ color: '#1dcd9f', fontSize: 10, flexShrink: 0 }}>●</span>
              <input style={{ ...S.inputField, color: '#6b6b80' }} readOnly value={isRTL ? 'موقعي الحالي - عمّان' : 'Current location – Amman'} />
              <span style={{ color: '#f5c518', fontSize: 14 }}>⊕</span>
            </div>
            <div style={S.routeInputActive}>
              <span style={{ color: '#ff4757', fontSize: 10, flexShrink: 0 }}>■</span>
              <input style={S.inputField} placeholder={isRTL ? 'الوجهة...' : 'Destination...'} />
              <span style={{ color: '#6b6b80', fontSize: 13 }}>🔍</span>
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 20px' }}>
          <div style={{ fontSize: 12, color: '#6b6b80', fontWeight: 700, marginBottom: 10 }}>{isRTL ? 'اختر نوع الرحلة' : 'Choose ride type'}</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {fares.map((f, i) => (
              <div key={i} style={selectedFare === i ? S.fareCardSel : S.fareCard} onClick={() => setSelectedFare(i)}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: selectedFare === i ? '#f5c518' : '#6b6b80' }}>{f.name}</div>
                <div style={{ fontSize: 14, fontWeight: 900 }}>{f.price}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '10px 14px', marginBottom: 14 }}>
            <span style={{ color: '#f5c518' }}>💵</span>
            <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{isRTL ? 'الدفع نقداً' : 'Cash payment'}</span>
            <span style={{ fontSize: 11, color: '#6b6b80' }}>{isRTL ? 'تغيير ›' : 'Change ›'}</span>
          </div>
          <button
            onClick={requestTaxi}
            disabled={loading}
            style={{ width: '100%', background: '#f5c518', border: 'none', borderRadius: 14, padding: 15, fontFamily: "'Cairo',sans-serif", fontSize: 15, fontWeight: 900, color: '#000', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (isRTL ? 'جاري البحث...' : 'Searching...') : (isRTL ? '🔍 ابحث عن سائق' : '🔍 Find a Driver')}
          </button>
        </div>
      </div>

      {/* ── Ride Status Sheet ── */}
      <div style={{ ...S.sheet, transform: sheet === 'status' ? 'translateY(0)' : 'translateY(120%)' }}>
        <div style={S.handle} />
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 900 }}>{isRTL ? 'السائق في الطريق إليك' : 'Driver on the way'}</h3>
              <p style={{ fontSize: 12, color: '#6b6b80', marginTop: 2 }}>
                {activeRequest?.taxi ? `${activeRequest.taxi.car_make_model} · ${activeRequest.taxi.plate}` : (isRTL ? 'جاري البحث...' : 'Searching...')}
              </p>
            </div>
            <div style={S.etaPill}>
              <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>4</div>
              <div style={{ fontSize: 11, color: 'rgba(29,205,159,0.7)', marginTop: 2 }}>{isRTL ? 'دقائق' : 'min'}</div>
            </div>
          </div>
          {activeRequest?.taxi && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={S.driverAvatar}>🚕</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 900 }}>{activeRequest.taxi.driver_name}</div>
                <div style={{ fontSize: 11, color: '#6b6b80', marginTop: 2 }}>⭐ 4.9</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <button style={{ ...S.actionBtn, borderColor: 'rgba(29,205,159,0.3)', color: '#1dcd9f' }}>📞 {isRTL ? 'اتصال' : 'Call'}</button>
            <button style={{ ...S.actionBtn, borderColor: 'rgba(245,197,24,0.3)', color: '#f5c518' }}>💬 {isRTL ? 'رسالة' : 'Chat'}</button>
            <button style={S.actionBtn} onClick={() => { setSheet('none'); setActiveRequest(null) }}>✕ {isRTL ? 'إلغاء' : 'Cancel'}</button>
          </div>
          {nearbyTaxis.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#1dcd9f', padding: '8px 12px', background: 'rgba(29,205,159,0.08)', borderRadius: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1dcd9f', display: 'inline-block' }} />
              {nearbyTaxis.length} {isRTL ? 'تاكسي قريب منك' : 'taxis nearby'}
            </div>
          )}
        </div>
      </div>

      {/* ── History Sheet ── */}
      <div style={{ ...S.sheet, transform: sheet === 'history' ? 'translateY(0)' : 'translateY(120%)', maxHeight: '70vh' }}>
        <div style={S.handle} />
        <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900 }}>{isRTL ? 'رحلاتي' : 'My Rides'}</h2>
          <button style={{ ...S.iconBtn, width: 32, height: 32, borderRadius: 10, fontSize: 12 }} onClick={() => setSheet('none')}>✕</button>
        </div>
        <div style={{ padding: '0 20px 16px', overflowY: 'auto', maxHeight: '55vh' }}>
          {[
            { from: isRTL ? 'مول عبدالله' : 'Abdullah Mall', to: isRTL ? 'شارع الرشيد' : 'Rashid St', time: isRTL ? 'اليوم، 10:30 ص' : 'Today, 10:30 AM', price: '4.20 JD' },
            { from: isRTL ? 'المطار' : 'Airport', to: isRTL ? 'الجبيهة' : 'Jubaiha', time: isRTL ? 'أمس، 3:15 م' : 'Yesterday, 3:15 PM', price: '9.50 JD' },
            { from: isRTL ? 'الدوار السابع' : '7th Circle', to: isRTL ? 'المدينة الرياضية' : 'Sports City', time: isRTL ? '26 مارس' : 'Mar 26', price: '3.80 JD' },
          ].map((r, i) => (
            <div key={i} style={S.tripRow}>
              <div style={S.tripIcon}>📍</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{r.from} ← {r.to}</div>
                <div style={{ fontSize: 11, color: '#6b6b80', marginTop: 2 }}>{r.time}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#1dcd9f' }}>{r.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
