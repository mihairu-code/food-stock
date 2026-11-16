import type { Product, ProductState } from '@/shared/api'

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
