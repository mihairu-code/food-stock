import { House, Settings, ShoppingCart } from 'lucide-react'
import { useEffect, type MouseEvent } from 'react'
import { NavLink, useLocation } from 'react-router'
import { useShoppingList } from '@/entities/shopping-list'
import { closeHomeSearch, HomeSearch, SEARCH_MIN_PRODUCTS, useHomeSearch } from '@/features/home-search'
import { useHomeData } from '@/shared/api'
import { useT } from '@/shared/i18n'

/**
 * Кнопки парят над содержимым по отдельности, без общей панели. Подписей нет,
 * поэтому название вкладки — в aria-label и в заголовке экрана.
 *
 * Ряд из пяти мест: пустое, три вкладки и лупа поиска справа. Пустое место уравновешивает
 * лупу, поэтому вкладки стоят по центру на любом экране и не сдвигаются, когда лупа
 * появляется на «Доме» и исчезает на других вкладках. Открытый поиск сворачивает ряд
 * в кнопку «Дом» слева, она же закрывает поиск, а лупа растягивается в поле.
 */
export function TabBar() {
  const t = useT()
  const { pathname } = useLocation()
  const shoppingCount = useShoppingList().length
  const { products } = useHomeData()
  const { open: searchOpen } = useHomeSearch()
  const onHome = pathname === '/'

  // Ушли с «Дома» (ссылкой из шапки, кнопкой «Назад») — поиск закрывается.
  useEffect(() => {
    if (!onHome) closeHomeSearch({ leavingHome: true })
  }, [onHome])

  function closeSearchInstead(event: MouseEvent) {
    if (!searchOpen) return
    event.preventDefault()
    closeHomeSearch()
  }

  return (
    <nav
      className="tabs"
      aria-label={t('nav.label')}
      data-search-open={searchOpen}
      // Пока открыт поиск, ряд стоит на клавиатуре; keyboard.ts проверяет, не промахнулся ли он.
      data-keyboard-anchor={searchOpen ? '' : undefined}
      // Окно подсказки не ставит пузырь на панель вкладок.
      data-coach-floor=""
    >
      <span className="tab-place" aria-hidden="true" />
      <NavLink
        className="tab"
        to="/"
        end
        aria-label={searchOpen ? t('search.close') : t('nav.home')}
        onClick={closeSearchInstead}
      >
        <House size={24} aria-hidden="true" />
      </NavLink>
      <NavLink
        className="tab tab-folding"
        to="/shopping"
        data-coach="tab-shopping"
        aria-label={shoppingCount > 0 ? t('nav.shoppingCount', { count: shoppingCount }) : t('nav.shopping')}
        inert={searchOpen}
      >
        <ShoppingCart size={24} aria-hidden="true" />
        {shoppingCount > 0 && (
          <span className="tab-count" aria-hidden="true">
            {shoppingCount}
          </span>
        )}
      </NavLink>
      <NavLink className="tab tab-folding" to="/settings" aria-label={t('nav.settings')} inert={searchOpen}>
        <Settings size={24} aria-hidden="true" />
      </NavLink>
      <HomeSearch available={searchOpen || (onHome && products.length >= SEARCH_MIN_PRODUCTS)} />
    </nav>
  )
}
