import { useSyncExternalStore } from 'react'
import { en } from './en'
import { ja } from './ja'
import { ru, type Messages } from './ru'
import { vi } from './vi'

/**
 * Языки интерфейса. Все словари лежат в основном файле приложения: ленивая подгрузка
 * ломает открытую старую версию после выкладки новой (см. README, «Обновления»).
 */
export const LANGS = ['ru', 'en', 'ja', 'vi'] as const
export type Lang = (typeof LANGS)[number]
/** 'auto' — язык берётся из настроек устройства. */
export type LangSetting = Lang | 'auto'
export type MessageKey = keyof Messages
export type Params = Record<string, string | number>
export type Translate = (key: MessageKey, params?: Params) => string

/** Названия языков на них самих — так их узнают в любом интерфейсе. */
export const LANG_NAMES: Record<Lang, string> = {
  ru: 'Русский',
  en: 'English',
  ja: '日本語',
  vi: 'Tiếng Việt',
}

const DICTS: Record<Lang, Messages> = { ru, en, ja, vi }
const STORAGE_KEY = 'home-stock:lang'
const FALLBACK: Lang = 'en'

const isLang = (value: unknown): value is Lang => LANGS.includes(value as Lang)

/** Первый поддерживаемый язык из предпочтений устройства: 'ja-JP' → 'ja'. */
export function matchLang(preferred: readonly string[]): Lang {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLang(base)) return base
  }
  return FALLBACK
}

const pluralRules = new Map<Lang, Intl.PluralRules>()

/**
 * Перевод по ключу. Сообщение с формами числа выбирает форму по `count`;
 * `{имя}` заменяется значением из params.
 */
export function format(lang: Lang, key: MessageKey, params?: Params): string {
  const entry = DICTS[lang][key]
  let text: string
  if (typeof entry === 'string') {
    text = entry
  } else {
    let rules = pluralRules.get(lang)
    if (!rules) pluralRules.set(lang, (rules = new Intl.PluralRules(lang)))
    text = entry[rules.select(Number(params?.count ?? 0))] ?? entry.other
  }
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

function readSetting(): LangSetting {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return isLang(saved) ? saved : 'auto'
  } catch {
    return 'auto'
  }
}

function deviceLang(): Lang {
  if (typeof navigator === 'undefined') return FALLBACK
  return matchLang(navigator.languages?.length ? navigator.languages : [navigator.language])
}

let setting: LangSetting = readSetting()
let lang: Lang = setting === 'auto' ? deviceLang() : setting
const listeners = new Set<() => void>()

/** Язык страницы и название приложения: их читают скринридер и «На экран „Домой“». */
function applyToDocument(): void {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
  document.title = format(lang, 'app.name')
  document
    .querySelector('meta[name="apple-mobile-web-app-title"]')
    ?.setAttribute('content', format(lang, 'app.shortName'))
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', format(lang, 'app.tagline'))
}

applyToDocument()

export const getLang = (): Lang => lang
export const getLangSetting = (): LangSetting => setting

export function setLangSetting(next: LangSetting): void {
  setting = next
  lang = next === 'auto' ? deviceLang() : next
  try {
    if (next === 'auto') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // хранилище недоступно — язык действует до перезагрузки
  }
  applyToDocument()
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Перевод на текущий язык — для кода вне компонентов. */
export const translate: Translate = (key, params) => format(lang, key, params)

// По одной функции на язык: ссылка не меняется, пока язык тот же, и её можно
// класть в зависимости useCallback и в пропсы memo-компонентов.
const translators = Object.fromEntries(
  LANGS.map((code) => [code, ((key, params) => format(code, key, params)) satisfies Translate]),
) as Record<Lang, Translate>

/** Перевод на текущий язык; компонент перерисуется, когда язык сменят. */
export function useT(): Translate {
  return translators[useSyncExternalStore(subscribe, getLang, getLang)]
}

export function useLang(): { lang: Lang; setting: LangSetting } {
  return {
    lang: useSyncExternalStore(subscribe, getLang, getLang),
    setting: useSyncExternalStore(subscribe, getLangSetting, getLangSetting),
  }
}
