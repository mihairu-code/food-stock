import { useT } from '@/shared/i18n'
import { setTipsEnabled, useTipsEnabled } from '@/shared/lib/coach/tips'
import { restartTour } from '@/shared/lib/coach/tour'
import { notify } from '@/shared/lib/toast'
import { SettingRow, SettingsGroup, SettingToggle } from '@/shared/ui'

/**
 * Обучение и советы. Обучение проходят все, один раз, поэтому переключателя у него нет —
 * только «Пройти обучение заново». Советы (по функциям и по привычкам) можно выключить.
 */
export function CoachGroup() {
  const t = useT()
  const tips = useTipsEnabled()

  function startAgain() {
    restartTour()
    notify('toast.coachReset')
  }

  return (
    <SettingsGroup label={t('settings.groupCoach')}>
      <SettingToggle id="tips" title={t('settings.tips')} meta={t('settings.tipsMeta')} checked={tips} onChange={setTipsEnabled} />
      <SettingRow title={t('settings.coachReset')} onClick={startAgain} />
    </SettingsGroup>
  )
}
