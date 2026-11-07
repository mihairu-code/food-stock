import type { ReactNode } from 'react'

export function EmptyState({ emoji, title, text, children }: { emoji: string; title: string; text: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-emoji" aria-hidden="true">
        {emoji}
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  )
}
