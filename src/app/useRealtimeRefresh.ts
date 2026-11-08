import { useEffect } from 'react'
import { backend } from '@/data'
import { queryClient } from '@/data/queryClient'

/** Держит данные свежими: изменения другого участника или устройства перечитывают кэш. */
export function useRealtimeRefresh(): void {
  useEffect(() => backend.subscribe(() => void queryClient.invalidateQueries()), [])
}
