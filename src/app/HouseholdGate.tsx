import { useQuery } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'
import { backend } from '@/data'
import { qk } from '@/data/keys'
import type { User } from '@/domain/types'
import { CreateHousehold } from './CreateHousehold'
import { SessionContext, type Session } from './session'
import { useRealtimeRefresh } from './useRealtimeRefresh'

/** Находит дом пользователя; если его ещё нет — предлагает создать или вступить. */
export function HouseholdGate({ user, children }: { user: User; children: ReactNode }) {
  const memberships = useQuery({ queryKey: qk.memberships, queryFn: () => backend.listMemberships() })
  useRealtimeRefresh()

  const session = useMemo<Session | null>(() => {
    const first = memberships.data?.[0]
    return first ? { user, household: first.household, role: first.role } : null
  }, [memberships.data, user])

  if (memberships.isPending) return <p className="status">Загрузка…</p>
  if (memberships.isError) return <p className="status">Не удалось загрузить дом. Обновите страницу.</p>
  if (!session) return <CreateHousehold />
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
