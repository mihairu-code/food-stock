import { useToastMessage } from '@/lib/toast'

/** Место, где появляются тосты. Монтируется один раз в корне приложения. */
export function ToastRegion() {
  const message = useToastMessage()
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && <div className="toast">{message}</div>}
    </div>
  )
}
