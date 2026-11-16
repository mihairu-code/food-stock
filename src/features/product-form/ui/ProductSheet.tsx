import { useState } from 'react'
import { StapleCheckbox, useCreateProduct } from '@/entities/product'
import { SectionPicker, useSortedSections } from '@/entities/section'
import { useT } from '@/shared/i18n'
import { useSuggestedEmoji } from '@/shared/lib/emoji/useSuggestedEmoji'
import { notify } from '@/shared/lib/toast'
import { closeSheet, FormSheet, NameIconFields } from '@/shared/ui'

/** Новый продукт; `sectionId` — раздел, из которого шторку открыли. */
export function ProductSheet({ sectionId: openedFromSection }: { sectionId?: string }) {
  const t = useT()
  const sections = useSortedSections()
  const createProduct = useCreateProduct()
  const [name, setName] = useState('')
  const { icon, setIcon, options } = useSuggestedEmoji(name)
  const [sectionId, setSectionId] = useState(openedFromSection ?? sections[0]?.id ?? '')
  const [staple, setStaple] = useState(false)

  function saveProduct() {
    const trimmed = name.trim()
    const section = sections.find((candidate) => candidate.id === sectionId)
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
    <FormSheet
      title={t('productSheet.title')}
      description={t('productSheet.description')}
      submitLabel={t('common.add')}
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
