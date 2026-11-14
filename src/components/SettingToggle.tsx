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
      <label className="row-text" htmlFor={id}>
        <div className="row-name">{title}</div>
        {meta && <div className="row-meta">{meta}</div>}
      </label>
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
