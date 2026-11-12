import { useT } from '@/i18n'

interface EmojiOptionsProps {
  options: string[]
  value: string
  onChange: (emoji: string) => void
  /** Пояснение рядом с подписью: «подбирается по названию». */
  hint?: string
}

/** Выбор иконки из подсказок. Повторное нажатие на выбранную снимает выбор. */
export function EmojiOptions({ options, value, onChange, hint }: EmojiOptionsProps) {
  const t = useT()
  return (
    <div className="field" role="group" aria-label={t('emoji.label')}>
      <span className="field-label">
        {t('emoji.label')} {hint && <small>{hint}</small>}
      </span>
      <div className="emoji-grid">
        {options.map((emoji) => (
          <button
            key={emoji}
            className="emoji-option"
            type="button"
            aria-pressed={value === emoji}
            onClick={() => onChange(value === emoji ? '' : emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
