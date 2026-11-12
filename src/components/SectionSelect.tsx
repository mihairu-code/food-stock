import type { Section } from '@/domain/types'
import { useT } from '@/i18n'

interface SectionSelectProps {
  sections: Section[]
  value: string
  onChange: (sectionId: string) => void
}

/** Выбор раздела дома в форме. */
export function SectionSelect({ sections, value, onChange }: SectionSelectProps) {
  const t = useT()
  return (
    <div className="field">
      <label htmlFor="section">{t('field.section')}</label>
      <select id="section" value={value} onChange={(event) => onChange(event.target.value)}>
        {sections.map((section) => (
          <option key={section.id} value={section.id}>
            {section.icon ? `${section.icon} ${section.name}` : section.name}
          </option>
        ))}
      </select>
    </div>
  )
}
