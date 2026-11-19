import { useState } from 'react'
import { useSuggestedEmoji } from './emoji/useSuggestedEmoji'
import { useFieldError } from './useFieldError'

/**
 * Название с иконкой, подобранной по нему, и ошибкой «такое уже есть» — состояние формы
 * продукта и ручной покупки. Правка названия снимает ошибку.
 * `fields` передаётся в NameIconFields как есть.
 */
export function useNameWithIcon(savedName = '', savedIcon: string | null = null) {
  const [name, setName] = useState(savedName)
  const { icon, setIcon, options } = useSuggestedEmoji(name, savedIcon)
  const nameError = useFieldError()

  function changeName(next: string) {
    setName(next)
    nameError.clear()
  }

  return {
    name,
    icon,
    /** Показать ошибку под названием и встряхнуть поле. */
    rejectName: nameError.reject,
    fields: {
      name,
      onNameChange: changeName,
      icon,
      onIconChange: setIcon,
      icons: options,
      nameError: nameError.error,
      nameShakeCount: nameError.shakeCount,
    },
  }
}
