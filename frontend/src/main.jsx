import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initializeAppInsights } from './telemetry/appInsights'
import { trackError, flushTelemetry } from './telemetry'

// Initialize Application Insights
initializeAppInsights()

// Global error handlers
window.addEventListener('error', (event) => {
  trackError(event.error, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    type: 'unhandled_error'
  })
})

window.addEventListener('unhandledrejection', (event) => {
  trackError(event.reason, {
    type: 'unhandled_promise_rejection',
    promise: event.promise?.toString()
  })
})

// Flush telemetry before page unload
window.addEventListener('beforeunload', () => {
  flushTelemetry()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
