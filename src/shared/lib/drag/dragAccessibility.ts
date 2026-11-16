import type { Announcements, ScreenReaderInstructions } from '@dnd-kit/core'
import type { Translate } from '@/shared/i18n'

/**
 * Что слышит пользователь скринридера: как взять строку и что происходит во время
 * перестановки. `t` — переводчик экрана: со сменой языка экран пересобирает подсказки.
 * `nameOf` — название продукта, раздела или позиции покупок.
 */
export function dragAccessibility(
  t: Translate,
  nameOf: (id: string) => string,
): {
  screenReaderInstructions: ScreenReaderInstructions
  announcements: Announcements
} {
  const name = (id: string | number) => nameOf(String(id))
  return {
    screenReaderInstructions: { draggable: t('dnd.instructions') },
    announcements: {
      onDragStart: ({ active }) => t('dnd.picked', { name: name(active.id) }),
      onDragOver: ({ active, over }) =>
        over && over.id !== active.id
          ? t('dnd.over', { name: name(active.id), target: name(over.id) })
          : undefined,
      onDragEnd: ({ active }) => t('dnd.dropped', { name: name(active.id) }),
      onDragCancel: ({ active }) => t('dnd.cancelled', { name: name(active.id) }),
    },
  }
}
