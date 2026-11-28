/** Вырез шире элемента на столько с каждой стороны: кольцо не прилипает к краю кнопки. */
export const SPOT_PAD = 6
/** Зазор между вырезом и пузырём — под стрелку. */
const GAP = 12
/** Пузырь не подходит к краю экрана ближе этого. */
const EDGE = 12
/** Стрелка не уходит в скруглённый угол пузыря. */
const ARROW_INSET = 20

export interface Box {
  left: number
  top: number
  width: number
  height: number
}

export interface CoachPlacementInput {
  /** Элемент под вырезом, координаты экрана (getBoundingClientRect). */
  target: Box
  /** Видимая часть экрана. */
  viewport: { width: number; height: number }
  /** Размер пузыря, уже измеренный при нужной ширине. */
  bubble: { width: number; height: number }
  /** Сколько сверху и снизу занято шапкой, панелью вкладок и вырезами экрана: туда пузырь не встаёт. */
  reserved: { top: number; bottom: number }
}

/**
 * Где встаёт пузырь: под вырезом, над ним или, если не помещается ни там ни там
 * (узкий экран, крупный шрифт), — карточкой внизу над панелью вкладок.
 */
export type CoachSide = 'below' | 'above' | 'dock'

export interface CoachPlacement {
  spot: Box
  side: CoachSide
  left: number
  top: number
  /** Середина стрелки от левого края пузыря; у карточки внизу стрелки нет. */
  arrow: number | null
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max))

/** Вырез и место пузыря для окна подсказки. Чистая функция: размеры меряет вызывающий. */
export function placeCoach({ target, viewport, bubble, reserved }: CoachPlacementInput): CoachPlacement {
  const spot = {
    left: target.left - SPOT_PAD,
    top: target.top - SPOT_PAD,
    width: target.width + SPOT_PAD * 2,
    height: target.height + SPOT_PAD * 2,
  }
  const spotBottom = spot.top + spot.height
  const floor = viewport.height - reserved.bottom

  let side: CoachSide
  let top: number
  if (spotBottom + GAP + bubble.height <= floor) {
    side = 'below'
    top = spotBottom + GAP
  } else if (spot.top - GAP - bubble.height >= reserved.top) {
    side = 'above'
    top = spot.top - GAP - bubble.height
  } else {
    side = 'dock'
    top = Math.max(reserved.top, floor - EDGE - bubble.height)
  }

  const center = spot.left + spot.width / 2
  const left = clamp(center - bubble.width / 2, EDGE, viewport.width - EDGE - bubble.width)
  const arrow = side === 'dock' ? null : clamp(center - left, ARROW_INSET, bubble.width - ARROW_INSET)
  return { spot, side, left, top, arrow }
}
