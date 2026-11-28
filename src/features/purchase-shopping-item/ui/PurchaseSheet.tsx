import { useState } from 'react'
import { SectionPicker, useSortedSections } from '@/entities/section'
import { useDeleteShoppingItem, usePurchaseShoppingItem } from '@/entities/shopping-item'
import type { ShoppingItem } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { markFirstStep } from '@/shared/lib/coach/firstSteps'
import { notify } from '@/shared/lib/toast'
import { closeSheet, FormSheet, Sheet, SheetActions } from '@/shared/ui'

/**
 * Ручная позиция куплена. Её можно положить в раздел — тогда она станет продуктом дома
 * и, закончившись, сама вернётся в покупки, — или просто отметить купленной, никуда
 * не добавляя: так поступают с разовыми покупками, за которыми дома следить незачем.
 */
export function PurchaseSheet({ item }: { item: ShoppingItem }) {
  const t = useT()
  const sections = useSortedSections()
  const purchase = usePurchaseShoppingItem()
  const deleteItem = useDeleteShoppingItem()
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '')

  function storeAtHome() {
    const section = sections.find((candidate) => candidate.id === sectionId)
    if (!section) return
    purchase.mutate({ item, sectionId: section.id })
    markFirstStep('bought')
    notify('toast.addedTo', { name: section.name })
    closeSheet()
  }

  /** Куплено, но домой не добавляем: позиция просто уходит из списка. */
  function markBoughtWithoutStoring() {
    deleteItem.mutate(item.id)
    markFirstStep('bought')
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
    </FormSheet>
  )
}
