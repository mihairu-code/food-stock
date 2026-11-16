import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange'> {
  id: string
  label: string
  value: string
  /** Без обработчика поле только для чтения. */
  onChange?: (value: string) => void
}

/** Подписанное текстовое поле формы. Остальные атрибуты уходят в <input> как есть. */
export function TextField({ id, label, value, onChange, ...input }: TextFieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={value}
        readOnly={!onChange}
        onChange={onChange && ((event) => onChange(event.target.value))}
        {...input}
      />
    </div>
  )
}
