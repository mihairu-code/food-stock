import { AppIconTiles } from '@/features/choose-app-icon'
import { useT } from '@/shared/i18n'
import { isStandalone } from '@/shared/lib/device'
import { RowText } from '@/shared/ui'

/**
 * Строка настроек с выбором иконки приложения. Есть только в браузере: иконку берут
 * в момент установки, а установленное приложение сменить её не может (решение 0021).
 */
export function AppIconPicker() {
  const t = useT()
  if (isStandalone()) return null

  return (
    <div className="setting-row app-icon-row">
      <RowText title={t('settings.appIcon')} meta={t('settings.appIconMeta')} titleId="app-icon-label" />
      <AppIconTiles labelledBy="app-icon-label" />
    </div>
  )
}
