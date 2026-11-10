import { useEffect } from 'react'
import { backend } from '@/data'
import { queryClient } from '@/data/queryClient'

const DEBOUNCE_MS = 150

/**
 * Держит данные свежими: изменения другого участника или устройства перечитывают кэш.
 * Изменение одного участника порождает несколько событий подряд — перечитываем один раз.
 * Пока свои правки ещё летят на сервер, ждём: иначе ответ затёр бы их на экране.
 */
export function useRealtimeRefresh(): void {
  useEffect(() => {
    let timer: number | undefined
    const refresh = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (queryClient.isMutating() > 0) refresh()
        else void queryClient.invalidateQueries()
      }, DEBOUNCE_MS)
    }
    const unsubscribe = backend.subscribe(refresh)
    return () => {
      window.clearTimeout(timer)
      unsubscribe()
    }
  }, [])
}
