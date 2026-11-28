import { groupProductsBySection } from '@/entities/product'
import type { Product, Section } from '@/shared/api'

/**
 * Первый продукт, который виден на доске: в первом развёрнутом разделе, где такой есть, —
 * на него встают окна обучения и советов. Он у верха экрана, поэтому на заполненном доме
 * вырез не уезжает вниз, а у нового человека это и есть только что добавленный продукт.
 */
export function firstOnBoard(
  sections: readonly Section[],
  products: readonly Product[],
  collapsed: readonly string[],
  fits: (product: Product) => boolean = () => true,
): Product | undefined {
  const groups = groupProductsBySection([...products])
  for (const section of sections) {
    if (collapsed.includes(section.id)) continue
    const found = groups.get(section.id)?.find(fits)
    if (found) return found
  }
  return undefined
}
