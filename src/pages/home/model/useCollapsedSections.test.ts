import { describe, expect, it } from 'vitest'
import { toggleCollapsed } from './useCollapsedSections'

describe('свёрнутые разделы', () => {
  it('нажатие сворачивает и разворачивает раздел', () => {
    expect(toggleCollapsed([], 'a', null)).toEqual(['a'])
    expect(toggleCollapsed(['a', 'b'], 'a', null)).toEqual(['b'])
  })

  it('в единственном доме id удалённых разделов не копятся', () => {
    expect(toggleCollapsed(['gone', 'b'], 'a', new Set(['a', 'b']))).toEqual(['b', 'a'])
  })

  it('при нескольких домах чужие id остаются: это разделы другого дома', () => {
    expect(toggleCollapsed(['other-home'], 'a', null)).toEqual(['other-home', 'a'])
  })
})
