import { Outlet, useLocation } from 'react-router'
import { SheetHost } from '@/sheets/SheetHost'
import { Header } from '@/widgets/header/ui/Header'
import { TabBar } from '@/widgets/tab-bar/ui/TabBar'

/** Каркас всех экранов: заголовок, содержимое, вкладки и общее место для шторок. */
export function Layout() {
  const { pathname } = useLocation()
  return (
    <div className="app">
      <Header />
      <main className="content" key={pathname}>
        <Outlet />
      </main>
      <TabBar />
      <SheetHost />
    </div>
  )
}
