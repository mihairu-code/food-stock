import { useCreateInvite, useInvites, useMembers } from '@/entities/household/api/householdApi'
import { inviteLink } from '@/entities/invite/lib/inviteToken'
import { useT } from '@/shared/i18n'
import { useSession } from '@/shared/session/session'
import { SettingRow } from '@/shared/ui/SettingRow'
import { SettingsGroup } from '@/shared/ui/SettingsGroup'
import { openSheet } from '@/shared/ui/sheet/sheetStore'
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
