import { X } from 'lucide-react'
import { memberIdentity, memberLabel } from '@/entities/member/lib/memberText'
import { MemberAvatar } from '@/entities/member/ui/MemberAvatar'
import type { Member } from '@/shared/api/types'
import { useT } from '@/shared/i18n'
import { useSession } from '@/shared/session/session'
import { SettingRow } from '@/shared/ui/SettingRow'
import { openSheet } from '@/shared/ui/sheet/sheetStore'

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
