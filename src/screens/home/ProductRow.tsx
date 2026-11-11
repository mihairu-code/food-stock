import { Minus, Plus, X } from 'lucide-react'
import { memo } from 'react'
import { StockIcon } from '@/components/StockIcon'
import { SwipeRow } from '@/components/SwipeRow'
import type { Product } from '@/domain/types'
import type { ProductActions } from './useProductActions'

/** Подпись под названием: чего не хватает или какой это продукт. */
function metaOf(product: Product): string {
  if (!product.is_available) return product.to_buy ? 'Закончилось · в покупках' : 'Закончилось'
  if (product.to_buy) return 'Есть · в покупках'
  return product.kind === 'staple' ? 'Постоянный' : 'Разовый'
}

/**
 * Строка продукта. Нажатие на иконку или название отмечает, что продукт закончился
 * или снова дома (это показывает точка в углу иконки), а кнопка справа кладёт продукт
 * в покупки или убирает из них — это две независимые отметки.
 */
export const ProductRow = memo(function ProductRow({ product, actions }: { product: Product; actions: ProductActions }) {
  const { name, is_available: available, to_buy: toBuy } = product
  // Продукт, только что перенесённый из покупок, ещё не получил настоящий идентификатор.
  const saving = product.id.startsWith('pending-')

  return (
    <SwipeRow onDelete={() => actions.remove(product)}>
      <div className="row" data-missing={!available}>
        <button
          className="row-main"
          type="button"
          disabled={saving}
          aria-label={available ? `Отметить, что «${name}» закончилось` : `Отметить, что «${name}» снова есть`}
          onClick={() => actions.toggleStock(product)}
        >
          <StockIcon icon={product.icon} />
          <span className="row-text">
            <span className="row-name">{name}</span>
            <span className="row-meta">{metaOf(product)}</span>
          </span>
        </button>
        <button
          className="list-toggle"
          type="button"
          disabled={saving}
          data-on={toBuy}
          aria-label={toBuy ? `Убрать «${name}» из покупок` : `Добавить «${name}» в покупки`}
          onClick={() => actions.toggleList(product)}
        >
          {toBuy ? <Minus size={18} /> : <Plus size={18} />}
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
