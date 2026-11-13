import type { Section } from '@/domain/types'

/** Раздел под пальцем во время перетаскивания: только шапка. */
export function SectionGhost({ section, count }: { section: Section; count: number }) {
  return (
    <div className="card drag-ghost section-ghost">
      <span className="section-title">
        {section.icon && <span aria-hidden="true">{section.icon}</span>}
        <span className="section-name">{section.name}</span>
      </span>
      <span className="count">{count}</span>
    </div>
  )
}
