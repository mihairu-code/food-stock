import { describe, expect, it } from 'vitest'
import { placeCoach } from './placeCoach'

const viewport = { width: 375, height: 812 }
const reserved = { top: 50, bottom: 90 }
const bubble = { width: 300, height: 140 }

describe('место окна подсказки', () => {
  it('вырез чуть шире элемента', () => {
    const { spot } = placeCoach({ target: { left: 20, top: 200, width: 100, height: 40 }, viewport, bubble, reserved })
    expect(spot).toEqual({ left: 14, top: 194, width: 112, height: 52 })
  })

  it('есть место снизу — пузырь под вырезом', () => {
    const place = placeCoach({ target: { left: 20, top: 200, width: 100, height: 40 }, viewport, bubble, reserved })
    expect(place.side).toBe('below')
    expect(place.top).toBe(246 + 12)
  })

  it('элемент у панели вкладок — пузырь над ним', () => {
    const place = placeCoach({ target: { left: 300, top: 740, width: 56, height: 56 }, viewport, bubble, reserved })
    expect(place.side).toBe('above')
    expect(place.top + bubble.height).toBe(734 - 12)
  })

  it('не помещается ни сверху, ни снизу — карточка над панелью вкладок, без стрелки', () => {
    const tall = { width: 300, height: 420 }
    const place = placeCoach({ target: { left: 20, top: 300, width: 100, height: 60 }, viewport, bubble: tall, reserved })
    expect(place.side).toBe('dock')
    expect(place.top + tall.height).toBe(812 - 90 - 12)
    expect(place.arrow).toBeNull()
  })

  it('карточка выше экрана прижимается к верху, а не уходит за него', () => {
    const huge = { width: 300, height: 900 }
    const place = placeCoach({ target: { left: 20, top: 300, width: 100, height: 60 }, viewport, bubble: huge, reserved })
    expect(place.top).toBe(reserved.top)
  })

  it('пузырь не выходит за края экрана, а стрелка смотрит на элемент', () => {
    const atRight = placeCoach({ target: { left: 320, top: 200, width: 40, height: 40 }, viewport, bubble, reserved })
    expect(atRight.left).toBe(375 - 12 - 300)
    expect(atRight.arrow).toBe(340 - atRight.left)

    const atLeft = placeCoach({ target: { left: 4, top: 200, width: 30, height: 30 }, viewport, bubble, reserved })
    expect(atLeft.left).toBe(12)
    // Середина элемента у самого края, стрелка — не дальше скругления пузыря.
    expect(atLeft.arrow).toBe(20)
  })

  it('пузырь шире экрана встаёт от левого края', () => {
    const wide = placeCoach({ target: { left: 100, top: 200, width: 40, height: 40 }, viewport: { width: 280, height: 600 }, bubble, reserved })
    expect(wide.left).toBe(12)
  })
})
