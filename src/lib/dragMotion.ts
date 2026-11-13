import { defaultDropAnimation, type DropAnimation } from '@dnd-kit/core'

/** Быстрый старт и мягкая остановка: движение не тянется, но и не дёргается. */
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

/** Как строки расступаются перед перетаскиваемой. */
export const SORT_TRANSITION = { duration: 120, easing: EASING }

/** Как отпущенная строка долетает до своего места. */
export const DROP_ANIMATION: DropAnimation = { ...defaultDropAnimation, duration: 90, easing: EASING }
