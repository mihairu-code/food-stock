import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { startAppearance } from '@/shared/lib/appearance'
import { trackInstallPrompt } from '@/shared/lib/install/installPrompt'
import { trackKeyboard } from '@/shared/lib/keyboard'
import { showKeyboardDebug } from '@/shared/lib/keyboardDebug'
import { enablePressFeedback } from '@/shared/lib/pressFeedback'
import { preventZoom } from '@/shared/lib/preventZoom'
import './styles/index.css'
import App from './App'

startAppearance()
preventZoom()
enablePressFeedback()
trackKeyboard()
trackInstallPrompt()
// Временная панель с числами клавиатуры — только в отладочной сборке.
if (import.meta.env.VITE_KEYBOARD_DEBUG === '1') showKeyboardDebug()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
