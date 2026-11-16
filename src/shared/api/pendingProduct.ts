/**
 * Продукт, только что перенесённый из покупок, до ответа сервера живёт под временным
 * идентификатором: настоящий выдаёт сервер. Такую строку пока нельзя трогать.
 */
const PENDING_PREFIX = 'pending:'

export const pendingProductId = (shoppingItemId: string): string => `${PENDING_PREFIX}${shoppingItemId}`

export const isPendingProduct = (productId: string): boolean => productId.startsWith(PENDING_PREFIX)
