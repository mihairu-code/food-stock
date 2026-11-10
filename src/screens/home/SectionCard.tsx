import { ChevronDown, Pencil } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Section } from '@/domain/types'

interface SectionCardProps {
  section: Section
  count: number
  open: boolean
  onToggle: () => void
  onEdit: () => void
  children?: ReactNode
}

/** Раздел дома: сворачиваемая карточка со своими продуктами. */
export function SectionCard({ section, count, open, onToggle, onEdit, children }: SectionCardProps) {
  const panelId = `section-${section.id}`
  return (
    <section className="card section" data-open={open}>
      <div className="section-head">
        <button
          className="section-toggle"
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <ChevronDown className="caret" size={18} aria-hidden="true" />
          <span className="section-title">
            {section.icon && <span aria-hidden="true">{section.icon}</span>}
            <span className="section-name">{section.name}</span>
          </span>
          <span className="count">{count}</span>
        </button>
        <button className="icon-btn" type="button" aria-label={`Изменить раздел «${section.name}»`} onClick={onEdit}>
          <Pencil size={16} />
        </button>
      </div>
      {/* Содержимое не размонтируется: высота плавно сворачивается, а inert убирает его из фокуса. */}
      <div className="section-body" id={panelId} inert={!open}>
        <div className="section-products">{children}</div>
      </div>
    </section>
  )
}
