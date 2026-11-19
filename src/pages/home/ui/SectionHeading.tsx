import type { Section } from '@/shared/api'
import { useT } from '@/shared/i18n'

/** Шапка раздела: иконка, название и число продуктов. Одна и в карточке, и под пальцем при перетаскивании. */
export function SectionHeading({ section, count }: { section: Section; count: number }) {
  const t = useT()
  return (
    <>
      <span className="section-title">
        {section.icon && <span aria-hidden="true">{section.icon}</span>}
        <span className="section-name">{section.name}</span>
      </span>
      <span className="count" aria-label={t('home.sectionCount', { count })}>
        {count}
      </span>
    </>
  )
}
