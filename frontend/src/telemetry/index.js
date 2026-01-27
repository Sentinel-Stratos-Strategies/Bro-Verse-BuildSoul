/**
 * Telemetry Module Exports
 * Central export point for all telemetry functionality
 */

export { initializeAppInsights, getAppInsights } from './appInsights'
export { 
  tracer, 
  tracedConsole, 
  enableTracedConsole,
  traceAsync,
  traceSync,
  TraceLevel,
  EventCategory
} from './tracer'
