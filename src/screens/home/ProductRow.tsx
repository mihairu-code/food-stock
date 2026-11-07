import { X } from 'lucide-react'
import type { Product } from '@/domain/types'

interface ProductRowProps {
  product: Product
  onToggleStock: () => void
  onDelete: () => void
}

/**
 * Строка продукта. Отметка справа — «Есть» или «Закончилось»: закончившийся постоянный
 * продукт сам попадает в покупки. Разовый существует, только пока он есть, — его
 * «Закончилось» просто убирает продукт.
 */
export function ProductRow({ product, onToggleStock, onDelete }: ProductRowProps) {
  const { name, is_available: available } = product
  const staple = product.kind === 'staple'
  const meta = !available ? 'Закончилось · в покупках' : staple ? 'Постоянный' : 'Разовый'

  return (
    <div className="row" data-missing={!available}>
      <span className="emoji" aria-hidden="true">
        {product.icon || '📦'}
      </span>
      <div className="row-text">
        <div className="row-name">{name}</div>
        <div className="row-meta">{meta}</div>
      </div>
      <button
        className="stock-toggle"
        type="button"
        aria-pressed={available}
        aria-label={available ? `Отметить, что «${name}» закончилось` : `Отметить, что «${name}» снова есть`}
        onClick={onToggleStock}
      >
        <span className="box" aria-hidden="true" />
        {available ? 'Есть' : 'Нет'}
      </button>
      <button className="icon-btn row-delete" type="button" aria-label={`Удалить «${name}»`} onClick={onDelete}>
        <X size={18} />
      </button>
    </div>
  )
}
