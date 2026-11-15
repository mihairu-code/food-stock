import { describe, expect, it } from 'vitest'
import { sheetPlacement } from './keyboard'

/*
 * Где стоит шторка при разных состояниях экрана. Числа — с iPhone 14 Pro Max:
 * экран 932 по высоте, над клавиатурой видно 456.
 */
describe('положение шторки над клавиатурой', () => {
  it('клавиатуры нет — шторка у низа экрана и занимает сколько нужно', () => {
    expect(sheetPlacement({ layout: 932, height: 932, offsetTop: 0 })).toEqual({
      inset: 0,
      visible: 932,
      keyboard: false,
    })
  })

  it('клавиатура открыта, экран не сдвинут — шторка поднята на высоту клавиатуры', () => {
    expect(sheetPlacement({ layout: 932, height: 456, offsetTop: 0 })).toEqual({
      inset: 476,
      visible: 456,
      keyboard: true,
    })
  })

  it('телефон сдвинул экран, чтобы показать поле, — шторка поднята только на остаток', () => {
    // Низ видимой части: 410 + 456 = 866 из 932.
    expect(sheetPlacement({ layout: 932, height: 456, offsetTop: 410 })).toEqual({
      inset: 66,
      visible: 456,
      keyboard: true,
    })
  })

  it('при сдвинутом экране клавиатура всё равно считается открытой: форма должна ужаться', () => {
    expect(sheetPlacement({ layout: 932, height: 456, offsetTop: 476 }).keyboard).toBe(true)
  })

  it('экран подвинулся ещё раз — шторка едет следом', () => {
    const before = sheetPlacement({ layout: 932, height: 456, offsetTop: 410 })
    const after = sheetPlacement({ layout: 932, height: 456, offsetTop: 320 })
    expect(after.inset - before.inset).toBe(90)
  })

  it('экран сдвинут сильнее, чем нужно, — шторка не уходит ниже края', () => {
    expect(sheetPlacement({ layout: 932, height: 456, offsetTop: 500 }).inset).toBe(0)
  })

  it('небольшая потеря высоты — это панели браузера, а не клавиатура', () => {
    expect(sheetPlacement({ layout: 932, height: 850, offsetTop: 0 })).toEqual({
      inset: 82,
      visible: 850,
      keyboard: false,
    })
  })
})
