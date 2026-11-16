import { X } from 'lucide-react'
import { MemberAvatar, memberIdentity, memberLabel, useRemoveMember } from '@/entities/member'
import type { Member } from '@/shared/api'
import { useT } from '@/shared/i18n'
import { useSession } from '@/shared/session'
import { openSheet, SettingRow } from '@/shared/ui'

export function MemberRow({ member, removable }: { member: Member; removable: boolean }) {
  const t = useT()
  const { user, household } = useSession()
  const removeMember = useRemoveMember()
  const label = memberLabel(member, t)

  function confirmRemoval() {
    openSheet({
      type: 'confirm',
      title: t('confirm.removeMemberTitle'),
      description: t('confirm.removeMemberText', { name: label, home: household.name }),
      confirmLabel: t('common.delete'),
      onConfirm: () => removeMember.mutate(member.user_id),
    })
  }

  return (
    <SettingRow
      leading={<MemberAvatar member={member} />}
      title={member.user_id === user.id ? `${label} ${t('settings.you')}` : label}
      meta={memberIdentity(member, t)}
      trailing={
        removable && (
          <button
            className="icon-btn"
            type="button"
            aria-label={t('settings.removeMemberAria', { name: label })}
            onClick={confirmRemoval}
          >
            <X size={18} />
          </button>
        )
      }
    />
  )
}
