import { createStore, useStore } from '../store'

/** Какие из «Первых шагов» сделаны на этом устройстве. */
const KEY = 'home-stock:first-steps'

/**
 * Пять шагов нового человека: создать раздел, добавить продукт, отметить «закончилось»,
 * купить что-нибудь из списка, позвать того, с кем живёте.
 */
export const FIRST_STEPS = ['section', 'product', 'markedOut', 'bought', 'invited'] as const
export type FirstStep = (typeof FIRST_STEPS)[number]

const isStep = (value: unknown): value is FirstStep => FIRST_STEPS.includes(value as FirstStep)

/** Разбор сохранённого списка: битая или чужая запись — пустой список. */
export function parseFirstSteps(raw: string | null): FirstStep[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isStep) : []
  } catch {
    return []
  }
}

function read(): ReadonlySet<FirstStep> {
  try {
    return new Set(parseFirstSteps(localStorage.getItem(KEY)))
  } catch {
    return new Set()
  }
}

function write(steps: ReadonlySet<FirstStep>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...steps]))
  } catch {
    // хранилище недоступно — шаг отметится снова, когда человек его повторит
  }
}

const store = createStore<ReadonlySet<FirstStep>>(read())

/**
 * Шаг сделан. Запоминается насовсем: например, после «Покинуть дом» участников снова
 * может стать один, но позвать домашних человек уже умеет.
 */
export function markFirstStep(step: FirstStep): void {
  if (store.get().has(step)) return
  const next = new Set(store.get()).add(step)
  store.set(next)
  write(next)
}

/** «Показать подсказки и советы заново». */
export function resetFirstSteps(): void {
  store.set(new Set())
  write(new Set())
}

/** Сколько шагов сделано: отмеченные и те, что видны по данным дома прямо сейчас. */
export function countFirstSteps(marked: ReadonlySet<FirstStep>, current: Partial<Record<FirstStep, boolean>>): number {
  return FIRST_STEPS.filter((step) => marked.has(step) || current[step]).length
}

export const useFirstStepsMarked = () => useStore(store)
