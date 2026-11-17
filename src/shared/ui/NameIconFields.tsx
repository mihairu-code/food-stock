import type { InputHTMLAttributes } from 'react'
import { EmojiField } from './EmojiField'
import { TextField } from './TextField'

interface NameIconFieldsProps {
  id: string
  label: string
  placeholder?: string
  maxLength: number
  name: string
  onNameChange: (name: string) => void
  icon: string
  onIconChange: (icon: string) => void
  /** Иконки для быстрого выбора рядом с кнопкой «все иконки». */
  icons: string[]
  iconHint?: string
  enterKeyHint?: InputHTMLAttributes<HTMLInputElement>['enterKeyHint']
  /** Ошибка в названии (например, такое уже есть) и счётчик встряски поля — см. TextField. */
  nameError?: string | null
  nameShakeCount?: number
}

/**
 * Название и иконка — пара полей, с которой начинается любая форма «создать или
 * изменить»: продукт, покупка, раздел, дом. Один компонент, чтобы везде они выглядели
 * и вели себя одинаково.
 */
export function NameIconFields(props: NameIconFieldsProps) {
  return (
    <>
      <TextField
        id={props.id}
        label={props.label}
        placeholder={props.placeholder}
        value={props.name}
        onChange={props.onNameChange}
        maxLength={props.maxLength}
        enterKeyHint={props.enterKeyHint ?? 'done'}
        autoFocus
        error={props.nameError}
        shakeCount={props.nameShakeCount}
      />
      <EmojiField value={props.icon} onChange={props.onIconChange} options={props.icons} hint={props.iconHint} />
    </>
  )
}
