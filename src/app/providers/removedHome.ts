import type { Membership } from '@/shared/api'

export interface ShownHome {
  id: string
  name: string
}

/**
 * Открытый дом пропал из свежего списка домов — значит, участника удалили. Свой выход
 * (leftSelf) сюда не относится. Возвращает дом, о котором нужно сказать, или null.
 */
export function removedHome(
  shown: ShownHome | null,
  list: readonly Membership[],
  leftSelf: (householdId: string) => boolean,
): ShownHome | null {
  if (!shown || leftSelf(shown.id)) return null
  return list.some((membership) => membership.household.id === shown.id) ? null : shown
}
