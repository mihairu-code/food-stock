import { useEffect, useRef, type InputHTMLAttributes } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange'> {
  id: string
  label: string
  value: string
  /** Без обработчика поле только для чтения. */
  onChange?: (value: string) => void
  /** Что не так с введённым: поле обводится красным, текст стоит под ним. */
  error?: string | null
  /**
   * Счётчик попыток отправить форму с ошибкой: каждое новое значение встряхивает поле,
   * чтобы взгляд сразу нашёл, что исправить.
   */
  shakeCount?: number
}

const SHAKE: Keyframe[] = [0, -7, 6, -4, 3, 0].map((x) => ({ transform: `translateX(${x}px)` }))
const SHAKE_MS = 320

/** Подписанное текстовое поле формы. Остальные атрибуты уходят в <input> как есть. */
export function TextField({ id, label, value, onChange, error, shakeCount = 0, ...input }: TextFieldProps) {
  const field = useRef<HTMLInputElement>(null)
  const errorId = `${id}-error`

  useEffect(() => {
    if (shakeCount === 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    field.current?.animate(SHAKE, { duration: SHAKE_MS, easing: 'ease-out' })
  }, [shakeCount])

  return (
    <div className="field" data-invalid={Boolean(error)}>
      <label htmlFor={id}>{label}</label>
      <input
        ref={field}
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
