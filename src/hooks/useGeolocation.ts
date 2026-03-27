import { useState, useEffect, useCallback } from 'react'
import type { GeoPoint } from '@/types'
import { AMMAN_CENTER } from '@/types'

interface GeoState {
  location: GeoPoint | null
  error: string | null
  loading: boolean
}

export function useGeolocation(watchMode = false) {
  const [state, setState] = useState<GeoState>({
    location: null,
    error: null,
    loading: true,
  })

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    setState({
      location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      error: null,
      loading: false,
    })
  }, [])

  const onError = useCallback(() => {
    setState({
      location: AMMAN_CENTER,
      error: 'location_denied',
      loading: false,
    })
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ location: AMMAN_CENTER, error: 'geolocation_unsupported', loading: false })
      return
    }
    const opts: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: watchMode ? 5_000 : 60_000,
    }
    if (watchMode) {
      const wid = navigator.geolocation.watchPosition(onSuccess, onError, opts)
      return () => navigator.geolocation.clearWatch(wid)
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, opts)
    }
  }, [watchMode, onSuccess, onError])

  return state
}
