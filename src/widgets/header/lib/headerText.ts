import { memberInitial } from '@/entities/member'
import type { Member } from '@/shared/api'
import type { MessageKey } from '@/shared/i18n'

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
