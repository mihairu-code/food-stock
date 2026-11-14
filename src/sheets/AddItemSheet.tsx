import { useState, type FormEvent } from 'react'
import { EmojiField, TextField } from '@/components'
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
        <TextField
          id="item-name"
          label={t('shopping.whatToBuy')}
          placeholder={t('shopping.placeholder')}
          value={name}
          onChange={setName}
          maxLength={80}
          autoFocus
        />
        <EmojiField options={options} value={icon} onChange={setIcon} hint={t('emoji.hint')} />
        <SheetActions submitLabel={t('common.add')} disabled={!name.trim()} />
      </form>
    </Sheet>
  )
}
