import { useCallback, useState } from 'react'

const KEY = 'home-stock:collapsed-sections'

function readCollapsed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

/** Свёрнутые разделы главного экрана; выбор помнится на устройстве. */
export function useCollapsedSections() {
  const [ids, setIds] = useState(readCollapsed)

  const toggle = useCallback((sectionId: string) => {
    setIds((current) => {
      const next = current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId]
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { ids, toggle }
}
