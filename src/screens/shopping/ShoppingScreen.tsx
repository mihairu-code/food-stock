import { EmptyState, StatusNote, SummaryBar, Tip } from '@/components'
import { useHomeData, useShoppingList } from '@/data/hooks'
import { useT } from '@/i18n'
import { rich } from '@/i18n/rich'
import { openSheet } from '@/sheets'
import { ShoppingList } from './ShoppingList'

export function ShoppingScreen() {
  const t = useT()
  const { isLoading, isError } = useHomeData()
  const entries = useShoppingList()

  if (isLoading) return <StatusNote>{t('shopping.loading')}</StatusNote>
  if (isError) return <StatusNote>{t('common.loadError')}</StatusNote>

  return (
    <>
      <SummaryBar onAdd={() => openSheet({ type: 'add-item' })}>
        {entries.length === 0 ? t('shopping.nothing') : rich(t('shopping.summary', { count: entries.length }))}
      </SummaryBar>

      {entries.length === 0 ? (
        <EmptyState emoji="🛒" title={t('shopping.emptyTitle')} text={t('shopping.emptyText')} />
      ) : (
        <ShoppingList entries={entries} />
      )}

      <Tip label={t('shopping.hintLabel')}>{t('shopping.hint')}</Tip>
    </>
  )
}
