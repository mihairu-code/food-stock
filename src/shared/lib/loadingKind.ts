/** Картинки загрузки (shared/ui/LoadingPicture). Тот же список — в скрипте index.html. */
export const LOADING_KINDS = ['fridge', 'shelves', 'list'] as const
export type LoadingKind = (typeof LOADING_KINDS)[number]

const isLoadingKind = (value: unknown): value is LoadingKind => LOADING_KINDS.includes(value as LoadingKind)

/** Картинку заставки выбирает скрипт в index.html и пишет в data-boot-picture на <html>. */
export function bootLoadingKind(): LoadingKind {
  const picked = document.documentElement.dataset.bootPicture
  return isLoadingKind(picked) ? picked : LOADING_KINDS[0]
}

let last: LoadingKind | null = null

/**
 * Случайная картинка для новой загрузки, но не та же, что в прошлый раз: подряд одна
 * и та же выглядела бы как будто не случайной. random — для тестов.
 */
export function nextLoadingKind(random: () => number = Math.random): LoadingKind {
  const previous = last ?? bootLoadingKind()
  const others = LOADING_KINDS.filter((kind) => kind !== previous)
  last = others[Math.floor(random() * others.length)]
  return last
}
