import { X } from 'lucide-react'
import { memo } from 'react'
import { SwipeRow } from '@/components/SwipeRow'
import type { Product } from '@/domain/types'
import type { ProductActions } from './useProductActions'

/**
 * Строка продукта. Отметка справа — «Есть» или «Закончилось»: закончившийся постоянный
 * продукт сам попадает в покупки. Разовый существует, только пока он есть, — его
 * «Закончилось» просто убирает продукт.
 */
export const ProductRow = memo(function ProductRow({ product, actions }: { product: Product; actions: ProductActions }) {
  const { name, is_available: available } = product
  const staple = product.kind === 'staple'
  const meta = !available ? 'Закончилось · в покупках' : staple ? 'Постоянный' : 'Разовый'
  // Продукт, только что перенесённый из покупок, ещё не получил настоящий идентификатор.
  const saving = product.id.startsWith('pending-')

  return (
    <SwipeRow onDelete={() => actions.remove(product)}>
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
          disabled={saving}
          aria-label={available ? `Отметить, что «${name}» закончилось` : `Отметить, что «${name}» снова есть`}
          onClick={() => actions.toggleStock(product)}
        >
          <span className="box" aria-hidden="true" />
          {available ? 'Есть' : 'Нет'}
        </button>
        <button
          className="icon-btn row-delete"
          type="button"
          disabled={saving}
          aria-label={`Удалить «${name}»`}
          onClick={() => actions.remove(product)}
        >
          <X size={18} />
        </button>
      </div>
    </SwipeRow>
  )
})
