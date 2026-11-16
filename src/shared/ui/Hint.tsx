import type { ReactNode } from 'react'
import { useHintsVisible } from '@/shared/lib/hints/useHintsVisible'

interface HintProps {
  label: string
  children: ReactNode
  /**
   * Подсказка «как этим пользоваться»: видна новому человеку первые дни, дальше —
   * только если подсказки включены в настройках. Без флага видна всегда.
   */
  onlyWhenHintsOn?: boolean
}

/** Подсказка с заголовком-меткой под содержимым экрана. */
export function Hint({ label, children, onlyWhenHintsOn = false }: HintProps) {
  const hintsOn = useHintsVisible()
  if (onlyWhenHintsOn && !hintsOn) return null
  return (
    <div className="hint">
      <div className="hint-label">{label}</div>
      {children}
    </div>
  )
}
