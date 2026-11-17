import { translate, type MessageKey, type Params } from '@/shared/i18n'
import { createStore, useStore } from './store'

const VISIBLE_MS = 2400
/** Тост с кнопкой висит дольше: человеку нужно успеть прочитать и нажать. */
export const ACTION_TOAST_MS = 5000

/** Кнопка в тосте, например «Вернуть» после удаления. */
export interface ToastAction {
  label: string
  run: () => void
}

export interface ToastMessage {
  text: string
  action?: ToastAction
}

const message = createStore<ToastMessage | null>(null)
let timer: number | undefined

/** Показывает короткое сообщение внизу экрана; новое заменяет прежнее. */
export function toast(text: string, action?: ToastAction): void {
  message.set({ text, action })
  window.clearTimeout(timer)
  timer = window.setTimeout(() => message.set(null), action ? ACTION_TOAST_MS : VISIBLE_MS)
}

/** Тост с текстом из словаря на текущем языке. */
export function notify(key: MessageKey, params?: Params): void {
  toast(translate(key, params))
}

/** Убирает тост с этой кнопкой, если он ещё на экране: нажимать её уже бессмысленно. */
export function dismissToastAction(action: ToastAction): void {
  if (message.get()?.action !== action) return
  window.clearTimeout(timer)
  message.set(null)
}

export const useToastMessage = () => useStore(message)
