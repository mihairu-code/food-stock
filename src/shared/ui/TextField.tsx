import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange'> {
  id: string
  label: string
  value: string
  /** Без обработчика поле только для чтения. */
  onChange?: (value: string) => void
  /** Что не так с введённым: поле обводится красным, текст стоит под ним. */
  error?: string | null
}

/** Подписанное текстовое поле формы. Остальные атрибуты уходят в <input> как есть. */
export function TextField({ id, label, value, onChange, error, ...input }: TextFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="field" data-invalid={Boolean(error)}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={value}
        readOnly={!onChange}
        onChange={onChange && ((event) => onChange(event.target.value))}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...input}
      />
      {error && (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
