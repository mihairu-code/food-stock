/**
 * Следит за экранной клавиатурой. На телефоне она не уменьшает страницу, а ложится
 * поверх: всё, что прижато к низу экрана, оказывается под ней. Сюда записывается,
 * сколько места снизу закрыто и сколько остаётся видимым, — шторка по этим числам
 * встаёт над клавиатурой. Пока клавиатура открыта, на <html> стоит data-keyboard:
 * места мало, и форма в шторке ужимается.
 *
 * В приложении с экрана «Домой» iPhone иногда сообщает отступ почти нулевым, хотя
 * клавиатура открыта, — шторка проваливается под неё. Поэтому высота клавиатуры
 * запоминается, когда её удалось честно измерить, и шторка поднимается не меньше чем на неё.
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

/**
 * На сколько поднять шторку. Пока клавиатура открыта — не меньше её запомненной высоты:
 * отступ, который сообщает телефон, бывает меньше настоящего.
 */
export function sheetInset(reading: ViewportReading, rememberedKeyboard: number): number {
  const inset = keyboardInset(reading)
  return keyboardOpen(reading) ? Math.max(inset, rememberedKeyboard) : inset
}

export function trackKeyboard(): void {
  const viewport = window.visualViewport
  if (!viewport) return
  const root = document.documentElement
  // Высота клавиатуры, измеренная, когда экран не был сдвинут.
  let rememberedKeyboard = 0

  function update() {
    const reading = { layout: window.innerHeight, height: viewport!.height, offsetTop: viewport!.offsetTop }
    if (keyboardOpen(reading) && reading.offsetTop === 0) rememberedKeyboard = keyboardInset(reading)
    root.style.setProperty('--keyboard-inset', `${sheetInset(reading, rememberedKeyboard)}px`)
    root.style.setProperty('--visible-height', `${Math.round(viewport!.height)}px`)
    root.toggleAttribute('data-keyboard', keyboardOpen(reading))
  }

  viewport.addEventListener('resize', update)
  viewport.addEventListener('scroll', update)
  update()
}
