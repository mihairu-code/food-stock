import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/App'
import { trackKeyboard } from '@/lib/keyboard'
import { startParallax } from '@/lib/parallax'
import { preventZoom } from '@/lib/preventZoom'
import { startTheme } from '@/lib/theme'

startTheme()
preventZoom()
trackKeyboard()
startParallax()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
