import type { ReactNode } from 'react'

interface NoticeProps {
  title: string
  children: ReactNode
  actionLabel: string
  onAction: () => void
}

/** Сообщение на весь экран с одним действием: «не получилось — повторить». */
export function Notice({ title, children, actionLabel, onAction }: NoticeProps) {
  return (
    <main className="auth">
      <div className="auth-emoji" aria-hidden="true">🏠</div>
      <h1>{title}</h1>
      <p className="auth-lead">{children}</p>
      <button className="btn" type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </main>
  )
}
