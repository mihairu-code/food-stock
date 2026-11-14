import { useState } from 'react'
import { NameIconFields, SectionPicker, StapleCheckbox } from '@/components'
import { useCreateProduct, useSortedSections } from '@/data/hooks'
import { useSuggestedEmoji } from '@/hooks/useSuggestedEmoji'
import { useT } from '@/i18n'
import { notify } from '@/lib/toast'
import { FormSheet } from './FormSheet'
import { closeSheet } from './sheetStore'

/** Новый продукт; `sectionId` — раздел, из которого шторку открыли. */
export function ProductSheet({ sectionId: initialSectionId }: { sectionId?: string }) {
  const t = useT()
  const sections = useSortedSections()
  const createProduct = useCreateProduct()
  const [name, setName] = useState('')
  const [sectionId, setSectionId] = useState(initialSectionId ?? sections[0]?.id ?? '')
  const [staple, setStaple] = useState(false)
  const { icon, setIcon, options } = useSuggestedEmoji(name)

  function submit() {
    const trimmed = name.trim()
    const section = sections.find((s) => s.id === sectionId)
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
      onSubmit={submit}
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
