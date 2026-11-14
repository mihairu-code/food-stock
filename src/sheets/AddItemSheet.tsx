import { useState } from 'react'
import { NameIconFields } from '@/components'
import { useCreateShoppingItem } from '@/data/hooks'
import { useSuggestedEmoji } from '@/hooks/useSuggestedEmoji'
import { useT } from '@/i18n'
import { notify } from '@/lib/toast'
import { FormSheet } from './FormSheet'
import { closeSheet } from './sheetStore'

/** Позиция покупок, добавленная вручную: того, чего в разделах дома нет. */
export function AddItemSheet() {
  const t = useT()
  const createItem = useCreateShoppingItem()
  const [name, setName] = useState('')
  const { icon, setIcon, options } = useSuggestedEmoji(name)

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) return
    createItem.mutate({ id: crypto.randomUUID(), name: trimmed, icon: icon || null })
    notify('toast.addedItem')
    closeSheet()
  }

  return (
    <FormSheet
      title={t('shopping.addTitle')}
      description={t('shopping.addDescription')}
      submitLabel={t('common.add')}
      disabled={!name.trim()}
      onSubmit={submit}
    >
      <NameIconFields
        id="item-name"
        label={t('shopping.whatToBuy')}
        placeholder={t('shopping.placeholder')}
        maxLength={80}
        name={name}
        onNameChange={setName}
        icon={icon}
        onIconChange={setIcon}
        icons={options}
        iconHint={t('emoji.hint')}
      />
    </FormSheet>
  )
}
