import type { MessageKey } from '@/shared/i18n'

/**
 * Готовые разделы на пустом доме. Холодильник и шкаф есть почти в каждом доме, поэтому
 * отмечены сразу; остальные — по желанию.
 */
export const READY_SECTIONS: readonly { id: string; key: MessageKey; icon: string; checked: boolean }[] = [
  { id: 'fridge', key: 'ready.fridge', icon: '🧊', checked: true },
  { id: 'cupboard', key: 'ready.cupboard', icon: '🧺', checked: true },
  { id: 'freezer', key: 'ready.freezer', icon: '❄️', checked: false },
  { id: 'treats', key: 'ready.treats', icon: '🍪', checked: false },
  { id: 'vegetables', key: 'ready.vegetables', icon: '🥔', checked: false },
]

/** Кнопка на экране: готовый раздел или свой, добавленный через шторку. */
export interface ReadySection {
  id: string
  name: string
  icon: string
  checked: boolean
}

/** Какие кнопки отмечены сначала. */
export const initialChecks = (): Record<string, boolean> =>
  Object.fromEntries(READY_SECTIONS.map(({ id, checked }) => [id, checked]))

/** Отмеченные кнопки — новые разделы в том же порядке, в каком стоят кнопки. */
export function sectionsToCreate(chips: readonly ReadySection[]): { name: string; icon: string | null; sort_order: number }[] {
  return chips
    .filter((chip) => chip.checked)
    .map((chip, index) => ({ name: chip.name, icon: chip.icon || null, sort_order: index }))
}
