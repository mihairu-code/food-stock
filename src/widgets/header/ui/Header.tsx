import { UserRound } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { useMembers } from '@/entities/member'
import { useT } from '@/shared/i18n'
import { useSession } from '@/shared/session'
import { memberInitials, titleKey } from '../lib/headerText'

export function Header() {
  const t = useT()
  const { household } = useSession()
  const { pathname } = useLocation()
  const members = useMembers().data
  const initials = memberInitials(members ?? [])

  return (
    <header className="header">
      <div>
        <div className="kicker">
          {household.name} · {t('n.members', { count: members?.length ?? 1 })}
        </div>
        <h1>{t(titleKey(pathname))}</h1>
      </div>
      {/* Аватарка дома; пока её не выбрали — инициалы участников. */}
      <Link className="avatar" to="/settings" data-icon={Boolean(household.icon)} aria-label={t('header.settingsLink')}>
        {household.icon || initials || <UserRound size={18} aria-hidden="true" />}
      </Link>
    </header>
  )
}
