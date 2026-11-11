import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { SwipeRow } from '@/components/SwipeRow'

interface ShoppingRowProps {
  name: string
  meta: string
  /** Иконка слева: у продукта дома — с точкой наличия. */
  icon: ReactNode
  /** Продукта дома уже нет: строка приглушена. */
  missing?: boolean
  /** Подпись кнопки удаления для скринридера. */
  removeLabel: string
  onBuy: () => void
  onRemove: () => void
}

/** Строка покупок: иконка, название, «Куплено» и удаление. */
export function ShoppingRow({ name, meta, icon, missing = false, removeLabel, onBuy, onRemove }: ShoppingRowProps) {
  return (
    <SwipeRow onDelete={onRemove} label="Убрать">
      <div className="row" data-missing={missing}>
        {icon}
        <div className="row-text">
          <div className="row-name">{name}</div>
          <div className="row-meta">{meta}</div>
        </div>
        <button className="btn small" type="button" aria-label={`«${name}» куплено`} onClick={onBuy}>
          Куплено
        </button>
        <button className="icon-btn row-delete" type="button" aria-label={removeLabel} onClick={onRemove}>
          <X size={18} />
        </button>
      </div>
    </SwipeRow>
  )
}
