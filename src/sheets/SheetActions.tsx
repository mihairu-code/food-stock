import { useT } from '@/i18n'
import { closeSheet } from './sheetStore'

/** Кнопки внизу формы в шторке: «Отмена» и отправка формы. */
export function SheetActions({ submitLabel, disabled }: { submitLabel: string; disabled?: boolean }) {
  const t = useT()
  return (
    <div className="sheet-actions">
      <button className="btn subtle" type="button" onClick={closeSheet}>
        {t('common.cancel')}
      </button>
      <button className="btn" type="submit" disabled={disabled}>
        {submitLabel}
      </button>
    </div>
  )
}
