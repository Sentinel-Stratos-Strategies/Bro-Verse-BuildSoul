/**
 * Telemetry module exports
 * Central export point for all telemetry functionality
 */

export { initializeAppInsights, getAppInsights } from './appInsights'

export {
  trackEvent,
  trackNavigation,
  trackUserAction,
  trackComponentLifecycle,
  trackError,
  trackApiCall,
  trackMetric,
  trackPageView,
  startTiming,
  trackDependency,
  flushTelemetry
} from './telemetryUtils'

export {
  useComponentTracking,
  usePageViewTracking,
  useTrackedAction,
  useTrackEvent,
  usePerformanceTracking,
  useTrackedEffect,
  useStateTracking
} from './useTelemetry'

export { default as ErrorBoundary } from './ErrorBoundary'
