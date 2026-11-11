import { House, Settings, ShoppingCart } from 'lucide-react'
import { NavLink } from 'react-router'
import { useShoppingList } from '@/data/useHomeData'

/**
 * Кнопки парят над содержимым по отдельности, без общей панели. Подписей нет,
 * поэтому название вкладки — в aria-label и в заголовке экрана.
 */
export function TabBar() {
  const shoppingCount = useShoppingList().length

  return (
    <nav className="tabs" aria-label="Разделы приложения">
      <NavLink className="tab" to="/" end aria-label="Дом">
        <House size={24} aria-hidden="true" />
      </NavLink>
      <NavLink
        className="tab"
        to="/shopping"
        aria-label={shoppingCount > 0 ? `Покупки: ${shoppingCount}` : 'Покупки'}
      >
        <ShoppingCart size={24} aria-hidden="true" />
        {shoppingCount > 0 && (
          <span className="tab-count" aria-hidden="true">
            {shoppingCount}
          </span>
        )}
      </NavLink>
      <NavLink className="tab" to="/settings" aria-label="Настройки">
        <Settings size={24} aria-hidden="true" />
      </NavLink>
    </nav>
  )
}
