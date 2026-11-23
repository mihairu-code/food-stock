import { DndContext, DragOverlay, MeasuringStrategy } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { matchProductsByName, type NameMatch } from '@/features/home-search'
import type { Product, Section } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { dragAccessibility } from '@/shared/lib/drag/dragAccessibility'
import { DROP_ANIMATION } from '@/shared/lib/drag/dragMotion'
import { sectionOf } from '../model/board'
import { boardCollision } from '../model/boardCollision'
import { useBoardDrag } from '../model/useBoardDrag'
import { useCollapsedSections } from '../model/useCollapsedSections'
import { useProductActions } from '../model/useProductActions'
import { ProductRow } from './ProductRow'
import { SectionCard } from './SectionCard'
import { SectionHeading } from './SectionHeading'

/** Высота разделов меняется прямо во время жеста (раздел раздвигается, сворачивается) — их нужно перемерять. */
const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } }
/** Пока идёт поиск, перетаскивать нельзя: в отфильтрованном списке не видно, куда встанет строка. */
const NO_SENSORS: [] = []

interface SectionFound {
  products: Product[]
  matches: ReadonlyMap<string, NameMatch>
}

interface SectionBoardProps {
  sections: Section[]
  products: Product[]
  /** Запрос поиска по дому (из normalizeQuery); пустой — показываем весь дом. */
  query: string
}

/**
 * Разделы дома с продуктами. Всё здесь можно перетаскивать: продукты и сами разделы.
 * Во время поиска видны только найденные продукты в своих разделах, раскрытых на это
 * время; разделы без совпадений скрыты.
 */
export function SectionBoard({ sections, products, query }: SectionBoardProps) {
  const t = useT()
  const actions = useProductActions()
  const collapsed = useCollapsedSections()
  const { board, active, sensors, handlers } = useBoardDrag(sections, products)

  const sectionById = useMemo(() => new Map(sections.map((section) => [section.id, section])), [sections])
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const accessibility = useMemo(
    () => dragAccessibility(t, (id) => sectionById.get(id)?.name ?? productById.get(id)?.name ?? ''),
    [t, sectionById, productById],
  )

  // Продукты каждого раздела в порядке доски. Пересчитываются только при изменении доски
  // или данных: на каждый кадр перетаскивания и на каждый тост их собирать незачем.
  const productsBySection = useMemo(
    () =>
      new Map(
        board.sections.map((sectionId) => [
          sectionId,
          (board.products[sectionId] ?? []).flatMap((id) => productById.get(id) ?? []),
        ]),
      ),
    [board, productById],
  )
  const productsOf = (sectionId: string) => productsBySection.get(sectionId) ?? []

  // Найденное по разделам. Сохранённое сворачивание не трогаем: после поиска разделы
  // снова свёрнуты так, как их оставили.
  const found = useMemo(() => {
    if (!query) return null
    const bySection = new Map<string, SectionFound>()
    for (const [sectionId, sectionProducts] of productsBySection) {
      const hits = matchProductsByName(sectionProducts, query)
      if (hits.length === 0) continue
      bySection.set(sectionId, {
        products: hits.map((hit) => hit.product),
        matches: new Map(hits.map((hit) => [hit.product.id, hit.match])),
      })
    }
    return bySection
  }, [query, productsBySection])

  // Свернуть раздел можно и во время поиска, но только на это время.
  const [foldedWhileSearching, setFoldedWhileSearching] = useState<ReadonlySet<string>>(() => new Set())
  if (!found && foldedWhileSearching.size > 0) setFoldedWhileSearching(new Set())
  const toggleWhileSearching = useCallback((sectionId: string) => {
    setFoldedWhileSearching((current) => {
      const next = new Set(current)
      if (!next.delete(sectionId)) next.add(sectionId)
      return next
    })
  }, [])

  const draggedProduct = active?.kind === 'product' ? productById.get(active.id) : undefined
  const draggedSection = active?.kind === 'section' ? sectionById.get(active.id) : undefined
  // Раздел, в который сейчас попадёт продукт, подсвечен: это видно, даже когда он свёрнут.
  const targetSection = draggedProduct && sectionOf(board, draggedProduct.id)

  return (
    <DndContext
      sensors={found ? NO_SENSORS : sensors}
      collisionDetection={boardCollision}
      measuring={MEASURING}
      accessibility={accessibility}
      {...handlers}
    >
      <SortableContext items={board.sections} strategy={verticalListSortingStrategy}>
        {board.sections.map((sectionId) => {
          const section = sectionById.get(sectionId)
          const sectionFound = found?.get(sectionId)
          if (!section || (found && !sectionFound)) return null
          return (
            <SectionCard
              key={sectionId}
              section={section}
              products={sectionFound?.products ?? productsOf(sectionId)}
              // Пока переставляют разделы, они свёрнуты до шапок — так список умещается на экране.
              // Во время поиска раздел с найденным раскрыт, даже если его свернули.
              open={
                sectionFound
                  ? !foldedWhileSearching.has(sectionId)
                  : !draggedSection && !collapsed.ids.includes(sectionId)
              }
              target={targetSection === sectionId}
              onToggle={found ? toggleWhileSearching : collapsed.toggle}
              actions={actions}
              matches={sectionFound?.matches}
            />
          )
        })}
      </SortableContext>

      {/* В body, а не внутри экрана: у экрана бывает transform, и «призрак» уехал бы из-под пальца. */}
      {createPortal(
        <DragOverlay dropAnimation={DROP_ANIMATION}>
          {draggedProduct && (
            <div className="drag-ghost" inert>
              <ProductRow product={draggedProduct} actions={actions} ghost />
            </div>
          )}
          {draggedSection && (
            // Раздел под пальцем: только шапка.
            <div className="card drag-ghost section-ghost" inert>
              <SectionHeading section={draggedSection} count={productsOf(draggedSection.id).length} />
            </div>
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  )
}
