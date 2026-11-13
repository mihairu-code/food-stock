/**
 * Масштаб жестами в приложении выключен: оно ведёт себя как установленное, а не как
 * страница. Основную работу делают viewport в index.html и touch-action в стилях;
 * здесь — то, что они не закрывают.
 */
export function preventZoom(): void {
  const cancel = (event: Event) => event.preventDefault()

  // iOS не слушает user-scalable=no; щипок приходит отдельными событиями Safari.
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, cancel, { passive: false })
  }

  // Трекпад: щипок — это колесо с зажатым Ctrl.
  document.addEventListener(
    'wheel',
    (event) => {
      if (event.ctrlKey) event.preventDefault()
    },
    { passive: false },
  )
}
