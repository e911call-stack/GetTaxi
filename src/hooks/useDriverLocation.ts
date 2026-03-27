import { useEffect, useRef } from 'react'
import { updateTaxiLocation } from '@/lib/supabase'

/**
 * Continuously watches GPS and pushes updates to Supabase
 * while the driver is online.
 */
export function useDriverLocation(taxiId: string | null, isOnline: boolean) {
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!taxiId || !isOnline) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        await updateTaxiLocation(taxiId, pos.coords.latitude, pos.coords.longitude)
      },
      () => { /* silent fail on GPS error */ },
      { enableHighAccuracy: true, maximumAge: 4_000, timeout: 8_000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [taxiId, isOnline])
}
