import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { homeScrollToRemember } from '@/features/home-search'
import { HomePage } from '@/pages/home'
import { ShoppingPage } from '@/pages/shopping'
import { Header } from '@/widgets/header'
import { TabBar } from '@/widgets/tab-bar'
import { SheetHost } from '../sheets/SheetHost'
import { useTabScrollMemory } from './useTabScrollMemory'

/**
 * Вкладки, которые остаются в памяти, пока открыт другой экран: переключение между ними
 * мгновенное, без пересборки списков и без мигания, а прокрутка у каждой своя — как
 * в системной панели вкладок. Вкладка появляется в памяти при первом заходе на неё.
 */
const KEPT_TABS = [
  { path: '/', Page: HomePage },
  { path: '/shopping', Page: ShoppingPage },
] as const

const KEPT_PATHS: readonly string[] = KEPT_TABS.map((tab) => tab.path)

const scrollToRemember = (path: string) => (path === '/' ? homeScrollToRemember() : window.scrollY)

/** Каркас всех экранов: заголовок, содержимое, вкладки и общее место для шторок. */
export function AppLayout() {
  const { pathname } = useLocation()
  const isKeptTab = KEPT_PATHS.includes(pathname)
  const [visitedTabs, setVisitedTabs] = useState<ReadonlySet<string>>(() => new Set([pathname]))
  if (isKeptTab && !visitedTabs.has(pathname)) setVisitedTabs(new Set(visitedTabs).add(pathname))

  useTabScrollMemory(pathname, KEPT_PATHS, scrollToRemember)

  return (
    <div className="app">
      <Header />
      <main className="content">
        {KEPT_TABS.map(
          ({ path, Page }) =>
            visitedTabs.has(path) && (
              // hidden убирает спрятанную вкладку с экрана, из фокуса и от скринридера.
              <div key={path} hidden={pathname !== path}>
                <Page />
              </div>
            ),
        )}
        {/* Остальные экраны (настройки, разделы) строятся при каждом заходе, как обычно. */}
        {!isKeptTab && (
          <div key={pathname}>
            <Outlet />
          </div>
        )}
      </main>
      <TabBar />
      <SheetHost />
    </div>
  )
}
