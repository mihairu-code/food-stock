/**
 * Следит за экранной клавиатурой. На телефоне она не уменьшает страницу, а ложится
 * поверх: всё, что прижато к низу экрана, оказывается под ней. Сюда записывается,
 * сколько места снизу закрыто и сколько остаётся видимым, — шторка по этим числам
 * встаёт над клавиатурой.
 */

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

export function trackKeyboard(): void {
  const viewport = window.visualViewport
  if (!viewport) return
  const root = document.documentElement

  function update() {
    const inset = keyboardInset({ layout: window.innerHeight, height: viewport!.height, offsetTop: viewport!.offsetTop })
    root.style.setProperty('--keyboard-inset', `${inset}px`)
    root.style.setProperty('--visible-height', `${Math.round(viewport!.height)}px`)
  }

  viewport.addEventListener('resize', update)
  viewport.addEventListener('scroll', update)
  update()
}
