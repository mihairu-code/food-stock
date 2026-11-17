import { useState } from 'react'
import { useCreateShoppingItem, useEditShoppingItem } from '@/entities/shopping-item'
import { findShoppingEntryNamed, useShoppingList } from '@/entities/shopping-list'
import type { ShoppingItem } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { useSuggestedEmoji } from '@/shared/lib/emoji/useSuggestedEmoji'
import { notify } from '@/shared/lib/toast'
import { useFieldError } from '@/shared/lib/useFieldError'
import { closeSheet, FormSheet, NameIconFields } from '@/shared/ui'

/**
 * Позиция покупок, добавленная вручную, — то, чего в разделах дома нет. Добавление
 * и правка — одна форма. То, что уже есть в списке, второй строкой не добавляется.
 */
export function ShoppingItemSheet({ item }: { item?: ShoppingItem }) {
  const t = useT()
  const entries = useShoppingList()
  const createItem = useCreateShoppingItem()
  const editItem = useEditShoppingItem()
  const [name, setName] = useState(item?.name ?? '')
  const { icon, setIcon, options } = useSuggestedEmoji(name, item?.icon ?? null)
  const nameError = useFieldError()

  function changeName(next: string) {
    setName(next)
    nameError.clear()
  }

  function saveShoppingItem() {
    const trimmed = name.trim()
    if (!trimmed) return
    if (findShoppingEntryNamed(entries, trimmed, item?.id)) {
      nameError.reject(t('shopping.duplicate'))
      return
    }
    if (item) {
      editItem.mutate({ id: item.id, patch: { name: trimmed, icon: icon || null } })
      notify('toast.changesSaved')
    } else {
      createItem.mutate({ id: crypto.randomUUID(), name: trimmed, icon: icon || null })
      notify('toast.addedItem')
    }
    closeSheet()
  }

  return (
    <FormSheet
      title={t(item ? 'shopping.editTitle' : 'shopping.addTitle')}
      description={item ? undefined : t('shopping.addDescription')}
      submitLabel={t(item ? 'common.save' : 'common.add')}
      disabled={!name.trim()}
      onSubmit={saveShoppingItem}
    >
      <NameIconFields
        id="item-name"
        label={t('shopping.whatToBuy')}
        placeholder={t('shopping.placeholder')}
        maxLength={80}
        name={name}
        onNameChange={changeName}
        icon={icon}
        onIconChange={setIcon}
        icons={options}
        iconHint={t('emoji.hint')}
        nameError={nameError.error}
        nameShakeCount={nameError.shakeCount}
      />
    </FormSheet>
  )
}
