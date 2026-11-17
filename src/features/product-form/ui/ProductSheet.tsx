import { useState } from 'react'
import {
  groupProductsBySection,
  StapleCheckbox,
  useCreateProduct,
  useEditProduct,
  type ProductEdit,
} from '@/entities/product'
import { SectionPicker, useSortedSections } from '@/entities/section'
import { useHomeData, type Product } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { useSuggestedEmoji } from '@/shared/lib/emoji/useSuggestedEmoji'
import { notify } from '@/shared/lib/toast'
import { closeSheet, FormSheet, NameIconFields } from '@/shared/ui'

interface ProductSheetProps {
  /** Продукт для правки; без него шторка добавляет новый. */
  product?: Product
  /** Раздел, из которого шторку открыли для добавления. */
  sectionId?: string
}

/** Продукт дома: добавление нового и правка существующего — одна и та же форма. */
export function ProductSheet({ product, sectionId: openedFromSection }: ProductSheetProps) {
  const t = useT()
  const sections = useSortedSections()
  const { products } = useHomeData()
  const createProduct = useCreateProduct()
  const editProduct = useEditProduct()
  const [name, setName] = useState(product?.name ?? '')
  const { icon, setIcon, options } = useSuggestedEmoji(name, product?.icon ?? null)
  const [sectionId, setSectionId] = useState(product?.section_id ?? openedFromSection ?? sections[0]?.id ?? '')
  const [staple, setStaple] = useState(product ? product.kind === 'staple' : false)

  function saveProduct() {
    const trimmed = name.trim()
    const section = sections.find((candidate) => candidate.id === sectionId)
    if (!trimmed || !section) return

    const patch = { name: trimmed, icon: icon || null, kind: staple ? ('staple' as const) : ('one_off' as const) }
    if (!product) {
      createProduct.mutate({ id: crypto.randomUUID(), section_id: section.id, ...patch })
      notify('toast.addedTo', { name: section.name })
    } else {
      const edit: ProductEdit = { id: product.id, patch }
      if (section.id !== product.section_id) {
        // В новом разделе продукт встаёт последним.
        const neighbours = groupProductsBySection(products).get(section.id) ?? []
        edit.move = { sectionId: section.id, productIds: [...neighbours.map((p) => p.id), product.id] }
      }
      editProduct.mutate(edit)
      notify('toast.changesSaved')
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
        name={name}
        onNameChange={setName}
        icon={icon}
        onIconChange={setIcon}
        icons={options}
        iconHint={t('emoji.hint')}
      />
      <SectionPicker sections={sections} value={sectionId} onChange={setSectionId} />
      <StapleCheckbox checked={staple} onChange={setStaple} />
    </FormSheet>
  )
}
