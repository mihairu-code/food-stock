import { useState, type FormEvent } from 'react'
import type { Section, ShoppingItem } from '@/domain/types'
import { useT } from '@/i18n'
import { Sheet } from './Sheet'

interface PurchaseSheetProps {
  item: ShoppingItem
  sections: Section[]
  onPurchase: (section: Section, makeStaple: boolean) => void
  onClose: () => void
}

/** Ручная позиция куплена: в какой раздел дома её положить и сделать ли постоянной. */
export function PurchaseSheet({ item, sections, onPurchase, onClose }: PurchaseSheetProps) {
  const t = useT()
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '')
  const [makeStaple, setMakeStaple] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return
    onPurchase(section, makeStaple)
    onClose()
  }

  if (sections.length === 0) {
    return (
      <Sheet title={t('purchase.needSectionTitle')} description={t('purchase.needSectionText')} onClose={onClose}>
        <div className="sheet-actions">
          <button className="btn" type="button" onClick={onClose}>
            {t('common.ok')}
          </button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet title={t('purchase.title')} description={t('purchase.description', { name: item.name })} onClose={onClose}>
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
        <div className="sheet-actions">
          <button className="btn subtle" type="button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn" type="submit">
            {t('purchase.submit')}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
