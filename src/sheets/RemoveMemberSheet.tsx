import { useRemoveMember } from '@/entities/household/api/householdApi'
import { memberLabel } from '@/entities/member/lib/memberText'
import type { Member } from '@/shared/api/types'
import { useT } from '@/shared/i18n'
import { useSession } from '@/shared/session/session'
import { ConfirmSheet } from '@/shared/ui/sheet/ConfirmSheet'

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
