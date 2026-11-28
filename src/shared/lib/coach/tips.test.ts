import { describe, expect, it } from 'vitest'
import { afterBought, afterMarkedOut, parseTipEvents, QUICK_BUY_MS } from './tips'

const empty = parseTipEvents(null)

describe('события для советов', () => {
  it('купили через несколько минут после «закончилось» — покупка прямо в магазине', () => {
    const out = afterMarkedOut(empty, 'milk', 1_000)
    const bought = afterBought(out, 'milk', 1_000 + 5 * 60_000)
    expect(bought.quickBuys).toBe(1)
    expect(bought.outAt).toEqual({})
  })

  it('купили через день — не считается, отметка убирается', () => {
    const out = afterMarkedOut(empty, 'milk', 1_000)
    const bought = afterBought(out, 'milk', 1_000 + QUICK_BUY_MS + 1)
    expect(bought.quickBuys).toBe(0)
    expect(bought.outAt).toEqual({})
  })

  it('покупка без недавнего «закончилось» ничего не меняет', () => {
    expect(afterBought(empty, 'milk', 5)).toBe(empty)
  })

  it('давние отметки «закончилось» не копятся', () => {
    const old = afterMarkedOut(empty, 'milk', 0)
    expect(afterMarkedOut(old, 'eggs', QUICK_BUY_MS + 1).outAt).toEqual({ eggs: QUICK_BUY_MS + 1 })
  })

  it('из сохранённого берётся только понятное', () => {
    expect(parseTipEvents('{"quickBuys":2,"outAt":{"a":5,"b":"x"},"shoppingReordered":"yes"}')).toEqual({
      oneOffDeletedAt: 0,
      shoppingReordered: false,
      outAt: { a: 5 },
      quickBuys: 2,
      opens: 0,
    })
    expect(parseTipEvents('oops')).toEqual(empty)
  })
})
