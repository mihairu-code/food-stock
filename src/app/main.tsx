import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { startAppearance } from '@/shared/lib/appearance'
import { noteAppOpen } from '@/shared/lib/coach/tips'
import { trackInstallPrompt } from '@/shared/lib/install/installPrompt'
import { trackKeyboard } from '@/shared/lib/keyboard'
import { enablePressFeedback } from '@/shared/lib/pressFeedback'
import { preventZoom } from '@/shared/lib/preventZoom'
import './styles/index.css'
import App from './App'

startAppearance()
preventZoom()
enablePressFeedback()
trackKeyboard()
trackInstallPrompt()
noteAppOpen()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
