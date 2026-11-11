import { Plus } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import {
  useCreateProduct,
  useCreateSection,
  useDeleteSection,
  useHomeData,
  useSortedSections,
  useUpdateSection,
} from '@/data/hooks'
import { productsOf } from '@/domain/logic'
import type { Section } from '@/domain/types'
import { useT } from '@/i18n'
import { rich } from '@/i18n/rich'
import { notify } from '@/lib/toast'
import { ConfirmSheet } from '@/sheets/ConfirmSheet'
import { ProductSheet } from '@/sheets/ProductSheet'
import { SectionSheet } from '@/sheets/SectionSheet'
import { ProductRow } from './ProductRow'
import { SectionCard } from './SectionCard'
import { useCollapsedSections } from './useCollapsedSections'
import { useProductActions } from './useProductActions'

type HomeSheet =
  | { type: 'add-product'; sectionId?: string }
  | { type: 'add-section' }
  | { type: 'edit-section'; section: Section }
  | { type: 'delete-section'; section: Section }

export function HomeScreen() {
  const t = useT()
  const { products, isLoading, isError } = useHomeData()
  const sections = useSortedSections()
  const collapsed = useCollapsedSections()
  const [sheet, setSheet] = useState<HomeSheet | null>(null)
  const close = () => setSheet(null)

  const actions = useProductActions()
  const createSection = useCreateSection()
  const updateSection = useUpdateSection()
  const deleteSection = useDeleteSection()
  const createProduct = useCreateProduct()

  if (isLoading) return <p className="status">{t('home.loading')}</p>
  if (isError) return <p className="status">{t('common.loadError')}</p>

  /** Сколько продуктов пропадёт вместе с разделом и сколько из них — из покупок. */
  function deleteText(section: Section) {
    const inSection = productsOf(products, section.id)
    const inList = inSection.filter((p) => p.to_buy).length
    return (
      <>
        {rich(t('section.deleteText', { count: inSection.length }))}{' '}
        {inList > 0 && `${t('section.deleteInList', { count: inList })} `}
        {t('section.deleteNoUndo')}
      </>
    )
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
        <EmptyState emoji="🏠" title={t('home.emptyTitle')} text={t('home.emptyText')}>
          <button className="btn" type="button" onClick={() => setSheet({ type: 'add-section' })}>
            <Plus size={16} /> {t('home.createSection')}
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="summary">
            <p>{rich(t('home.summary', { count: products.filter((p) => p.is_available).length }))}</p>
            <button className="btn small" type="button" onClick={() => setSheet({ type: 'add-product' })}>
              <Plus size={16} aria-hidden="true" /> {t('common.add')}
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
                <ProductRow key={product.id} product={product} actions={actions} />
              ))}
              <button
                className="add-row"
                type="button"
                onClick={() => setSheet({ type: 'add-product', sectionId: section.id })}
              >
                <Plus size={16} aria-hidden="true" /> {t('home.addProductTo', { name: section.name })}
              </button>
            </SectionCard>
          ))}
          <button className="add-row" type="button" onClick={() => setSheet({ type: 'add-section' })}>
            <Plus size={16} aria-hidden="true" /> {t('section.newTitle')}
          </button>
        </>
      )}

      {sheet?.type === 'add-product' && (
        <ProductSheet
          sections={sections}
          sectionId={sheet.sectionId}
          onSave={(input) => {
            createProduct.mutate(input)
            notify('toast.addedTo', { name: sections.find((s) => s.id === input.section_id)?.name ?? '' })
          }}
          onClose={close}
        />
      )}
      {sheet?.type === 'add-section' && (
        <SectionSheet
          onSave={(name, icon) => {
            const sort_order = sections.reduce((max, s) => Math.max(max, s.sort_order + 1), 0)
            createSection.mutate({ id: crypto.randomUUID(), name, icon, sort_order })
            notify('toast.sectionCreated', { name })
          }}
          onClose={close}
        />
      )}
      {sheet?.type === 'edit-section' && (
        <SectionSheet
          section={sheet.section}
          onSave={(name, icon) => updateSection.mutate({ id: sheet.section.id, patch: { name, icon } })}
          onDelete={() => requestDelete(sheet.section)}
          onClose={close}
        />
      )}
      {sheet?.type === 'delete-section' && (
        <ConfirmSheet
          title={t('section.deleteTitle', { name: sheet.section.name })}
          description={deleteText(sheet.section)}
          confirmLabel={t('common.delete')}
          onConfirm={() => {
            deleteSection.mutate(sheet.section.id)
            notify('toast.sectionDeleted', { name: sheet.section.name })
          }}
          onClose={close}
        />
      )}
    </>
  )
}
