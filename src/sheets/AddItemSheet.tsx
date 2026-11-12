import { useState, type FormEvent } from 'react'
import { useCreateShoppingItem } from '@/data/hooks'
import { useSuggestedEmoji } from '@/hooks/useSuggestedEmoji'
import { useT } from '@/i18n'
import { notify } from '@/lib/toast'
import { Sheet } from './Sheet'
import { SheetActions } from './SheetActions'
import { closeSheet } from './sheetStore'

/** Позиция покупок, добавленная вручную: того, чего в разделах дома нет. Раздел не нужен. */
export function AddItemSheet() {
  const t = useT()
  const createItem = useCreateShoppingItem()
  const [name, setName] = useState('')
  const { icon, setIcon, options } = useSuggestedEmoji(name)

  function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    createItem.mutate({ id: crypto.randomUUID(), name: trimmed, icon: icon || null })
    notify('toast.addedItem')
    closeSheet()
  }

  return (
    <Sheet title={t('shopping.addTitle')} description={t('shopping.addDescription')}>
      <form onSubmit={submit}>
        <label className="field">
          <span>{t('shopping.whatToBuy')}</span>
          <input
            value={name}
            maxLength={80}
            placeholder={t('shopping.placeholder')}
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
        <SheetActions submitLabel={t('common.add')} disabled={!name.trim()} />
      </form>
    </Sheet>
  )
}
