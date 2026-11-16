import { KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

/** Мышь: тянуть сразу, но только по вертикали — горизонтальное движение остаётся свайпу удаления. */
const MOUSE = { activationConstraint: { distance: { y: 6 }, tolerance: { x: 10 } } }
/** Палец: удержать — иначе это прокрутка страницы или свайп. */
const TOUCH = { activationConstraint: { delay: 250, tolerance: 8 } }
const KEYBOARD = { coordinateGetter: sortableKeyboardCoordinates }

/** Чем в приложении начинают перетаскивание: мышью, пальцем и с клавиатуры (пробел, стрелки, пробел). */
export function useDragSensors() {
  return useSensors(useSensor(MouseSensor, MOUSE), useSensor(TouchSensor, TOUCH), useSensor(KeyboardSensor, KEYBOARD))
}
