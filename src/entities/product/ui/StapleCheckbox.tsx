import { useT } from '@/shared/i18n'

/**
 * «Держать дома всегда»: постоянный продукт, закончившись, сам попадает в покупки.
 *
 * Галочку переключает сам браузер — и нажатием на квадрат, и нажатием на подпись.
 * Подпись лишь не даёт фокусу уйти с поля названия: иначе на телефоне прячется
 * клавиатура, а шторка прыгает.
 */
export function StapleCheckbox({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const t = useT()
  return (
    <label className="check" onMouseDown={(event) => event.preventDefault()}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>
        {t('product.keep')}
        <small>{t('product.keepHint')}</small>
      </span>
    </label>
  )
}
