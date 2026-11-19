import { Link } from 'lucide-react'
import { useT } from '@/shared/i18n'
import { setAppIcon, useAppearance } from '@/shared/lib/appearance'
import { APP_ICONS } from '@/shared/lib/appIcons'
import { copyLink } from '@/shared/lib/copyLink'
import { RowText } from '@/shared/ui'

/**
 * Строка настроек с выбором иконки приложения: плитки с самими иконками.
 * Новая иконка видна только после повторного добавления на экран «Домой», а на iPhone
 * добавляют из Safari — поэтому рядом ссылка на приложение, чтобы вставить её в браузер.
 */
export function AppIconPicker() {
  const t = useT()
  const { icon } = useAppearance()

  return (
    <div className="setting-row app-icon-row">
      <RowText title={t('settings.appIcon')} meta={t('settings.appIconMeta')} titleId="app-icon-label" />
      <div className="app-icons" role="radiogroup" aria-labelledby="app-icon-label">
        {APP_ICONS.map((option) => (
          <button
            key={option}
            className="app-icon"
            type="button"
            role="radio"
            aria-checked={option === icon}
            aria-label={t(`appIcon.${option}`)}
            onClick={() => setAppIcon(option)}
          >
            <img src={`/icons/${option}.svg`} alt="" draggable={false} />
          </button>
        ))}
      </div>
      <button className="btn subtle small app-link-copy" type="button" onClick={() => void copyLink(location.origin)}>
        <Link size={16} aria-hidden="true" />
        {t('settings.copyAppLink')}
      </button>
    </div>
  )
}
