/** Когда приложение впервые открыли на этом устройстве — запасная точка отсчёта без аккаунта. */
const FIRST_SEEN_KEY = 'home-stock:first-seen'
const DAY_MS = 24 * 60 * 60 * 1000

function deviceFirstSeen(): number {
  try {
    const saved = Number(localStorage.getItem(FIRST_SEEN_KEY))
    if (saved > 0) return saved
    localStorage.setItem(FIRST_SEEN_KEY, String(Date.now()))
  } catch {
    // хранилище недоступно — считаем человека новым
  }
  return Date.now()
}

/** Сколько дней человек с приложением: от создания аккаунта, а без него — от первого запуска на устройстве. */
export function daysSinceStart(userCreatedAt: string | null): number {
  const since = userCreatedAt ? Date.parse(userCreatedAt) : deviceFirstSeen()
  return (Date.now() - since) / DAY_MS
}
