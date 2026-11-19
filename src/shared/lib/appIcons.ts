/**
 * Иконки приложения на выбор. Список читает и vite.config.ts — он собирает свой
 * манифест для каждой иконки, — поэтому здесь только данные, без браузерных API.
 * Сами картинки лежат в public/; пересобрать их — scripts/make-app-icons.mjs.
 */
export const APP_ICONS = [
  'checklist',
  'checklistDark',
  'boxLeaf',
  'checklistGreen',
  'check',
  'grid',
  'boxDark',
] as const
export type AppIcon = (typeof APP_ICONS)[number]

export const DEFAULT_APP_ICON: AppIcon = 'checklist'

export interface AppIconFiles {
  /** Скруглённый SVG: вкладка браузера и плитка в настройках. */
  svg: string
  /** 180×180 для экрана «Домой» iPhone. */
  touch: string
  small: string
  large: string
  maskable: string
  manifest: string
}

/**
 * Пути к файлам иконки от корня сайта, без начального «/».
 * Иконка по умолчанию лежит в корне под прежними именами: на них ссылаются уже
 * установленные приложения и манифест старой версии.
 */
export function appIconFiles(icon: AppIcon): AppIconFiles {
  if (icon === DEFAULT_APP_ICON) {
    return {
      svg: 'favicon.svg',
      touch: 'apple-touch-icon.png',
      small: 'pwa-192.png',
      large: 'pwa-512.png',
      maskable: 'pwa-maskable-512.png',
      manifest: 'manifest.webmanifest',
    }
  }
  const base = `icons/${icon}`
  return {
    svg: `${base}.svg`,
    touch: `${base}-180.png`,
    small: `${base}-192.png`,
    large: `${base}-512.png`,
    maskable: `${base}-maskable-512.png`,
    manifest: `manifest-${icon}.webmanifest`,
  }
}
