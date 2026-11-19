import type { ReactNode } from 'react'

interface AuthScreenProps {
  title: string
  lead: ReactNode
  children: ReactNode
}

/** Экран на весь экран до входа в дом: домик, заголовок, пояснение и содержимое под ними. */
export function AuthScreen({ title, lead, children }: AuthScreenProps) {
  return (
    <main className="auth">
      <div className="auth-emoji" aria-hidden="true">🏠</div>
      <h1>{title}</h1>
      <p className="auth-lead">{lead}</p>
      {children}
    </main>
  )
}
