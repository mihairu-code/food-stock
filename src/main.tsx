import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from './App'
import { startAppearance } from '@/shared/lib/appearance'
import { trackInstallPrompt } from '@/shared/lib/install/installPrompt'
import { enablePressFeedback } from '@/shared/lib/pressFeedback'
import { trackKeyboard } from '@/shared/lib/keyboard'
import { preventZoom } from '@/shared/lib/preventZoom'

startAppearance()
preventZoom()
enablePressFeedback()
trackKeyboard()
trackInstallPrompt()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
