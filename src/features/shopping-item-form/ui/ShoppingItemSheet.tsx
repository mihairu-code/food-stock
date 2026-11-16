import { useState } from 'react'
import { useCreateShoppingItem } from '@/entities/shopping-item'
import { useT } from '@/shared/i18n'
import { useSuggestedEmoji } from '@/shared/lib/emoji/useSuggestedEmoji'
import { notify } from '@/shared/lib/toast'
import { closeSheet, FormSheet, NameIconFields } from '@/shared/ui'

/** Позиция покупок, добавленная вручную, — то, чего в разделах дома нет. */
export function ShoppingItemSheet() {
  const t = useT()
  const createItem = useCreateShoppingItem()
  const [name, setName] = useState('')
  const { icon, setIcon, options } = useSuggestedEmoji(name)

  function saveShoppingItem() {
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
      onSubmit={saveShoppingItem}
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
