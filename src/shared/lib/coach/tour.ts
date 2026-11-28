import { createStore, useStore } from '../store'

/** Какой шаг обучения следующий на этом устройстве. */
const KEY = 'home-stock:tour'

/**
 * Обучение — пять окон подряд: добавить продукт; продукт, плюс и вкладка «Покупки»;
 * галочка и «Добавить» в покупках; свайп; новый раздел и карандаш раздела.
 */
export const TOUR_STEPS = 5
/** Обучение пройдено: шагов больше нет. */
export const TOUR_DONE = TOUR_STEPS + 1

/** Разбор сохранённого: без записи или с мусором — обучение с начала. */
export function parseTourStep(raw: string | null): number {
  const step = Number(raw)
  return Number.isInteger(step) && step >= 1 && step <= TOUR_DONE ? step : 1
}

/** Следующий шаг после того, как закрыли окно шага `done`; чужой шаг ничего не двигает. */
export const afterTourStep = (current: number, done: number): number =>
  done === current ? Math.min(current + 1, TOUR_DONE) : current

function read(): number {
  try {
    return parseTourStep(localStorage.getItem(KEY))
  } catch {
    return 1
  }
}

function write(step: number): void {
  try {
    localStorage.setItem(KEY, String(step))
  } catch {
    // хранилище недоступно — после перезагрузки обучение продолжится с начала
  }
}

const store = createStore<number>(read())

/** Окно шага закрыто — обучение идёт дальше. */
export function completeTourStep(step: number): void {
  const next = afterTourStep(store.get(), step)
  if (next === store.get()) return
  store.set(next)
  write(next)
}

/** «Пройти обучение заново». */
export function restartTour(): void {
  store.set(1)
  write(1)
}

export const useTourStep = () => useStore(store)
