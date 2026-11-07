import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useHouseholdId } from '@/app/session'
import { EmptyState } from '@/components/EmptyState'
import { backend } from '@/data'
import { useHomeData, useSortedSections } from '@/data/useHomeData'
import { useHomeMutation } from '@/data/useHomeMutation'
import { productsOf } from '@/domain/logic'
import type { NewProduct } from '@/data/backend'
import type { Product, Section } from '@/domain/types'
import { ConfirmSheet } from '@/sheets/ConfirmSheet'
import { ProductSheet } from '@/sheets/ProductSheet'
import { SectionSheet } from '@/sheets/SectionSheet'
import { ProductRow } from './ProductRow'
import { SectionCard } from './SectionCard'
import { useCollapsedSections } from './useCollapsedSections'

type HomeSheet =
  | { type: 'add-product'; sectionId?: string }
  | { type: 'add-section' }
  | { type: 'edit-section'; section: Section }
  | { type: 'delete-section'; section: Section }

export function HomeScreen() {
  const hid = useHouseholdId()
  const { products, isLoading, isError } = useHomeData()
  const sections = useSortedSections()
  const collapsed = useCollapsedSections()
  const [sheet, setSheet] = useState<HomeSheet | null>(null)
  const close = () => setSheet(null)

  const createSection = useHomeMutation((v: { name: string; icon: string | null }) =>
    backend.createSection(hid, {
      ...v,
      sort_order: sections.reduce((max, s) => Math.max(max, s.sort_order + 1), 0),
    }),
  )
  const updateSection = useHomeMutation((v: { id: string; name: string; icon: string | null }) =>
    backend.updateSection(v.id, { name: v.name, icon: v.icon }),
  )
  const deleteSection = useHomeMutation((id: string) => backend.deleteSection(id))
  const createProduct = useHomeMutation((input: NewProduct) => backend.createProduct(hid, input))
  const setAvailability = useHomeMutation((v: { id: string; available: boolean }) =>
    backend.setAvailability(v.id, v.available),
  )
  const deleteProduct = useHomeMutation((id: string) => backend.deleteProduct(id))

  if (isLoading) return <p className="status">Загрузка…</p>
  if (isError) return <p className="status">Не удалось загрузить данные</p>

  function toggleStock(product: Product) {
    // Разовый продукт существует, только пока он есть дома: закончился — убираем.
    if (product.kind === 'one_off') deleteProduct.mutate(product.id)
    else setAvailability.mutate({ id: product.id, available: !product.is_available })
  }

  function requestDelete(section: Section) {
    // Пустой раздел удаляем сразу, непустой — только после подтверждения.
    if (productsOf(products, section.id).length === 0) {
      deleteSection.mutate(section.id)
      close()
    } else {
      setSheet({ type: 'delete-section', section })
    }
  }

  return (
    <>
      {sections.length === 0 ? (
        <EmptyState emoji="🏠" title="Пока пусто" text="Заведите первый раздел — например, «Холодильник».">
          <button className="btn" type="button" onClick={() => setSheet({ type: 'add-section' })}>
            <Plus size={16} /> Создать раздел
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="summary">
            <p>
              Дома <strong>{products.filter((p) => p.is_available).length}</strong> из {products.length}
            </p>
            <button className="btn small" type="button" onClick={() => setSheet({ type: 'add-product' })}>
              <Plus size={16} aria-hidden="true" /> Продукт
            </button>
          </div>
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              count={productsOf(products, section.id).length}
              open={!collapsed.ids.includes(section.id)}
              onToggle={() => collapsed.toggle(section.id)}
              onEdit={() => setSheet({ type: 'edit-section', section })}
            >
              {productsOf(products, section.id).map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onToggleStock={() => toggleStock(product)}
                  onDelete={() => deleteProduct.mutate(product.id)}
                />
              ))}
              <button
                className="add-row"
                type="button"
                onClick={() => setSheet({ type: 'add-product', sectionId: section.id })}
              >
                <Plus size={16} aria-hidden="true" /> Добавить в «{section.name}»
              </button>
            </SectionCard>
          ))}
          <button className="add-row" type="button" onClick={() => setSheet({ type: 'add-section' })}>
            <Plus size={16} aria-hidden="true" /> Новый раздел
          </button>
        </>
      )}

      {sheet?.type === 'add-product' && (
        <ProductSheet
          sections={sections}
          sectionId={sheet.sectionId}
          onSave={(input) => createProduct.mutate(input)}
          onClose={close}
        />
      )}
      {sheet?.type === 'add-section' && (
        <SectionSheet onSave={(name, icon) => createSection.mutate({ name, icon })} onClose={close} />
      )}
      {sheet?.type === 'edit-section' && (
        <SectionSheet
          section={sheet.section}
          onSave={(name, icon) => updateSection.mutate({ id: sheet.section.id, name, icon })}
          onDelete={() => requestDelete(sheet.section)}
          onClose={close}
        />
      )}
      {sheet?.type === 'delete-section' && (
        <ConfirmSheet
          title={`Удалить «${sheet.section.name}»?`}
          description="Вместе с разделом удалятся все его продукты, в том числе те, что сейчас в покупках."
          confirmLabel="Удалить"
          onConfirm={() => deleteSection.mutate(sheet.section.id)}
          onClose={close}
        />
      )}
    </>
  )
}
