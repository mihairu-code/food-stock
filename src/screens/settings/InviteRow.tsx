import { X } from 'lucide-react'
import { SettingRow } from '@/components'
import { useRevokeInvite } from '@/data/hooks'
import type { Invite } from '@/domain/types'
import { useLang, useT } from '@/i18n'

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
