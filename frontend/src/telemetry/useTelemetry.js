/**
 * React hooks for telemetry integration
 */

import { useEffect, useCallback, useRef } from 'react'
import { 
  trackEvent, 
  trackComponentLifecycle,
  trackUserAction,
  trackPageView,
  startTiming 
} from './telemetryUtils'

/**
 * Hook to track component mount/unmount
 * @param {string} componentName - Name of the component
 */
export const useComponentTracking = (componentName) => {
  useEffect(() => {
    trackComponentLifecycle(componentName, 'mount')
    
    return () => {
      trackComponentLifecycle(componentName, 'unmount')
    }
  }, [componentName])
}

/**
 * Hook to track page views
 * @param {string} pageName - Name of the page
 * @param {Object} properties - Additional properties (should be stable/memoized)
 */
export const usePageViewTracking = (pageName, properties = {}) => {
  useEffect(() => {
    trackPageView(pageName, properties)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageName])
}

/**
 * Hook to create tracked event handlers
 * @returns {Function} Function to create tracked handlers
 */
export const useTrackedAction = () => {
  return useCallback((action, target, data = {}) => {
    return (event) => {
      trackUserAction(action, target, data)
      return event
    }
  }, [])
}

/**
 * Hook to track custom events
 * @returns {Function} trackEvent function
 */
export const useTrackEvent = () => {
  return useCallback((name, properties, measurements) => {
    trackEvent(name, properties, measurements)
  }, [])
}

/**
 * Hook to track performance of operations
 * @returns {Function} Function to start timing
 */
export const usePerformanceTracking = () => {
  return useCallback((operationName) => {
    return startTiming(operationName)
  }, [])
}

/**
 * Hook to track effect execution times
 * @param {string} effectName - Name for tracking
 */
export const useTrackedEffect = (effectName) => {
  useEffect(() => {
    const endTiming = startTiming(effectName)
    return () => {
      endTiming()
    }
  }, [effectName])
}

/**
 * Hook to track state changes
 * Note: Only use for primitive values or small objects to avoid performance issues
 * @param {*} state - State to track (should be primitive or small object)
 * @param {string} stateName - Name of the state
 */
export const useStateTracking = (state, stateName) => {
  const prevStateRef = useRef(state)
  
  useEffect(() => {
    // Only track if state actually changed
    if (prevStateRef.current !== state) {
      // For primitive values, track directly
      // For objects, consider tracking specific properties instead
      const oldValue = typeof prevStateRef.current === 'object' 
        ? 'object' 
        : String(prevStateRef.current)
      const newValue = typeof state === 'object'
        ? 'object'
        : String(state)
        
      trackEvent('state_change', {
        stateName,
        oldValue,
        newValue
      })
      prevStateRef.current = state
    }
  }, [state, stateName])
}
