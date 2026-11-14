/**
 * Включает отклик на нажатие (:active в стилях) на iPhone: Safari показывает его,
 * только если на странице кто-то слушает касания. Сам обработчик ничего не делает.
 */
export function enablePressFeedback(): void {
  document.addEventListener('touchstart', () => {}, { passive: true })
}
