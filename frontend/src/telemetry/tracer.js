/**
 * Enhanced Tracing Module for BroVerse
 * Provides comprehensive tracing for console operations, user actions, and app events
 * Integrates with Azure Application Insights
 */

import { getAppInsights } from './appInsights'

/**
 * Trace levels
 */
export const TraceLevel = {
  VERBOSE: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  CRITICAL: 4
}

/**
 * Event categories for better organization in Application Insights
 */
export const EventCategory = {
  NAVIGATION: 'navigation',
  USER_ACTION: 'user_action',
  API_CALL: 'api_call',
  CONSOLE: 'console',
  BRO_CALL: 'bro_call',
  CHARACTER: 'character',
  ERROR: 'error',
  PERFORMANCE: 'performance'
}

/**
 * Enhanced console with automatic tracing
 */
class TracedConsole {
  constructor() {
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console)
    }
  }

  log(...args) {
    this.originalConsole.log(...args)
    this._trackConsole('log', args, TraceLevel.INFO)
  }

  info(...args) {
    this.originalConsole.info(...args)
    this._trackConsole('info', args, TraceLevel.INFO)
  }

  warn(...args) {
    this.originalConsole.warn(...args)
    this._trackConsole('warn', args, TraceLevel.WARNING)
  }

  error(...args) {
    this.originalConsole.error(...args)
    this._trackConsole('error', args, TraceLevel.ERROR)
  }

  debug(...args) {
    this.originalConsole.debug(...args)
    this._trackConsole('debug', args, TraceLevel.VERBOSE)
  }

  _trackConsole(level, args, severity) {
    const appInsights = getAppInsights()
    if (!appInsights) return

    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ')

    appInsights.trackTrace({
      message: `[Console.${level}] ${message}`,
      severityLevel: severity,
      properties: {
        category: EventCategory.CONSOLE,
        level,
        timestamp: new Date().toISOString()
      }
    })
  }
}

/**
 * Tracer class - main tracing interface
 */
class Tracer {
  /**
   * Track a custom event
   */
  trackEvent(name, properties = {}, measurements = {}) {
    const appInsights = getAppInsights()
    if (!appInsights) {
      console.log(`[Tracer] Event: ${name}`, properties)
      return
    }

    appInsights.trackEvent({
      name,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      },
      measurements
    })
  }

  /**
   * Track navigation events
   */
  trackNavigation(from, to, metadata = {}) {
    this.trackEvent('navigation', {
      category: EventCategory.NAVIGATION,
      from,
      to,
      ...metadata
    })
  }

  /**
   * Track user actions (button clicks, form submissions, etc.)
   */
  trackUserAction(action, element, metadata = {}) {
    this.trackEvent('user_action', {
      category: EventCategory.USER_ACTION,
      action,
      element,
      ...metadata
    })
  }

  /**
   * Track API/LLM calls
   */
  trackApiCall(endpoint, method, status, duration, metadata = {}) {
    this.trackEvent('api_call', {
      category: EventCategory.API_CALL,
      endpoint,
      method,
      status,
      ...metadata
    }, {
      duration
    })
  }

  /**
   * Track BroCalls events
   */
  trackBroCall(action, character, metadata = {}) {
    this.trackEvent('bro_call', {
      category: EventCategory.BRO_CALL,
      action, // 'triggered', 'viewed', 'dismissed', 'expired'
      character: character?.name,
      characterArchetype: character?.archetype,
      ...metadata
    })
  }

  /**
   * Track character interactions
   */
  trackCharacterInteraction(action, character, metadata = {}) {
    this.trackEvent('character_interaction', {
      category: EventCategory.CHARACTER,
      action, // 'selected', 'chat_opened', 'chat_closed', 'message_sent'
      character: character?.name,
      characterArchetype: character?.archetype,
      ...metadata
    })
  }

  /**
   * Track errors with full context
   */
  trackError(error, context = {}) {
    const appInsights = getAppInsights()
    if (!appInsights) {
      console.error('[Tracer] Error:', error, context)
      return
    }

    appInsights.trackException({
      exception: error instanceof Error ? error : new Error(String(error)),
      properties: {
        category: EventCategory.ERROR,
        ...context,
        timestamp: new Date().toISOString()
      },
      severityLevel: TraceLevel.ERROR
    })
  }

  /**
   * Track page views
   */
  trackPageView(name, url, properties = {}) {
    const appInsights = getAppInsights()
    if (!appInsights) {
      console.log(`[Tracer] Page View: ${name}`)
      return
    }

    appInsights.trackPageView({
      name,
      uri: url,
      properties: {
        ...properties,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Track performance metrics
   */
  trackMetric(name, value, properties = {}) {
    const appInsights = getAppInsights()
    if (!appInsights) {
      console.log(`[Tracer] Metric: ${name} = ${value}`)
      return
    }

    appInsights.trackMetric({
      name,
      average: value,
      properties: {
        category: EventCategory.PERFORMANCE,
        ...properties,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Start a timed operation
   */
  startTimer(name) {
    const startTime = performance.now()
    return {
      stop: (metadata = {}) => {
        const duration = performance.now() - startTime
        this.trackMetric(name, duration, {
          ...metadata,
          unit: 'ms'
        })
        return duration
      }
    }
  }

  /**
   * Flush telemetry (useful before app closes)
   */
  flush() {
    const appInsights = getAppInsights()
    if (appInsights) {
      appInsights.flush()
    }
  }
}

// Create singleton instances
export const tracer = new Tracer()
export const tracedConsole = new TracedConsole()

/**
 * Enable traced console globally (replaces native console)
 */
export function enableTracedConsole() {
  if (typeof window !== 'undefined') {
    window.console = tracedConsole
  }
}

/**
 * Helper to wrap async operations with tracing
 */
export function traceAsync(name, asyncFn, metadata = {}) {
  return async (...args) => {
    const timer = tracer.startTimer(name)
    try {
      const result = await asyncFn(...args)
      timer.stop({ ...metadata, success: true })
      return result
    } catch (error) {
      timer.stop({ ...metadata, success: false })
      tracer.trackError(error, { operation: name, ...metadata })
      throw error
    }
  }
}

/**
 * Helper to wrap sync operations with tracing
 */
export function traceSync(name, syncFn, metadata = {}) {
  return (...args) => {
    const timer = tracer.startTimer(name)
    try {
      const result = syncFn(...args)
      timer.stop({ ...metadata, success: true })
      return result
    } catch (error) {
      timer.stop({ ...metadata, success: false })
      tracer.trackError(error, { operation: name, ...metadata })
      throw error
    }
  }
}

export default tracer
