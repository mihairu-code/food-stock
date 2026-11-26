import { backend, qk, useAction, type HouseholdPatch } from '@/shared/api'
import { notify } from '@/shared/lib/toast'
import { useHouseholdId, useSession } from '@/shared/session'
import { markLeftHousehold, unmarkLeftHousehold } from '../lib/leftHouseholds'

/** Название и аватарка дома; меняет их владелец. */
export function useUpdateHousehold() {
  const householdId = useHouseholdId()
  return useAction((patch: HouseholdPatch) => backend.updateHousehold(householdId, patch), {
    failed: 'toast.renameError',
    refresh: qk.memberships,
  })
}

/**
 * Покинуть текущий дом. Дальше открывается другой дом; если других нет, новый пустой
 * создаст HouseholdGate, как при первом запуске.
 */
export function useLeaveHousehold() {
  const { household, memberships, selectHousehold } = useSession()
  return useAction(
    async () => {
      // Отметка — до запроса: событие Realtime о выходе может прийти раньше ответа.
      markLeftHousehold(household.id)
      try {
        await backend.leaveHousehold(household.id)
      } catch (error) {
        unmarkLeftHousehold(household.id)
        throw error
      }
      const next = memberships.find((membership) => membership.household.id !== household.id)
      if (next) selectHousehold(next.household.id)
      notify('toast.leftHome', { name: household.name })
    },
    { refresh: qk.memberships },
  )
}
