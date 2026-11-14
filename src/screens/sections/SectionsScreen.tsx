import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router'
import { AddRow, SettingRow } from '@/components'
import { useHomeData, useSortedSections } from '@/data/hooks'
import { useT } from '@/i18n'
import { openSheet } from '@/sheets'

export function SectionsScreen() {
  const t = useT()
  const { products } = useHomeData()
  const sections = useSortedSections()

  return (
    <>
      <Link className="back-link" to="/settings">
        <ChevronLeft size={18} aria-hidden="true" /> {t('nav.settings')}
      </Link>
      <h2 className="group-label">{t('settings.sections')}</h2>
      {sections.length > 0 && (
        <div className="card list">
          {sections.map((section) => (
            <SettingRow
              key={section.id}
              leading={<span className="emoji" aria-hidden="true">{section.icon || '📦'}</span>}
              title={section.name}
              meta={t('n.products', { count: products.filter((p) => p.section_id === section.id).length })}
              onClick={() => openSheet({ type: 'manage-section', section })}
            />
          ))}
        </div>
      )}
      <AddRow label={t('section.newTitle')} onClick={() => openSheet({ type: 'add-section' })} />
    </>
  )
}
