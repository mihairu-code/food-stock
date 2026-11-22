/** Иконка продукта с точкой наличия в углу. Цвет и форму точки задаёт `data-stock` строки. */
export function ProductStockIcon({ icon }: { icon: string | null }) {
  return (
    <span className="stock">
      <span className="emoji" aria-hidden="true">{icon || '🛍️'}</span>
      <span className="stock-dot" aria-hidden="true" />
    </span>
  )
}
