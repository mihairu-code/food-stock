import { useT } from '@/shared/i18n'
import { resetCoachSeen } from '@/shared/lib/coach/coach'
import { resetFirstSteps } from '@/shared/lib/coach/firstSteps'
import { setTipsEnabled, useTipsEnabled } from '@/shared/lib/coach/tips'
import { setHintsVisible } from '@/shared/lib/hints/hints'
import { useHintsVisible } from '@/shared/lib/hints/useHintsVisible'
import { notify } from '@/shared/lib/toast'
import { SettingRow, SettingsGroup, SettingToggle } from '@/shared/ui'

/**
 * Подсказки и советы. Переключателей два: у них разное время жизни — подсказки нужны
 * первые дни, советы потом. «Показать заново» одна на оба и включает оба: иначе после
 * трёх дней подсказки, стёртые как непоказанные, всё равно бы не появились.
 */
export function CoachGroup() {
  const t = useT()
  const hints = useHintsVisible()
  const tips = useTipsEnabled()

  function showAgain() {
    resetCoachSeen()
    resetFirstSteps()
    setHintsVisible(true)
    setTipsEnabled(true)
    notify('toast.coachReset')
  }

  return (
    <SettingsGroup label={t('settings.groupCoach')}>
      <SettingToggle
        id="hints"
        title={t('settings.hints')}
        meta={t('settings.hintsMeta')}
        checked={hints}
        onChange={setHintsVisible}
      />
      <SettingToggle id="tips" title={t('settings.tips')} meta={t('settings.tipsMeta')} checked={tips} onChange={setTipsEnabled} />
      <SettingRow title={t('settings.coachReset')} onClick={showAgain} />
    </SettingsGroup>
  )
}
