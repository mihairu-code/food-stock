import { useState, type FormEvent } from 'react'
import { EmojiField, SectionPicker, StapleCheckbox, TextField } from '@/components'
import { useCreateProduct, useSortedSections } from '@/data/hooks'
import { useSuggestedEmoji } from '@/hooks/useSuggestedEmoji'
import { useT } from '@/i18n'
import { notify } from '@/lib/toast'
import { Sheet } from './Sheet'
import { SheetActions } from './SheetActions'
import { closeSheet } from './sheetStore'

/** Новый продукт; `sectionId` — раздел, из которого шторку открыли. */
export function ProductSheet({ sectionId: initialSectionId }: { sectionId?: string }) {
  const t = useT()
  const sections = useSortedSections()
  const createProduct = useCreateProduct()
  const [name, setName] = useState('')
  const { icon, setIcon, options } = useSuggestedEmoji(name)
  const [sectionId, setSectionId] = useState(initialSectionId ?? sections[0]?.id ?? '')
  const [staple, setStaple] = useState(true)

  function submit(event: FormEvent) {
    event.preventDefault()
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
    <Sheet title={t('productSheet.title')} description={t('productSheet.description')}>
      <form onSubmit={submit}>
        <TextField
          id="product-name"
          label={t('productSheet.name')}
          placeholder={t('productSheet.placeholder')}
          value={name}
          onChange={setName}
          maxLength={80}
          autoFocus
        />
        <EmojiField options={options} value={icon} onChange={setIcon} hint={t('emoji.hint')} />
        <SectionPicker sections={sections} value={sectionId} onChange={setSectionId} />
        <StapleCheckbox checked={staple} onChange={setStaple} />
        <SheetActions submitLabel={t('common.add')} disabled={!name.trim() || !sectionId} />
      </form>
    </Sheet>
  )
}
