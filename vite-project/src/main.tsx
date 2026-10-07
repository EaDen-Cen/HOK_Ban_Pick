import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './BroadcastApp.tsx'
import { BpSimulator } from './simulator/BpSimulator.tsx'

const simulator = location.pathname === '/tools/bp-simulator'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {simulator ? <BpSimulator /> : <App />}
  </StrictMode>,
)
