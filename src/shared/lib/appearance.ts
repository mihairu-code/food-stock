import { APP_ICONS, appIconFiles, DEFAULT_APP_ICON, type AppIcon } from './appIcons'
import { createStore, useStore } from './store'

/** 'auto' — тема берётся из настроек устройства. */
export const THEMES = ['auto', 'light', 'dark'] as const
export type ThemeSetting = (typeof THEMES)[number]

/** Акцентные цвета; сами оттенки для светлой и тёмной темы описаны в index.css. */
export const ACCENTS = ['green', 'teal', 'blue', 'violet', 'rose', 'graphite'] as const
export type Accent = (typeof ACCENTS)[number]

/** Где у строки продукта точка наличия: в правом или левом верхнем углу иконки или после названия. */
export const DOT_PLACES = ['icon-right', 'icon-left', 'after-name'] as const
export type DotPlace = (typeof DOT_PLACES)[number]

interface Appearance {
  theme: ThemeSetting
  accent: Accent
  icon: AppIcon
  /** Различать не только цветом: точки наличия меняют форму и палитру. */
  colorSafe: boolean
  dotPlace: DotPlace
}

/* Те же ключи читает скрипт в index.html: он выставляет тему до первой отрисовки,
   чтобы экран не мигал светлым перед тёмным. */
const THEME_KEY = 'home-stock:theme'
const ACCENT_KEY = 'home-stock:accent'
const ICON_KEY = 'home-stock:app-icon'
/* Включено — 'on', выключено — ключа нет. Сама система не сообщает вебу о нарушениях
   цветового зрения, поэтому режим только ручной. */
const COLOR_SAFE_KEY = 'home-stock:color-safe'
/* По умолчанию — справа вверху иконки, тогда ключа нет. */
const DOT_PLACE_KEY = 'home-stock:dot-place'

const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

function read(): Appearance {
  let theme: string | null = null
  let accent: string | null = null
  let icon: string | null = null
  let colorSafe: string | null = null
  let dotPlace: string | null = null
  try {
    theme = localStorage.getItem(THEME_KEY)
    accent = localStorage.getItem(ACCENT_KEY)
    icon = localStorage.getItem(ICON_KEY)
    colorSafe = localStorage.getItem(COLOR_SAFE_KEY)
    dotPlace = localStorage.getItem(DOT_PLACE_KEY)
  } catch {
    // хранилище недоступно — оформление по умолчанию
  }
  return {
    theme: theme === 'light' || theme === 'dark' ? theme : 'auto',
    accent: ACCENTS.includes(accent as Accent) ? (accent as Accent) : 'green',
    icon: APP_ICONS.includes(icon as AppIcon) ? (icon as AppIcon) : DEFAULT_APP_ICON,
    colorSafe: colorSafe === 'on',
    dotPlace: DOT_PLACES.includes(dotPlace as DotPlace) ? (dotPlace as DotPlace) : 'icon-right',
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

/**
 * Подставляет выбранную иконку в ссылки страницы. iPhone берёт apple-touch-icon в момент
 * «На экран Домой», Android — иконку из манифеста при установке и при плановой проверке
 * уже установленного приложения. Сменить иконку на экране сразу веб-приложение не может.
 */
function applyIcon(icon: AppIcon): void {
  const files = appIconFiles(icon)
  const links: [string, string][] = [
    ['icon', files.svg],
    ['apple-touch-icon', files.touch],
    // Ссылку на манифест vite-plugin-pwa добавляет только в сборке.
    ['manifest', files.manifest],
  ]
  for (const [rel, file] of links) {
    const link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
    if (link) link.href = `/${file}`
  }
}

/** Переносит выбор на страницу: атрибуты для стилей и цвет системной панели вокруг приложения. */
function apply(): void {
  const { theme, accent, icon, colorSafe, dotPlace } = store.get()
  const root = document.documentElement
  root.dataset.theme = theme === 'auto' ? (systemDark.matches ? 'dark' : 'light') : theme
  root.dataset.accent = accent
  root.toggleAttribute('data-color-safe', colorSafe)
  root.dataset.dotPlace = dotPlace

  const background = getComputedStyle(root).getPropertyValue('--bg').trim()
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.removeAttribute('media')
    meta.content = background
  }
  applyIcon(icon)
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

export function setAppIcon(icon: AppIcon): void {
  save(ICON_KEY, icon === DEFAULT_APP_ICON ? null : icon)
  store.set({ ...store.get(), icon })
  apply()
}

export function setColorSafe(colorSafe: boolean): void {
  save(COLOR_SAFE_KEY, colorSafe ? 'on' : null)
  store.set({ ...store.get(), colorSafe })
  apply()
}

export function setDotPlace(dotPlace: DotPlace): void {
  save(DOT_PLACE_KEY, dotPlace === 'icon-right' ? null : dotPlace)
  store.set({ ...store.get(), dotPlace })
  apply()
}

export const useAppearance = () => useStore(store)
