import { queryOptions } from '@tanstack/react-query'
import { backend } from '@/data'
import { qk } from './keys'

/* Описания запросов: одно и то же описание используют хуки и код вне компонентов. */

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
