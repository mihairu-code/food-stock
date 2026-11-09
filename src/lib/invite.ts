/** Ссылка-приглашение: https://приложение/#join=<32 hex>. Токен в якоре не уходит на сервер хостинга. */

const NAME_KEY = 'home-stock:name'

export function inviteLink(token: string): string {
  return `${window.location.origin}/#join=${token}`
}

/** Достаёт токен из вставленной ссылки или из самого токена. */
export function parseInviteToken(text: string): string | null {
  const match = text.match(/join=([0-9a-f]{32})(?![0-9a-f])/i) ?? text.trim().match(/^([0-9a-f]{32})$/i)
  return match ? match[1].toLowerCase() : null
}

export function readInviteToken(): string | null {
  return parseInviteToken(window.location.hash)
}

/** Убирает токен из адреса, чтобы он не остался в истории и не сработал повторно. */
export function clearInviteToken(): void {
  if (window.location.hash.includes('join=')) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}

/** Имя пользователя помнится на устройстве, чтобы подставлять его в новые дома. */
export function savedName(): string {
  return localStorage.getItem(NAME_KEY) ?? ''
}

export function saveName(name: string): void {
  localStorage.setItem(NAME_KEY, name)
}
