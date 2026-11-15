import { createStore, useStore } from './store'

/** Событие Chrome и Edge: сайт можно установить одной кнопкой. В Safari и Firefox его нет. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const store = createStore<InstallPromptEvent | null>(null)

/**
 * Вызывается при запуске: браузер присылает событие сразу после загрузки, ещё до
 * того, как появится экран входа, — его нужно поймать и придержать.
 */
export function trackInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Без этого Chrome на Android сам покажет свою плашку поверх экрана входа.
    event.preventDefault()
    store.set(event as InstallPromptEvent)
  })
  window.addEventListener('appinstalled', () => store.set(null))
}

/** Можно ли установить приложение своей кнопкой, без инструкции. */
export const useCanPromptInstall = () => useStore(store) !== null

/** Показывает системное окно установки. Событие одноразовое: после ответа кнопка пропадает. */
export async function promptInstall(): Promise<void> {
  const event = store.get()
  if (!event) return
  store.set(null)
  await event.prompt()
}
