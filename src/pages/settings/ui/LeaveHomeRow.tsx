import { useLeaveHousehold } from '@/entities/household'
import { memberLabel, nextOwner, useMembers } from '@/entities/member'
import { useT } from '@/shared/i18n'
import { useSession } from '@/shared/session'
import { openSheet, SettingRow } from '@/shared/ui'

/**
 * «Покинуть дом» (решение 0022). Единственному участнику строка не видна: уходить ему
 * некуда, дом бы просто удалился вместе с продуктами.
 */
export function LeaveHomeRow() {
  const t = useT()
  const { user, household } = useSession()
  const members = useMembers().data ?? []
  const leave = useLeaveHousehold()

  if (members.length < 2) return null

  function confirmLeave() {
    const heir = nextOwner(members, user.id)
    openSheet({
      type: 'confirm',
      title: t('confirm.leaveTitle', { home: household.name }),
      description: [
        t('confirm.leaveText'),
        heir ? t('confirm.leaveOwner', { name: memberLabel(heir, t) }) : '',
      ]
        .filter(Boolean)
        .join(' '),
      confirmLabel: t('confirm.leave'),
      onConfirm: () => leave.mutate(),
    })
  }

  return (
    <SettingRow
      danger
      title={t('settings.leaveHome')}
      meta={t('settings.leaveHomeMeta')}
      disabled={leave.isPending}
      onClick={confirmLeave}
    />
  )
}
