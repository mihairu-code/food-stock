import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { useT } from '@/shared/i18n'

interface SummaryBarProps {
  children: ReactNode
  onAdd: () => void
  /** Метка кнопки «Добавить» для окна обучения (data-coach). */
  coach?: string
}

/** Итог экрана одной фразой и кнопка «Добавить» справа. */
export function SummaryBar({ children, onAdd, coach }: SummaryBarProps) {
  const t = useT()
  return (
    <div className="summary">
      <p>{children}</p>
      <button className="btn" type="button" data-coach={coach} onClick={onAdd}>
        <Plus size={16} /> {t('common.add')}
      </button>
    </div>
  )
}
