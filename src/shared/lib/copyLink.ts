import { notify } from './toast'

/** Копирует ссылку и сообщает тостом, вышло ли: без доступа к буферу ссылку выделяют вручную. */
export async function copyLink(link: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(link)
    notify('toast.copied')
  } catch {
    notify('toast.copyError')
  }
}
