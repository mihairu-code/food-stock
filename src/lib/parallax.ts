/** Насколько фон с точками отстаёт от прокрутки: 0 — стоит на месте, 1 — едет вместе со страницей. */
const DEPTH = 0.15

/**
 * Лёгкий параллакс: сетка точек едет медленнее содержимого. Сдвиг пишется
 * в переменную, а сам фон двигает CSS.
 */
export function startParallax(): void {
  const root = document.documentElement
  let frame = 0
  window.addEventListener(
    'scroll',
    () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        root.style.setProperty('--dots-shift', `${Math.round(-window.scrollY * DEPTH)}px`)
      })
    },
    { passive: true },
  )
}
