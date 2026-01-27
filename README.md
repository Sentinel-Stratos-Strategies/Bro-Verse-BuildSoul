# Bro-Verse-BuildSoul
Rebuilding Better

## Overview
BroVerse is an AI-powered character interaction platform with 19 archetypes + 1 custom character. Built with React, deployed on Azure Static Web Apps, with comprehensive telemetry via Application Insights.

## Features
- **Character Roster**: Select 4 prebuilt characters + create 1 custom Alpha Bro
- **Bro Calls**: Receive 3 random calls per week (7-10 seconds each)
- **AI-Powered Chat**: Interact with characters using their unique voice styles
- **30-Day Lock**: Commit to your roster for consistent growth
- **Comprehensive Tracing**: Full telemetry with Azure Application Insights

## Quick Start

### Prerequisites
- Node.js 20.19.0 or higher
- npm or yarn

### Local Development

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173

### Build for Production

```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/`

### Lint

```bash
cd frontend
npm run lint
```

## Telemetry & Tracing

BroVerse includes comprehensive telemetry powered by Azure Application Insights:

- **Console Tracing**: All console.log/warn/error calls automatically traced
- **Navigation Tracking**: Page views and route changes
- **User Actions**: Button clicks, form submissions
- **Character Interactions**: Chat opens/closes, roster selections
- **BroCalls**: Trigger, dismiss, and expiration events
- **API Calls**: LLM service calls with duration and success metrics
- **Performance**: Custom metrics and timers
- **Error Tracking**: Automatic exception tracking

### Configuration

Set `VITE_APPINSIGHTS_CONNECTION_STRING` in your environment:

```bash
# .env.local
VITE_APPINSIGHTS_CONNECTION_STRING=your-connection-string-here
```

## Azure Deployment

This project is configured for automatic deployment to Azure Static Web Apps. See [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md) for complete deployment instructions.

### Required GitHub Secrets
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: Azure deployment token
- `VITE_APPINSIGHTS_CONNECTION_STRING`: Application Insights connection string

## Project Structure

```
Bro-Verse-BuildSoul/
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── telemetry/      # Tracing and telemetry
│   │   ├── data/           # Character data and messages
│   │   └── assets/         # Static assets
│   ├── public/             # Public assets
│   └── package.json
├── .github/
│   └── workflows/          # GitHub Actions
├── AZURE_DEPLOYMENT.md     # Deployment guide
└── README.md
```

## Contributing

This is sacred construction. Every commit matters. Every feature serves the mission.

## License

See [LICENSE](./LICENSE)

---

**The BroVerse • Built by The Sentinel • Sacred Construction**

