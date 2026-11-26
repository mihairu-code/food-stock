/** Ссылка-приглашение: https://приложение/#join=<32 hex>. Токен в якоре не уходит на сервер хостинга. */

const PENDING_INVITE_KEY = 'home-stock:pending-invite'

export function inviteLink(token: string): string {
  return `${window.location.origin}/#join=${token}`
}

/** Достаёт токен из вставленной ссылки или из самого токена. */
export function parseInviteToken(text: string): string | null {
  const match = text.match(/join=([0-9a-f]{32})(?![0-9a-f])/i) ?? text.trim().match(/^([0-9a-f]{32})$/i)
  return match ? match[1].toLowerCase() : null
}

/**
 * Токен приглашения: из адреса или отложенный перед уходом на страницу Google
 * (после возврата якоря в адресе уже нет).
 */
export function readInviteToken(): string | null {
  return parseInviteToken(window.location.hash) ?? readPendingToken()
}

function readPendingToken(): string | null {
  try {
    return localStorage.getItem(PENDING_INVITE_KEY)
  } catch {
    return null
  }
}

export function rememberInviteToken(): void {
  const token = parseInviteToken(window.location.hash)
  if (!token) return
  try {
    localStorage.setItem(PENDING_INVITE_KEY, token)
  } catch {
    // хранилище недоступно — после входа через Google ссылку придётся открыть снова
  }
}

/** Убирает токен отовсюду, чтобы он не остался в истории и не сработал повторно. */
export function clearInviteToken(): void {
  try {
    localStorage.removeItem(PENDING_INVITE_KEY)
  } catch {
    // хранилище недоступно — там и нечего убирать
  }
  if (window.location.hash.includes('join=')) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}
