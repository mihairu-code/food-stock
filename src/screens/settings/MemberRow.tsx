import { X } from 'lucide-react'
import { useSession } from '@/app/session'
import { SettingRow } from '@/components'
import type { Member } from '@/domain/types'
import { useT } from '@/i18n'
import { memberIdentity, memberLabel } from '@/lib/memberText'
import { openSheet } from '@/sheets'
import { MemberAvatar } from './MemberAvatar'

export function MemberRow({ member, removable }: { member: Member; removable: boolean }) {
  const t = useT()
  const { user } = useSession()
  const label = memberLabel(member, t)

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
            onClick={() => openSheet({ type: 'remove-member', member })}
          >
            <X size={18} />
          </button>
        )
      }
    />
  )
}
