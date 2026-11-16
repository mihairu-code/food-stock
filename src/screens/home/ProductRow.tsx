import { Minus, Plus, X } from 'lucide-react'
import { memo } from 'react'
import { StockIcon } from '@/entities/product/ui/StockIcon'
import { isPendingProduct } from '@/entities/shopping-item/api/shoppingItemApi'
import type { Product } from '@/shared/api/types'
import { useT, type MessageKey } from '@/shared/i18n'
import { SortableRow } from '@/shared/ui/SortableRow'
import { SwipeRow } from '@/shared/ui/SwipeRow'
import type { ProductActions } from './useProductActions'

interface ProductRowProps {
  product: Product
  actions: ProductActions
  /** Раздел развёрнут: на строку можно бросить другой продукт. */
  droppable?: boolean
  /**
   * Копия строки под пальцем во время перетаскивания. Выглядит точно как настоящая,
   * поэтому в момент, когда строку отпускают, подмены не видно.
   */
  ghost?: boolean
}

/** Подпись под названием: чего не хватает или какой это продукт. */
function metaKey(product: Product): MessageKey {
  if (!product.is_available) return product.to_buy ? 'product.outInList' : 'product.out'
  if (product.to_buy) return 'product.inList'
  return product.kind === 'staple' ? 'product.staple' : 'product.oneOff'
}

/**
 * Строка продукта. Нажатие на иконку или название отмечает, что продукт закончился
 * или снова дома (это показывает точка в углу иконки), а кнопка справа кладёт продукт
 * в покупки или убирает из них — это две независимые отметки. Строку можно перетащить
 * на другое место или в другой раздел.
 */
export const ProductRow = memo(function ProductRow({ product, actions, droppable = true, ghost = false }: ProductRowProps) {
  const t = useT()
  const { name, is_available: available, to_buy: toBuy } = product
  // Продукт, только что перенесённый из покупок, ещё не получил настоящий идентификатор.
  const saving = isPendingProduct(product.id)

  const row = (
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
  )

  if (ghost) {
    return (
      <div className="drag-ghost" inert>
        {row}
      </div>
    )
  }

  return (
    <SortableRow
      id={product.id}
      kind="product"
      label={name}
      description={t('dnd.product')}
      disabled={saving}
      droppable={droppable}
    >
      <SwipeRow onDelete={() => actions.remove(product)} disabled={saving}>
        {row}
      </SwipeRow>
    </SortableRow>
  )
})
