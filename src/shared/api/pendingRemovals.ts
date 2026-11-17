import { translate, type MessageKey, type Params } from '@/shared/i18n'
import { createStore, useStore, type Store } from '@/shared/lib/store'
import { ACTION_TOAST_MS, dismissToastAction, toast, type ToastAction } from '@/shared/lib/toast'
import type { HomeData } from './homeDataRules'

/**
 * Что убирается: продукт целиком, продукт только из покупок (дома он остаётся)
 * или ручная позиция покупок.
 */
export type RemovalKind = 'product' | 'from-list' | 'shopping-item'

/** Запись, скрытая с экрана до отправки запроса. */
export interface HiddenRecord {
  id: string
  kind: RemovalKind
}

interface Removal {
  /** Всё, что скрыто этим удалением: сама запись и то, что уходит вместе с ней. */
  records: HiddenRecord[]
  commit: () => Promise<unknown>
  timer: ReturnType<typeof setTimeout>
  action: ToastAction
}

/**
 * Удаление, которое можно отменить. Запись сразу пропадает с экрана, а запрос уходит
 * позже — когда закроется тост с «Вернуть», когда человек сделает что-то ещё или
 * свернёт приложение. Так отмене не нужно восстанавливать запись на сервере: её
 * там ещё никто не трогал, и она возвращается со своим местом в списке.
 */
const waiting = new Map<string, Removal>()
/**
 * Что сейчас скрыто от экрана. Запись остаётся здесь и после отправки запроса — до его
 * ответа: оптимистичная правка кэша наступает не мгновенно, и без этого строка мелькала бы.
 */
const hiddenStore: Store<ReadonlyMap<string, RemovalKind>> = createStore<ReadonlyMap<string, RemovalKind>>(new Map())
let listening = false

function hide(records: HiddenRecord[]) {
  const next = new Map(hiddenStore.get())
  for (const { id, kind } of records) next.set(id, kind)
  hiddenStore.set(next)
}

function reveal(records: HiddenRecord[]) {
  const next = new Map(hiddenStore.get())
  for (const { id } of records) next.delete(id)
  hiddenStore.set(next)
}

function commit(id: string) {
  const removal = waiting.get(id)
  if (!removal) return
  waiting.delete(id)
  clearTimeout(removal.timer)
  dismissToastAction(removal.action)
  // Ошибку покажет сама мутация; после ответа запись снова видна, если она уцелела.
  removal.commit().then(
    () => reveal(removal.records),
    () => reveal(removal.records),
  )
}

/** Отправить все отложенные удаления сейчас. */
export function commitPendingRemovals(): void {
  for (const id of [...waiting.keys()]) commit(id)
}

function listenForLeaving() {
  if (listening || typeof document === 'undefined') return
  listening = true
  // Свёрнутое приложение телефон может выгрузить — удаление не должно пропасть вместе с ним.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') commitPendingRemovals()
  })
  window.addEventListener('pagehide', commitPendingRemovals)
}

interface RemovalRequest {
  id: string
  kind: RemovalKind
  /** Сам запрос: вызывается один раз, когда отменять уже поздно. */
  commit: () => Promise<unknown>
  /** Текст тоста; кнопка «Вернуть» добавляется к нему сама. */
  message: MessageKey
  params?: Params
}

/**
 * Убирает запись с экрана сразу, а с сервера — если человек не нажал «Вернуть».
 * Возвращает ту же отмену, что и кнопка тоста.
 */
export function removeWithUndo({ id, kind, commit: send, message, params }: RemovalRequest): () => void {
  listenForLeaving()
  // Прежнюю отмену заменит новый тост — её удаление уходит сразу.
  commitPendingRemovals()
  const action: ToastAction = {
    label: translate('toast.undo'),
    run: () => {
      const removal = waiting.get(id)
      if (!removal) return
      waiting.delete(id)
      clearTimeout(removal.timer)
      reveal(removal.records)
    },
  }
  const records = [{ id, kind }]
  waiting.set(id, { records, commit: send, action, timer: setTimeout(() => commit(id), ACTION_TOAST_MS) })
  hide(records)
  toast(translate(message, params), action)
  return action.run
}

/** Данные дома без того, что ждёт удаления. Без отложенных удалений — те же объекты. */
export function withoutPendingRemovals(data: HomeData, hidden: ReadonlyMap<string, RemovalKind>): HomeData {
  if (hidden.size === 0) return data
  return {
    sections: data.sections,
    products: data.products
      .filter((product) => hidden.get(product.id) !== 'product')
      .map((product) => {
        const kind = hidden.get(product.id)
        if (kind === 'from-list') return { ...product, to_buy: false }
        return product
      }),
    shoppingItems: data.shoppingItems.filter((item) => hidden.get(item.id) !== 'shopping-item'),
  }
}

export const usePendingRemovals = () => useStore(hiddenStore)

/** Что скрыто прямо сейчас — для кода вне React. */
export const readPendingRemovals = () => hiddenStore.get()
