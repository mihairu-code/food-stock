import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { useT } from '@/i18n'

/** Итог экрана одной фразой и кнопка «Добавить» справа. */
export function SummaryBar({ children, onAdd }: { children: ReactNode; onAdd: () => void }) {
  const t = useT()
  return (
    <div className="summary">
      <p>{children}</p>
      <button className="btn" type="button" onClick={onAdd}>
        <Plus size={16} /> {t('common.add')}
      </button>
    </div>
  )
}
