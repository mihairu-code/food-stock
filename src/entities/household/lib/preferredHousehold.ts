/** Дом, открытый на этом устройстве последним: с него приложение начинает следующий запуск. */
const KEY = 'home-stock:household'

export function preferredHousehold(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function rememberHousehold(householdId: string): void {
  try {
    localStorage.setItem(KEY, householdId)
  } catch {
    // хранилище недоступно — следующий запуск начнётся с первого дома
  }
}
