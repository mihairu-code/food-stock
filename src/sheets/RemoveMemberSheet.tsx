import { useSession } from '@/app/session'
import { useRemoveMember } from '@/data/hooks'
import type { Member } from '@/domain/types'
import { useT } from '@/i18n'
import { memberLabel } from '@/lib/memberText'
import { ConfirmSheet } from './ConfirmSheet'

export function RemoveMemberSheet({ member }: { member: Member }) {
  const t = useT()
  const { household } = useSession()
  const removeMember = useRemoveMember()
  return (
    <ConfirmSheet
      title={t('confirm.removeMemberTitle')}
      description={t('confirm.removeMemberText', { name: memberLabel(member, t), home: household.name })}
      confirmLabel={t('common.delete')}
      onConfirm={() => removeMember.mutate(member.user_id)}
    />
  )
}
