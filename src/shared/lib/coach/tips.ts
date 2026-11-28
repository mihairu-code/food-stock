import { createStore, useStore } from '../store'

/** Советы выключены — 'off', включены — ключа нет. */
const ENABLED_KEY = 'home-stock:tips'
/** Что человек делал на этом устройстве — поводы для советов. Аналитики нет, всё остаётся здесь. */
const EVENTS_KEY = 'home-stock:tip-events'
/** «Закончилось» и «Куплено» с разницей не больше этого — значит, отметили прямо в магазине. */
export const QUICK_BUY_MS = 30 * 60 * 1000

export interface TipEvents {
  /** Когда удалили продукт, добавленный меньше недели назад (повод для совета 1); 0 — не было. */
  oneOffDeletedAt: number
  /** Список покупок хоть раз переставляли (совет 5 тогда не нужен). */
  shoppingReordered: boolean
  /** Когда продукт отметили «закончилось»: id → время; ждёт «Куплено». */
  outAt: Record<string, number>
  /** Сколько раз продукт купили почти сразу после «закончилось» (совет 8). */
  quickBuys: number
  /** Сколько раз открывали приложение (совет 3+4 на iPhone — с третьего захода). */
  opens: number
}

const EMPTY: TipEvents = { oneOffDeletedAt: 0, shoppingReordered: false, outAt: {}, quickBuys: 0, opens: 0 }

const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

/** Разбор сохранённого: недостающее и битое — по умолчанию. */
export function parseTipEvents(raw: string | null): TipEvents {
  if (!raw) return EMPTY
  try {
    const parsed = JSON.parse(raw) as Partial<Record<keyof TipEvents, unknown>> | null
    if (!parsed || typeof parsed !== 'object') return EMPTY
    const outAt =
      parsed.outAt && typeof parsed.outAt === 'object' && !Array.isArray(parsed.outAt)
        ? Object.fromEntries(Object.entries(parsed.outAt).filter(([, at]) => typeof at === 'number'))
        : {}
    return {
      oneOffDeletedAt: num(parsed.oneOffDeletedAt),
      shoppingReordered: parsed.shoppingReordered === true,
      outAt,
      quickBuys: num(parsed.quickBuys),
      opens: num(parsed.opens),
    }
  } catch {
    return EMPTY
  }
}

/** Продукт отметили «закончилось»: запоминаем время; давние отметки выбрасываем. */
export function afterMarkedOut(events: TipEvents, id: string, now: number): TipEvents {
  const fresh = Object.fromEntries(Object.entries(events.outAt).filter(([, at]) => now - at <= QUICK_BUY_MS))
  return { ...events, outAt: { ...fresh, [id]: now } }
}

/** Продукт купили: если «закончилось» было совсем недавно, это покупка «прямо в магазине». */
export function afterBought(events: TipEvents, id: string, now: number): TipEvents {
  const outAt = events.outAt[id]
  if (outAt === undefined) return events
  const rest = Object.fromEntries(Object.entries(events.outAt).filter(([key]) => key !== id))
  const quick = now - outAt <= QUICK_BUY_MS
  return { ...events, outAt: rest, quickBuys: events.quickBuys + (quick ? 1 : 0) }
}

function read<T>(key: string, parse: (raw: string | null) => T): T {
  try {
    return parse(localStorage.getItem(key))
  } catch {
    return parse(null)
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // хранилище недоступно — совет просто покажется позже или не покажется
  }
}

const events = createStore<TipEvents>(read(EVENTS_KEY, parseTipEvents))
const enabled = createStore<boolean>(read(ENABLED_KEY, (raw) => raw !== 'off'))

function update(next: TipEvents): void {
  events.set(next)
  write(EVENTS_KEY, JSON.stringify(next))
}

export const noteAppOpen = () => update({ ...events.get(), opens: events.get().opens + 1 })
export const noteOneOffDeleted = () => update({ ...events.get(), oneOffDeletedAt: Date.now() })
export function noteShoppingReordered(): void {
  if (!events.get().shoppingReordered) update({ ...events.get(), shoppingReordered: true })
}
export const noteMarkedOut = (id: string) => update(afterMarkedOut(events.get(), id, Date.now()))
export function noteBought(id: string): void {
  const next = afterBought(events.get(), id, Date.now())
  if (next !== events.get()) update(next)
}

/** Переключатель «Советы» в настройках. */
export function setTipsEnabled(on: boolean): void {
  enabled.set(on)
  write(ENABLED_KEY, on ? null : 'off')
}

export const useTipEvents = () => useStore(events)
export const useTipsEnabled = () => useStore(enabled)
