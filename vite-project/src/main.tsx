import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './BroadcastApp.tsx'
import { BpSimulator } from './simulator/BpSimulator.tsx'
import { BpSimulatorControl } from './simulator/BpSimulatorControl.tsx'

const simulatorStage = location.pathname === '/tools/bp-simulator'
const simulatorControl = location.pathname === '/tools/bp-simulator-control'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {simulatorStage ? <BpSimulator /> : simulatorControl ? <BpSimulatorControl /> : <App />}
  </StrictMode>,
)
