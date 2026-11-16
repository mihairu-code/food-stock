import { useDeferredValue, useMemo, useState } from 'react'
import { useLang } from '@/shared/i18n'
import { suggestEmojis } from './emojiSuggest'

/** Столько подсказок помещается в одну строку рядом с полем ввода. */
const SUGGESTIONS = 5

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
  const { options, best } = useMemo(() => suggestEmojis(deferredName, { lang, limit: SUGGESTIONS }), [deferredName, lang])
  return { icon: manual ?? best ?? '', setIcon: setManual, options }
}
