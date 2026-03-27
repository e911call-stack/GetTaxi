import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase, getNearbyTaxis } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import type { Taxi, RideRequest } from '@/types'
import { AMMAN_CENTER, MAX_RADIUS_KM } from '@/types'
import toast from 'react-hot-toast'

// ─── Custom Leaflet icons ─────────────────────────────────────────────────────
const passengerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:40px;height:40px;border-radius:50%;
    background:#FFD700;border:3px solid #0A0A0A;
    display:flex;align-items:center;justify-content:center;
    font-size:20px;box-shadow:0 0 20px rgba(255,215,0,0.6);
  ">📍</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

const taxiIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:36px;height:36px;border-radius:8px;
    background:#0A0A0A;border:2px solid #FFD700;
    display:flex;align-items:center;justify-content:center;
    font-size:18px;
  ">🚕</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

// ─── Map re-center helper ─────────────────────────────────────────────────────
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => { map.setView([lat, lng], 15) }, [lat, lng, map])
  return null
}

// ─── Privacy Toggle ───────────────────────────────────────────────────────────
function PrivacyToggle() {
  const { t, i18n } = useTranslation()
  const { hideNumber, setHideNumber } = useAppStore()
  const isRTL = i18n.language === 'ar'

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-taxi-black-mid border border-taxi-yellow/15">
      <div className="flex items-center gap-3">
        <span className="text-xl">{hideNumber ? '🔒' : '📱'}</span>
        <div>
          <div className="font-arabic text-taxi-white-pure text-sm font-semibold">
            {t('hide_number')}
          </div>
          <div className="font-body text-taxi-gray-light text-xs mt-0.5">
            {isRTL ? 'استخدام قناة مؤقتة' : 'Use temporary channel'}
          </div>
        </div>
      </div>
      <button
        onClick={() => setHideNumber(!hideNumber)}
        className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
          hideNumber ? 'bg-taxi-green' : 'bg-taxi-gray'
        }`}
      >
        <span
          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
            hideNumber
              ? isRTL ? 'translate-x-1' : 'translate-x-7'
              : isRTL ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

// ─── Driver Card (passenger sees full details) ────────────────────────────────
function DriverCard({ taxi, request }: { taxi: Taxi; request: RideRequest }) {
  const { t } = useTranslation()
  const canChat = request.status === 'driver_arrived' || request.status === 'in_progress'

  return (
    <div className="rounded-2xl bg-taxi-black-soft border border-taxi-yellow/20 overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-taxi-yellow via-taxi-yellow-glow to-taxi-yellow" />
      <div className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-taxi-yellow/10 border border-taxi-yellow/30 flex items-center justify-center text-3xl">
            🚕
          </div>
          <div>
            <div className="font-arabic text-taxi-yellow text-lg font-bold">{taxi.driver_name}</div>
            {taxi.verified && (
              <div className="flex items-center gap-1 text-taxi-green text-xs font-body">
                <span>✓</span><span>{t('verified_driver')}</span>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-taxi-black-mid rounded-xl p-3">
            <div className="text-taxi-gray-light font-body text-xs mb-1">{t('plate_number')}</div>
            <div className="text-taxi-white-pure font-arabic font-bold">{taxi.plate}</div>
          </div>
          <div className="bg-taxi-black-mid rounded-xl p-3">
            <div className="text-taxi-gray-light font-body text-xs mb-1">{t('car_model')}</div>
            <div className="text-taxi-white-pure font-body text-sm">{taxi.car_make_model}</div>
          </div>
          {taxi.company && (
            <div className="col-span-2 bg-taxi-black-mid rounded-xl p-3">
              <div className="text-taxi-gray-light font-body text-xs mb-1">{t('company')}</div>
              <div className="text-taxi-white-pure font-arabic">{taxi.company}</div>
            </div>
          )}
        </div>
        {canChat && (
          <div className="mt-4 p-3 rounded-xl bg-taxi-green/10 border border-taxi-green/30 text-center">
            <div className="font-arabic text-taxi-green text-sm font-semibold">
              💬 {t('chat_unlocked')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Passenger Page ──────────────────────────────────────────────────────
export function PassengerPage() {
  const { t } = useTranslation()
  const { passengerLocation, setPassengerLocation, nearbyTaxis, setNearbyTaxis, hideNumber, language } = useAppStore()
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const isRTL = language === 'ar'

  // ── Get location ────────────────────────────────────────────────────────────
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
        // Fallback to Amman center
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
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    if (!passengerLocation) getLocation()
  }, [])

  // ── Request taxi ────────────────────────────────────────────────────────────
  const requestTaxi = async () => {
    if (!passengerLocation) return getLocation()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth'; return }

      const { data, error } = await supabase
        .from('requests')
        .insert({
          passenger_uid: user.id,
          pickup_lat: passengerLocation.lat,
          pickup_lng: passengerLocation.lng,
          anonymous_channel: hideNumber,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error
      setActiveRequest(data)
      toast.success(isRTL ? 'جاري البحث عن تاكسي...' : 'Searching for a taxi...')
    } catch {
      toast.error(t('generic_error'))
    } finally {
      setLoading(false)
    }
  }

  const loc = passengerLocation || AMMAN_CENTER

  return (
    <div className="min-h-screen bg-taxi-black flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-taxi-black-soft border-b border-taxi-yellow/10">
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">🚕</span>
          <span className="font-arabic text-taxi-yellow font-bold">YellowWant.jo</span>
        </a>
        <div className="text-taxi-gray-light font-body text-sm">{t('amman_only')}</div>
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: '60vh' }}>
        {locating && (
          <div className="absolute inset-0 z-50 bg-taxi-black/80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4 animate-bounce">📍</div>
              <div className="font-arabic text-taxi-yellow text-lg">{isRTL ? 'جاري تحديد موقعك...' : 'Locating you...'}</div>
            </div>
          </div>
        )}
        <MapContainer
          center={[loc.lat, loc.lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <RecenterMap lat={loc.lat} lng={loc.lng} />

          {/* Passenger marker */}
          <Marker position={[loc.lat, loc.lng]} icon={passengerIcon}>
            <Popup><div className="font-arabic text-sm">{isRTL ? 'موقعك الحالي' : 'Your location'}</div></Popup>
          </Marker>

          {/* 2km radius circle */}
          <Circle
            center={[loc.lat, loc.lng]}
            radius={MAX_RADIUS_KM * 1000}
            pathOptions={{ color: '#FFD700', fillColor: '#FFD700', fillOpacity: 0.05, weight: 1, dashArray: '6' }}
          />

          {/* Nearby taxis */}
          {nearbyTaxis.map((taxi) => (
            <Marker key={taxi.id} position={[taxi.lat, taxi.lng]} icon={taxiIcon}>
              <Popup>
                <div className="font-arabic text-sm">
                  <div className="font-bold">{taxi.driver_name}</div>
                  <div className="text-gray-600">{taxi.plate}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Bottom panel */}
      <div className="bg-taxi-black-soft border-t border-taxi-yellow/20 px-4 py-5 space-y-4">
        <PrivacyToggle />

        {nearbyTaxis.length > 0 && !activeRequest && (
          <div className="flex items-center gap-2 text-taxi-green text-sm font-body">
            <span className="w-2 h-2 rounded-full bg-taxi-green animate-pulse" />
            <span>{nearbyTaxis.length} {isRTL ? 'تاكسي متاح قريبك' : 'taxis available nearby'}</span>
          </div>
        )}

        {!activeRequest ? (
          <button
            onClick={requestTaxi}
            disabled={loading}
            className="w-full py-5 rounded-3xl bg-gradient-to-b from-taxi-yellow-glow to-taxi-yellow text-taxi-black font-arabic text-2xl font-black shadow-yellow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '⏳' : `🚕 ${t('want_taxi')}`}
          </button>
        ) : (
          <div className="space-y-3">
            {/* Status */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-taxi-yellow/10 border border-taxi-yellow/30">
              <span className="text-2xl animate-bounce">🔍</span>
              <span className="font-arabic text-taxi-yellow font-semibold">{t('finding_taxi')}</span>
            </div>
            {activeRequest.taxi && (
              <DriverCard taxi={activeRequest.taxi} request={activeRequest} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
