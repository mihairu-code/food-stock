import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/App'
import { preventZoom } from '@/lib/preventZoom'
import { startTheme } from '@/lib/theme'

startTheme()
preventZoom()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
