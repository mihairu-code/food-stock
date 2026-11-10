import { createContext, useContext } from 'react'

export const ToastContext = createContext<(text: string) => void>(() => {})

/** Показать короткое сообщение внизу экрана. */
export const useToast = () => useContext(ToastContext)
