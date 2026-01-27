import { useEffect, useState } from 'react'
import { getAppInsights } from '../../telemetry'

/**
 * HealthCheck Component
 * Displays application health status and telemetry connectivity
 * Useful for deployment verification
 */
export function HealthCheck() {
  const [status, setStatus] = useState({
    app: 'healthy',
    telemetry: 'unknown',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })

  useEffect(() => {
    const checkHealth = () => {
      const appInsights = getAppInsights()
      
      setStatus({
        app: 'healthy',
        telemetry: appInsights ? 'connected' : 'not_configured',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        nodeEnv: import.meta.env.MODE,
        hasAppInsights: !!appInsights
      })
    }

    checkHealth()
  }, [])

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      padding: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: '#fff',
      fontSize: '10px',
      borderRadius: '4px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div>🟢 App: {status.app}</div>
      <div>📊 Telemetry: {status.telemetry}</div>
      <div>🌍 Env: {status.nodeEnv}</div>
      <div>📅 {new Date(status.timestamp).toLocaleTimeString()}</div>
    </div>
  )
}

export default HealthCheck
