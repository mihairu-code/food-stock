import { useState } from 'react'
import { useT } from '@/i18n'
import { Sheet } from './Sheet'

/** Только что созданная ссылка-приглашение: поделиться или скопировать. Второй раз её не показать. */
export function InviteLinkSheet({ link, onClose }: { link: string; onClose: () => void }) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator.share === 'function'

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      // буфер обмена недоступен — ссылку можно выделить в поле
    }
  }

  async function share() {
    try {
      await navigator.share({ title: t('invite.shareTitle'), url: link })
    } catch {
      // пользователь закрыл системное окно — это не ошибка
    }
  }

  return (
    <Sheet
      title={t('invite.title')}
      description={t('invite.sheetText')}
      onClose={onClose}
    >
      <label className="field">
        <span>{t('invite.link')}</span>
        <input value={link} readOnly onFocus={(event) => event.target.select()} />
      </label>
      <p className="sheet-description">{t('invite.pwaNote')}</p>
      <div className="sheet-actions">
        <button className="btn subtle" type="button" onClick={() => void copy()}>
          {t(copied ? 'toast.copied' : 'invite.copy')}
        </button>
        {canShare ? (
          <button className="btn" type="button" onClick={() => void share()}>
            {t('invite.share')}
          </button>
        ) : (
          <button className="btn" type="button" onClick={onClose}>
            {t('common.done')}
          </button>
        )}
      </div>
    </Sheet>
  )
}
