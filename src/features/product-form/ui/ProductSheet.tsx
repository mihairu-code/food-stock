import { useState } from 'react'
import {
  findProductNamed,
  groupProductsBySection,
  StapleCheckbox,
  useCreateProduct,
  useEditProduct,
  withToBuy,
  type ProductEdit,
} from '@/entities/product'
import { SectionPicker, useSortedSections } from '@/entities/section'
import { listOrderReplacing, useReplaceItemWithProduct, useShoppingList } from '@/entities/shopping-list'
import { useHomeData, type Product } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { findNamed } from '@/shared/lib/sameName'
import { notify } from '@/shared/lib/toast'
import { useNameWithIcon } from '@/shared/lib/useNameWithIcon'
import { closeSheet, FormSheet, NameIconFields } from '@/shared/ui'

interface ProductSheetProps {
  /** Продукт для правки; без него шторка добавляет новый. */
  product?: Product
  /** Раздел, из которого шторку открыли для добавления. */
  sectionId?: string
  /** Готовое название нового продукта: то, что искали и не нашли дома. */
  name?: string
}

/**
 * Продукт дома: добавление нового и правка существующего — одна и та же форма.
 * Продукт с таким же названием второй раз не заводится: поле встряхивается и
 * подсказывает, в каком разделе он уже есть. Ручная позиция покупок с тем же названием
 * уступает место продукту: одно название — одна вещь.
 */
export function ProductSheet({ product, sectionId: openedFromSection, name: searchedName }: ProductSheetProps) {
  const t = useT()
  const sections = useSortedSections()
  const { products, shoppingItems } = useHomeData()
  const entries = useShoppingList()
  const createProduct = useCreateProduct()
  const editProduct = useEditProduct()
  const replaceItem = useReplaceItemWithProduct()
  const { name, icon, rejectName, fields } = useNameWithIcon(product?.name ?? searchedName, product?.icon)
  const [sectionId, setSectionId] = useState(product?.section_id ?? openedFromSection ?? sections[0]?.id ?? '')
  const [staple, setStaple] = useState(product ? product.kind === 'staple' : false)

  function saveProduct() {
    const trimmed = name.trim()
    const section = sections.find((candidate) => candidate.id === sectionId)
    if (!trimmed || !section) return

    const twin = findProductNamed(products, trimmed, product?.id)
    if (twin) {
      const twinSection = sections.find((candidate) => candidate.id === twin.section_id)
      rejectName(t('productSheet.duplicate', { section: twinSection?.name ?? '' }))
      return
    }

    const patch = { name: trimmed, icon: icon || null, kind: staple ? ('staple' as const) : ('one_off' as const) }
    const manualTwin = findNamed(shoppingItems, trimmed)
    if (!product) {
      const id = crypto.randomUUID()
      createProduct.mutate({ id, section_id: section.id, ...patch })
      if (manualTwin) {
        replaceItem.mutate({
          item: manualTwin,
          productId: id,
          // Новый продукт дома, и он же теперь в покупках — вместо ручной позиции.
          state: { is_available: true, to_buy: true },
          order: listOrderReplacing(entries, manualTwin.id, id),
        })
        notify('toast.addedReplacing', { name: trimmed, section: section.name })
      } else {
        notify('toast.addedTo', { name: section.name })
      }
    } else {
      const edit: ProductEdit = { id: product.id, patch }
      if (section.id !== product.section_id) {
        // В новом разделе продукт встаёт последним.
        const neighbours = groupProductsBySection(products).get(section.id) ?? []
        edit.move = { sectionId: section.id, productIds: [...neighbours.map((p) => p.id), product.id] }
      }
      editProduct.mutate(edit)
      if (manualTwin) {
        replaceItem.mutate({
          item: manualTwin,
          productId: product.id,
          state: product.to_buy ? undefined : withToBuy(product, true),
          order: listOrderReplacing(entries, manualTwin.id, product.id),
        })
        notify('toast.savedReplacing', { name: trimmed })
      } else {
        notify('toast.changesSaved')
      }
    }
    closeSheet()
  }

  return (
    <FormSheet
      title={t(product ? 'productSheet.editTitle' : 'productSheet.title')}
      description={product ? undefined : t('productSheet.description')}
      submitLabel={t(product ? 'common.save' : 'common.add')}
      disabled={!name.trim() || !sectionId}
      onSubmit={saveProduct}
    >
      <NameIconFields
        id="product-name"
        label={t('productSheet.name')}
        placeholder={t('productSheet.placeholder')}
        maxLength={80}
        iconHint={t('emoji.hint')}
        {...fields}
      />
      <SectionPicker sections={sections} value={sectionId} onChange={setSectionId} />
      <StapleCheckbox checked={staple} onChange={setStaple} />
    </FormSheet>
  )
}
