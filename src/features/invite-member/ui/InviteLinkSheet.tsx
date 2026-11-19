import { useT } from '@/shared/i18n'
import { copyLink } from '@/shared/lib/copyLink'
import { Sheet, SheetActions, TextField } from '@/shared/ui'

/** Только что созданная ссылка-приглашение: поделиться или скопировать. Второй раз её не показать. */
export function InviteLinkSheet({ link }: { link: string }) {
  const t = useT()
  const canShare = typeof navigator.share === 'function'

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
        <button className="btn" type="button" data-autofocus onClick={() => void (canShare ? shareLink() : copyLink(link))}>
          {t(canShare ? 'invite.share' : 'invite.copy')}
        </button>
      </SheetActions>
      {canShare && (
        <button className="btn danger-text link-copy" type="button" onClick={() => void copyLink(link)}>
          {t('invite.copyLink')}
        </button>
      )}
    </Sheet>
  )
}
