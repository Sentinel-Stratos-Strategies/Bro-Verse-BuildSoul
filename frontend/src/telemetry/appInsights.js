import { ApplicationInsights } from '@microsoft/applicationinsights-web'

let appInsights

export const initializeAppInsights = () => {
  const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING

  if (!connectionString) {
    console.warn('App Insights connection string missing. Set VITE_APPINSIGHTS_CONNECTION_STRING to enable tracing.')
    return null
  }

  if (appInsights) {
    return appInsights
  }

  appInsights = new ApplicationInsights({
    config: {
      connectionString,
      enableAutoRouteTracking: true,
      autoTrackPageVisitTime: true,
      disableFetchTracking: false,
      disableAjaxTracking: false,
    },
  })

  appInsights.loadAppInsights()
  appInsights.trackPageView()

  return appInsights
}

export const getAppInsights = () => appInsights
