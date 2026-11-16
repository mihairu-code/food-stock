import { createStore, useStore } from '../store'

/** 'auto' — подсказки видит только новый человек, первые дни. */
export type HintsSetting = 'auto' | 'on' | 'off'

const KEY = 'home-stock:hints'
/** Когда приложение впервые открыли на этом устройстве — запасная точка отсчёта. */
const FIRST_SEEN_KEY = 'home-stock:first-seen'
const NEW_USER_DAYS = 3
const DAY_MS = 24 * 60 * 60 * 1000

function read(): HintsSetting {
  try {
    const saved = localStorage.getItem(KEY)
    return saved === 'on' || saved === 'off' ? saved : 'auto'
  } catch {
    return 'auto'
  }
}

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

const store = createStore<HintsSetting>(read())

export const useHintsSetting = () => useStore(store)

/** Показывать ли подсказки: явный выбор в настройках главнее, иначе — только новичку. */
export function hintsVisible(setting: HintsSetting, userCreatedAt: string | null): boolean {
  if (setting !== 'auto') return setting === 'on'
  const since = userCreatedAt ? Date.parse(userCreatedAt) : deviceFirstSeen()
  return Date.now() - since < NEW_USER_DAYS * DAY_MS
}

/** Переключатель в настройках: дальше подсказки включены или выключены независимо от срока. */
export function setHintsVisible(visible: boolean): void {
  const next: HintsSetting = visible ? 'on' : 'off'
  try {
    localStorage.setItem(KEY, next)
  } catch {
    // хранилище недоступно — выбор действует до перезагрузки
  }
  store.set(next)
}
