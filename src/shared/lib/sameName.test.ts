import { expect, it } from 'vitest'
import { findNamed, sameName } from './sameName'

it('регистр, лишние пробелы и «ё» не делают название новым', () => {
  expect(sameName('  Зелёный   ЧАЙ ', 'зеленый чай')).toBe(true)
  expect(sameName('Мёд', 'Мед')).toBe(true)
  expect(sameName('Мёд', 'Мята')).toBe(false)
})

it('сама редактируемая запись своё название не занимает', () => {
  const sections = [
    { id: 'fridge', name: 'Холодильник' },
    { id: 'shelf', name: 'Полка' },
  ]
  expect(findNamed(sections, 'холодильник ')).toBe(sections[0])
  expect(findNamed(sections, 'Холодильник', 'fridge')).toBeUndefined()
  expect(findNamed(sections, 'Полка', 'fridge')).toBe(sections[1])
})
