import type { ReactNode } from 'react'
import { useT } from '@/shared/i18n'
import { ListRow } from '@/shared/ui'

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
 * Общий вид строки покупок: та же строка, что на экране «Дом», только справа «Куплено»
 * вместо плюса, а удаление убирает из списка.
 */
export function ShoppingRow({ id, name, meta, icon, missing, ghost = false, onBuy, onRemove }: ShoppingRowProps) {
  const t = useT()
  return (
    <ListRow
      id={id}
      kind="entry"
      dragDescription={t('dnd.product')}
      icon={icon}
      name={name}
      meta={meta}
      missing={missing}
      ghost={ghost}
      toggle={{ label: t('shopping.boughtAria', { name }), icon: t('shopping.bought'), text: true, onClick: onBuy }}
      removeLabel={t('product.removeFromList', { name })}
      removeSwipeLabel={t('shopping.remove')}
      onRemove={onRemove}
    />
  )
}
