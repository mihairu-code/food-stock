import { describe, expect, it } from 'vitest'
import { en } from './en'
import { format, LANGS, matchLang, type Lang, type MessageKey } from './index'
import { ja } from './ja'
import { ru, type Messages, type Plural } from './ru'
import { vi } from './vi'

const DICTS: Record<Lang, Messages> = { ru, en, ja, vi }
const KEYS = Object.keys(ru) as MessageKey[]

const variants = (entry: string | Plural) => (typeof entry === 'string' ? [entry] : Object.values(entry))
const placeholders = (text: string) => [...new Set(text.match(/\{\w+\}/g) ?? [])].sort()

describe('переводы', () => {
  it('во всех языках одни и те же ключи', () => {
    for (const lang of LANGS) expect(Object.keys(DICTS[lang]).sort()).toEqual([...KEYS].sort())
  })

  it('перевод не пустой и того же вида, что образец: строка или формы числа', () => {
    for (const lang of LANGS) {
      for (const key of KEYS) {
        const entry = DICTS[lang][key]
        expect(typeof entry, `${lang}: ${key}`).toBe(typeof DICTS.ru[key])
        for (const text of variants(entry)) expect(text.trim(), `${lang}: ${key}`).not.toBe('')
        if (typeof entry !== 'string') expect(entry.other, `${lang}: ${key}`).toBeTruthy()
      }
    }
  })

  it('подстановки и выделение совпадают с образцом в каждой форме', () => {
    for (const key of KEYS) {
      const expected = placeholders(variants(DICTS.ru[key])[0])
      const bold = variants(DICTS.ru[key])[0].includes('<b>')
      for (const lang of LANGS) {
        for (const text of variants(DICTS[lang][key])) {
          expect(placeholders(text), `${lang}: ${key}`).toEqual(expected)
          expect(text.includes('<b>') && text.includes('</b>'), `${lang}: ${key}`).toBe(bold)
        }
      }
    }
  })

  it('у языка есть все формы числа, которые ему нужны', () => {
    for (const lang of LANGS) {
      const needed = new Intl.PluralRules(lang).resolvedOptions().pluralCategories
      for (const key of KEYS) {
        const entry = DICTS[lang][key]
        if (typeof entry === 'string') continue
        for (const category of needed) expect(entry[category], `${lang}: ${key}: ${category}`).toBeTruthy()
      }
    }
  })
})

describe('подстановка и число', () => {
  it('русские формы: 1 продукт, 3 продукта, 5 продуктов, 11 продуктов, 21 продукт', () => {
    const word = (count: number) => format('ru', 'n.products', { count })
    expect([1, 3, 5, 11, 21, 22, 112].map(word)).toEqual([
      '1 продукт',
      '3 продукта',
      '5 продуктов',
      '11 продуктов',
      '21 продукт',
      '22 продукта',
      '112 продуктов',
    ])
  })

  it('английское единственное и множественное число', () => {
    expect(format('en', 'n.products', { count: 1 })).toBe('1 item')
    expect(format('en', 'n.products', { count: 0 })).toBe('0 items')
    expect(format('en', 'n.members', { count: 2 })).toBe('2 members')
  })

  it('японский и вьетнамский обходятся одной формой', () => {
    expect(format('ja', 'n.products', { count: 1 })).toBe('1品')
    expect(format('vi', 'n.products', { count: 5 })).toBe('5 món')
  })

  it('подставляет значения в текст', () => {
    expect(format('ru', 'toast.deleted', { name: 'Сыр' })).toBe('Удалено: «Сыр»')
    expect(format('ja', 'toast.deleted', { name: 'チーズ' })).toBe('「チーズ」を削除しました')
    expect(format('en', 'confirm.removeMemberText', { name: 'Ann', home: 'Our home' })).toBe(
      'Ann will lose access to “Our home”. You can bring them back with a new link.',
    )
  })
})

describe('язык устройства', () => {
  it('берёт первый поддерживаемый язык из предпочтений', () => {
    expect(matchLang(['ja-JP', 'en-US'])).toBe('ja')
    expect(matchLang(['de-DE', 'vi'])).toBe('vi')
    expect(matchLang(['ru'])).toBe('ru')
    expect(matchLang(['EN-gb'])).toBe('en')
  })

  it('незнакомый язык — английский', () => {
    expect(matchLang(['de-DE', 'fr'])).toBe('en')
    expect(matchLang([])).toBe('en')
  })
})
