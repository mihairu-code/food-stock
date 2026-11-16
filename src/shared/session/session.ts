import { createContext, useContext } from 'react'
import type { Household, Membership, Role, User } from '@/shared/api/types'

export interface Session {
  user: User
  household: Household
  role: Role
  memberships: Membership[]
  selectHousehold: (householdId: string) => void
}

export const SessionContext = createContext<Session | null>(null)

export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession вызван вне HouseholdGate')
  return session
}

export const useHouseholdId = (): string => useSession().household.id
