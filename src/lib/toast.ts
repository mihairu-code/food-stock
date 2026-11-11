import { translate, type MessageKey, type Params } from '@/i18n'
import { createStore, useStore } from './store'

const VISIBLE_MS = 2400

const message = createStore<string | null>(null)
let timer: number | undefined

/** Показывает короткое сообщение внизу экрана; новое заменяет прежнее. */
export function toast(text: string): void {
  message.set(text)
  window.clearTimeout(timer)
  timer = window.setTimeout(() => message.set(null), VISIBLE_MS)
}

/** Тост с текстом из словаря на текущем языке. */
export function notify(key: MessageKey, params?: Params): void {
  toast(translate(key, params))
}

export const useToastMessage = () => useStore(message)
