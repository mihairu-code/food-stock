import { describe, expect, it } from 'vitest'
import { initialChecks, READY_SECTIONS, sectionsToCreate } from './readySections'

describe('готовые разделы', () => {
  it('сначала отмечены холодильник и шкаф', () => {
    const checks = initialChecks()
    expect(READY_SECTIONS.filter(({ id }) => checks[id]).map(({ id }) => id)).toEqual(['fridge', 'cupboard'])
  })

  it('создаются только отмеченные, в порядке кнопок', () => {
    const chips = [
      { id: 'fridge', name: 'Холодильник', icon: '🧊', checked: true },
      { id: 'cupboard', name: 'Шкаф', icon: '🧺', checked: false },
      { id: 'freezer', name: 'Морозилка', icon: '❄️', checked: true },
      { id: 'own', name: 'Балкон', icon: '', checked: true },
    ]
    expect(sectionsToCreate(chips)).toEqual([
      { name: 'Холодильник', icon: '🧊', sort_order: 0 },
      { name: 'Морозилка', icon: '❄️', sort_order: 1 },
      { name: 'Балкон', icon: null, sort_order: 2 },
    ])
  })

  it('ничего не отмечено — создавать нечего', () => {
    expect(sectionsToCreate([{ id: 'fridge', name: 'Холодильник', icon: '🧊', checked: false }])).toEqual([])
  })
})
