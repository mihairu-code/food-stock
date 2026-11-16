import type { ReactNode } from 'react'

/** Подсказка с заголовком-меткой под содержимым экрана. */
export function Hint({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="hint">
      <div className="hint-label">{label}</div>
      {children}
    </div>
  )
}
