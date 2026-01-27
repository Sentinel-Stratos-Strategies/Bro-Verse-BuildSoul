import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeAppInsights, enableTracedConsole } from './telemetry'

// Initialize Application Insights and enable traced console
initializeAppInsights()
enableTracedConsole()

// Log app initialization
console.log('BroVerse application initializing...')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
