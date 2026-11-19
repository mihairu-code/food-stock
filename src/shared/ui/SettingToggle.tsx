import { RowText } from './RowText'

interface SettingToggleProps {
  id: string
  title: string
  meta?: string
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
