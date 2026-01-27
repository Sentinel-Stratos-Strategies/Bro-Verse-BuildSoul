# Tracing Quick Test

This file demonstrates how to verify the tracing implementation is working.

## Prerequisites

1. Set up Azure Application Insights connection string in `.env`:
```bash
VITE_APPINSIGHTS_CONNECTION_STRING=your_connection_string_here
```

## Test Steps

### 1. Start the Development Server

```bash
cd frontend
npm install
npm run dev
```

### 2. Open Browser Console

Navigate to `http://localhost:5173` and open the browser's developer console (F12).

### 3. Expected Console Output

You should see telemetry logs similar to:

```
[Telemetry] Event tracked: app_start
[Telemetry] Page view tracked: HomePage
[Telemetry] Event tracked: component_lifecycle { component: 'HomePage', lifecycle: 'mount' }
```

### 4. Test User Interactions

Click around the application:

- Click "Build Your Roster" button
- Navigate to Dashboard
- Navigate to Profile
- Click on character cards

Each action should log to console:

```
[Telemetry] Event tracked: user_action { action: 'click', target: 'build-roster-button' }
[Telemetry] Event tracked: navigation { from: '/', to: '/dashboard' }
```

### 5. Test Error Tracking

To test error boundary, you can temporarily break a component:

```javascript
// Add to any component for testing
throw new Error('Test error for telemetry')
```

You should see:
```
[Telemetry] Error tracked: Error: Test error for telemetry
```

### 6. Verify in Azure Portal

1. Go to Azure Portal → Your Application Insights resource
2. Navigate to "Live Metrics" - you should see real-time data
3. Navigate to "Logs" and run:

```kql
customEvents
| where timestamp > ago(5m)
| project timestamp, name, customDimensions
| order by timestamp desc
```

## Without Azure Connection String

If you don't set the connection string, you'll see:

```
App Insights connection string missing. Set VITE_APPINSIGHTS_CONNECTION_STRING to enable tracing.
```

The app will still work normally, but telemetry won't be sent to Azure (only logged to console).

## Example Tracked Events

| Event Type | Event Name | Example Data |
|------------|------------|--------------|
| Page View | `HomePage`, `DashboardPage` | `{ timestamp: '2026-01-27...' }` |
| Navigation | `navigation` | `{ from: '/', to: '/dashboard' }` |
| User Action | `user_action` | `{ action: 'click', target: 'nav-home' }` |
| Component Lifecycle | `component_lifecycle` | `{ component: 'HomePage', lifecycle: 'mount' }` |
| Error | exception | `{ componentStack: '...', errorMessage: '...' }` |

## Troubleshooting

### No Console Logs

- Check that you're running the dev server
- Verify you're on the correct URL
- Check browser console is set to show all messages (not just errors)

### No Data in Azure

- Verify connection string is correct
- Check that it starts with `InstrumentationKey=`
- Wait 1-2 minutes for data to appear
- Check "Live Metrics" for real-time view

### Build Errors

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Success Criteria

✅ Dev server starts without errors
✅ Console shows `[Telemetry]` logs
✅ Navigation events are tracked
✅ User actions are tracked
✅ Error boundary catches errors
✅ Data appears in Azure Live Metrics (if configured)

---

**The BroVerse • Built by The Sentinel • Sacred Construction**
