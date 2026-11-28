import { useEffect } from 'react'
import { offerCoach, withdrawCoach, type CoachRequest } from './coach'

/**
 * Экран сообщает, есть ли сейчас повод для окна `id`: `request` — есть, `null` — нет.
 * Когда показать, решает CoachHost. `request` стоит держать в useMemo: новый объект на
 * каждой отрисовке просто обновит тексты, но лишний раз разбудит очередь.
 */
export function useCoach(id: string, request: CoachRequest | null): void {
  useEffect(() => {
    if (request) offerCoach(request)
    else withdrawCoach(id)
  }, [id, request])

  useEffect(() => () => withdrawCoach(id), [id])
}
