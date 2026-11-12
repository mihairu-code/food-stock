import { useState } from 'react'
import { useDeleteSection, useHomeData } from '@/data/hooks'
import type { Section } from '@/domain/types'
import { useT } from '@/i18n'
import { rich } from '@/i18n/rich'
import { notify } from '@/lib/toast'
import { ConfirmSheet } from './ConfirmSheet'
import { SectionSheet } from './SectionSheet'
import { closeSheet } from './sheetStore'

/**
 * Управление разделом: переименование и удаление. Пустой раздел удаляется сразу,
 * непустой — только после подтверждения каскадного удаления.
 */
export function SectionManagerSheet({ section }: { section: Section }) {
  const t = useT()
  const { products } = useHomeData()
  const deleteSection = useDeleteSection()
  const [confirming, setConfirming] = useState(false)

  const inSection = products.filter((p) => p.section_id === section.id)
  const inShopping = inSection.filter((p) => p.to_buy).length

  function remove() {
    deleteSection.mutate(section.id)
    notify('toast.sectionDeleted', { name: section.name })
    closeSheet()
  }

  if (!confirming) {
    return (
      <SectionSheet
        section={section}
        onRequestDelete={() => (inSection.length === 0 ? remove() : setConfirming(true))}
      />
    )
  }

  const warning = [
    t('section.deleteText', { count: inSection.length }),
    inShopping > 0 ? t('section.deleteInList', { count: inShopping }) : '',
    t('section.deleteNoUndo'),
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ConfirmSheet
      title={t('section.deleteTitle', { name: section.name })}
      description={rich(warning)}
      confirmLabel={t('section.delete')}
      onConfirm={remove}
    />
  )
}
