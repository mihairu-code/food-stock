import { findProductNamed, useSetProductState, withToBuy } from '@/entities/product'
import { useCreateShoppingItem, useEditShoppingItem } from '@/entities/shopping-item'
import { findShoppingEntryNamed, useShoppingList } from '@/entities/shopping-list'
import { useHomeData, type ShoppingItem } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { sameName } from '@/shared/lib/sameName'
import { notify } from '@/shared/lib/toast'
import { useNameWithIcon } from '@/shared/lib/useNameWithIcon'
import { closeSheet, FormSheet, NameIconFields } from '@/shared/ui'

/**
 * Позиция покупок, добавленная вручную, — то, чего в разделах дома нет. Добавление
 * и правка — одна форма. То, что уже есть в списке, второй строкой не добавляется,
 * а то, что есть дома, ложится в покупки само: одно название — одна вещь.
 */
export function ShoppingItemSheet({ item }: { item?: ShoppingItem }) {
  const t = useT()
  const entries = useShoppingList()
  const { products, sections } = useHomeData()
  const setProductState = useSetProductState()
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
    // Старую позицию-двойник (от прежних версий) можно править, не меняя названия.
    const homeProduct = item && sameName(item.name, trimmed) ? undefined : findProductNamed(products, trimmed)
    if (homeProduct) {
      const section = sections.find((candidate) => candidate.id === homeProduct.section_id)?.name ?? ''
      // Переименовать ручную позицию в продукт дома нельзя: их стало бы два.
      if (item) {
        rejectName(t('shopping.productAtHome', { section }))
        return
      }
      setProductState.mutate({ id: homeProduct.id, state: withToBuy(homeProduct, true) })
      notify('toast.listedFromHome', { name: homeProduct.name, section })
      closeSheet()
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
