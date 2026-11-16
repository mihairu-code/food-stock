import { useState } from 'react'
import { StapleCheckbox } from '@/entities/product/ui/StapleCheckbox'
import { SectionPicker } from '@/entities/section/ui/SectionPicker'
import { useDeleteShoppingItem, usePurchaseShoppingItem } from '@/entities/shopping-item/api/shoppingItemApi'
import type { ShoppingItem } from '@/shared/api/types'
import { useSortedSections } from '@/shared/api/useHomeData'
import { useT } from '@/shared/i18n'
import { notify } from '@/shared/lib/toast'
import { FormSheet } from '@/shared/ui/sheet/FormSheet'
import { Sheet } from '@/shared/ui/sheet/Sheet'
import { closeSheet } from '@/shared/ui/sheet/sheetStore'

/**
 * Ручная позиция куплена. Её можно положить в раздел — тогда она станет продуктом дома —
 * или просто отметить купленной, никуда не добавляя: так поступают с разовыми покупками,
 * за которыми дома следить незачем.
 */
export function PurchaseSheet({ item }: { item: ShoppingItem }) {
  const t = useT()
  const sections = useSortedSections()
  const purchase = usePurchaseShoppingItem()
  const remove = useDeleteShoppingItem()
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '')
  const [makeStaple, setMakeStaple] = useState(false)

  function submit() {
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return
    purchase.mutate({ item, sectionId: section.id, makeStaple })
    notify(makeStaple ? 'toast.purchasedStaple' : 'toast.purchasedOnce', { name: section.name })
    closeSheet()
  }

  /** Куплено, но домой не добавляем: позиция просто уходит из списка. */
  function skip() {
    remove.mutate(item.id)
    notify('toast.boughtNotStored', { name: item.name })
    closeSheet()
  }

  if (sections.length === 0) {
    return (
      <Sheet title={t('purchase.needSectionTitle')} description={t('purchase.needSectionText')}>
        <div className="sheet-actions">
          <button className="btn subtle" type="button" onClick={closeSheet}>
            {t('common.cancel')}
          </button>
          <button className="btn" type="button" onClick={skip}>
            {t('purchase.skip')}
          </button>
        </div>
      </Sheet>
    )
  }

  return (
    <FormSheet
      title={t('purchase.title')}
      description={t('purchase.description', { name: item.name })}
      submitLabel={t('purchase.submit')}
      onSubmit={submit}
      footer={
        <button className="btn text-only" type="button" onClick={skip}>
          {t('purchase.skip')}
        </button>
      }
    >
      <SectionPicker sections={sections} value={sectionId} onChange={setSectionId} />
      <StapleCheckbox checked={makeStaple} onChange={setMakeStaple} />
    </FormSheet>
  )
}
