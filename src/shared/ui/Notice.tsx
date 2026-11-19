import type { ReactNode } from 'react'
import { AuthScreen } from './AuthScreen'

interface NoticeProps {
  title: string
  children: ReactNode
  actionLabel: string
  onAction: () => void
}

/** Сообщение на весь экран с одним действием: «не получилось — повторить». */
export function Notice({ title, children, actionLabel, onAction }: NoticeProps) {
  return (
    <AuthScreen title={title} lead={children}>
      <button className="btn" type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </AuthScreen>
  )
}
