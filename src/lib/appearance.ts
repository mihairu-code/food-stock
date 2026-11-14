import { createStore, useStore } from './store'

/** 'auto' — тема берётся из настроек устройства. */
export const THEMES = ['auto', 'light', 'dark'] as const
export type ThemeSetting = (typeof THEMES)[number]

/** Акцентные цвета; сами оттенки для светлой и тёмной темы описаны в index.css. */
export const ACCENTS = ['green', 'teal', 'blue', 'violet', 'rose', 'graphite'] as const
export type Accent = (typeof ACCENTS)[number]

interface Appearance {
  theme: ThemeSetting
  accent: Accent
}

/* Те же ключи читает скрипт в index.html: он выставляет тему до первой отрисовки,
   чтобы экран не мигал светлым перед тёмным. */
const THEME_KEY = 'home-stock:theme'
const ACCENT_KEY = 'home-stock:accent'

const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

function read(): Appearance {
  let theme: string | null = null
  let accent: string | null = null
  try {
    theme = localStorage.getItem(THEME_KEY)
    accent = localStorage.getItem(ACCENT_KEY)
  } catch {
    // хранилище недоступно — оформление по умолчанию
  }
  return {
    theme: theme === 'light' || theme === 'dark' ? theme : 'auto',
    accent: ACCENTS.includes(accent as Accent) ? (accent as Accent) : 'green',
  }
}

function save(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // хранилище недоступно — выбор действует до перезагрузки
  }
}

const store = createStore<Appearance>(read())

/** Переносит выбор на страницу: атрибуты для стилей и цвет системной панели вокруг приложения. */
function apply(): void {
  const { theme, accent } = store.get()
  const root = document.documentElement
  root.dataset.theme = theme === 'auto' ? (systemDark.matches ? 'dark' : 'light') : theme
  root.dataset.accent = accent

  const background = getComputedStyle(root).getPropertyValue('--bg').trim()
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.removeAttribute('media')
    meta.content = background
  }
}

/** Вызывается при запуске; дальше оформление следит за сменой темы на устройстве. */
export function startAppearance(): void {
  apply()
  systemDark.addEventListener('change', apply)
}

export function setTheme(theme: ThemeSetting): void {
  save(THEME_KEY, theme === 'auto' ? null : theme)
  store.set({ ...store.get(), theme })
  apply()
}

export function setAccent(accent: Accent): void {
  save(ACCENT_KEY, accent === 'green' ? null : accent)
  store.set({ ...store.get(), accent })
  apply()
}

export const useAppearance = () => useStore(store)
