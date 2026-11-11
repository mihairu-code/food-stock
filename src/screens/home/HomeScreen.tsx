import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/app/session'
import { EmptyState } from '@/components/EmptyState'
import { useToast } from '@/components/toastContext'
import { backend } from '@/data'
import type { NewProduct, NewSection } from '@/data/backend'
import { useHomeData, useSortedSections } from '@/data/useHomeData'
import { useHomeMutation } from '@/data/useHomeMutation'
import { productsOf } from '@/domain/logic'
import type { Section } from '@/domain/types'
import { useT } from '@/i18n'
import { rich } from '@/i18n/rich'
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
  const { household, user } = useSession()
  const hid = household.id
  const { products, isLoading, isError } = useHomeData()
  const sections = useSortedSections()
  const collapsed = useCollapsedSections()
  const [sheet, setSheet] = useState<HomeSheet | null>(null)
  const close = () => setSheet(null)

  const toast = useToast()
  const actions = useProductActions()

  const createSection = useHomeMutation(
    (input: NewSection) => backend.createSection(hid, input),
    (cache, input) =>
      cache.sections((list) => [...list, { ...input, household_id: hid, created_at: new Date().toISOString() }]),
  )
  const updateSection = useHomeMutation(
    (v: { id: string; name: string; icon: string | null }) => backend.updateSection(v.id, { name: v.name, icon: v.icon }),
    (cache, { id, name, icon }) => cache.sections((list) => list.map((s) => (s.id === id ? { ...s, name, icon } : s))),
  )
  const deleteSection = useHomeMutation(
    (id: string) => backend.deleteSection(id),
    (cache, id) => {
      cache.sections((list) => list.filter((s) => s.id !== id))
      cache.products((list) => list.filter((p) => p.section_id !== id))
    },
  )
  const createProduct = useHomeMutation(
    (input: NewProduct) => backend.createProduct(hid, input),
    (cache, input) => {
      const now = new Date().toISOString()
      cache.products((list) => [
        ...list,
        { ...input, household_id: hid, is_available: true, to_buy: false, created_at: now, updated_at: now, created_by: user.id },
      ])
    },
  )

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
            toast(t('toast.addedTo', { name: sections.find((s) => s.id === input.section_id)?.name ?? '' }))
          }}
          onClose={close}
        />
      )}
      {sheet?.type === 'add-section' && (
        <SectionSheet
          onSave={(name, icon) => {
            const sort_order = sections.reduce((max, s) => Math.max(max, s.sort_order + 1), 0)
            createSection.mutate({ id: crypto.randomUUID(), name, icon, sort_order })
            toast(t('toast.sectionCreated', { name }))
          }}
          onClose={close}
        />
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
          title={t('section.deleteTitle', { name: sheet.section.name })}
          description={deleteText(sheet.section)}
          confirmLabel={t('common.delete')}
          onConfirm={() => {
            deleteSection.mutate(sheet.section.id)
            toast(t('toast.sectionDeleted', { name: sheet.section.name }))
          }}
          onClose={close}
        />
      )}
    </>
  )
}
