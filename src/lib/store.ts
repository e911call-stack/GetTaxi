import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile, RideRequest, Taxi } from '@/types'

interface AppStore {
  // ── Language ──────────────────────────────────────────────────────────────
  language: 'ar' | 'en'
  setLanguage: (lang: 'ar' | 'en') => void

  // ── Auth ──────────────────────────────────────────────────────────────────
  profile: Profile | null
  setProfile: (profile: Profile | null) => void

  // ── Taxi driver state ─────────────────────────────────────────────────────
  myTaxi: Taxi | null
  setMyTaxi: (taxi: Taxi | null) => void

  // ── Active ride request ───────────────────────────────────────────────────
  activeRequest: RideRequest | null
  setActiveRequest: (req: RideRequest | null) => void

  // ── Passenger privacy ─────────────────────────────────────────────────────
  hideNumber: boolean
  setHideNumber: (v: boolean) => void

  // ── Passenger location ────────────────────────────────────────────────────
  passengerLocation: { lat: number; lng: number } | null
  setPassengerLocation: (loc: { lat: number; lng: number } | null) => void

  // ── Nearby taxis (passenger view) ─────────────────────────────────────────
  nearbyTaxis: Taxi[]
  setNearbyTaxis: (taxis: Taxi[]) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      language: 'ar',
      setLanguage: (language) => set({ language }),

      profile: null,
      setProfile: (profile) => set({ profile }),

      myTaxi: null,
      setMyTaxi: (myTaxi) => set({ myTaxi }),

      activeRequest: null,
      setActiveRequest: (activeRequest) => set({ activeRequest }),

      hideNumber: false,
      setHideNumber: (hideNumber) => set({ hideNumber }),

      passengerLocation: null,
      setPassengerLocation: (passengerLocation) => set({ passengerLocation }),

      nearbyTaxis: [],
      setNearbyTaxis: (nearbyTaxis) => set({ nearbyTaxis }),
    }),
    {
      name: 'yellowwant-store',
      partialize: (state) => ({
        language: state.language,
        hideNumber: state.hideNumber,
      }),
    }
  )
)
