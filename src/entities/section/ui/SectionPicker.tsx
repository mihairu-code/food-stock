import { useEffect, useId, useRef } from 'react'
import type { Section } from '@/shared/api'
import { useT } from '@/shared/i18n'

interface SectionPickerProps {
  sections: Section[]
  value: string
  onChange: (sectionId: string) => void
}

/**
 * Выбор раздела, в который попадёт продукт: ряд плиток, который листается вбок.
 * Не системный выпадающий список — тот на телефоне прячет клавиатуру и сдвигает шторку.
 */
export function SectionPicker({ sections, value, onChange }: SectionPickerProps) {
  const t = useT()
  const labelId = useId()
  const row = useRef<HTMLDivElement>(null)
  const chosen = useRef<HTMLButtonElement>(null)

  // Выбранный раздел сразу на виду, даже если он далеко в ряду.
  useEffect(() => {
    const list = row.current
    const chip = chosen.current
    if (list && chip) list.scrollLeft = chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2
  }, [])

  return (
    <div className="field">
      <span className="field-label" id={labelId}>
        {t('field.section')}
      </span>
      {/* data-scroll-x: шторка не перехватывает движение пальца вбок по этому ряду. */}
      <div className="chips" ref={row} role="radiogroup" aria-labelledby={labelId} data-scroll-x>
        {sections.map((section) => (
          <button
            key={section.id}
            ref={section.id === value ? chosen : undefined}
            className="chip"
            type="button"
            role="radio"
            aria-checked={section.id === value}
            // Нажатие не забирает фокус у поля ввода: клавиатура остаётся на месте.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange(section.id)}
          >
            {section.icon && <span aria-hidden="true">{section.icon}</span>}
            {section.name}
          </button>
        ))}
      </div>
    </div>
  )
}
