import type { Announcements } from '@dnd-kit/core'
import { translate } from '@/shared/i18n'

/** Что слышит пользователь скринридера во время перестановки. `nameOf` — название продукта или раздела. */
export function dragAnnouncements(nameOf: (id: string) => string): Announcements {
  const name = (id: string | number) => nameOf(String(id))
  return {
    onDragStart: ({ active }) => translate('dnd.picked', { name: name(active.id) }),
    onDragOver: ({ active, over }) =>
      over && over.id !== active.id
        ? translate('dnd.over', { name: name(active.id), target: name(over.id) })
        : undefined,
    onDragEnd: ({ active }) => translate('dnd.dropped', { name: name(active.id) }),
    onDragCancel: ({ active }) => translate('dnd.cancelled', { name: name(active.id) }),
  }
}
