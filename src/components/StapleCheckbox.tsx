import { useT } from '@/i18n'

/**
 * «Держать дома всегда»: постоянный продукт, закончившись, сам попадает в покупки.
 *
 * Галочку переключает сама подпись, а не браузер: обычное нажатие на подпись переводит
 * фокус на галочку, поле названия теряет его — и на телефоне прячется клавиатура,
 * а шторка прыгает. Здесь фокус остаётся там, где был.
 */
export function StapleCheckbox({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const t = useT()
  return (
    <label
      className="check"
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.preventDefault()
        onChange(!checked)
      }}
    >
      {/* Состояние меняет обработчик подписи; пробел с клавиатуры приходит туда же. */}
      <input type="checkbox" checked={checked} readOnly />
      <span>
        {t('product.keep')}
        <small>{t('product.keepHint')}</small>
      </span>
    </label>
  )
}
