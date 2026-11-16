import { X } from 'lucide-react'
import { useRevokeInvite } from '@/entities/invite'
import type { Invite } from '@/shared/api'
import { useLang, useT } from '@/shared/i18n'
import { SettingRow } from '@/shared/ui'

/** Действующая ссылка-приглашение: до какого числа работает и кнопка отзыва. */
export function InviteRow({ invite, revocable }: { invite: Invite; revocable: boolean }) {
  const t = useT()
  const { lang } = useLang()
  const revoke = useRevokeInvite()
  const date = new Date(invite.expires_at).toLocaleDateString(lang, { day: 'numeric', month: 'long' })

  return (
    <SettingRow
      leading={<span className="avatar small pending" aria-hidden="true">🔗</span>}
      title={t('invite.title')}
      meta={t('invite.rowMeta', { date })}
      trailing={
        revocable && (
          <button
            className="icon-btn"
            type="button"
            aria-label={t('invite.revokeAria', { date })}
            onClick={() => revoke.mutate(invite.id)}
          >
            <X size={18} />
          </button>
        )
      }
    />
  )
}
