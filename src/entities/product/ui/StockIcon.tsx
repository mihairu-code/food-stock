/** Иконка продукта с точкой наличия в углу. Цвет точки задаёт строка (`data-missing`). */
export function StockIcon({ icon }: { icon: string | null }) {
  return (
    <span className="stock">
      <span className="emoji" aria-hidden="true">{icon || '🛍️'}</span>
      <span className="stock-dot" aria-hidden="true" />
    </span>
  )
}
