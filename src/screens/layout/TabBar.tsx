import { House, Settings, ShoppingCart } from 'lucide-react'
import { NavLink } from 'react-router'
import { useShoppingList } from '@/data/useHomeData'

export function TabBar() {
  const shoppingCount = useShoppingList().length
  return (
    <nav className="tabs" aria-label="Разделы приложения">
      <NavLink className="tab" to="/" end>
        <House size={22} aria-hidden="true" />
        <span>Дом</span>
      </NavLink>
      <NavLink className="tab" to="/shopping">
        <ShoppingCart size={22} aria-hidden="true" />
        <span>Покупки{shoppingCount > 0 && ` · ${shoppingCount}`}</span>
      </NavLink>
      <NavLink className="tab" to="/settings">
        <Settings size={22} aria-hidden="true" />
        <span>Настройки</span>
      </NavLink>
    </nav>
  )
}
