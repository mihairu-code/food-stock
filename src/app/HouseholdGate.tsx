import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { backend } from '@/data'
import { qk } from '@/data/keys'
import { queryClient } from '@/data/queryClient'
import type { User } from '@/domain/types'
import { SessionContext, type Session } from './session'
import { useRealtimeRefresh } from './useRealtimeRefresh'

/** Находит дом пользователя; при первом запуске создаёт его сам. */
export function HouseholdGate({ user, children }: { user: User; children: ReactNode }) {
  const memberships = useQuery({ queryKey: qk.memberships, queryFn: () => backend.listMemberships() })
  const [createFailed, setCreateFailed] = useState(false)
  // Ref, а не состояние: двойной вызов эффекта в StrictMode не должен создать два дома.
  const creating = useRef(false)
  useRealtimeRefresh()

  const hasHome = (memberships.data?.length ?? 0) > 0
  useEffect(() => {
    if (!memberships.isSuccess || hasHome || creating.current || createFailed) return
    creating.current = true
    backend
      .createHousehold('Наш дом', '')
      .then(() => queryClient.invalidateQueries({ queryKey: qk.memberships }))
      .catch(() => setCreateFailed(true))
      .finally(() => {
        creating.current = false
      })
  }, [memberships.isSuccess, hasHome, createFailed])

  const session = useMemo<Session | null>(() => {
    const first = memberships.data?.[0]
    return first ? { user, household: first.household, role: first.role } : null
  }, [memberships.data, user])

  if (memberships.isPending) return <p className="status">Загрузка…</p>
  if (memberships.isError) return <p className="status">Не удалось загрузить дом. Обновите страницу.</p>
  if (createFailed) {
    return (
      <div className="notice">
        <h2>Не удалось создать дом</h2>
        <p>Проверьте соединение и попробуйте ещё раз.</p>
        <button className="btn" type="button" onClick={() => setCreateFailed(false)}>
          Повторить
        </button>
      </div>
    )
  }
  if (!session) return <p className="status">Готовим ваш дом…</p>
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
