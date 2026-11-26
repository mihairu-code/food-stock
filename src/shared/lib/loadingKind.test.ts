import { expect, it, vi } from 'vitest'
import { LOADING_KINDS, nextLoadingKind } from './loadingKind'

it('картинка случайная, но подряд одна и та же не повторяется', () => {
  // Заставка показала холодильник — так её отметил бы скрипт в index.html.
  vi.stubGlobal('document', { documentElement: { dataset: { bootPicture: 'fridge' } } })
  const shown: string[] = ['fridge']
  for (const roll of [0, 0.99, 0, 0.5, 0.2, 0.9]) shown.push(nextLoadingKind(() => roll))
  for (let i = 1; i < shown.length; i++) expect(shown[i]).not.toBe(shown[i - 1])
  expect(new Set(shown)).toEqual(new Set(LOADING_KINDS))
  vi.unstubAllGlobals()
})
