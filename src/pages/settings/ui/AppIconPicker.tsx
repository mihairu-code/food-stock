import { useT } from '@/shared/i18n'
import { setAppIcon, useAppearance } from '@/shared/lib/appearance'
import { APP_ICONS } from '@/shared/lib/appIcons'

/**
 * Строка настроек с выбором иконки приложения: плитки с самими иконками.
 * Новая иконка видна только после повторного добавления на экран «Домой».
 */
export function AppIconPicker() {
  const t = useT()
  const { icon } = useAppearance()

  return (
    <div className="setting-row app-icon-row">
      <div className="row-text">
        <div className="row-name" id="app-icon-label">
          {t('settings.appIcon')}
        </div>
        <div className="row-meta">{t('settings.appIconMeta')}</div>
      </div>
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
    </div>
  )
}
