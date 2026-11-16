import { House, Settings, ShoppingCart } from 'lucide-react'
import { NavLink } from 'react-router'
import { useShoppingList } from '@/shared/api/useHomeData'
import { useT } from '@/shared/i18n'

/**
 * Кнопки парят над содержимым по отдельности, без общей панели. Подписей нет,
 * поэтому название вкладки — в aria-label и в заголовке экрана.
 */
export function TabBar() {
  const t = useT()
  const shoppingCount = useShoppingList().length

  return (
    <nav className="tabs" aria-label={t('nav.label')}>
      <NavLink className="tab" to="/" end aria-label={t('nav.home')}>
        <House size={24} aria-hidden="true" />
      </NavLink>
      <NavLink
        className="tab"
        to="/shopping"
        aria-label={shoppingCount > 0 ? t('nav.shoppingCount', { count: shoppingCount }) : t('nav.shopping')}
      >
        <ShoppingCart size={24} aria-hidden="true" />
        {shoppingCount > 0 && (
          <span className="tab-count" aria-hidden="true">
            {shoppingCount}
          </span>
        )}
      </NavLink>
      <NavLink className="tab" to="/settings" aria-label={t('nav.settings')}>
        <Settings size={24} aria-hidden="true" />
      </NavLink>
    </nav>
  )
}
