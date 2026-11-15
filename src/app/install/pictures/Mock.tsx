import type { ReactNode } from 'react'

/**
 * Рамка схематичного «скриншота» шага. Картинка дублирует текст шага, поэтому
 * скрыта от экранного диктора. place — где на экране происходит действие.
 */
export function Mock({ place, children }: { place: 'top' | 'bottom' | 'center'; children: ReactNode }) {
  return (
    <div className={`mock mock-${place}`} aria-hidden="true">
      {children}
    </div>
  )
}
