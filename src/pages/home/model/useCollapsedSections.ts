import { useCallback } from 'react'
import type { Section } from '@/shared/api'
import { createStore, useStore } from '@/shared/lib/store'
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

/** Одно хранилище на экран: свёрнутые разделы знает и доска, и обучение (оно встаёт на развёрнутый). */
const collapsed = createStore<readonly string[]>(readCollapsed())

/** Какие разделы свёрнуты — для тех, кому нужно только знать, а не сворачивать. */
export const useCollapsedIds = () => useStore(collapsed)

/**
 * Свёрнутые разделы главного экрана; выбор помнится на устройстве.
 * Список один на все дома устройства, поэтому id разделов, которых больше нет, убираются
 * при сохранении, только когда дом один: в другом доме неизвестный id — его живой раздел.
 */
export function useCollapsedSections(sections: readonly Section[]) {
  const singleHome = useSession().memberships.length === 1
  const ids = useStore(collapsed)

  const toggle = useCallback(
    (sectionId: string) => {
      const next = toggleCollapsed(collapsed.get(), sectionId, singleHome ? new Set(sections.map(({ id }) => id)) : null)
      collapsed.set(next)
      saveCollapsed(next)
    },
    [sections, singleHome],
  )

  return { ids, toggle }
}
