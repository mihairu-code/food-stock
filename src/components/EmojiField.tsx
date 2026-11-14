import { memo, useEffect, useId, useState } from 'react'
import { useT } from '@/i18n'
import { EMOJI_PALETTE } from '@/lib/emojiPalette'

/** Подсказок ровно столько, чтобы вместе с кнопкой «все иконки» они заняли одну строку. */
const VISIBLE_OPTIONS = 5

interface EmojiFieldProps {
  value: string
  onChange: (value: string) => void
  /** Иконки для быстрого выбора; показываются первые, сколько помещается в одну строку. */
  options: string[]
  hint?: string
}

const isTextField = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.matches('input, textarea')

/**
 * Необязательная иконка: выбрать из подсказок или открыть панель со всеми иконками.
 * Панель встаёт на место клавиатуры — открываясь, она убирает клавиатуру, а когда
 * человек возвращается к полю ввода, закрывается сама.
 */
export const EmojiField = memo(function EmojiField({ value, onChange, options, hint }: EmojiFieldProps) {
  const t = useT()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const quick = options.slice(0, VISIBLE_OPTIONS)

  useEffect(() => {
    if (!open) return
    const close = (event: FocusEvent) => {
      if (isTextField(event.target)) setOpen(false)
    }
    document.addEventListener('focusin', close)
    return () => document.removeEventListener('focusin', close)
  }, [open])

  function toggle() {
    // Клавиатура и панель вместе в шторку не помещаются: панель её заменяет.
    if (!open && isTextField(document.activeElement)) (document.activeElement as HTMLElement).blur()
    setOpen(!open)
  }

  function pick(emoji: string) {
    onChange(value === emoji ? '' : emoji)
    setOpen(false)
  }

  return (
    <div className="field">
      <span className="field-label">
        {t('emoji.label')}
        {hint && <small>{hint}</small>}
      </span>
      <div className="emoji-grid">
        <button
          type="button"
          className="emoji-option emoji-more"
          aria-label={t('emoji.custom')}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggle}
        >
          {/* Выбранная иконка, если её нет среди подсказок рядом; иначе приглашение выбрать. */}
          {value && !quick.includes(value) ? value : '＋'}
        </button>
        {quick.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="emoji-option"
            aria-pressed={value === emoji}
            // Нажатие не забирает фокус у поля ввода: клавиатура остаётся на месте.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange(value === emoji ? '' : emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
      {open && (
        // data-scroll-y: шторка не перехватывает прокрутку панели.
        <div className="emoji-panel" id={panelId} data-scroll-y>
          {EMOJI_PALETTE.map((emoji) => (
            <button key={emoji} type="button" aria-pressed={value === emoji} onClick={() => pick(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
