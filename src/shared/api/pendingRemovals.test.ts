import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HomeData } from './homeDataRules'
import {
  commitPendingRemovals,
  readPendingRemovals,
  removeWithUndo,
  withoutPendingRemovals,
  type RemovalKind,
} from './pendingRemovals'
import type { Product, ShoppingItem } from './types'

const product = (id: string, toBuy = false): Product => ({
  id,
  household_id: 'h',
  section_id: 's',
  name: id,
  icon: null,
  kind: 'staple',
  is_available: true,
  to_buy: toBuy,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  created_by: null,
})

const item = (id: string): ShoppingItem => ({
  id,
  household_id: 'h',
  name: id,
  icon: null,
  created_at: '2026-01-01T00:00:00Z',
  created_by: null,
})

/** Удаление, у которого можно проверить, ушёл ли запрос, и ответить на него. */
function request(id: string, kind: RemovalKind = 'product') {
  let answer: () => void = () => {}
  const commit = vi.fn(() => new Promise<void>((resolve) => (answer = resolve)))
  const undo = removeWithUndo({ id, kind, commit, message: 'toast.deleted', params: { name: id } })
  return { commit, undo, answer: () => answer() }
}

describe('удаление с возможностью вернуть', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Тест идёт без браузера: таймеры тоста живут на window.
    vi.stubGlobal('window', globalThis)
  })

  afterEach(() => {
    commitPendingRemovals()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('запись пропадает сразу, а запрос уходит, только когда закроется тост', async () => {
    const { commit, answer } = request('milk')
    expect(readPendingRemovals().get('milk')).toBe('product')
    expect(commit).not.toHaveBeenCalled()

    vi.advanceTimersByTime(5000)
    expect(commit).toHaveBeenCalledOnce()
    // До ответа сервера запись остаётся скрытой: иначе она мелькнула бы до оптимистичной правки.
    expect(readPendingRemovals().has('milk')).toBe(true)

    answer()
    await vi.waitFor(() => expect(readPendingRemovals().has('milk')).toBe(false))
  })

  it('вместе с записью скрывается и то, что уходит с ней, а «Вернуть» возвращает всё', async () => {
    let answer: () => void = () => {}
    const commit = vi.fn(() => new Promise<void>((resolve) => (answer = resolve)))
    const undo = removeWithUndo({
      id: 'milk',
      kind: 'bought',
      also: [{ id: 'milk-manual', kind: 'shopping-item' }],
      commit,
      message: 'toast.backHome',
      params: { name: 'milk' },
    })
    expect(readPendingRemovals().get('milk')).toBe('bought')
    expect(readPendingRemovals().get('milk-manual')).toBe('shopping-item')

    undo()
    expect(readPendingRemovals().size).toBe(0)
    expect(commit).not.toHaveBeenCalled()

    removeWithUndo({
      id: 'milk',
      kind: 'bought',
      also: [{ id: 'milk-manual', kind: 'shopping-item' }],
      commit,
      message: 'toast.backHome',
    })
    vi.advanceTimersByTime(5000)
    expect(commit).toHaveBeenCalledOnce()
    answer()
    await vi.waitFor(() => expect(readPendingRemovals().size).toBe(0))
  })

  it('«Вернуть» отменяет удаление: запрос не уходит, запись снова видна', () => {
    const { commit, undo } = request('bread', 'shopping-item')
    undo()
    expect(readPendingRemovals().has('bread')).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(commit).not.toHaveBeenCalled()
  })

  it('новое удаление сразу отправляет прежнее: вернуть можно только последнее', () => {
    const first = request('milk')
    const second = request('eggs')
    expect(first.commit).toHaveBeenCalledOnce()
    expect(second.commit).not.toHaveBeenCalled()
  })

  it('отправить всё сразу — например, перед другой правкой', () => {
    const { commit } = request('milk')
    commitPendingRemovals()
    expect(commit).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(5000)
    expect(commit).toHaveBeenCalledOnce()
  })
})

describe('данные дома без отложенных удалений', () => {
  const data: HomeData = {
    sections: [],
    products: [product('milk', true), product('eggs', true), product('cheese'), { ...product('rice', true), is_available: false }],
    shoppingItems: [item('bread'), item('tea')],
  }

  it('без отложенных удалений — те же объекты', () => {
    expect(withoutPendingRemovals(data, new Map())).toBe(data)
  })

  it('удалённый продукт и позиция пропадают, убранный из покупок остаётся дома', () => {
    const visible = withoutPendingRemovals(
      data,
      new Map([
        ['milk', 'product'],
        ['eggs', 'from-list'],
        ['rice', 'bought'],
        ['bread', 'shopping-item'],
      ] as const),
    )
    expect(visible.products.map((p) => [p.id, p.to_buy, p.is_available])).toEqual([
      ['eggs', false, true],
      ['cheese', false, true],
      // Купленный уходит из покупок и снова дома.
      ['rice', false, true],
    ])
    expect(visible.shoppingItems.map((i) => i.id)).toEqual(['tea'])
    // Нетронутый продукт — тот же объект: memo-строка не перерисуется.
    expect(visible.products[1]).toBe(data.products[2])
  })
})
