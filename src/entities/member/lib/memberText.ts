import type { Member } from '@/shared/api'
import type { Translate } from '@/shared/i18n'
import { localizeDevice } from '@/shared/lib/device'

const roleLabel = (member: Member, t: Translate) => t(member.role === 'owner' ? 'role.owner' : 'role.member')

/** Имя участника, а если он его не задал — роль. */
export const memberLabel = (member: Member, t: Translate) => member.display_name || roleLabel(member, t)

/** Что отличает участника от остальных: почта аккаунта или, без аккаунта, его устройство. */
export const memberIdentity = (member: Member, t: Translate) =>
  [roleLabel(member, t), member.account_email ?? localizeDevice(member.device, t)].filter(Boolean).join(' · ')

/** Первая буква имени для аватара. */
export const memberInitial = (member: Member) => member.display_name.charAt(0).toUpperCase()
