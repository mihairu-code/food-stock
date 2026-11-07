import { createContext, useContext } from 'react'
import type { Household, Role, User } from '@/domain/types'

export interface Session {
  user: User
  household: Household
  role: Role
}

export const SessionContext = createContext<Session | null>(null)

export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession вызван вне HouseholdGate')
  return session
}

export const useHouseholdId = (): string => useSession().household.id
