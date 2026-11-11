import { useDeferredValue, useMemo, useState } from 'react'
import { useLang } from '@/i18n'
import { suggestEmojis } from '@/lib/emojiSuggest'

/** Два ряда подсказок под полем: больше на телефоне не помещается без прокрутки. */
const SUGGESTIONS = 10

/**
 * Иконка продукта, подобранная по названию. Пока пользователь не выбрал иконку
 * сам, подставляется уверенное совпадение из словаря; ручной выбор (в том числе
 * «без иконки») всегда главнее.
 */
export function useSuggestedEmoji(name: string) {
  // null — пользователь иконку не трогал; '' — намеренно убрал.
  const [manual, setManual] = useState<string | null>(null)
  const { lang } = useLang()
  const deferredName = useDeferredValue(name)
  const { options, best } = useMemo(
    () => suggestEmojis(deferredName, { lang, limit: SUGGESTIONS }),
    [deferredName, lang],
  )
  return { icon: manual ?? best ?? '', setIcon: setManual, options }
}
