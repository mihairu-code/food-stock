import { useSession } from '@/app/session'
import { hintsVisible, useHintsSetting } from '@/lib/hints'

/** Видны ли сейчас подсказки: новому человеку — первые три дня, дальше — как выбрано в настройках. */
export function useHintsVisible(): boolean {
  const setting = useHintsSetting()
  const { user } = useSession()
  return hintsVisible(setting, user.createdAt)
}
