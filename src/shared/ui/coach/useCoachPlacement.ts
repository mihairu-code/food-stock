import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { placeCoach, SPOT_PAD, type CoachPlacement } from '@/shared/lib/coach/placeCoach'

export interface CoachLayout extends CoachPlacement {
  /** Скругление выреза: как у элемента, у круглых и «таблеток» — полное. */
  radius: string
}

/** Вырез шире элемента на SPOT_PAD — скругление растёт на столько же, чтобы кольцо шло ровно. */
function spotRadius(target: HTMLElement): string {
  const radius = parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0
  const { height } = target.getBoundingClientRect()
  return radius * 2 >= height ? '999px' : `${radius + SPOT_PAD}px`
}

/**
 * Меряет элемент и пузырь и держит вырез на месте: при повороте, смене шрифта или ширины
 * окна, при изменении размера элемента. Если элемент исчез — зовёт `onLost`.
 * `frame` — само окно: его отступы сверху и снизу — вырезы экрана.
 */
export function useCoachPlacement(
  target: HTMLElement | null,
  bubble: RefObject<HTMLElement | null>,
  frame: RefObject<HTMLElement | null>,
  onLost: () => void,
): CoachLayout | null {
  const [layout, setLayout] = useState<CoachLayout | null>(null)
  const lost = useRef(onLost)
  useEffect(() => {
    lost.current = onLost
  })

  useLayoutEffect(() => {
    const card = bubble.current
    const box = frame.current
    if (!target || !card || !box) return

    function measure() {
      if (!target || !card || !box) return
      if (!target.isConnected) {
        lost.current()
        return
      }
      const style = getComputedStyle(box)
      const viewport = { width: box.clientWidth, height: box.clientHeight }
      // Панель вкладок помечена data-coach-floor: пузырь не встаёт на неё.
      const floor = document.querySelector('[data-coach-floor]')?.getBoundingClientRect().top
      const bottom = floor === undefined ? parseFloat(style.paddingBottom) || 0 : viewport.height - floor
      setLayout({
        ...placeCoach({
          target: target.getBoundingClientRect(),
          viewport,
          bubble: { width: card.offsetWidth, height: card.offsetHeight },
          reserved: { top: parseFloat(style.paddingTop) || 0, bottom },
        }),
        radius: spotRadius(target),
      })
    }

    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(target)
    resize.observe(card)
    const removal = new MutationObserver(() => {
      if (!target.isConnected) lost.current()
    })
    removal.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      resize.disconnect()
      removal.disconnect()
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [target, bubble, frame])

  // Без элемента вырезу негде быть; прежние числа остаются только до первого замера нового.
  return target ? layout : null
}
