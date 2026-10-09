import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { Providers } from './providers'
import { initPlayerEngine } from '@/stores/playerStore'
import { logger } from '@/utils/logger'

initPlayerEngine()

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container #root not found')
}

createRoot(container).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
)

// Surface unhandled failures instead of swallowing them silently.
window.addEventListener('unhandledrejection', (event) => {
  logger.error('unhandled rejection', event.reason)
})
