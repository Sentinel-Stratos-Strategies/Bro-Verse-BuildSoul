# Tracing Implementation Guide

## Overview

The BroVerse application now includes comprehensive tracing powered by **Azure Application Insights**. This provides real-time monitoring, error tracking, performance metrics, and user behavior analytics.

## Features

### 🎯 Implemented Tracing Capabilities

1. **Automatic Page View Tracking** - Tracks all route changes and page views
2. **User Action Tracking** - Monitors button clicks, form submissions, and interactions
3. **Error Tracking** - Captures and reports all errors with full context
4. **Performance Monitoring** - Measures operation durations and performance metrics
5. **Component Lifecycle Tracking** - Monitors React component mount/unmount events
6. **Navigation Tracking** - Logs all route transitions
7. **API Call Tracking** - Monitors external service calls (when implemented)
8. **Custom Event Tracking** - Flexible system for tracking any custom events

## Setup

### 1. Configure Azure Application Insights

You need an Azure Application Insights resource. Get your connection string from the Azure Portal:

1. Go to your Application Insights resource
2. Navigate to "Overview" → "Connection String"
3. Copy the connection string

### 2. Set Environment Variable

Create a `.env` file in the frontend directory (or use `.env.local`):

```bash
VITE_APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxxxx;IngestionEndpoint=https://...
```

### 3. Build and Run

```bash
cd frontend
npm install
npm run dev
```

## Architecture

### Core Files

```
frontend/src/telemetry/
├── appInsights.js          # Application Insights initialization
├── telemetryUtils.js       # Utility functions for tracking
├── useTelemetry.js         # React hooks for tracing
├── ErrorBoundary.jsx       # Error boundary with telemetry
└── index.js               # Central export point
```

### Usage Examples

#### Track Custom Events

```javascript
import { trackEvent } from './telemetry'

trackEvent('user_signup', { 
  email: 'user@example.com',
  plan: 'premium' 
})
```

#### Track User Actions

```javascript
import { trackUserAction } from './telemetry'

const handleButtonClick = () => {
  trackUserAction('click', 'submit-button', { formType: 'contact' })
  // ... handle action
}
```

#### Use React Hooks

```javascript
import { usePageViewTracking, useComponentTracking } from './telemetry'

function MyComponent() {
  usePageViewTracking('MyComponent')
  useComponentTracking('MyComponent')
  
  // ... component code
}
```

#### Track Performance

```javascript
import { startTiming } from './telemetry'

async function fetchData() {
  const endTiming = startTiming('data_fetch')
  
  const data = await fetch('/api/data')
  
  endTiming({ endpoint: '/api/data', success: true })
  return data
}
```

#### Error Boundary

```javascript
import { ErrorBoundary } from './telemetry'

function App() {
  return (
    <ErrorBoundary name="App">
      <YourComponent />
    </ErrorBoundary>
  )
}
```

## What Gets Tracked

### Automatically Tracked

- **Page Views**: Every route change
- **Navigation**: All route transitions with source and destination
- **Errors**: Unhandled errors and promise rejections
- **Component Lifecycle**: Mount/unmount of tracked components
- **User Interactions**: Button clicks on navigation and key UI elements

### Current Integrations

- ✅ Main App navigation
- ✅ HomePage interactions
- ✅ DashboardPage interactions
- ✅ Character selection
- ✅ Global error handlers

## Viewing Telemetry Data

### Azure Portal

1. Go to your Application Insights resource
2. Navigate to different sections:
   - **Live Metrics**: Real-time telemetry stream
   - **Application Map**: Visual dependency map
   - **Performance**: Performance metrics and slowest operations
   - **Failures**: Error rates and exception details
   - **Usage**: User behavior analytics
   - **Logs**: Query telemetry data with KQL

### Sample Queries

#### View All Custom Events
```kql
customEvents
| where timestamp > ago(1h)
| project timestamp, name, customDimensions
| order by timestamp desc
```

#### Track User Navigation
```kql
customEvents
| where name == "navigation"
| project timestamp, tostring(customDimensions.from), tostring(customDimensions.to)
```

#### Monitor Errors
```kql
exceptions
| where timestamp > ago(24h)
| project timestamp, type, outerMessage, customDimensions
| order by timestamp desc
```

#### User Actions
```kql
customEvents
| where name == "user_action"
| summarize count() by tostring(customDimensions.action), tostring(customDimensions.target)
```

## Console Logging

When Application Insights is active, all telemetry events are also logged to the browser console with the `[Telemetry]` prefix. This helps with local debugging.

To disable console logging in production, modify `telemetryUtils.js` to check the environment:

```javascript
if (import.meta.env.DEV) {
  console.log(`[Telemetry] Event tracked: ${name}`, properties)
}
```

## Performance Considerations

- Telemetry is lightweight and non-blocking
- Events are batched and sent asynchronously
- Failed telemetry calls don't affect user experience
- Telemetry is flushed before page unload

## Troubleshooting

### No Data Appearing in Azure

1. **Check Connection String**: Verify `VITE_APPINSIGHTS_CONNECTION_STRING` is set correctly
2. **Check Console**: Look for `[Telemetry]` logs in browser console
3. **Check Initialization**: Look for warning: "App Insights connection string missing..."
4. **Delay**: Data may take 1-2 minutes to appear in Azure Portal

### Connection String Not Found

If you see: *"App Insights connection string missing. Set VITE_APPINSIGHTS_CONNECTION_STRING to enable tracing."*

1. Create a `.env` file in the `frontend/` directory
2. Add the connection string
3. Restart the dev server (`npm run dev`)

## Extending Tracing

### Add Tracing to New Components

```javascript
import { useComponentTracking, trackUserAction } from '../telemetry'

function NewComponent() {
  useComponentTracking('NewComponent')
  
  const handleAction = () => {
    trackUserAction('click', 'new-component-button')
    // ... handle action
  }
  
  return <button onClick={handleAction}>Click Me</button>
}
```

### Add Custom Metrics

```javascript
import { trackMetric } from './telemetry'

// Track a custom metric
trackMetric('active_users', 42)
trackMetric('roster_size', 5, { userId: '123' })
```

### Track API Calls

```javascript
import { trackApiCall } from './telemetry'

async function callApi() {
  const startTime = performance.now()
  
  try {
    const response = await fetch('/api/endpoint')
    const duration = performance.now() - startTime
    
    trackApiCall('/api/endpoint', 'GET', duration, response.status)
    
    return response.json()
  } catch (error) {
    trackApiCall('/api/endpoint', 'GET', performance.now() - startTime, 0)
    throw error
  }
}
```

## Best Practices

1. **Track Meaningful Events**: Focus on user actions that matter for business/product insights
2. **Include Context**: Add relevant properties to events (user ID, page, action type)
3. **Don't Over-Track**: Avoid tracking every mouse movement or render
4. **Protect Privacy**: Don't track PII (personally identifiable information) unless necessary
5. **Use Error Boundaries**: Wrap components in ErrorBoundary to catch React errors
6. **Monitor Performance**: Use timing utilities for slow operations
7. **Test Locally**: Check console logs before deploying

## Security Notes

- Never commit connection strings to git
- Use environment variables for all secrets
- The `.env` file is gitignored by default
- Connection strings are not exposed to end users
- Telemetry data is encrypted in transit and at rest

## Future Enhancements

Potential additions:

- [ ] Custom user properties (user ID, email, preferences)
- [ ] Session tracking and replay
- [ ] A/B test tracking
- [ ] Conversion funnel analysis
- [ ] Real-time alerts on critical errors
- [ ] Performance budgets and alerts
- [ ] Custom dashboards in Azure

## Support

For issues or questions:

1. Check the Azure Application Insights documentation
2. Review console logs for telemetry events
3. Verify environment configuration
4. Test with Live Metrics in Azure Portal

---

**The BroVerse • Built by The Sentinel • Sacred Construction**
