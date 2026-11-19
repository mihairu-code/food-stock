import type { DragOverEvent } from '@dnd-kit/core'
import { useState } from 'react'
import { haptic } from '@/shared/lib/haptics'
import { setDragActive } from './dragState'
import { useDragSensors } from './useDragSensors'

/**
 * Черновик расположения на время перетаскивания. Пока идёт жест, расположение живёт
 * в черновике; после отпускания его сохраняют одним запросом, а черновик остаётся на
 * экране, пока не придут обновлённые данные, — строка не возвращается на старое место
 * ни на кадр. Что именно переставили и как сохранить — решает экран.
 *
 * `saved` — расположение из данных; новое значение (по ссылке) означает, что данные
 * обновились.
 */
export function useDragDraft<Layout, Active>(saved: Layout) {
  const [draft, setDraft] = useState<Layout | null>(null)
  const [active, setActive] = useState<Active | null>(null)
  // Данные, которые были на экране в момент отпускания. Пока они не сменились, показываем черновик.
  const [dropped, setDropped] = useState<Layout | null>(null)
  const sensors = useDragSensors()

  // Данные обновились (оптимистично или с сервера) — дальше показываем их, а не черновик.
  // Сбрасывать черновик раньше нельзя: до этого момента в `saved` ещё старый порядок.
  if (draft && !active && dropped && saved !== dropped) {
    setDraft(null)
    setDropped(null)
  }

  function endDragGesture() {
    setDragActive(false)
    setActive(null)
  }

  /** Жест закончился без изменений. */
  function discardDraft() {
    setDraft(null)
    setDropped(null)
  }

  return {
    sensors,
    /** Черновик; null — на экране данные. */
    draft,
    setDraft,
    active,

    /** Жест начался: черновик — копия данных. */
    startDrag(next: Active) {
      setDragActive(true)
      setDropped(null)
      setDraft(saved)
      setActive(next)
      haptic('pick')
    },

    /** Строка оказалась над другой — лёгкий отклик. */
    noteDragOver({ active: item, over }: DragOverEvent) {
      if (over && over.id !== item.id) haptic('move')
    },

    /** Строку отпустили. Дальше экран либо сохраняет черновик, либо отбрасывает его. */
    finishDrag() {
      endDragGesture()
      haptic('drop')
    },

    discardDraft,

    /** Черновик остаётся на экране, пока не придут данные с новым порядком. */
    keepDraftUntilSaved(next: Layout) {
      setDraft(next)
      setDropped(saved)
    },

    /** Жест отменили (Esc, системный жест). */
    cancelDrag() {
      endDragGesture()
      discardDraft()
    },
  }
}
