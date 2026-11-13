import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { SortableRow, SwipeRow } from '@/components'
import { useT } from '@/i18n'

interface ShoppingRowProps {
  /** Идентификатор строки в списке покупок: продукта или ручной позиции. */
  id: string
  name: string
  meta: string
  /** Иконка слева: у продукта дома — с точкой наличия. */
  icon: ReactNode
  /** Продукта дома уже нет: строка приглушена. */
  missing?: boolean
  /** Копия строки под пальцем во время перетаскивания — выглядит точно как настоящая. */
  ghost?: boolean
  onBuy: () => void
  onRemove: () => void
}

/**
 * Общий вид строки покупок: иконка, название, «Купил» и удаление свайпом или крестиком.
 * Строку можно перетащить на другое место в списке.
 */
export function ShoppingRow({ id, name, meta, icon, missing, ghost = false, onBuy, onRemove }: ShoppingRowProps) {
  const t = useT()

  const row = (
    <div className="row" data-missing={missing}>
      {icon}
      <div className="row-text">
        <div className="row-name">{name}</div>
        <div className="row-meta">{meta}</div>
      </div>
      <button className="btn small" type="button" aria-label={t('shopping.boughtAria', { name })} onClick={onBuy}>
        {t('shopping.bought')}
      </button>
      <button
        className="icon-btn row-delete"
        type="button"
        aria-label={t('product.removeFromList', { name })}
        onClick={onRemove}
      >
        <X size={18} />
      </button>
    </div>
  )

  if (ghost) {
    // Класс list — чтобы копия была той же высоты, что строки списка.
    return (
      <div className="drag-ghost list" inert>
        {row}
      </div>
    )
  }

  return (
    <SortableRow id={id} kind="entry" label={name} description={t('dnd.product')}>
      <SwipeRow onDelete={onRemove} label={t('shopping.remove')}>
        {row}
      </SwipeRow>
    </SortableRow>
  )
}
