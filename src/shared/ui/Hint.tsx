import type { ReactNode } from 'react'

/**
 * Пояснение с заголовком-меткой под содержимым экрана — например, что такое демо-режим.
 * Как пользоваться кнопками, объясняют окна подсказок (shared/ui/coach), а не абзацы.
 */
export function Hint({ label, children }: { label: string; children: ReactNode }) {
  return (
    <aside className="hint">
      <p className="hint-label">{label}</p>
      {children}
    </aside>
  )
}
