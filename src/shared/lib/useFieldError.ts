import { useCallback, useState } from 'react'

/**
 * Ошибка поля формы, которую показывают при попытке отправить: текст под полем
 * и встряска поля при каждой новой попытке. Стоит исправить значение — ошибка уходит.
 */
export function useFieldError() {
  const [error, setError] = useState<string | null>(null)
  const [shakeCount, setShakeCount] = useState(0)

  const reject = useCallback((message: string) => {
    setError(message)
    setShakeCount((count) => count + 1)
  }, [])

  const clear = useCallback(() => setError(null), [])

  return { error, shakeCount, reject, clear }
}
