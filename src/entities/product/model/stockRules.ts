import type { Product, ProductState } from '@/shared/api'

/**
 * Что показывает точка на иконке продукта. Состояние выводится из двух отметок
 * (решение 0006), отдельного поля для него нет.
 * - in — есть дома и не в покупках;
 * - low — ещё есть дома, но лежит в покупках: «по желанию», почти всегда «заканчивается»;
 * - out — закончилось, в покупках он или нет.
 * Слово «мало» в интерфейсе не используем: плюс жмут и про запас, и для конкретного блюда.
 */
export type StockState = 'in' | 'low' | 'out'

export function stockState(product: ProductState): StockState {
  if (!product.is_available) return 'out'
  return product.to_buy ? 'low' : 'in'
}

/**
 * Наличие поменяли вручную. Закончившийся постоянный продукт сам попадает в покупки;
 * продукт, который снова дома, из покупок уходит. То же правило для прежних версий
 * приложения держит триггер products_sync_to_buy.
 */
export function withAvailability(product: Product, available: boolean): ProductState {
  if (available) return { is_available: true, to_buy: false }
  return { is_available: false, to_buy: product.kind === 'staple' ? true : product.to_buy }
}

/** Продукт положили в покупки или убрали из них; наличие при этом не меняется. */
export function withToBuy(product: Product, toBuy: boolean): ProductState {
  return { is_available: product.is_available, to_buy: toBuy }
}

/** Продукт из списка покупок куплен: он дома, покупать больше не нужно. */
export const PURCHASED: ProductState = { is_available: true, to_buy: false }
