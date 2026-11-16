import { useT } from '@/shared/i18n'
import { notify } from '@/shared/lib/toast'
import { Sheet, SheetActions, TextField } from '@/shared/ui'

/** Только что созданная ссылка-приглашение: поделиться или скопировать. Второй раз её не показать. */
export function InviteLinkSheet({ link }: { link: string }) {
  const t = useT()
  const canShare = typeof navigator.share === 'function'

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      notify('toast.copied')
    } catch {
      notify('toast.copyError')
    }
  }

  async function shareLink() {
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
      <SheetActions closeLabel={t('common.done')}>
        <button className="btn" type="button" autoFocus onClick={() => void (canShare ? shareLink() : copyLink())}>
          {t(canShare ? 'invite.share' : 'invite.copy')}
        </button>
      </SheetActions>
      {canShare && (
        <button className="btn danger-text link-copy" type="button" onClick={() => void copyLink()}>
          {t('invite.copyLink')}
        </button>
      )}
    </Sheet>
  )
}
