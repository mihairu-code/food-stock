import { useShoppingList } from '@/entities/shopping-list'
import { useHomeData } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { rich } from '@/shared/i18n/rich'
import { EmptyState, Hint, openSheet, StatusNote, SummaryBar } from '@/shared/ui'
import { ShoppingList } from './ShoppingList'

export function ShoppingPage() {
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

      <Hint label={t('shopping.hintLabel')} onlyWhenHintsOn>
        {t('shopping.hint')}
      </Hint>
    </>
  )
}
