import { defaultDropAnimation, type DropAnimation } from '@dnd-kit/core'

/** Быстрый старт и мягкая остановка: движение не тянется, но и не дёргается. */
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

/**
 * Как строки расступаются перед перетаскиваемой. Короче — на телефоне строки
 * перескакивают на новое место, а не съезжают; длиннее — отстают от пальца.
 */
export const SORT_TRANSITION = { duration: 180, easing: EASING }

/**
 * Как отпущенная строка долетает до своего места. Пока она летит, место в списке
 * пустое (dnd-kit прячет саму строку), и она встаёт в него ровно в конце полёта.
 */
export const DROP_ANIMATION: DropAnimation = { ...defaultDropAnimation, duration: 180, easing: EASING }
