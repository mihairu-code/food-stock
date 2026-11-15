import { describe, expect, it } from 'vitest'
import { keyboardInset, keyboardOpen, sheetInset } from './keyboard'

/* Числа — с iPhone 14 Pro Max: окно 932 по высоте, над клавиатурой видно 456. */
describe('место под клавиатурой', () => {
  it('клавиатуры нет — снизу ничего не закрыто', () => {
    expect(keyboardInset({ layout: 932, height: 932, offsetTop: 0 })).toBe(0)
  })

  it('клавиатура открыта — шторка поднимается на её высоту', () => {
    expect(keyboardInset({ layout: 932, height: 456, offsetTop: 0 })).toBe(476)
  })

  it('видимая часть сдвинута — поднимаемся только на остаток', () => {
    expect(keyboardInset({ layout: 932, height: 456, offsetTop: 410 })).toBe(66)
  })

  it('ниже края не уходим', () => {
    expect(keyboardInset({ layout: 932, height: 456, offsetTop: 500 })).toBe(0)
  })
})

describe('открыта ли клавиатура', () => {
  it('видимая часть заметно ниже окна — открыта', () => {
    expect(keyboardOpen({ layout: 932, height: 456, offsetTop: 0 })).toBe(true)
  })

  it('видимая часть сдвинута — всё равно открыта, форма должна ужаться', () => {
    expect(keyboardOpen({ layout: 932, height: 456, offsetTop: 476 })).toBe(true)
  })

  it('небольшая потеря высоты — это панели браузера', () => {
    expect(keyboardOpen({ layout: 932, height: 850, offsetTop: 0 })).toBe(false)
  })
})

describe('запомненная высота клавиатуры', () => {
  it('отступ пришёл почти нулевым — шторка всё равно над клавиатурой', () => {
    expect(sheetInset({ layout: 932, height: 456, offsetTop: 470 }, 476)).toBe(476)
  })

  it('клавиатура закрыта — запомненная высота не мешает', () => {
    expect(sheetInset({ layout: 932, height: 932, offsetTop: 0 }, 476)).toBe(0)
  })
})
