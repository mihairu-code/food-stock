/**
 * Следит за экранной клавиатурой. На телефоне она не уменьшает страницу, а ложится
 * поверх: всё, что прижато к низу экрана, оказывается под ней. Сюда записывается,
 * сколько места снизу закрыто и сколько остаётся видимым, — шторка по этим числам
 * встаёт над клавиатурой. Пока клавиатура открыта, на <html> стоит data-keyboard:
 * места мало, и форма в шторке ужимается.
 */

/** Меньше этого от высоты экрана отнимают панели браузера, а не клавиатура. */
const MIN_KEYBOARD = 120

export interface ViewportReading {
  /** Высота окна. */
  layout: number
  /** Высота видимой части: всё, что не закрыто клавиатурой. */
  height: number
  /** На сколько видимая часть сдвинута вниз от верха окна. */
  offsetTop: number
}

/** Сколько места снизу закрыто клавиатурой. */
export function keyboardInset({ layout, height, offsetTop }: ViewportReading): number {
  return Math.max(0, Math.round(layout - (offsetTop + height)))
}

/** Открыта ли клавиатура. Небольшую потерю высоты дают панели браузера. */
export function keyboardOpen({ layout, height }: ViewportReading): boolean {
  return layout - height >= MIN_KEYBOARD
}

export function trackKeyboard(): void {
  const viewport = window.visualViewport
  if (!viewport) return
  const root = document.documentElement

  function update() {
    const reading = { layout: window.innerHeight, height: viewport!.height, offsetTop: viewport!.offsetTop }
    root.style.setProperty('--keyboard-inset', `${keyboardInset(reading)}px`)
    root.style.setProperty('--visible-height', `${Math.round(viewport!.height)}px`)
    root.toggleAttribute('data-keyboard', keyboardOpen(reading))
  }

  viewport.addEventListener('resize', update)
  viewport.addEventListener('scroll', update)
  update()
}
