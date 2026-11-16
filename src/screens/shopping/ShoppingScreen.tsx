import { useHomeData, useShoppingList } from '@/shared/api/useHomeData'
import { useT } from '@/shared/i18n'
import { rich } from '@/shared/i18n/rich'
import { EmptyState } from '@/shared/ui/EmptyState'
import { StatusNote } from '@/shared/ui/StatusNote'
import { SummaryBar } from '@/shared/ui/SummaryBar'
import { Tip } from '@/shared/ui/Tip'
import { openSheet } from '@/shared/ui/sheet/sheetStore'
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
