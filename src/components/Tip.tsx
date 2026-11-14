import type { ReactNode } from 'react'
import { useHintsVisible } from '@/hooks/useHintsVisible'
import { Hint } from './Hint'

/**
 * Подсказка «как этим пользоваться». В отличие от Hint, видна не всегда: новому человеку —
 * первые дни, дальше — только если подсказки включены в настройках.
 */
export function Tip({ label, children }: { label: string; children: ReactNode }) {
  return useHintsVisible() ? <Hint label={label}>{children}</Hint> : null
}
