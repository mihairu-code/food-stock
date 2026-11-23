/* Данные приложения: контракт хранилища, его реализации, кэш запросов и типы записей. */
export type {
  Backend,
  DataChange,
  HomeTable,
  HouseholdPatch,
  NewProduct,
  NewSection,
  NewShoppingItem,
  ProductPatch,
  SectionPatch,
  ShoppingItemPatch,
} from './backend'
export { backend } from './currentBackend'
export {
  placeProducts,
  placeSections,
  placeShopping,
  withState,
  type HomeData,
  type ProductState,
} from './homeDataRules'
export { invitesQuery, membersQuery, membershipsQuery, prefetchHome } from './homeQueries'
export { isPendingProduct, pendingProductId } from './pendingProduct'
export { removeWithUndo, type RemovalKind } from './pendingRemovals'
export { queryClient } from './queryClient'
export { qk } from './queryKeys'
export { dropSnapshot, openSnapshot } from './snapshot'
export type * from './types'
export { NEW_PRODUCT_KIND } from './types'
export { useAction } from './useAction'
export { useHomeData } from './useHomeData'
export { useHomeMutation, type CachePatch } from './useHomeMutation'
