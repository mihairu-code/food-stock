import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, Pencil } from 'lucide-react'
import { memo, useMemo } from 'react'
import { AddRow } from '@/components'
import type { Product, Section } from '@/domain/types'
import { useT } from '@/i18n'
import { SORT_TRANSITION } from '@/lib/dragMotion'
import { sameItems } from '@/lib/sameItems'
import { openSheet } from '@/sheets'
import { ProductRow } from './ProductRow'
import type { ProductActions } from './useProductActions'

interface SectionCardProps {
  section: Section
  products: Product[]
  open: boolean
  /** В этот раздел сейчас попадёт перетаскиваемый продукт. */
  target: boolean
  onToggle: (sectionId: string) => void
  actions: ProductActions
}

/** Массив продуктов раздела собирается заново при любом изменении дома — сравниваем по содержимому. */
const sameCard = (prev: SectionCardProps, next: SectionCardProps) =>
  prev.section === next.section &&
  prev.open === next.open &&
  prev.target === next.target &&
  prev.onToggle === next.onToggle &&
  prev.actions === next.actions &&
  sameItems(prev.products, next.products)

/**
 * Раздел дома: сворачиваемая карточка со своими продуктами. Раздел переставляют,
 * потянув за шапку; продукты внутри — потянув за строку.
 */
export const SectionCard = memo(function SectionCard({
  section,
  products,
  open,
  target,
  onToggle,
  actions,
}: SectionCardProps) {
  const t = useT()
  const sortable = useSortable({
    id: section.id,
    data: { kind: 'section' },
    transition: SORT_TRANSITION,
    attributes: { role: 'group', roleDescription: t('dnd.section') },
  })
  const productIds = useMemo(() => products.map((product) => product.id), [products])
  const panelId = `section-${section.id}`

  return (
    <section
      ref={sortable.setNodeRef}
      className="card section"
      data-open={open}
      data-dragging={sortable.isDragging}
      data-target={target}
      style={{ transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition }}
    >
      <div
        className="section-head"
        ref={sortable.setActivatorNodeRef}
        {...sortable.attributes}
        {...sortable.listeners}
        aria-label={section.name}
      >
        <button
          className="section-toggle"
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onToggle(section.id)}
        >
          <ChevronDown className="caret" size={18} aria-hidden="true" />
          <span className="section-title">
            {section.icon && <span aria-hidden="true">{section.icon}</span>}
            <span className="section-name">{section.name}</span>
          </span>
          <span className="count" aria-label={t('home.sectionCount', { count: products.length })}>
            {products.length}
          </span>
        </button>
        <button
          className="icon-btn"
          type="button"
          aria-label={t('home.editSection', { name: section.name })}
          onClick={() => openSheet({ type: 'manage-section', section })}
        >
          <Pencil size={16} />
        </button>
      </div>
      {/* Содержимое не размонтируется: высота плавно сворачивается, а inert убирает его из фокуса. */}
      <div className="section-body" id={panelId} inert={!open}>
        <div className="section-products">
          <SortableContext id={section.id} items={productIds} strategy={verticalListSortingStrategy}>
            {products.map((product) => (
              <ProductRow key={product.id} product={product} actions={actions} droppable={open} />
            ))}
          </SortableContext>
          <AddRow
            label={t('home.addProductTo', { name: section.name })}
            onClick={() => openSheet({ type: 'add-product', sectionId: section.id })}
          />
        </div>
      </div>
    </section>
  )
}, sameCard)
