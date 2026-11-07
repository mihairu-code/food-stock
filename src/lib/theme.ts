/** 'auto' — тема берётся из настроек устройства. */
export type ThemeSetting = 'auto' | 'light' | 'dark'

const THEME_KEY = 'home-stock:theme'

const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

export function readTheme(): ThemeSetting {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'auto'
  } catch {
    return 'auto'
  }
}

function apply(theme: ThemeSetting): void {
  const dark = theme === 'dark' || (theme === 'auto' && systemDark.matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

/** Вызывается при запуске; дальше тема следит за сменой темы на устройстве. */
export function startTheme(): void {
  apply(readTheme())
  systemDark.addEventListener('change', () => apply(readTheme()))
}

export function setTheme(theme: ThemeSetting): void {
  try {
    if (theme === 'auto') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, theme)
  } catch {
    // хранилище недоступно — выбор действует до перезагрузки
  }
  apply(theme)
}
