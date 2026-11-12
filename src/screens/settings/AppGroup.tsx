import { useState } from 'react'
import { SettingSelect, SettingsGroup } from '@/components'
import { LANG_NAMES, LANGS, setLangSetting, useLang, useT, type LangSetting } from '@/i18n'
import { readTheme, setTheme, type ThemeSetting } from '@/lib/theme'

/** Приложение: язык и тема. Выбор хранится на устройстве, а не в доме. */
export function AppGroup() {
  const t = useT()
  const { setting } = useLang()
  const [theme, setThemeState] = useState(readTheme)

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
        onChange={(value) => {
          setTheme(value as ThemeSetting)
          setThemeState(value as ThemeSetting)
        }}
      >
        <option value="auto">{t('settings.themeAuto')}</option>
        <option value="light">{t('settings.themeLight')}</option>
        <option value="dark">{t('settings.themeDark')}</option>
      </SettingSelect>
    </SettingsGroup>
  )
}
