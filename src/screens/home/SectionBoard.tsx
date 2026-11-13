import { DndContext, DragOverlay, MeasuringStrategy } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { Product, Section } from '@/domain/types'
import { useT } from '@/i18n'
import { dragAnnouncements } from '@/lib/dragAnnouncements'
import { ProductRow } from './ProductRow'
import { SectionCard } from './SectionCard'
import { SectionGhost } from './SectionGhost'
import { sectionOf } from './board'
import { boardCollision } from './boardCollision'
import { useBoardDrag } from './useBoardDrag'
import { useCollapsedSections } from './useCollapsedSections'
import { useProductActions } from './useProductActions'

/** Высота разделов меняется прямо во время жеста (раздел раздвигается, сворачивается) — их нужно перемерять. */
const MEASURING = { droppable: { strategy: MeasuringStrategy.Always } }

/** Разделы дома с продуктами. Всё здесь можно перетаскивать: продукты и сами разделы. */
export function SectionBoard({ sections, products }: { sections: Section[]; products: Product[] }) {
  const t = useT()
  const actions = useProductActions()
  const collapsed = useCollapsedSections()
  const { board, active, sensors, handlers } = useBoardDrag(sections, products)

  const sectionById = useMemo(() => new Map(sections.map((section) => [section.id, section])), [sections])
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const accessibility = useMemo(
    () => ({
      screenReaderInstructions: { draggable: t('dnd.instructions') },
      announcements: dragAnnouncements((id) => sectionById.get(id)?.name ?? productById.get(id)?.name ?? ''),
    }),
    [t, sectionById, productById],
  )

  const productsOf = (sectionId: string) =>
    (board.products[sectionId] ?? []).flatMap((id) => productById.get(id) ?? [])

  const draggedProduct = active?.kind === 'product' ? productById.get(active.id) : undefined
  const draggedSection = active?.kind === 'section' ? sectionById.get(active.id) : undefined
  // Раздел, в который сейчас попадёт продукт, подсвечен: это видно, даже когда он свёрнут.
  const targetSection = draggedProduct && sectionOf(board, draggedProduct.id)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={boardCollision}
      measuring={MEASURING}
      accessibility={accessibility}
      {...handlers}
    >
      <SortableContext items={board.sections} strategy={verticalListSortingStrategy}>
        {board.sections.map((sectionId) => {
          const section = sectionById.get(sectionId)
          return (
            section && (
              <SectionCard
                key={sectionId}
                section={section}
                products={productsOf(sectionId)}
                // Пока переставляют разделы, они свёрнуты до шапок — так список умещается на экране.
                open={!draggedSection && !collapsed.ids.includes(sectionId)}
                target={targetSection === sectionId}
                onToggle={collapsed.toggle}
                actions={actions}
              />
            )
          )
        })}
      </SortableContext>

      {/* В body, а не внутри экрана: у экрана бывает transform, и «призрак» уехал бы из-под пальца. */}
      {createPortal(
        <DragOverlay>
          {draggedProduct && <ProductRow product={draggedProduct} actions={actions} ghost />}
          {draggedSection && <SectionGhost section={draggedSection} count={productsOf(draggedSection.id).length} />}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  )
}
