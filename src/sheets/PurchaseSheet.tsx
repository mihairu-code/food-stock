import { useState, type FormEvent } from 'react'
import type { Section, ShoppingItem } from '@/domain/types'
import { Sheet } from './Sheet'

interface PurchaseSheetProps {
  item: ShoppingItem
  sections: Section[]
  onPurchase: (sectionId: string, makeStaple: boolean) => void
  onClose: () => void
}

/** Ручная позиция куплена: в какой раздел дома её положить и сделать ли постоянной. */
export function PurchaseSheet({ item, sections, onPurchase, onClose }: PurchaseSheetProps) {
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '')
  const [makeStaple, setMakeStaple] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!sectionId) return
    onPurchase(sectionId, makeStaple)
    onClose()
  }

  if (sections.length === 0) {
    return (
      <Sheet title="Некуда положить" description="Сначала заведите раздел на экране «Дом»." onClose={onClose}>
        <div className="sheet-actions">
          <button className="btn" type="button" onClick={onClose}>
            Понятно
          </button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet title="Куда положить?" description={`«${item.name}» появится дома в выбранном разделе.`} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field">
          <span>Раздел</span>
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
            Сделать постоянным
            <small>Когда закончится — сам попадёт в покупки</small>
          </span>
        </label>
        <div className="sheet-actions">
          <button className="btn subtle" type="button" onClick={onClose}>
            Отмена
          </button>
          <button className="btn" type="submit">
            Положить
          </button>
        </div>
      </form>
    </Sheet>
  )
}
