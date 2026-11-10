/**
 * Билет слияния переживает уход на страницу Google: до входа им помечается
 * анонимный пользователь устройства, после входа он вливается в аккаунт.
 */
const KEY = 'home-stock:merge-ticket'

export interface MergeTicket {
  token: string
  /** Анонимный пользователь, для которого билет выдан. */
  userId: string
}

export function readMergeTicket(): MergeTicket | null {
  try {
    const ticket = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<MergeTicket> | null
    return ticket?.token && ticket.userId ? { token: ticket.token, userId: ticket.userId } : null
  } catch {
    return null
  }
}

export function saveMergeTicket(ticket: MergeTicket): void {
  localStorage.setItem(KEY, JSON.stringify(ticket))
}

export function clearMergeTicket(): void {
  localStorage.removeItem(KEY)
}
