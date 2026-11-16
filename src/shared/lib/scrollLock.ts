/**
 * Замораживает страницу на месте, пока открыта шторка. Телефон, поднимая клавиатуру,
 * прокручивает страницу, чтобы показать поле ввода, — и после закрытия шторки список
 * оказывался не там, где его оставили. Закреплённую страницу прокрутить нельзя,
 * а при разблокировке она возвращается ровно в прежнее положение.
 */
export function lockPageScroll(): () => void {
  const top = window.scrollY
  const { style } = document.body
  style.position = 'fixed'
  style.top = `${-top}px`
  style.left = '0'
  style.right = '0'

  return () => {
    style.position = ''
    style.top = ''
    style.left = ''
    style.right = ''
    window.scrollTo(0, top)
  }
}
