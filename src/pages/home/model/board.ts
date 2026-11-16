import { arrayMove } from '@dnd-kit/sortable'
import { groupProductsBySection } from '@/entities/product'
import type { Product, Section } from '@/shared/api'

/** Что перетаскивают: продукт или целый раздел. */
export type DragKind = 'product' | 'section'

/** Расположение главного экрана: разделы сверху вниз и продукты каждого из них — по идентификаторам. */
export interface Board {
  sections: string[]
  products: Record<string, string[]>
}

/** Расположение, как оно сохранено: разделы уже в порядке показа. */
export function buildBoard(sections: Section[], products: Product[]): Board {
  const bySection = groupProductsBySection(products)
  return {
    sections: sections.map((section) => section.id),
    products: Object.fromEntries(
      sections.map((section) => [section.id, (bySection.get(section.id) ?? []).map((product) => product.id)]),
    ),
  }
}

/** Раздел, в котором сейчас лежит продукт. */
export function sectionOf(board: Board, productId: string): string | undefined {
  return board.sections.find((sectionId) => board.products[sectionId]?.includes(productId))
}

/** Продукт переезжает в другой раздел на место `index` (за пределами списка — в конец). */
export function moveToSection(board: Board, productId: string, toSectionId: string, index: number): Board {
  const from = sectionOf(board, productId)
  if (!from || from === toSectionId || !board.products[toSectionId]) return board
  const target = [...board.products[toSectionId]]
  target.splice(Math.min(Math.max(index, 0), target.length), 0, productId)
  return {
    ...board,
    products: {
      ...board.products,
      [from]: board.products[from].filter((id) => id !== productId),
      [toSectionId]: target,
    },
  }
}

/** Продукт встаёт на место другого продукта своего раздела. */
export function moveWithinSection(board: Board, productId: string, overProductId: string): Board {
  const sectionId = sectionOf(board, productId)
  if (!sectionId) return board
  const list = board.products[sectionId]
  const to = list.indexOf(overProductId)
  if (to < 0) return board
  return { ...board, products: { ...board.products, [sectionId]: arrayMove(list, list.indexOf(productId), to) } }
}

/** Раздел встаёт на место другого раздела. */
export function moveSection(board: Board, sectionId: string, overSectionId: string): Board {
  const from = board.sections.indexOf(sectionId)
  const to = board.sections.indexOf(overSectionId)
  if (from < 0 || to < 0) return board
  return { ...board, sections: arrayMove(board.sections, from, to) }
}

const sameList = (a: string[] = [], b: string[] = []) =>
  a.length === b.length && a.every((id, index) => id === b[index])

export const sameProducts = (a: Board, b: Board, sectionId: string) =>
  sameList(a.products[sectionId], b.products[sectionId])

export const sameSections = (a: Board, b: Board) => sameList(a.sections, b.sections)
