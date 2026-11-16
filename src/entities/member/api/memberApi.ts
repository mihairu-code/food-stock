import { useQuery } from '@tanstack/react-query'
import { backend, membersQuery, qk, useAction } from '@/shared/api'
import { useHouseholdId } from '@/shared/session'

export function useMembers() {
  return useQuery(membersQuery(useHouseholdId()))
}

export function useRemoveMember() {
  const householdId = useHouseholdId()
  return useAction((userId: string) => backend.removeMember(householdId, userId), {
    done: 'toast.memberRemoved',
    refresh: qk.members(householdId),
  })
}

export function useSetDisplayName() {
  const householdId = useHouseholdId()
  return useAction((name: string) => backend.setDisplayName(householdId, name), {
    failed: 'toast.nameError',
    refresh: qk.members(householdId),
  })
}
