import { useT } from '@/i18n'

/** «Держать дома постоянно»: постоянный продукт, закончившись, сам попадает в покупки. */
export function StapleCheckbox({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  const t = useT()
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>
        {t('product.keep')}
        <small>{t('product.keepHint')}</small>
      </span>
    </label>
  )
}
