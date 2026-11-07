import { useQuery } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'
import { backend } from '@/data'
import { qk } from '@/data/keys'
import type { User } from '@/domain/types'
import { SessionContext, type Session } from './session'

/** Находит дом пользователя; пока его нет — показывает заставку. */
export function HouseholdGate({ user, children }: { user: User; children: ReactNode }) {
  const memberships = useQuery({ queryKey: qk.memberships, queryFn: () => backend.listMemberships() })

  const session = useMemo<Session | null>(() => {
    const first = memberships.data?.[0]
    return first ? { user, household: first.household, role: first.role } : null
  }, [memberships.data, user])

  if (memberships.isPending) return <p className="status">Загрузка…</p>
  if (memberships.isError) return <p className="status">Не удалось загрузить дом. Обновите страницу.</p>
  if (!session) return <p className="status">Дом не найден</p>
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
