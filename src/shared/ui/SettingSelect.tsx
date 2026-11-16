import type { ReactNode } from 'react'

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
      <label className="row-text" htmlFor={id}>
        <div className="row-name">{title}</div>
        {meta && <div className="row-meta">{meta}</div>}
      </label>
      <select id={id} className="inline-select" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </div>
  )
}
