/** Имя пользователя помнится на устройстве, чтобы подставлять его в новые дома. */
const NAME_KEY = 'home-stock:name'

/** Имя без фамилии: «Анна Петрова» → «Анна». */
export function firstName(name: string | null): string {
  return name?.trim().split(/\s+/)[0] ?? ''
}

export function savedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name)
  } catch {
    // хранилище недоступно — имя уже записано в дом, на устройстве его просто не будет
  }
}
