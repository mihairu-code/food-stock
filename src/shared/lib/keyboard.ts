/**
 * Следит за экранной клавиатурой. На телефоне она не уменьшает страницу, а ложится
 * поверх: всё, что прижато к низу экрана, оказывается под ней. Сюда записывается,
 * сколько места снизу не видно и сколько остаётся видимым, — шторка по этим числам
 * встаёт ровно над клавиатурой.
 *
 * Два обстоятельства, из-за которых здесь всё устроено именно так:
 *
 * 1. Открывая клавиатуру, iPhone ещё и сдвигает сам экран вверх, чтобы показать поле
 *    ввода. Поэтому «сколько места занято снизу» — не высота клавиатуры: считать можно
 *    только от того, что телефон сообщает прямо сейчас (сдвиг и высота видимой части).
 *    Подставлять заранее запомненную высоту нельзя: при сдвинутом экране шторка с ней
 *    улетает за верхний край.
 *
 * 2. О сдвиге телефон сообщает не всегда: экран может подвинуться ещё раз уже после
 *    последнего события. Поэтому, пока человек печатает, размеры перемеряются по таймеру.
 */

/** Меньше этого от высоты экрана отнимают панели браузера, а не клавиатура. */
const MIN_KEYBOARD = 120
/** Сколько после смены фокуса клавиатура ещё может двигаться. */
const SETTLE_MS = 1200
/** Как часто перемерять, пока клавиатура открыта или двигается. */
const STEP_MS = 80

export interface ViewportReading {
  /** Высота экрана, к низу которого прижата шторка. */
  layout: number
  /** Высота видимой части: всё, что не закрыто клавиатурой. */
  height: number
  /** На сколько экран сдвинут вверх, чтобы показать поле ввода. */
  offsetTop: number
}

export interface SheetPlacement {
  /** На сколько поднять шторку от низа экрана, чтобы её низ совпал с низом видимой части. */
  inset: number
  /** Сколько места у шторки по высоте. */
  visible: number
  /** Клавиатура открыта: форме нужно ужаться, чтобы поместиться целиком. */
  keyboard: boolean
}

/**
 * Где стоять шторке при таком состоянии экрана.
 *
 * Клавиатура определяется по высоте видимой части, а не по отступу снизу: когда экран
 * сдвинут вверх, отступ получается маленьким, хотя клавиатура открыта.
 */
export function sheetPlacement({ layout, height, offsetTop }: ViewportReading): SheetPlacement {
  return {
    inset: Math.max(0, Math.round(layout - (offsetTop + height))),
    visible: Math.round(height),
    keyboard: layout - height >= MIN_KEYBOARD,
  }
}

/** Поле, в котором печатают: его фокус открывает клавиатуру. */
const opensKeyboard = (element: Element | null) =>
  element instanceof HTMLElement &&
  !element.matches('[readonly]') &&
  (element.matches('textarea') ||
    (element instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit'].includes(element.type)))

export function trackKeyboard(): void {
  const viewport = window.visualViewport
  if (!viewport) return
  const root = document.documentElement

  // Невидимая мерка во весь экран: её низ — это низ, к которому прижата шторка.
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;inset:0;visibility:hidden;pointer-events:none'
  document.body.append(probe)

  let applied = ''
  let settleUntil = 0
  let timer = 0

  function update() {
    const { inset, visible, keyboard } = sheetPlacement({
      layout: probe.getBoundingClientRect().bottom,
      height: viewport!.height,
      offsetTop: viewport!.offsetTop,
    })
    // Стили трогаем, только когда числа изменились: перемеряем часто, а меняются они редко.
    const next = `${inset}|${visible}|${keyboard}`
    if (next === applied) return
    applied = next
    root.style.setProperty('--keyboard-inset', `${inset}px`)
    root.style.setProperty('--visible-height', `${visible}px`)
    root.toggleAttribute('data-keyboard', keyboard)
  }

  /** Перемеряет, пока человек печатает и ещё немного после: клавиатура и экран двигаются. */
  function watch() {
    update()
    if (timer) return
    timer = window.setInterval(() => {
      update()
      if (!opensKeyboard(document.activeElement) && performance.now() >= settleUntil) {
        window.clearInterval(timer)
        timer = 0
      }
    }, STEP_MS)
  }

  function onFocusChange() {
    settleUntil = performance.now() + SETTLE_MS
    watch()
  }

  viewport.addEventListener('resize', update)
  viewport.addEventListener('scroll', update)
  document.addEventListener('focusin', onFocusChange)
  document.addEventListener('focusout', onFocusChange)
  update()
}
