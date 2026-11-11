import { Minus, Plus, X } from 'lucide-react'
import { memo } from 'react'
import { StockIcon } from '@/components/StockIcon'
import { SwipeRow } from '@/components/SwipeRow'
import type { Product } from '@/domain/types'
import { useT, type MessageKey } from '@/i18n'
import type { ProductActions } from './useProductActions'

/** Подпись под названием: чего не хватает или какой это продукт. */
function metaKey(product: Product): MessageKey {
  if (!product.is_available) return product.to_buy ? 'product.outInList' : 'product.out'
  if (product.to_buy) return 'product.inList'
  return product.kind === 'staple' ? 'product.staple' : 'product.oneOff'
}

/**
 * Строка продукта. Нажатие на иконку или название отмечает, что продукт закончился
 * или снова дома (это показывает точка в углу иконки), а кнопка справа кладёт продукт
 * в покупки или убирает из них — это две независимые отметки.
 */
export const ProductRow = memo(function ProductRow({ product, actions }: { product: Product; actions: ProductActions }) {
  const t = useT()
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
          aria-label={t(available ? 'product.markOut' : 'product.markIn', { name })}
          onClick={() => actions.toggleStock(product)}
        >
          <StockIcon icon={product.icon} />
          <span className="row-text">
            <span className="row-name">{name}</span>
            <span className="row-meta">{t(metaKey(product))}</span>
          </span>
        </button>
        <button
          className="list-toggle"
          type="button"
          disabled={saving}
          data-on={toBuy}
          aria-label={t(toBuy ? 'product.removeFromList' : 'product.addToList', { name })}
          onClick={() => actions.toggleList(product)}
        >
          {toBuy ? <Minus size={18} /> : <Plus size={18} />}
        </button>
        <button
          className="icon-btn row-delete"
          type="button"
          disabled={saving}
          aria-label={t('product.delete', { name })}
          onClick={() => actions.remove(product)}
        >
          <X size={18} />
        </button>
      </div>
    </SwipeRow>
  )
})
