import { Plus } from 'lucide-react'
import { AddRow, EmptyState, StatusNote, SummaryBar, Tip } from '@/components'
import { useHomeData, useSortedSections } from '@/data/hooks'
import { useT } from '@/i18n'
import { rich } from '@/i18n/rich'
import { openSheet } from '@/sheets'
import { SectionBoard } from './SectionBoard'

const addSection = () => openSheet({ type: 'add-section' })

export function HomeScreen() {
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

      {products.length > 0 && <Tip label={t('home.hintLabel')}>{t('home.hint')}</Tip>}
    </>
  )
}
