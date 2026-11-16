import { queryOptions } from '@tanstack/react-query'
import { backend } from './currentBackend'
import { queryClient } from './queryClient'
import { qk } from './queryKeys'

/* Описания запросов: одно и то же описание используют хуки и предзагрузка. */

export const membershipsQuery = queryOptions({
  queryKey: qk.memberships,
  queryFn: () => backend.listMemberships(),
})

export const sectionsQuery = (hid: string) =>
  queryOptions({ queryKey: qk.sections(hid), queryFn: () => backend.listSections(hid) })

export const productsQuery = (hid: string) =>
  queryOptions({ queryKey: qk.products(hid), queryFn: () => backend.listProducts(hid) })

export const shoppingItemsQuery = (hid: string) =>
  queryOptions({ queryKey: qk.shoppingItems(hid), queryFn: () => backend.listShoppingItems(hid) })

export const membersQuery = (hid: string) =>
  queryOptions({ queryKey: qk.members(hid), queryFn: () => backend.listMembers(hid) })

export const invitesQuery = (hid: string) =>
  queryOptions({ queryKey: qk.invites(hid), queryFn: () => backend.listInvites(hid) })

/**
 * Запрашивает всё, что нужно первому экрану, не дожидаясь списка домов: какой дом
 * откроется, известно с прошлого запуска. Запросы уходят одним залпом, а не цепочкой.
 */
export function prefetchHome(hid: string): void {
  void queryClient.prefetchQuery(sectionsQuery(hid))
  void queryClient.prefetchQuery(productsQuery(hid))
  void queryClient.prefetchQuery(shoppingItemsQuery(hid))
  void queryClient.prefetchQuery(membersQuery(hid))
}
