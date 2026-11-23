import { useT } from '@/shared/i18n'
import { setAppIcon, useAppearance } from '@/shared/lib/appearance'
import { APP_ICONS } from '@/shared/lib/appIcons'

/**
 * Плитки с иконками приложения. Выбор подставляется в ссылки страницы, и браузер берёт
 * его при установке: iPhone — при «На экран „Домой“», остальные — из манифеста.
 * Сменить иконку уже установленного приложения веб не может, поэтому плитки показываются
 * только в браузере (решение 0021).
 */
export function AppIconTiles({ labelledBy }: { labelledBy: string }) {
  const t = useT()
  const { icon } = useAppearance()

  return (
    <div className="app-icons" role="radiogroup" aria-labelledby={labelledBy}>
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
  )
}
