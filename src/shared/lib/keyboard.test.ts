import { describe, expect, it } from 'vitest'
import { anchorMiss, nextCorrection, sheetPlacement } from './keyboard'

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

  it('запись владельца (приложение на экране «Домой»): экран 873, видно 458, сдвиг 274 — подъём 141', () => {
    // Раньше вместо высоты экрана подставлялся низ мерки — 599, уже за вычетом сдвига,
    // и подъём выходил нулевым: шторка уходила под клавиатуру ровно на 141.
    expect(sheetPlacement({ layout: 873, height: 458, offsetTop: 273.7 })).toEqual({
      inset: 141,
      visible: 458,
      keyboard: true,
    })
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

describe('поправка, если шторка всё же встала ниже клавиатуры', () => {
  it('шторка ниже на 120 — её поднимают ещё на 120', () => {
    expect(nextCorrection(0, 120, true)).toBe(120)
  })

  it('после поправки шторка на месте — поправка сохраняется', () => {
    expect(nextCorrection(120, 0.5, true)).toBe(120)
  })

  it('перестарались — поправка уменьшается', () => {
    expect(nextCorrection(120, -30, true)).toBe(90)
  })

  it('шторка не двигается от поправки — поправка не растёт без конца', () => {
    let correction = 0
    for (let i = 0; i < 10; i++) correction = nextCorrection(correction, 118, true)
    expect(correction).toBe(200)
  })

  it('клавиатура закрылась — поправка сбрасывается', () => {
    expect(nextCorrection(120, 0, false)).toBe(0)
  })
})

describe('промах элемента, прижатого к клавиатуре (шторка, поле поиска)', () => {
  // Запись владельца: мерка высотой 873 стоит низом на 599 при сдвиге 274 — её верх на −274.
  const reading = { layout: 873, height: 458, offsetTop: 274 }
  const frameTop = 599 - 873

  it('элемент поднят на 141 от низа мерки — стоит ровно на клавиатуре', () => {
    expect(anchorMiss(599 - 141, frameTop, reading)).toBe(0)
  })

  it('элемент остался у низа мерки — промах 141, его поднимут поправкой', () => {
    expect(anchorMiss(599, frameTop, reading)).toBe(141)
  })

  it('в Safari во вкладке мерка от верха экрана — промах считается так же', () => {
    const tab = { layout: 932, height: 456, offsetTop: 0 }
    expect(anchorMiss(456, 0, tab)).toBe(0)
    expect(anchorMiss(932, 0, tab)).toBe(476)
  })
})
