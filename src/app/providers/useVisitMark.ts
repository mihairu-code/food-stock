import { useEffect } from 'react'
import { backend } from '@/shared/api'

/** День, за который визит этого пользователя с этого устройства уже отмечен. */
const MARKED_KEY = 'home-stock:visit-marked'

/** Сегодняшняя дата по местному времени: «2026-11-16». */
const today = () => new Date().toLocaleDateString('sv')

/**
 * Отмечает на сервере, что человек открыл приложение, — не чаще раза в сутки с устройства.
 * Анонимных пользователей, которые не заходили больше года, база удаляет: эта отметка
 * говорит ей, что пользователь жив. Приложение на телефоне неделями не закрывают, поэтому
 * отметка ставится и при возвращении к нему, а не только при запуске.
 */
export function useVisitMark(userId: string): void {
  useEffect(() => {
    function markVisit() {
      if (document.visibilityState !== 'visible') return
      const mark = `${userId}|${today()}`
      try {
        if (localStorage.getItem(MARKED_KEY) === mark) return
        // Отметка ставится сразу: второй вызов не отправит второй запрос.
        localStorage.setItem(MARKED_KEY, mark)
      } catch {
        // хранилище недоступно — отмечаем при каждом открытии, это не страшно
      }
      backend.markVisit().catch(() => {
        // Не вышло — попробуем при следующем открытии.
        try {
          localStorage.removeItem(MARKED_KEY)
        } catch {
          // хранилище недоступно
        }
      })
    }

    markVisit()
    document.addEventListener('visibilitychange', markVisit)
    return () => document.removeEventListener('visibilitychange', markVisit)
  }, [userId])
}
