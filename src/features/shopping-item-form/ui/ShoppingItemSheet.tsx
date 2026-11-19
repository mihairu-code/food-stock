import { useCreateShoppingItem, useEditShoppingItem } from '@/entities/shopping-item'
import { findShoppingEntryNamed, useShoppingList } from '@/entities/shopping-list'
import type { ShoppingItem } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { notify } from '@/shared/lib/toast'
import { useNameWithIcon } from '@/shared/lib/useNameWithIcon'
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
  const { name, icon, rejectName, fields } = useNameWithIcon(item?.name, item?.icon)

  function saveShoppingItem() {
    const trimmed = name.trim()
    if (!trimmed) return
    if (findShoppingEntryNamed(entries, trimmed, item?.id)) {
      rejectName(t('shopping.duplicate'))
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
        iconHint={t('emoji.hint')}
        {...fields}
      />
    </FormSheet>
  )
}
