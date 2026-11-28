import { Minus, Plus } from 'lucide-react'
import { memo } from 'react'
import { ProductStockIcon, stockState, type StockState } from '@/entities/product'
import type { NameMatch } from '@/features/home-search'
import { isPendingProduct, type Product } from '@/shared/api'
import { useT, type MessageKey } from '@/shared/i18n'
import { ListRow } from '@/shared/ui'
import type { ProductActions } from '../model/useProductActions'

interface ProductRowProps {
  product: Product
  actions: ProductActions
  /** Раздел развёрнут: на строку можно бросить другой продукт. */
  droppable?: boolean
  /** Совпадение с поиском по дому: эта часть названия подсвечена. */
  match?: NameMatch
  /**
   * Копия строки под пальцем во время перетаскивания. Выглядит точно как настоящая,
   * поэтому в момент, когда строку отпускают, подмены не видно.
   */
  ghost?: boolean
}

/**
 * Подпись под названием — состояние словами, в паре с точкой. Отличие от соседнего
 * состояния стоит первым: «Есть дома» и «В покупках · ещё есть». В минималистичном виде
 * подписи скрыты стилями.
 */
function stockCaptionKey(product: Product, stock: StockState): MessageKey {
  if (stock === 'out') return product.to_buy ? 'product.outInList' : 'product.out'
  if (stock === 'low') return 'product.inList'
  return 'product.atHome'
}

/** Подпись главной кнопки: состояние словами, чтобы скринридер не зависел от цвета точки. */
const MAIN_LABEL_KEYS: Record<StockState, MessageKey> = {
  in: 'product.markOut',
  low: 'product.markOutInList',
  out: 'product.markIn',
}

/**
 * Строка продукта. Нажатие на иконку или название отмечает, что продукт закончился
 * или снова дома (это показывает точка в углу иконки), а кнопка справа кладёт продукт
 * в покупки или убирает из них — это две независимые отметки.
 * Строку можно перетащить на другое место или в другой раздел.
 */
export const ProductRow = memo(function ProductRow({
  product,
  actions,
  droppable = true,
  match,
  ghost = false,
}: ProductRowProps) {
  const t = useT()
  const { name, to_buy: toBuy } = product
  const stock = stockState(product)

  return (
    <ListRow
      id={product.id}
      kind="product"
      dragDescription={t('dnd.product')}
      icon={<ProductStockIcon icon={product.icon} />}
      name={name}
      highlight={match}
      meta={t(stockCaptionKey(product, stock))}
      stock={stock}
      // Продукт, только что перенесённый из покупок, ещё не получил настоящий идентификатор.
      disabled={isPendingProduct(product.id)}
      droppable={droppable}
      ghost={ghost}
      main={{
        label: t(MAIN_LABEL_KEYS[stock], { name }),
        onClick: () => actions.toggleStock(product),
      }}
      toggle={{
        label: t(toBuy ? 'product.removeFromList' : 'product.addToList', { name }),
        icon: toBuy ? <Minus size={18} /> : <Plus size={18} />,
        on: toBuy,
        onClick: () => actions.toggleList(product),
      }}
      editLabel={t('product.edit', { name })}
      onEdit={() => actions.edit(product)}
      removeLabel={t('product.delete', { name })}
      removeSwipeLabel={t('common.delete')}
      onRemove={() => actions.deleteProduct(product)}
      // Окна подсказок встают на продукт, который есть дома и не в покупках: у него плюс,
      // о котором и говорит подсказка. Остальные помечены своим id — для советов про
      // конкретный продукт («давно закончилось»).
      coach={ghost ? undefined : stock === 'in' && !toBuy ? 'product' : `item-${product.id}`}
    />
  )
})
