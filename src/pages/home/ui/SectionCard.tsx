import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, Pencil } from 'lucide-react'
import { memo, useMemo } from 'react'
import type { NameMatch } from '@/features/home-search'
import type { Product, Section } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { SORT_TRANSITION } from '@/shared/lib/drag/dragMotion'
import { sameItems } from '@/shared/lib/sameItems'
import { AddRow, openSheet } from '@/shared/ui'
import type { ProductActions } from '../model/useProductActions'
import { ProductRow } from './ProductRow'
import { SectionHeading } from './SectionHeading'

interface SectionCardProps {
  section: Section
  products: Product[]
  open: boolean
  /** В этот раздел сейчас попадёт перетаскиваемый продукт. */
  target: boolean
  onToggle: (sectionId: string) => void
  actions: ProductActions
  /** Совпадения поиска по продуктам раздела; есть — идёт поиск, и добавлять сюда некуда. */
  matches?: ReadonlyMap<string, NameMatch>
}

/** Массив продуктов раздела собирается заново при любом изменении дома — сравниваем по содержимому. */
const sameCard = (prev: SectionCardProps, next: SectionCardProps) =>
  prev.section === next.section &&
  prev.open === next.open &&
  prev.target === next.target &&
  prev.onToggle === next.onToggle &&
  prev.actions === next.actions &&
  prev.matches === next.matches &&
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
  matches,
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
      <header
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
          <SectionHeading section={section} count={products.length} />
        </button>
        <button
          className="icon-btn"
          type="button"
          aria-label={t('home.editSection', { name: section.name })}
          onClick={() => openSheet({ type: 'manage-section', section })}
        >
          <Pencil size={16} />
        </button>
      </header>
      {/* Содержимое не размонтируется: высота плавно сворачивается, а inert убирает его из фокуса. */}
      <div className="section-body" id={panelId} inert={!open}>
        <div className="section-products">
          <SortableContext id={section.id} items={productIds} strategy={verticalListSortingStrategy}>
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                actions={actions}
                droppable={open}
                match={matches?.get(product.id)}
              />
            ))}
          </SortableContext>
          {!matches && (
            <AddRow
              label={t('home.addProductTo', { name: section.name })}
              coach="add-product"
              onClick={() => openSheet({ type: 'add-product', sectionId: section.id })}
            />
          )}
        </div>
      </div>
    </section>
  )
}, sameCard)
