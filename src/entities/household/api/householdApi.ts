import { backend, qk, useAction, type HouseholdPatch } from '@/shared/api'
import { useHouseholdId } from '@/shared/session'

/** Название и аватарка дома; меняет их владелец. */
export function useUpdateHousehold() {
  const householdId = useHouseholdId()
  return useAction((patch: HouseholdPatch) => backend.updateHousehold(householdId, patch), {
    failed: 'toast.renameError',
    refresh: qk.memberships,
  })
}
