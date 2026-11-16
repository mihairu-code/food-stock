import { LANG_NAMES, LANGS, setLangSetting, useLang, useT, type LangSetting } from '@/shared/i18n'
import { setTheme, useAppearance, type ThemeSetting } from '@/shared/lib/appearance'
import { setHintsVisible } from '@/shared/lib/hints/hints'
import { useHintsVisible } from '@/shared/lib/hints/useHintsVisible'
import { SettingSelect, SettingsGroup, SettingToggle } from '@/shared/ui'
import { AccentPicker } from './AccentPicker'

/** Приложение: язык, оформление и подсказки. Выбор хранится на устройстве, а не в доме. */
export function AppGroup() {
  const t = useT()
  const { setting } = useLang()
  const { theme } = useAppearance()
  const hints = useHintsVisible()

  return (
    <SettingsGroup label={t('settings.groupApp')}>
      <SettingSelect
        id="language"
        title={t('settings.language')}
        value={setting}
        onChange={(value) => setLangSetting(value as LangSetting)}
      >
        <option value="auto">{t('settings.languageAuto')}</option>
        {LANGS.map((code) => (
          <option key={code} value={code} lang={code}>
            {LANG_NAMES[code]}
          </option>
        ))}
      </SettingSelect>
      <SettingSelect
        id="theme"
        title={t('settings.theme')}
        value={theme}
        onChange={(value) => setTheme(value as ThemeSetting)}
      >
        <option value="auto">{t('settings.themeAuto')}</option>
        <option value="light">{t('settings.themeLight')}</option>
        <option value="dark">{t('settings.themeDark')}</option>
      </SettingSelect>
      <AccentPicker />
      <SettingToggle
        id="hints"
        title={t('settings.hints')}
        meta={t('settings.hintsMeta')}
        checked={hints}
        onChange={setHintsVisible}
      />
    </SettingsGroup>
  )
}
