import { Outlet, useLocation } from 'react-router'
import { Header } from './Header'
import { TabBar } from './TabBar'

/** Каркас всех экранов: заголовок, содержимое и нижние вкладки. */
export function Layout() {
  const { pathname } = useLocation()
  return (
    <div className="app">
      <Header />
      {/* key — чтобы при смене вкладки экран появлялся заново, с лёгким переходом. */}
      <main className="content" key={pathname}>
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
