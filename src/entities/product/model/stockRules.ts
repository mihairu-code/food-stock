import type { ProductState } from '@/shared/api'

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
 * Наличие поменяли вручную. Закончившийся продукт сам попадает в покупки, а продукт,
 * который снова дома, из покупок уходит. Тип продукта не важен: разовых продуктов
 * больше нет (решение 0020). У прежних версий приложения это же правило для постоянных
 * продуктов держит триггер products_sync_to_buy.
 */
export function withAvailability(available: boolean): ProductState {
  return { is_available: available, to_buy: !available }
}

/** Продукт положили в покупки или убрали из них; наличие при этом не меняется. */
export function withToBuy(product: ProductState, toBuy: boolean): ProductState {
  return { is_available: product.is_available, to_buy: toBuy }
}

/** Продукт из списка покупок куплен: он дома, покупать больше не нужно. */
export const PURCHASED: ProductState = { is_available: true, to_buy: false }
