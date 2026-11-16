import { useT } from '@/shared/i18n'
import { ACCENTS, setAccent, useAppearance } from '@/shared/lib/appearance'

/** Строка настроек с выбором акцентного цвета: ряд кружков, каждый — своего оттенка. */
export function AccentPicker() {
  const t = useT()
  const { accent } = useAppearance()

  return (
    <div className="setting-row accent-row">
      <div className="row-text">
        <div className="row-name" id="accent-label">
          {t('settings.accent')}
        </div>
      </div>
      <div className="swatches" role="radiogroup" aria-labelledby="accent-label">
        {ACCENTS.map((option) => (
          <button
            key={option}
            className="swatch"
            type="button"
            role="radio"
            data-accent={option}
            aria-checked={option === accent}
            aria-label={t(`accent.${option}`)}
            onClick={() => setAccent(option)}
          />
        ))}
      </div>
    </div>
  )
}
