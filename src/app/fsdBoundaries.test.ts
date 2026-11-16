/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Правила слоёв Feature-Sliced Design, проверяемые на каждом прогоне тестов:
 * слой импортирует только слои ниже себя, слайсы одного слоя друг друга не знают,
 * а снаружи в слайс заходят только через его index.ts (публичный API).
 */
const LAYERS = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'] as const
type Layer = (typeof LAYERS)[number]

const SRC = join(import.meta.dirname, '..')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : []
  })
}

interface Location {
  layer: Layer
  slice: string
}

function locate(pathInSrc: string): Location {
  const [layer, slice = ''] = pathInSrc.split('/')
  return { layer: layer as Layer, slice: layer === 'app' || layer === 'shared' ? '' : slice }
}

function violations(): string[] {
  const found: string[] = []
  for (const file of sourceFiles(SRC)) {
    const from = relative(SRC, file)
    const source = locate(from)
    const text = readFileSync(file, 'utf8')
    for (const [, spec] of text.matchAll(/(?:from|import)\s+'@\/([^']+)'/g)) {
      const target = locate(spec)
      const rank = (layer: Layer) => LAYERS.indexOf(layer)
      if (rank(target.layer) > rank(source.layer)) found.push(`${from}: слой выше — @/${spec}`)
      else if (target.layer === source.layer && target.layer !== 'shared' && target.layer !== 'app') {
        found.push(`${from}: соседний слайс или свой же через @/ — @/${spec}`)
      } else if (target.slice && spec.split('/').length > 2) {
        found.push(`${from}: мимо публичного API — @/${spec}`)
      }
    }
  }
  return found
}

describe('границы слоёв FSD', () => {
  it('импорты идут только вниз и через публичный API слайса', () => {
    expect(violations()).toEqual([])
  })
})
