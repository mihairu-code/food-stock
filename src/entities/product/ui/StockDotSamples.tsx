import type { StockState } from '../model/stockRules'
import { ProductStockIcon } from './ProductStockIcon'

/* Порядок — как продукт проходит путь: есть, положили в покупки, закончился. */
const SAMPLE_STATES: StockState[] = ['in', 'low', 'out']
const SAMPLE_ICON = '🥛'

/**
 * Три точки наличия в текущем режиме — показывают, что изменит настройка «Различать
 * не только цветом». Скринридеру не нужны: состояние в списках он узнаёт из подписи.
 */
export function StockDotSamples() {
  return (
    <span className="stock-samples" aria-hidden="true">
      {SAMPLE_STATES.map((stock) => (
        <span key={stock} data-stock={stock}>
          <ProductStockIcon icon={SAMPLE_ICON} />
        </span>
      ))}
    </span>
  )
}
