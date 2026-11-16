import { Outlet, useLocation } from 'react-router'
import { Header } from '@/widgets/header'
import { TabBar } from '@/widgets/tab-bar'
import { SheetHost } from '../sheets/SheetHost'

/** Каркас всех экранов: заголовок, содержимое, вкладки и общее место для шторок. */
export function AppLayout() {
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
