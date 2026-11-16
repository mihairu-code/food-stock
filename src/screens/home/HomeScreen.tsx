import { Plus } from 'lucide-react'
import { useHomeData, useSortedSections } from '@/shared/api/useHomeData'
import { useT } from '@/shared/i18n'
import { rich } from '@/shared/i18n/rich'
import { AddRow } from '@/shared/ui/AddRow'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusNote } from '@/shared/ui/StatusNote'
import { SummaryBar } from '@/shared/ui/SummaryBar'
import { Tip } from '@/shared/ui/Tip'
import { openSheet } from '@/shared/ui/sheet/sheetStore'
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
