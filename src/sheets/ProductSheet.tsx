import { useState, type FormEvent } from 'react'
import { useCreateProduct, useSortedSections } from '@/data/hooks'
import { useSuggestedEmoji } from '@/hooks/useSuggestedEmoji'
import { useT } from '@/i18n'
import { notify } from '@/lib/toast'
import { Sheet } from './Sheet'
import { SheetActions } from './SheetActions'
import { closeSheet } from './sheetStore'

/** Новый продукт; `sectionId` — раздел, из которого шторку открыли. */
export function ProductSheet({ sectionId: initialSectionId }: { sectionId?: string }) {
  const t = useT()
  const sections = useSortedSections()
  const createProduct = useCreateProduct()
  const [name, setName] = useState('')
  const { icon, setIcon, options } = useSuggestedEmoji(name)
  const [sectionId, setSectionId] = useState(initialSectionId ?? sections[0]?.id ?? '')
  const [staple, setStaple] = useState(true)

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    const section = sections.find((s) => s.id === sectionId)
    if (!trimmed || !section) return
    createProduct.mutate({
      id: crypto.randomUUID(),
      section_id: section.id,
      name: trimmed,
      icon: icon || null,
      kind: staple ? 'staple' : 'one_off',
    })
    notify('toast.addedTo', { name: section.name })
    closeSheet()
  }

  return (
    <Sheet title={t('productSheet.title')} description={t('productSheet.description')}>
      <form onSubmit={submit}>
        <label className="field">
          <span>{t('productSheet.name')}</span>
          <input
            value={name}
            maxLength={80}
            placeholder={t('productSheet.placeholder')}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <div className="field">
          <span>
            {t('emoji.label')} <small>{t('emoji.hint')}</small>
          </span>
          <div className="emoji-grid">
            {options.map((emoji) => (
              <button
                key={emoji}
                className="emoji-option"
                type="button"
                aria-pressed={icon === emoji}
                onClick={() => setIcon(icon === emoji ? '' : emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
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
          <input type="checkbox" checked={staple} onChange={(e) => setStaple(e.target.checked)} />
          <span>
            {t('product.keep')}
            <small>{t('product.keepHint')}</small>
          </span>
        </label>
        <SheetActions submitLabel={t('common.add')} disabled={!name.trim() || !sectionId} />
      </form>
    </Sheet>
  )
}
