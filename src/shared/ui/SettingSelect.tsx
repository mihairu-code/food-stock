import type { ReactNode } from 'react'
import { RowText } from './RowText'

interface SettingSelectProps {
  id: string
  title: string
  meta?: string
  value: string
  onChange: (value: string) => void
  /** Варианты выбора — элементы <option>. */
  children: ReactNode
}

/** Строка настроек с выпадающим списком справа. */
export function SettingSelect({ id, title, meta, value, onChange, children }: SettingSelectProps) {
  return (
    <div className="setting-row">
      <RowText title={title} meta={meta} labelFor={id} />
      <select id={id} className="inline-select" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </div>
  )
}
