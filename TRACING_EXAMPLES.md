# Tracing Examples for BroVerse

This document provides examples of how to use the tracing system in BroVerse.

## Basic Usage

### Import the Tracer

```javascript
import { tracer } from '../telemetry'
// or
import { tracer } from './telemetry'
```

## Console Tracing

Console tracing is **automatic** once `enableTracedConsole()` is called in `main.jsx`. All console calls are automatically sent to Application Insights.

```javascript
// These are automatically traced:
console.log('User logged in')
console.warn('API rate limit approaching')
console.error('Failed to load data', error)

// Visible in Application Insights as traces with appropriate severity levels
```

## Event Tracking

### Track Custom Events

```javascript
// Basic event
tracer.trackEvent('feature_used', {
  featureName: 'export_roster',
  userId: user.id
})

// Event with measurements
tracer.trackEvent('data_processed', 
  { dataType: 'roster_selection' },
  { recordCount: 42, processingTime: 1250 }
)
```

### Track Navigation

```javascript
// In a navigation handler
const handleNavigate = (from, to) => {
  tracer.trackNavigation(from, to, { 
    trigger: 'user_click',
    source: 'nav_menu' 
  })
  navigate(to)
}
```

### Track User Actions

```javascript
// Button click
<button onClick={() => {
  tracer.trackUserAction('click', 'submit_button', {
    formType: 'roster_selection',
    page: 'home'
  })
  handleSubmit()
}}>Submit</button>

// Form submission
const handleSubmit = (formData) => {
  tracer.trackUserAction('submit', 'roster_form', {
    fieldsCount: Object.keys(formData).length
  })
  // ... rest of handler
}
```

## Character Tracking

### Track Character Interactions

```javascript
// Opening a character chat
const openChat = (character) => {
  tracer.trackCharacterInteraction('chat_opened', character, {
    source: 'dashboard',
    rosterPosition: 1
  })
  setShowChat(true)
}

// Closing chat
const closeChat = (character) => {
  tracer.trackCharacterInteraction('chat_closed', character, {
    sessionDuration: Date.now() - chatStartTime,
    messagesExchanged: messageCount
  })
  setShowChat(false)
}

// Character selection
const selectCharacter = (character) => {
  tracer.trackCharacterInteraction('selected', character, {
    availableSlots: remainingSlots,
    totalSelected: selectedCharacters.length + 1
  })
  addToRoster(character)
}
```

### Track BroCalls

```javascript
// BroCall triggered
tracer.trackBroCall('triggered', character, {
  messageType: 'motivational',
  duration: 8,
  callsRemaining: 2
})

// BroCall dismissed
tracer.trackBroCall('dismissed', character, {
  messageType: 'challenge',
  timeViewed: 3.5
})

// BroCall expired
tracer.trackBroCall('expired', character, {
  messageType: 'wisdom',
  wasViewed: false
})
```

## API & Service Tracking

### Track API Calls

```javascript
const callApi = async (endpoint, data) => {
  const startTime = performance.now()
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    
    const duration = performance.now() - startTime
    
    tracer.trackApiCall(
      endpoint, 
      'POST', 
      response.status, 
      duration,
      { success: response.ok, dataSize: JSON.stringify(data).length }
    )
    
    return await response.json()
  } catch (error) {
    const duration = performance.now() - startTime
    tracer.trackApiCall(endpoint, 'POST', 'error', duration, {
      success: false,
      error: error.message
    })
    throw error
  }
}
```

### Using Trace Helpers

```javascript
import { traceAsync } from '../telemetry'

// Wrap async function with automatic tracing
const fetchUserData = traceAsync(
  'fetch_user_data',
  async (userId) => {
    const response = await fetch(`/api/users/${userId}`)
    return await response.json()
  },
  { category: 'data_access' }
)

// Use it normally - tracing happens automatically
const userData = await fetchUserData(123)
```

## Performance Tracking

### Track Metrics

```javascript
// Simple metric
tracer.trackMetric('roster_size', roster.length, {
  userId: user.id,
  rosterType: 'initial'
})

// Performance metric
tracer.trackMetric('component_render_time', renderDuration, {
  component: 'CharacterSelection',
  itemCount: characters.length
})
```

### Using Timers

```javascript
// Start a timer
const timer = tracer.startTimer('data_processing')

// Do some work...
processLargeDataset()

// Stop timer and track metric
const duration = timer.stop({ 
  recordCount: 1000,
  success: true 
})

console.log(`Processing took ${duration}ms`)
```

### Advanced Timer Usage

```javascript
const processRoster = async (roster) => {
  const timer = tracer.startTimer('roster_processing')
  
  try {
    // Validate roster
    await validateRoster(roster)
    
    // Save to storage
    await saveRoster(roster)
    
    timer.stop({ 
      charactersCount: roster.length,
      success: true 
    })
  } catch (error) {
    timer.stop({ 
      success: false,
      error: error.message 
    })
    throw error
  }
}
```

## Error Tracking

### Track Errors

```javascript
try {
  await riskyOperation()
} catch (error) {
  tracer.trackError(error, {
    operation: 'roster_submission',
    userId: user.id,
    rosterData: JSON.stringify(roster)
  })
  
  // Still show error to user
  showErrorMessage(error.message)
}
```

### Track Errors in Async Handlers

```javascript
const handleSubmit = async () => {
  try {
    const result = await submitRoster(roster)
    console.log('Roster submitted successfully')
  } catch (error) {
    console.error('Roster submission failed:', error)
    tracer.trackError(error, {
      context: 'roster_submission',
      roster: roster.prebuilt.map(c => c.id),
      timestamp: new Date().toISOString()
    })
  }
}
```

## Page View Tracking

```javascript
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function App() {
  const location = useLocation()
  
  useEffect(() => {
    // Track page view on route change
    const pageName = getPageName(location.pathname)
    tracer.trackPageView(pageName, location.pathname, {
      referrer: document.referrer,
      userAgent: navigator.userAgent
    })
  }, [location])
  
  // ... rest of component
}
```

## Complete Example: Form with Tracing

```javascript
import { useState } from 'react'
import { tracer } from '../telemetry'

function RosterForm() {
  const [roster, setRoster] = useState([])
  
  const handleCharacterSelect = (character) => {
    tracer.trackCharacterInteraction('selected', character, {
      position: roster.length,
      source: 'roster_form'
    })
    
    console.log(`Character selected: ${character.name}`)
    setRoster([...roster, character])
  }
  
  const handleSubmit = async () => {
    const timer = tracer.startTimer('roster_submission')
    
    try {
      tracer.trackUserAction('submit', 'roster_form', {
        characterCount: roster.length
      })
      
      const result = await submitRoster(roster)
      
      timer.stop({ success: true, rosterSize: roster.length })
      
      tracer.trackEvent('roster_locked', {
        characters: roster.map(c => c.name).join(', '),
        timestamp: new Date().toISOString()
      })
      
      console.log('Roster locked successfully')
      navigate('/dashboard')
      
    } catch (error) {
      timer.stop({ success: false })
      tracer.trackError(error, {
        operation: 'roster_submission',
        rosterSize: roster.length
      })
      console.error('Failed to submit roster:', error)
    }
  }
  
  return (
    // ... JSX
  )
}
```

## Best Practices

1. **Be Consistent**: Use consistent event names and property keys across your app
2. **Add Context**: Include relevant metadata with events to make debugging easier
3. **Track Errors**: Always track errors with context
4. **Use Timers**: Use timers for long-running operations to track performance
5. **Don't Over-Track**: Only track meaningful events that provide value
6. **Protect Privacy**: Never track PII (personally identifiable information) or sensitive data
7. **Use Categories**: Use the EventCategory constants for better organization

## Querying Telemetry in Azure

### Find Events by Category

```kusto
customEvents
| where customDimensions.category == "navigation"
| project timestamp, name, customDimensions
```

### Find Console Errors

```kusto
traces
| where severityLevel >= 3  // ERROR level
| where message startswith "[Console."
| project timestamp, message
```

### Track User Journey

```kusto
customEvents
| where customDimensions.userId == "abc123"
| order by timestamp asc
| project timestamp, name, customDimensions
```

### Performance Metrics

```kusto
customMetrics
| where name == "roster_processing"
| summarize avg(value), percentile(value, 95) by bin(timestamp, 1h)
```

---

For more information, see:
- [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) - Full deployment guide
- [README.md](./README.md) - Project overview
- [Application Insights Documentation](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)
