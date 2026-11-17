import { dismissToastAction, useToastMessage } from '@/shared/lib/toast'

/** Место, где появляются тосты. Монтируется один раз в корне приложения. */
export function ToastRegion() {
  const message = useToastMessage()
  const action = message?.action
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && (
        <div className="toast" data-action={Boolean(action)}>
          <p>{message.text}</p>
          {action && (
            <button
              className="toast-action"
              type="button"
              onClick={() => {
                dismissToastAction(action)
                action.run()
              }}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
