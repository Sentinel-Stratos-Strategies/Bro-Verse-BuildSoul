/**
 * Telemetry utility functions for enhanced tracing
 * Provides custom event tracking, error logging, and performance monitoring
 */

import { getAppInsights } from './appInsights'

/**
 * Track a custom event with optional properties and metrics
 * @param {string} name - Event name
 * @param {Object} properties - Custom properties
 * @param {Object} measurements - Custom metrics
 */
export const trackEvent = (name, properties = {}, measurements = {}) => {
  const appInsights = getAppInsights()
  if (appInsights) {
    appInsights.trackEvent({ 
      name, 
      properties: {
        timestamp: new Date().toISOString(),
        ...properties
      },
      measurements 
    })
    console.log(`[Telemetry] Event tracked: ${name}`, properties)
  }
}

/**
 * Track navigation events
 * @param {string} from - Source route
 * @param {string} to - Destination route
 */
export const trackNavigation = (from, to) => {
  trackEvent('navigation', { from, to })
}

/**
 * Track user interactions (clicks, form submissions, etc.)
 * @param {string} action - Action type (click, submit, etc.)
 * @param {string} target - Target element/component
 * @param {Object} data - Additional data
 */
export const trackUserAction = (action, target, data = {}) => {
  trackEvent('user_action', { 
    action, 
    target,
    ...data 
  })
}

/**
 * Track component lifecycle events
 * @param {string} component - Component name
 * @param {string} lifecycle - Lifecycle event (mount, unmount, update)
 */
export const trackComponentLifecycle = (component, lifecycle) => {
  trackEvent('component_lifecycle', { component, lifecycle })
}

/**
 * Track errors with full context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export const trackError = (error, context = {}) => {
  const appInsights = getAppInsights()
  if (appInsights) {
    appInsights.trackException({ 
      exception: error,
      properties: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    })
    console.error('[Telemetry] Error tracked:', error, context)
  }
}

/**
 * Track API calls
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {number} duration - Request duration in ms
 * @param {number} status - HTTP status code
 */
export const trackApiCall = (endpoint, method, duration, status) => {
  trackEvent('api_call', { 
    endpoint, 
    method, 
    status,
    success: status >= 200 && status < 300
  }, { 
    duration 
  })
}

/**
 * Track performance metrics
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @param {Object} properties - Additional properties
 */
export const trackMetric = (name, value, properties = {}) => {
  const appInsights = getAppInsights()
  if (appInsights) {
    appInsights.trackMetric({ 
      name, 
      average: value,
      properties: {
        timestamp: new Date().toISOString(),
        ...properties
      }
    })
    console.log(`[Telemetry] Metric tracked: ${name} = ${value}`)
  }
}

/**
 * Track page views with custom properties
 * @param {string} name - Page name
 * @param {Object} properties - Custom properties
 */
export const trackPageView = (name, properties = {}) => {
  const appInsights = getAppInsights()
  if (appInsights) {
    appInsights.trackPageView({ 
      name,
      properties: {
        timestamp: new Date().toISOString(),
        ...properties
      }
    })
    console.log(`[Telemetry] Page view tracked: ${name}`)
  }
}

/**
 * Start timing an operation
 * @param {string} operationName - Name of the operation
 * @returns {Function} Function to call when operation completes
 */
export const startTiming = (operationName) => {
  const startTime = performance.now()
  
  return (properties = {}) => {
    const duration = performance.now() - startTime
    trackMetric(`${operationName}_duration`, duration, properties)
    return duration
  }
}

/**
 * Track dependency (external service call)
 * @param {string} name - Dependency name
 * @param {string} data - Command/query
 * @param {number} duration - Duration in ms
 * @param {boolean} success - Whether call succeeded
 */
export const trackDependency = (name, data, duration, success) => {
  const appInsights = getAppInsights()
  if (appInsights) {
    appInsights.trackDependencyData({
      name,
      data,
      duration,
      success,
      properties: {
        timestamp: new Date().toISOString()
      }
    })
    console.log(`[Telemetry] Dependency tracked: ${name} (${success ? 'success' : 'failed'})`)
  }
}

/**
 * Flush telemetry immediately (useful before page unload)
 */
export const flushTelemetry = () => {
  const appInsights = getAppInsights()
  if (appInsights) {
    appInsights.flush()
    console.log('[Telemetry] Telemetry flushed')
  }
}
