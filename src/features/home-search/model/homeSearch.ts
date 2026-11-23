import { createStore, useStore } from '@/shared/lib/store'

/**
 * С какого числа продуктов на «Доме» появляется лупа. Меньше — дом умещается на
 * нескольких экранах, и найти глазами быстрее, чем открыть поиск (строка продукта
 * около 60 pt, 20 строк с шапками разделов — это уже четыре-пять экранов прокрутки).
 */
export const SEARCH_MIN_PRODUCTS = 20

interface HomeSearchState {
  open: boolean
  query: string
  /**
   * Куда вернуть прокрутку «Дома» после закрытия: там, где она была до открытия поиска.
   * null — возвращать не нужно (поиск закрыт уходом на другую вкладку: у неё своя прокрутка).
   */
  restoreScroll: number | null
}

const CLOSED: HomeSearchState = { open: false, query: '', restoreScroll: null }

const homeSearch = createStore<HomeSearchState>(CLOSED)
/** Прокрутка «Дома» в момент открытия поиска. */
let scrollBeforeSearch = 0

/** Открывает поиск. Поле фокусирует тот, кто вызвал, — в том же обработчике нажатия. */
export function openHomeSearch(): void {
  if (homeSearch.get().open) return
  scrollBeforeSearch = window.scrollY
  homeSearch.set({ open: true, query: '', restoreScroll: null })
}

/**
 * Закрывает поиск и стирает запрос. `leavingHome` — поиск закрыт переходом на другую
 * вкладку: прокрутку окна трогать нельзя, она уже чужая.
 */
export function closeHomeSearch({ leavingHome = false } = {}): void {
  if (!homeSearch.get().open) return
  homeSearch.set({ ...CLOSED, restoreScroll: leavingHome ? null : scrollBeforeSearch })
}

export function setHomeSearchQuery(query: string): void {
  const current = homeSearch.get()
  if (current.open && current.query !== query) homeSearch.set({ ...current, query })
}

/**
 * Прокрутка «Дома», которую стоит запомнить при уходе с него: пока открыт поиск,
 * это место до поиска, а не в отфильтрованном списке.
 */
export const homeScrollToRemember = (): number => (homeSearch.get().open ? scrollBeforeSearch : window.scrollY)

export const useHomeSearch = () => useStore(homeSearch)
