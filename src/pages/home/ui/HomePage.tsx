import { Plus } from 'lucide-react'
import { useSortedSections } from '@/entities/section'
import { useHomeData } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { rich } from '@/shared/i18n/rich'
import { AddRow, EmptyState, Hint, openSheet, StatusNote, SummaryBar } from '@/shared/ui'
import { SectionBoard } from './SectionBoard'

const addSection = () => openSheet({ type: 'add-section' })

export function HomePage() {
  const t = useT()
  const { products, isLoading, isError } = useHomeData()
  const sections = useSortedSections()

  if (isLoading) return <StatusNote>{t('home.loading')}</StatusNote>
  if (isError) return <StatusNote>{t('common.loadError')}</StatusNote>

  if (sections.length === 0) {
    return (
      <EmptyState emoji="🏠" title={t('home.emptyTitle')} text={t('home.emptyText')}>
        <button className="btn" type="button" onClick={addSection}>
          <Plus size={16} /> {t('home.createSection')}
        </button>
      </EmptyState>
    )
  }

  const atHome = products.filter((product) => product.is_available).length

  return (
    <>
      <SummaryBar onAdd={() => openSheet({ type: 'add-product' })}>
        {rich(t('home.summary', { count: atHome }))}
      </SummaryBar>

      <SectionBoard sections={sections} products={products} />

      <AddRow label={t('section.newTitle')} onClick={addSection} />

      {products.length > 0 && (
        <Hint label={t('home.hintLabel')} onlyWhenHintsOn>
          {t('home.hint')}
        </Hint>
      )}
    </>
  )
}
