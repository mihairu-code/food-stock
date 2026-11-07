import { Outlet } from 'react-router'
import { Header } from './Header'
import { TabBar } from './TabBar'

/** Каркас всех экранов: заголовок, содержимое и нижние вкладки. */
export function Layout() {
  return (
    <div className="app">
      <Header />
      <main className="content">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
