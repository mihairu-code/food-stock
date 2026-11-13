/**
 * Тактильный отклик. Работает там, где у браузера есть Vibration API, — на Android.
 * На iPhone веб-приложению вибрация недоступна: Safari этот API не поддерживает,
 * а обходной приём с переключателем Apple закрыла. Там функция ничего не делает.
 */
const PATTERNS = {
  /** Строку взяли. */
  pick: 12,
  /** Строка перешла на новое место. */
  move: 6,
  /** Строку отпустили. */
  drop: [8, 40, 10],
} satisfies Record<string, number | number[]>

export type Haptic = keyof typeof PATTERNS

export function haptic(kind: Haptic): void {
  // Без жеста пользователя браузер вибрацию запрещает и пишет об этом в консоль.
  if (typeof navigator.vibrate !== 'function' || !navigator.userActivation?.hasBeenActive) return
  navigator.vibrate(PATTERNS[kind])
}
