import { useSession } from '@/shared/session'
import { daysSinceStart } from './hints'

/** Сколько дней человек с приложением — советы начинаются с третьего. */
export function useDaysSinceStart(): number {
  const { user } = useSession()
  return daysSinceStart(user.createdAt)
}
