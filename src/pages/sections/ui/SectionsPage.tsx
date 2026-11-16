import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router'
import { useSortedSections } from '@/entities/section'
import { useHomeData } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { AddRow, openSheet, SettingRow, SettingsGroup } from '@/shared/ui'

export function SectionsPage() {
  const t = useT()
  const { products } = useHomeData()
  const sections = useSortedSections()

  return (
    <>
      <Link className="back-link" to="/settings">
        <ChevronLeft size={18} aria-hidden="true" /> {t('nav.settings')}
      </Link>
      <SettingsGroup label={t('settings.sections')}>
        {sections.map((section) => (
          <SettingRow
            key={section.id}
            leading={<span className="emoji" aria-hidden="true">{section.icon || '📦'}</span>}
            title={section.name}
            meta={t('n.products', { count: products.filter((p) => p.section_id === section.id).length })}
            onClick={() => openSheet({ type: 'manage-section', section })}
          />
        ))}
      </SettingsGroup>
      <AddRow label={t('section.newTitle')} onClick={() => openSheet({ type: 'add-section' })} />
    </>
  )
}
