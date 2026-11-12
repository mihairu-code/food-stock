import { Plus } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
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

  if (isLoading) return <p className="status">{t('home.loading')}</p>
  if (isError) return <p className="status">{t('common.loadError')}</p>

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
          <div className="summary">
            <p>{rich(t('home.summary', { count: products.filter((p) => p.is_available).length }))}</p>
            <button className="btn small" type="button" onClick={() => openSheet({ type: 'add-product' })}>
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
              onEdit={() => openSheet({ type: 'manage-section', section })}
            >
              {productsOf(products, section.id).map((product) => (
                <ProductRow key={product.id} product={product} actions={actions} />
              ))}
              <button
                className="add-row"
                type="button"
                onClick={() => openSheet({ type: 'add-product', sectionId: section.id })}
              >
                <Plus size={16} aria-hidden="true" /> {t('home.addProductTo', { name: section.name })}
              </button>
            </SectionCard>
          ))}
          <button className="add-row" type="button" onClick={() => openSheet({ type: 'add-section' })}>
            <Plus size={16} aria-hidden="true" /> {t('section.newTitle')}
          </button>
        </>
      )}
    </>
  )
}
