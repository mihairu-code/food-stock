import { useSession } from '@/app/session'
import { SettingRow, SettingsGroup } from '@/components'
import { useCreateInvite, useInvites, useMembers } from '@/data/hooks'
import { useT } from '@/i18n'
import { inviteLink } from '@/lib/invite'
import { openSheet } from '@/sheets'
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
              onSuccess: (token) => openSheet({ type: 'invite-link', link: inviteLink(token) }),
            })
          }
        />
      )}
    </SettingsGroup>
  )
}
