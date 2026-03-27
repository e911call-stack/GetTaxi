import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { RideRequest } from '@/types'

/**
 * Subscribes to real-time updates on a single ride request row.
 * Returns the latest version of the request.
 */
export function useRealtimeRequest(requestId: string | null) {
  const [request, setRequest] = useState<RideRequest | null>(null)

  useEffect(() => {
    if (!requestId) return

    // Load initial state
    supabase
      .from('requests')
      .select('*, taxi:taxis(*)')
      .eq('id', requestId)
      .single()
      .then(({ data }) => { if (data) setRequest(data as RideRequest) })

    // Subscribe to changes
    const channel = supabase
      .channel(`request-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'requests',
          filter: `id=eq.${requestId}`,
        },
        async (payload) => {
          // Re-fetch with taxi join so driver info is fresh
          const { data } = await supabase
            .from('requests')
            .select('*, taxi:taxis(*)')
            .eq('id', payload.new.id)
            .single()
          if (data) setRequest(data as RideRequest)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [requestId])

  return request
}
