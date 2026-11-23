import { StockDotSamples } from '@/entities/product'
import { LANG_NAMES, LANGS, setLangSetting, useLang, useT, type LangSetting, type MessageKey } from '@/shared/i18n'
import {
  DOT_PLACES,
  setColorSafe,
  setDotPlace,
  setMinimal,
  setTheme,
  useAppearance,
  type DotPlace,
  type ThemeSetting,
} from '@/shared/lib/appearance'
import { setHintsVisible } from '@/shared/lib/hints/hints'
import { useHintsVisible } from '@/shared/lib/hints/useHintsVisible'
import { SettingSelect, SettingsGroup, SettingToggle } from '@/shared/ui'
import { AccentPicker } from './AccentPicker'
import { AppIconPicker } from './AppIconPicker'

const DOT_PLACE_LABELS: Record<DotPlace, MessageKey> = {
  'icon-right': 'settings.dotPlaceIconRight',
  'icon-left': 'settings.dotPlaceIconLeft',
  'after-name': 'settings.dotPlaceAfterName',
}

/** Приложение: язык, оформление, точки наличия, иконка и подсказки. Выбор хранится на устройстве, а не в доме. */
export function AppGroup() {
  const t = useT()
  const { setting } = useLang()
  const { theme, colorSafe, dotPlace, minimal } = useAppearance()
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
        id="color-safe"
        title={t('settings.colorSafe')}
        meta={
          <>
            {t('settings.colorSafeMeta')}
            <StockDotSamples />
          </>
        }
        checked={colorSafe}
        onChange={setColorSafe}
      />
      <SettingSelect
        id="dot-place"
        title={t('settings.dotPlace')}
        value={dotPlace}
        onChange={(value) => setDotPlace(value as DotPlace)}
      >
        {DOT_PLACES.map((place) => (
          <option key={place} value={place}>
            {t(DOT_PLACE_LABELS[place])}
          </option>
        ))}
      </SettingSelect>
      <SettingToggle
        id="minimal"
        title={t('settings.minimal')}
        meta={t('settings.minimalMeta')}
        checked={minimal}
        onChange={setMinimal}
      />
      <AppIconPicker />
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
