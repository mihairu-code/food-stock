import { useT } from '@/shared/i18n'
import { notify } from '@/shared/lib/toast'
import { TextField } from '@/shared/ui/TextField'
import { Sheet } from '@/shared/ui/sheet/Sheet'
import { closeSheet } from '@/shared/ui/sheet/sheetStore'

/** Только что созданная ссылка-приглашение: поделиться или скопировать. Второй раз её не показать. */
export function InviteLinkSheet({ link }: { link: string }) {
  const t = useT()
  const canShare = typeof navigator.share === 'function'

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      notify('toast.copied')
    } catch {
      notify('toast.copyError')
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
    <Sheet title={t('invite.title')} description={t('invite.sheetText')}>
      <TextField
        id="invite-link"
        label={t('invite.link')}
        value={link}
        onFocus={(event) => event.target.select()}
      />
      <p className="sheet-description">{t('invite.pwaNote')}</p>
      <div className="sheet-actions">
        <button className="btn subtle" type="button" onClick={closeSheet}>
          {t('common.done')}
        </button>
        <button className="btn" type="button" autoFocus onClick={() => void (canShare ? share() : copy())}>
          {t(canShare ? 'invite.share' : 'invite.copy')}
        </button>
      </div>
      {canShare && (
        <button className="btn danger-text link-copy" type="button" onClick={() => void copy()}>
          {t('invite.copyLink')}
        </button>
      )}
    </Sheet>
  )
}
