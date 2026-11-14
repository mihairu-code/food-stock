import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/App'
import { startAppearance } from '@/lib/appearance'
import { trackKeyboard } from '@/lib/keyboard'
import { preventZoom } from '@/lib/preventZoom'

startAppearance()
preventZoom()
trackKeyboard()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
