import { useEffect, type RefObject } from 'react'
import { closeSheet } from './sheetStore'

/** Сдвиг, после которого жест считается начатым. */
const SLOP = 6
/**
 * На поле ввода — больше: лёгкое дрожание пальца при нажатии на поле не должно
 * превращаться в жест шторки.
 */
const FIELD_SLOP = 12
/** Палец, который столько пролежал на поле, двигает курсор или выделение, а не шторку. */
const FIELD_HOLD_MS = 300
/** Насколько нужно стянуть шторку, чтобы она закрылась: доля высоты, но не больше этого. */
const CLOSE_DISTANCE = 140
const CLOSE_RATIO = 0.3
/**
 * Стянуть шторку можно, только начав жест в её верхней части: ниже лежат поля, плитки
 * и кнопки, и движение пальца по ним не должно закрывать форму.
 */
const PULL_ZONE_RATIO = 0.35
/** Быстрый смах вниз закрывает и с меньшего расстояния (пикселей в миллисекунду). */
const FLING_SPEED = 0.5
const CLOSE_MS = 180

const isField = (target: EventTarget | null) =>
  target instanceof Element && target.closest('input, select, textarea') !== null

/** Ряд, который листается вбок (плитки разделов): движение по нему — его, а не шторки. */
const scrollsSideways = (target: EventTarget | null) =>
  target instanceof Element && target.closest('[data-scroll-x]') !== null

/** Область со своей прокруткой (панель иконок): жесты внутри неё шторка не трогает. */
const scrollsItself = (target: EventTarget | null) =>
  target instanceof Element && target.closest('[data-scroll-y]') !== null

/**
 * Жесты шторки: её можно стянуть вниз, чтобы закрыть, а движения по ней и по
 * затемнению не прокручивают страницу под ней.
 */
export function useSheetDismiss(ref: RefObject<HTMLDialogElement | null>): void {
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const sheet = dialog

    let start: {
      x: number
      y: number
      at: number
      backdrop: boolean
      field: boolean
      sideways: boolean
      /** Палец лёг на верхнюю часть шторки — её можно стянуть вниз. */
      inPullZone: boolean
    } | null = null
    let pulling = false
    let offset = 0
    let closing = 0

    function onStart(event: TouchEvent) {
      if (event.touches.length !== 1 || scrollsItself(event.target)) {
        start = null
        return
      }
      const touch = event.touches[0]
      const box = sheet.getBoundingClientRect()
      start = {
        x: touch.clientX,
        y: touch.clientY,
        at: event.timeStamp,
        backdrop: event.target === sheet,
        field: isField(event.target),
        sideways: scrollsSideways(event.target),
        inPullZone: touch.clientY - box.top <= box.height * PULL_ZONE_RATIO,
      }
      pulling = false
      offset = 0
    }

    function onMove(event: TouchEvent) {
      if (!start) return
      // Затемнение: страница под шторкой не прокручивается.
      if (start.backdrop) return void event.preventDefault()

      const touch = event.touches[0]
      const dx = touch.clientX - start.x
      const dy = touch.clientY - start.y
      if (!pulling) {
        const slop = start.field ? FIELD_SLOP : SLOP
        if (Math.abs(dx) < slop && Math.abs(dy) < slop) return
        if (start.field && (event.timeStamp - start.at > FIELD_HOLD_MS || Math.abs(dx) >= Math.abs(dy))) {
          // Курсор, выделение и прокрутка текста вбок — дело браузера. С поля шторку тянут
          // только сразу и вниз; движение вверх ниже не даст уйти странице под шторкой.
          start = null
          return
        }
        if (start.sideways && Math.abs(dx) > Math.abs(dy)) {
          start = null // ряд листают вбок — дальше этим жестом занимается браузер
          return
        }
        const down = start.inPullZone && dy > 0 && dy > Math.abs(dx) && sheet.scrollTop <= 0
        if (!down) {
          // Длинную шторку прокручивает браузер; короткой прокручивать нечего —
          // и жест не должен уйти на страницу под ней.
          if (sheet.scrollHeight <= sheet.clientHeight) event.preventDefault()
          return
        }
        pulling = true
        sheet.dataset.pulling = 'true'
      }
      event.preventDefault()
      offset = Math.max(0, dy)
      sheet.style.transform = `translateY(${offset}px)`
    }

    function onEnd(event: TouchEvent) {
      if (!start) return
      const speed = offset / Math.max(event.timeStamp - start.at, 1)
      const wasPulling = pulling
      start = null
      pulling = false
      if (!wasPulling) return

      delete sheet.dataset.pulling
      const far = offset > Math.min(CLOSE_DISTANCE, sheet.offsetHeight * CLOSE_RATIO)
      if (far || (speed > FLING_SPEED && offset > SLOP * 5)) {
        sheet.style.transition = `transform ${CLOSE_MS}ms ease-in`
        sheet.style.transform = 'translateY(100%)'
        closing = window.setTimeout(closeSheet, CLOSE_MS)
      } else {
        sheet.style.transform = ''
      }
    }

    sheet.addEventListener('touchstart', onStart, { passive: true })
    sheet.addEventListener('touchmove', onMove, { passive: false })
    sheet.addEventListener('touchend', onEnd)
    sheet.addEventListener('touchcancel', onEnd)
    return () => {
      window.clearTimeout(closing)
      sheet.removeEventListener('touchstart', onStart)
      sheet.removeEventListener('touchmove', onMove)
      sheet.removeEventListener('touchend', onEnd)
      sheet.removeEventListener('touchcancel', onEnd)
    }
  }, [ref])
}
