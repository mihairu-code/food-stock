import { useCallback, useState } from 'react'
import type { Section } from '@/shared/api'
import { useSession } from '@/shared/session'

const KEY = 'home-stock:collapsed-sections'

function readCollapsed(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function saveCollapsed(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    // хранилище недоступно — разделы свёрнуты до перезагрузки
  }
}

/**
 * Новый список свёрнутых после нажатия на раздел. existing — разделы, которые сейчас есть;
 * null — проверить нельзя (домов несколько), неизвестные id остаются.
 */
export function toggleCollapsed(
  current: readonly string[],
  sectionId: string,
  existing: ReadonlySet<string> | null,
): string[] {
  const toggled = current.includes(sectionId) ? current.filter((id) => id !== sectionId) : [...current, sectionId]
  return existing ? toggled.filter((id) => existing.has(id)) : toggled
}

/**
 * Свёрнутые разделы главного экрана; выбор помнится на устройстве.
 * Список один на все дома устройства, поэтому id разделов, которых больше нет, убираются
 * при сохранении, только когда дом один: в другом доме неизвестный id — его живой раздел.
 */
export function useCollapsedSections(sections: readonly Section[]) {
  const singleHome = useSession().memberships.length === 1
  const [ids, setIds] = useState(readCollapsed)

  const toggle = useCallback(
    (sectionId: string) => {
      setIds((current) => {
        const next = toggleCollapsed(current, sectionId, singleHome ? new Set(sections.map(({ id }) => id)) : null)
        saveCollapsed(next)
        return next
      })
    },
    [sections, singleHome],
  )

  return { ids, toggle }
}
