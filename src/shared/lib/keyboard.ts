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
 *
 * 3. Высоту экрана даёт невидимая мерка во весь экран — её высота, а не низ. В приложении
 *    на экране «Домой» iPhone сообщает координаты прижатых к экрану элементов уже за вычетом
 *    сдвига: на записи владельца мерка высотой 873 стояла низом на 599 при сдвиге 274.
 *    Когда сдвиг вычитали из низа мерки ещё раз, подъём выходил отрицательным, шторка
 *    оставалась у низа экрана и уходила под клавиатуру на 141 pt. Низ видимой части
 *    в координатах шторки — верх мерки плюс сдвиг плюс видимая высота: так верно и там,
 *    где координаты считаются от верха экрана, и там, где от сдвинутой видимой части.
 *
 * 4. На случай других таких сюрпризов: когда шторка встала, проверяется, где её низ на
 *    самом деле, и промах добавляется к подъёму.
 */

/** Меньше этого от высоты экрана отнимают панели браузера, а не клавиатура. */
const MIN_KEYBOARD = 120
/** Сколько после смены фокуса клавиатура ещё может двигаться. */
const SETTLE_MS = 1200
/** Как часто перемерять, пока клавиатура открыта или двигается. */
const STEP_MS = 80
/** Промах меньше этого — погрешность округления, а не ошибка положения. */
const MISS_TOLERANCE = 2
/** Самая большая поправка: на записи шторка промахивалась на 141 pt. */
const MAX_CORRECTION = 200

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

/**
 * Поправка к подъёму шторки: на сколько её низ на деле промахнулся мимо низа видимой части
 * (положительный промах — шторка ниже, чем нужно). Поправки копятся, пока клавиатура открыта,
 * и сбрасываются, когда она закрылась.
 */
export function nextCorrection(correction: number, miss: number, keyboard: boolean): number {
  if (!keyboard) return 0
  if (Math.abs(miss) <= MISS_TOLERANCE) return correction
  // Если шторка почему-то не двигается от поправки, промах повторялся бы снова и снова,
  // и она уехала бы за верхний край. Поправка не больше замеченной на записи ошибки с запасом.
  return Math.max(-MAX_CORRECTION, Math.min(MAX_CORRECTION, correction + miss))
}

/** Шторка стоит на месте: не едет, не открывается и не тянется пальцем. Только тогда её низ что-то значит. */
const standsStill = (sheet: HTMLElement) =>
  !sheet.dataset.pulling &&
  !sheet.style.transform &&
  (typeof sheet.getAnimations !== 'function' || sheet.getAnimations().length === 0)

export function trackKeyboard(): void {
  const viewport = window.visualViewport
  if (!viewport) return
  const root = document.documentElement

  // Невидимая мерка во весь экран — та же основа, от которой отсчитывается положение шторки.
  const probe = document.createElement('div')
  probe.style.cssText = 'position:fixed;inset:0;visibility:hidden;pointer-events:none'
  document.body.append(probe)

  let applied = ''
  let settleUntil = 0
  let timer = 0
  let correction = 0
  /** Подъём по числам телефона в прошлый раз и шторка, к которой относится поправка. */
  let lastInset = -1
  let lastSheet: Element | null = null

  function update() {
    const frame = probe.getBoundingClientRect()
    const { inset, visible, keyboard } = sheetPlacement({
      layout: frame.height,
      height: viewport!.height,
      offsetTop: viewport!.offsetTop,
    })
    // Низ видимой части в тех же координатах, в которых телефон сообщает, где шторка.
    const visibleBottom = frame.top + viewport!.offsetTop + viewport!.height
    const sheet = document.querySelector<HTMLElement>('dialog.sheet[open]')
    if (sheet !== lastSheet) correction = 0
    // Промах считается, только если числа телефона с прошлого раза не менялись: иначе
    // шторка ещё стоит по старым, и промах был бы не её.
    let miss = 0
    if (sheet && keyboard && inset === lastInset && standsStill(sheet)) {
      miss = sheet.getBoundingClientRect().bottom - visibleBottom
    }
    correction = nextCorrection(correction, miss, keyboard)
    lastInset = inset
    lastSheet = sheet
    const lift = Math.max(0, Math.round(inset + correction))

    // Стили трогаем, только когда числа изменились: перемеряем часто, а меняются они редко.
    const next = `${lift}|${visible}|${keyboard}`
    if (next === applied) return
    applied = next
    root.style.setProperty('--keyboard-inset', `${lift}px`)
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
