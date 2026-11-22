import type { ReactNode } from 'react'
import { RowText } from './RowText'

interface SettingToggleProps {
  id: string
  title: string
  /** Подпись под названием; может нести и пример того, что изменится. */
  meta?: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
}

/** Строка настроек с переключателем справа. */
export function SettingToggle({ id, title, meta, checked, onChange }: SettingToggleProps) {
  return (
    <div className="setting-row">
      <RowText title={title} meta={meta} labelFor={id} />
      <input
        id={id}
        className="switch"
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </div>
  )
}
