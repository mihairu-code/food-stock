import { Plus } from 'lucide-react'
import { AddRow, EmptyState, StatusNote, SummaryBar } from '@/components'
import { useHomeData, useSortedSections } from '@/data/hooks'
import { productsOf } from '@/domain/logic'
import { useT } from '@/i18n'
import { rich } from '@/i18n/rich'
import { openSheet } from '@/sheets'
import { ProductRow } from './ProductRow'
import { SectionCard } from './SectionCard'
import { useCollapsedSections } from './useCollapsedSections'
import { useProductActions } from './useProductActions'

export function HomeScreen() {
  const t = useT()
  const { products, isLoading, isError } = useHomeData()
  const sections = useSortedSections()
  const collapsed = useCollapsedSections()
  const actions = useProductActions()

  if (isLoading) return <StatusNote>{t('home.loading')}</StatusNote>
  if (isError) return <StatusNote>{t('common.loadError')}</StatusNote>

  return (
    <>
      {sections.length === 0 ? (
        <EmptyState emoji="🏠" title={t('home.emptyTitle')} text={t('home.emptyText')}>
          <button className="btn" type="button" onClick={() => openSheet({ type: 'add-section' })}>
            <Plus size={16} /> {t('home.createSection')}
          </button>
        </EmptyState>
      ) : (
        <>
          <SummaryBar onAdd={() => openSheet({ type: 'add-product' })}>
            {rich(t('home.summary', { count: products.filter((p) => p.is_available).length }))}
          </SummaryBar>
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              count={productsOf(products, section.id).length}
              open={!collapsed.ids.includes(section.id)}
              onToggle={() => collapsed.toggle(section.id)}
              onEdit={() => openSheet({ type: 'manage-section', section })}
            >
              {productsOf(products, section.id).map((product) => (
                <ProductRow key={product.id} product={product} actions={actions} />
              ))}
              <AddRow
                label={t('home.addProductTo', { name: section.name })}
                onClick={() => openSheet({ type: 'add-product', sectionId: section.id })}
              />
            </SectionCard>
          ))}
          <AddRow label={t('section.newTitle')} onClick={() => openSheet({ type: 'add-section' })} />
        </>
      )}
    </>
  )
}
