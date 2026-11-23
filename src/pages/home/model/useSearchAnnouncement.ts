import { useEffect, useState } from 'react'

/** Сколько ждать после ввода: скринридер не должен зачитывать число на каждую букву. */
const ANNOUNCE_DELAY_MS = 400

/** Текст для aria-live, обновлённый не сразу, а когда человек перестал печатать. */
export function useSearchAnnouncement(text: string): string {
  const [announced, setAnnounced] = useState('')
  useEffect(() => {
    const timer = window.setTimeout(() => setAnnounced(text), ANNOUNCE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [text])
  return announced
}
