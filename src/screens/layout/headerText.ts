import type { Member } from '@/domain/types'
import type { MessageKey } from '@/i18n'
import { memberInitial } from '@/lib/memberText'

/** Заголовок экрана по адресу. */
export function titleKey(pathname: string): MessageKey {
  if (pathname.startsWith('/shopping')) return 'nav.shopping'
  if (pathname.startsWith('/settings')) return 'nav.settings'
  return 'title.home'
}

/** Инициалы первых двух участников с именами — «А+М». */
export function memberInitials(members: Member[]): string {
  return members
    .filter((member) => member.display_name)
    .slice(0, 2)
    .map(memberInitial)
    .filter(Boolean)
    .join('+')
}
