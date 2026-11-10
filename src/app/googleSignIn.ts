import { backend } from '@/data'
import { rememberInviteToken } from '@/lib/invite'
import { saveMergeTicket } from '@/lib/mergeTicket'

/**
 * Вход через Google с этого устройства. Билет помечает анонимного пользователя:
 * после входа всё, что он успел завести, перейдёт в аккаунт. Приглашение из адреса
 * должно пережить уход на страницу Google.
 */
export async function signInWithGoogle(anonymousUserId: string | null): Promise<void> {
  rememberInviteToken()
  if (anonymousUserId) saveMergeTicket({ token: await backend.createMergeTicket(), userId: anonymousUserId })
  await backend.signInWithGoogle()
}
