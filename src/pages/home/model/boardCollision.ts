import { closestCenter, pointerWithin, type CollisionDetection, type DroppableContainer } from '@dnd-kit/core'
import type { DragKind } from './board'

const kindOf = (container: DroppableContainer) => container.data.current?.kind as DragKind | undefined

const sectionOfRow = (container: DroppableContainer) =>
  container.data.current?.sortable?.containerId as string | undefined

/**
 * Над чем сейчас находится перетаскиваемое.
 *
 * Раздел сравнивается только с разделами. Продукт — сначала с продуктом прямо под
 * пальцем; если палец над шапкой раздела или кнопкой «Добавить», берётся ближайший
 * продукт этого раздела, а у пустого или свёрнутого раздела — сам раздел.
 */
export const boardCollision: CollisionDetection = (args) => {
  const only = (keep: (container: DroppableContainer) => boolean) =>
    closestCenter({ ...args, droppableContainers: args.droppableContainers.filter(keep) })

  if (args.active.data.current?.kind === 'section') return only((c) => kindOf(c) === 'section')

  const under = pointerWithin(args)
  const byId = new Map(args.droppableContainers.map((container) => [container.id, container]))
  const kindAt = (id: string | number) => {
    const container = byId.get(id)
    return container && kindOf(container)
  }

  const row = under.find((hit) => kindAt(hit.id) === 'product')
  if (row) return [row]

  const section = under.find((hit) => kindAt(hit.id) === 'section')
  if (section) {
    const rows = only((c) => kindOf(c) === 'product' && sectionOfRow(c) === section.id)
    return rows.length > 0 ? rows : [section]
  }

  // Палец между карточками или перестановка с клавиатуры — ближайшее из всего.
  return only(() => true)
}
