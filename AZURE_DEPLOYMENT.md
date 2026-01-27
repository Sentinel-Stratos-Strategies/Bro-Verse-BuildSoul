# Azure Deployment Guide for BroVerse

## Overview
BroVerse is configured for automatic deployment to Azure Static Web Apps via GitHub Actions. Every push to the `main` branch triggers a build and deployment.

## Prerequisites

1. **Azure Account**: Active Azure subscription
2. **GitHub Repository**: Access to Sentinel-Stratos-Strategies/Bro-Verse-BuildSoul
3. **Required Secrets**: The following GitHub secrets must be configured:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN`: Azure Static Web Apps deployment token
   - `VITE_APPINSIGHTS_CONNECTION_STRING`: Azure Application Insights connection string for telemetry

## Deployment Configuration

### GitHub Actions Workflow
Location: `.github/workflows/azure-static-web-apps-broverse.yml`

The workflow:
- Triggers on push to `main` branch and pull requests
- Uses Node.js 20.19.0
- Builds the frontend application with Vite
- Deploys to Azure Static Web Apps
- Injects environment variables during build

### Build Configuration
- **Frontend Directory**: `frontend/`
- **Output Directory**: `frontend/dist`
- **Build Command**: `npm run build`
- **Node Version**: 20.19.0

## Setup Steps

### 1. Create Azure Static Web App

```bash
# Using Azure CLI
az login
az staticwebapp create \
  --name broverse-app \
  --resource-group your-resource-group \
  --source https://github.com/Sentinel-Stratos-Strategies/Bro-Verse-BuildSoul \
  --location "centralus" \
  --branch main \
  --app-location "frontend" \
  --output-location "dist" \
  --login-with-github
```

### 2. Configure Application Insights

```bash
# Create Application Insights resource
az monitor app-insights component create \
  --app broverse-insights \
  --location centralus \
  --resource-group your-resource-group \
  --application-type web

# Get connection string
az monitor app-insights component show \
  --app broverse-insights \
  --resource-group your-resource-group \
  --query connectionString -o tsv
```

### 3. Add GitHub Secrets

Navigate to repository Settings → Secrets and variables → Actions:

1. **AZURE_STATIC_WEB_APPS_API_TOKEN**
   - Get from Azure Portal → Static Web App → Overview → Manage deployment token
   - Or from CLI: `az staticwebapp secrets list --name broverse-app`

2. **VITE_APPINSIGHTS_CONNECTION_STRING**
   - Copy from Application Insights connection string (step 2)
   - Format: `InstrumentationKey=xxx;IngestionEndpoint=https://xxx;LiveEndpoint=https://xxx`

## Telemetry & Tracing

### Application Insights Integration
BroVerse includes comprehensive telemetry:

- **Console Tracing**: All console.log/warn/error calls are automatically traced
- **Navigation Tracking**: Page views and route changes
- **User Actions**: Button clicks, form submissions
- **Character Interactions**: Chat opens/closes, roster selections
- **BroCalls**: Trigger, dismiss, and expiration events
- **API Calls**: LLM service calls with duration and success metrics
- **Performance**: Custom metrics and timers
- **Error Tracking**: Automatic exception tracking

### Viewing Telemetry Data

1. **Azure Portal**:
   - Navigate to Application Insights resource
   - Use "Logs" for custom queries
   - Use "Metrics" for performance data

2. **Example Queries**:

```kusto
// All custom events
customEvents
| where timestamp > ago(24h)
| project timestamp, name, customDimensions

// Navigation events
customEvents
| where name == "navigation"
| project timestamp, 
    from = tostring(customDimensions.from), 
    to = tostring(customDimensions.to)

// BroCalls activity
customEvents
| where customDimensions.category == "bro_call"
| summarize count() by tostring(customDimensions.action)

// Console logs with errors
traces
| where severityLevel >= 2
| project timestamp, message, severityLevel
```

## Local Development

### Setup
```bash
cd frontend
npm install
```

### Environment Variables
Create `frontend/.env.local`:
```
VITE_APPINSIGHTS_CONNECTION_STRING=your-connection-string
```

### Run Development Server
```bash
npm run dev
```
- Server runs on http://localhost:5173
- Hot module reloading enabled
- Telemetry works with local connection string

### Build for Production
```bash
npm run build
```
- Output: `frontend/dist/`
- Optimized and minified
- Environment variables baked in at build time

### Preview Production Build
```bash
npm run preview
```

## Deployment Process

### Automatic Deployment
1. Commit changes to feature branch
2. Create pull request to `main`
3. Workflow runs build and creates preview deployment
4. Merge PR to `main`
5. Workflow automatically deploys to production

### Manual Deployment
```bash
# Using Azure CLI with SWA CLI
npm install -g @azure/static-web-apps-cli
cd frontend
npm run build
swa deploy ./dist \
  --deployment-token $AZURE_STATIC_WEB_APPS_API_TOKEN \
  --app-name broverse-app
```

## Monitoring & Troubleshooting

### Check Deployment Status
- **GitHub**: Actions tab shows workflow runs
- **Azure Portal**: Static Web App → Deployment History

### View Application Logs
```bash
# Stream logs (if configured)
az webapp log tail --name broverse-app --resource-group your-resource-group
```

### Common Issues

1. **Build Fails**
   - Check Node version (must be 20.19.0+)
   - Verify all dependencies are in package.json
   - Review workflow logs in GitHub Actions

2. **Telemetry Not Working**
   - Verify VITE_APPINSIGHTS_CONNECTION_STRING is set
   - Check browser console for Application Insights errors
   - Ensure connection string format is correct

3. **Deployment Token Invalid**
   - Regenerate token in Azure Portal
   - Update GitHub secret
   - Re-run workflow

## Cost Estimation

### Azure Static Web Apps
- **Free Tier**: 
  - 100 GB bandwidth/month
  - 0.5 GB storage
  - No custom domains
  
- **Standard Tier** (~$9/month):
  - Unlimited bandwidth
  - Custom domains
  - SLA support

### Application Insights
- **Free Tier**: 5 GB data ingestion/month
- **Pay-as-you-go**: $2.30/GB after free tier
- **Typical usage**: ~1-2 GB/month for medium traffic

## Production Checklist

- [ ] Azure Static Web App created
- [ ] Application Insights configured
- [ ] GitHub secrets added (both required)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with SWA)
- [ ] Telemetry verified in Azure Portal
- [ ] Build succeeds locally
- [ ] GitHub Actions workflow runs successfully
- [ ] Application accessible at deployed URL
- [ ] All features tested in production
- [ ] Monitoring alerts configured (optional)

## Support Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Application Insights Documentation](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Actions Documentation](https://docs.github.com/actions)

## Security Notes

- Never commit `.env` files or secrets to the repository
- Use GitHub Secrets for all sensitive configuration
- Application Insights connection string is safe to expose in client-side code
- Regularly rotate Azure deployment tokens
- Review Application Insights data retention policies

---

**Last Updated**: January 2026
**Maintained By**: The Sentinel • Sacred Construction
