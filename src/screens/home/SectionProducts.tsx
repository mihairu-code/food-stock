import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemo } from 'react'
import { useReorderProducts } from '@/data/hooks'
import type { Product } from '@/domain/types'
import { useDragSensors } from '@/hooks/useDragSensors'
import { ProductRow } from './ProductRow'
import type { ProductActions } from './useProductActions'

interface SectionProductsProps {
  sectionId: string
  products: Product[]
  actions: ProductActions
}

/** Продукты раздела, которые можно переставлять внутри него: удержать строку и потянуть. */
export function SectionProducts({ sectionId, products, actions }: SectionProductsProps) {
  const sensors = useDragSensors()
  const { mutate: reorderProducts } = useReorderProducts()
  const ids = useMemo(() => products.map((product) => product.id), [products])

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
    reorderProducts({ sectionId, productIds: next })
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {products.map((product) => (
          <ProductRow key={product.id} product={product} actions={actions} />
        ))}
      </SortableContext>
    </DndContext>
  )
}
