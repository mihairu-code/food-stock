import { inviteLink, useCreateInvite, useInvites } from '@/entities/invite'
import { useMembers } from '@/entities/member'
import { useT } from '@/shared/i18n'
import { markFirstStep } from '@/shared/lib/coach/firstSteps'
import { useSession } from '@/shared/session'
import { openSheet, SettingRow, SettingsGroup } from '@/shared/ui'
import { InviteRow } from './InviteRow'
import { MemberRow } from './MemberRow'

/** Участники дома и действующие ссылки-приглашения; приглашает и удаляет владелец. */
export function MembersGroup() {
  const t = useT()
  const { role } = useSession()
  const members = useMembers().data ?? []
  const invites = useInvites().data ?? []
  const createInvite = useCreateInvite()
  const isOwner = role === 'owner'

  return (
    <SettingsGroup label={t('settings.groupMembers')}>
      {members.map((member) => (
        <MemberRow key={member.user_id} member={member} removable={isOwner && member.role !== 'owner'} />
      ))}
      {invites.map((invite) => (
        <InviteRow key={invite.id} invite={invite} revocable={isOwner} />
      ))}
      {isOwner && (
        <SettingRow
          title={t('invite.create')}
          meta={t('invite.createMeta')}
          disabled={createInvite.isPending}
          onClick={() =>
            createInvite.mutate(undefined, {
              onSuccess: (token) => {
                markFirstStep('invited')
                openSheet({ type: 'invite-link', link: inviteLink(token) })
              },
            })
          }
        />
      )}
    </SettingsGroup>
  )
}
