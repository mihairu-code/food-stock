import { useState } from 'react'
import { Sheet } from './Sheet'

/** Только что созданная ссылка-приглашение: поделиться или скопировать. Второй раз её не показать. */
export function InviteLinkSheet({ link, onClose }: { link: string; onClose: () => void }) {
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
      await navigator.share({ title: 'Домашние запасы', url: link })
    } catch {
      // пользователь закрыл системное окно — это не ошибка
    }
  }

  return (
    <Sheet
      title="Ссылка-приглашение"
      description="Отправьте её тому, кого зовёте в дом. Сработает один раз и действует 7 дней."
      onClose={onClose}
    >
      <label className="field">
        <span>Ссылка</span>
        <input value={link} readOnly onFocus={(event) => event.target.select()} />
      </label>
      <p className="sheet-description">
        Если у человека приложение уже стоит на экране «Домой», пусть вставит ссылку в нём: Настройки →
        «Присоединиться по ссылке».
      </p>
      <div className="sheet-actions">
        <button className="btn subtle" type="button" onClick={() => void copy()}>
          {copied ? 'Скопировано' : 'Скопировать'}
        </button>
        {canShare ? (
          <button className="btn" type="button" onClick={() => void share()}>
            Поделиться
          </button>
        ) : (
          <button className="btn" type="button" onClick={onClose}>
            Готово
          </button>
        )}
      </div>
    </Sheet>
  )
}
