import { useState } from 'react'
import { SectionPicker, StapleCheckbox } from '@/components'
import { useDeleteShoppingItem, usePurchaseShoppingItem, useSortedSections } from '@/data/hooks'
import type { ShoppingItem } from '@/domain/types'
import { useT } from '@/i18n'
import { notify } from '@/lib/toast'
import { FormSheet } from './FormSheet'
import { Sheet } from './Sheet'
import { closeSheet } from './sheetStore'

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
