/**
 * Дома, из которых человек вышел сам в этом запуске. Дом пропадает из списка и когда
 * участника удаляет владелец; по этой отметке приложение отличает одно от другого
 * и о своём выходе не говорит «Вас удалили».
 */
const left = new Set<string>()

export function markLeftHousehold(householdId: string): void {
  left.add(householdId)
}

/** Выйти не получилось — дом остаётся, отметка снимается. */
export function unmarkLeftHousehold(householdId: string): void {
  left.delete(householdId)
}

export const leftHouseholdSelf = (householdId: string): boolean => left.has(householdId)
