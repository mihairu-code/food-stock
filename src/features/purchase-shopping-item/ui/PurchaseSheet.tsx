import { useState } from 'react'
import { StapleCheckbox } from '@/entities/product'
import { SectionPicker, useSortedSections } from '@/entities/section'
import { useDeleteShoppingItem, usePurchaseShoppingItem } from '@/entities/shopping-item'
import type { ShoppingItem } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { notify } from '@/shared/lib/toast'
import { closeSheet, FormSheet, Sheet, SheetActions } from '@/shared/ui'

/**
 * Ручная позиция куплена. Её можно положить в раздел — тогда она станет продуктом дома —
 * или просто отметить купленной, никуда не добавляя: так поступают с разовыми покупками,
 * за которыми дома следить незачем.
 */
export function PurchaseSheet({ item }: { item: ShoppingItem }) {
  const t = useT()
  const sections = useSortedSections()
  const purchase = usePurchaseShoppingItem()
  const deleteItem = useDeleteShoppingItem()
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '')
  const [makeStaple, setMakeStaple] = useState(false)

  function storeAtHome() {
    const section = sections.find((candidate) => candidate.id === sectionId)
    if (!section) return
    purchase.mutate({ item, sectionId: section.id, makeStaple })
    notify(makeStaple ? 'toast.purchasedStaple' : 'toast.purchasedOnce', { name: section.name })
    closeSheet()
  }

  /** Куплено, но домой не добавляем: позиция просто уходит из списка. */
  function markBoughtWithoutStoring() {
    deleteItem.mutate(item.id)
    notify('toast.boughtNotStored', { name: item.name })
    closeSheet()
  }

  if (sections.length === 0) {
    return (
      <Sheet title={t('purchase.needSectionTitle')} description={t('purchase.needSectionText')}>
        <SheetActions>
          <button className="btn" type="button" onClick={markBoughtWithoutStoring}>
            {t('purchase.skip')}
          </button>
        </SheetActions>
      </Sheet>
    )
  }

  return (
    <FormSheet
      title={t('purchase.title')}
      description={t('purchase.description', { name: item.name })}
      submitLabel={t('purchase.submit')}
      onSubmit={storeAtHome}
      footer={
        <button className="btn text-only" type="button" onClick={markBoughtWithoutStoring}>
          {t('purchase.skip')}
        </button>
      }
    >
      <SectionPicker sections={sections} value={sectionId} onChange={setSectionId} />
      <StapleCheckbox checked={makeStaple} onChange={setMakeStaple} />
    </FormSheet>
  )
}
