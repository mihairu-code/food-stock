import type { ReactNode } from 'react'

interface EmptyStateProps {
  emoji: string
  title: string
  text: string
  /** Необязательное действие под текстом. */
  children?: ReactNode
}

export function EmptyState({ emoji, title, text, children }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="empty-emoji" aria-hidden="true">{emoji}</div>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  )
}
