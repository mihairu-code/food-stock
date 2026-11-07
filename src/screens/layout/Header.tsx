import { useLocation } from 'react-router'
import { useSession } from '@/app/session'

function titleOf(pathname: string): string {
  if (pathname.startsWith('/shopping')) return 'Покупки'
  if (pathname.startsWith('/settings')) return 'Настройки'
  return 'Дома'
}

export function Header() {
  const { household } = useSession()
  const { pathname } = useLocation()
  return (
    <header className="header">
      <div className="kicker">{household.name}</div>
      <h1>{titleOf(pathname)}</h1>
    </header>
  )
}
