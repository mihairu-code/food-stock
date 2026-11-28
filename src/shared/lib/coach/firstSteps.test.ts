import { describe, expect, it } from 'vitest'
import { countFirstSteps, parseFirstSteps } from './firstSteps'

describe('первые шаги', () => {
  it('считаются и отмеченные, и видные по данным дома, каждый один раз', () => {
    expect(countFirstSteps(new Set(['section', 'markedOut']), { section: true, product: true })).toBe(3)
  })

  it('отмеченный шаг остаётся сделанным, даже если по данным его больше не видно', () => {
    expect(countFirstSteps(new Set(['invited']), { invited: false })).toBe(1)
  })

  it('из сохранённого берутся только известные шаги', () => {
    expect(parseFirstSteps('["section","bogus",3,"bought"]')).toEqual(['section', 'bought'])
    expect(parseFirstSteps('oops')).toEqual([])
    expect(parseFirstSteps(null)).toEqual([])
  })
})
