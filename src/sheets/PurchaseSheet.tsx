import { useState, type FormEvent } from 'react'
import { usePurchaseShoppingItem, useSortedSections } from '@/data/hooks'
import type { ShoppingItem } from '@/domain/types'
import { useT } from '@/i18n'
import { notify } from '@/lib/toast'
import { Sheet } from './Sheet'
import { SheetActions } from './SheetActions'
import { closeSheet } from './sheetStore'

/** Ручная позиция куплена: в какой раздел дома её положить и сделать ли постоянной. */
export function PurchaseSheet({ item }: { item: ShoppingItem }) {
  const t = useT()
  const sections = useSortedSections()
  const purchase = usePurchaseShoppingItem()
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '')
  const [makeStaple, setMakeStaple] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return
    purchase.mutate({ item, sectionId: section.id, makeStaple })
    notify(makeStaple ? 'toast.purchasedStaple' : 'toast.purchasedOnce', { name: section.name })
    closeSheet()
  }

  if (sections.length === 0) {
    return (
      <Sheet title={t('purchase.needSectionTitle')} description={t('purchase.needSectionText')}>
        <div className="sheet-actions single">
          <button className="btn" type="button" onClick={closeSheet}>
            {t('common.ok')}
          </button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet title={t('purchase.title')} description={t('purchase.description', { name: item.name })}>
      <form onSubmit={submit}>
        <label className="field">
          <span>{t('field.section')}</span>
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.icon ? `${section.icon} ${section.name}` : section.name}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={makeStaple} onChange={(e) => setMakeStaple(e.target.checked)} />
          <span>
            {t('product.keep')}
            <small>{t('product.keepHint')}</small>
          </span>
        </label>
        <SheetActions submitLabel={t('purchase.submit')} />
      </form>
    </Sheet>
  )
}
