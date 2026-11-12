import { TextField } from '@/components'
import { useT } from '@/i18n'
import { notify } from '@/lib/toast'
import { Sheet } from './Sheet'
import { closeSheet } from './sheetStore'

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
    <Sheet
      title={t('invite.title')}
      description={t('invite.sheetText')}
    >
      <TextField id="invite-link" label={t('invite.link')} value={link} onFocus={(event) => event.target.select()} />
      <p className="sheet-description">{t('invite.pwaNote')}</p>
      <div className="sheet-actions">
        <button className="btn subtle" type="button" onClick={() => void copy()}>
          {t('invite.copy')}
        </button>
        {canShare ? (
          <button className="btn" type="button" onClick={() => void share()}>
            {t('invite.share')}
          </button>
        ) : (
          <button className="btn" type="button" onClick={closeSheet}>
            {t('common.done')}
          </button>
        )}
      </div>
    </Sheet>
  )
}
