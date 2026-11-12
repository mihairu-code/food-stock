/** Дом, открытый на этом устройстве последним: с него приложение начинает следующий запуск. */
const KEY = 'home-stock:household'

export function preferredHousehold(): string | null {
  return localStorage.getItem(KEY)
}

export function rememberHousehold(householdId: string): void {
  localStorage.setItem(KEY, householdId)
}
