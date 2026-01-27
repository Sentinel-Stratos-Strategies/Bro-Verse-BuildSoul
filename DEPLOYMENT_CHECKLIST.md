# BroVerse Deployment Checklist

Use this checklist to ensure successful deployment to Azure.

## Pre-Deployment Setup

### Azure Resources
- [ ] Azure account is active and accessible
- [ ] Resource group created (or identified)
- [ ] Azure Static Web App created
  - Name: `broverse-app` (or your chosen name)
  - Region: Selected (e.g., Central US)
  - GitHub repository connected
- [ ] Application Insights resource created
  - Name: `broverse-insights` (or your chosen name)
  - Resource Type: Web
  - Connected to Static Web App

### GitHub Configuration
- [ ] Repository access confirmed: Sentinel-Stratos-Strategies/Bro-Verse-BuildSoul
- [ ] GitHub Actions enabled
- [ ] Required secrets added to repository:
  - [ ] `AZURE_STATIC_WEB_APPS_API_TOKEN`
  - [ ] `VITE_APPINSIGHTS_CONNECTION_STRING`

### Verify Workflow File
- [ ] File exists: `.github/workflows/azure-static-web-apps-broverse.yml`
- [ ] Node version set to 20.19.0
- [ ] Build command: `npm run build`
- [ ] App location: `frontend`
- [ ] Output location: `dist`

## Build & Test Locally

- [ ] Dependencies installed: `cd frontend && npm ci`
- [ ] Lint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Dev server runs: `npm run dev`
- [ ] Application loads in browser: http://localhost:5173

## Deployment

### Initial Deployment
- [ ] Push to `main` branch (or create PR and merge)
- [ ] GitHub Action triggers automatically
- [ ] Workflow runs successfully (check Actions tab)
- [ ] Build completes without errors
- [ ] Deployment succeeds

### Verify Deployment
- [ ] Application URL accessible (from Azure Portal)
- [ ] Home page loads correctly
- [ ] Navigation works (Home, Dashboard, Profile)
- [ ] Health check indicator visible (in dev/preview environments)
- [ ] Console shows no critical errors (F12 Dev Tools)

### Telemetry Verification
- [ ] Open Azure Portal → Application Insights
- [ ] Navigate to "Logs" section
- [ ] Run test query:
  ```kusto
  customEvents
  | where timestamp > ago(1h)
  | take 10
  ```
- [ ] Events are being logged
- [ ] Console traces visible
- [ ] Navigation events tracked

## Post-Deployment

### Application Testing
- [ ] Test character roster selection
- [ ] Test navigation between pages
- [ ] Test character interactions (if applicable)
- [ ] Verify all features work as expected

### Monitoring Setup
- [ ] Set up Application Insights alerts (optional)
- [ ] Configure availability tests (optional)
- [ ] Review telemetry data for errors
- [ ] Monitor performance metrics

### Documentation
- [ ] Update team on deployment URL
- [ ] Share Application Insights access
- [ ] Document any environment-specific configurations
- [ ] Update project README if needed

## Troubleshooting

If deployment fails:
- [ ] Check GitHub Actions logs for errors
- [ ] Verify all secrets are correctly set
- [ ] Ensure Node version matches (20.19.0)
- [ ] Verify build succeeds locally
- [ ] Check Azure Portal for deployment history
- [ ] Review Static Web App configuration

If telemetry not working:
- [ ] Verify `VITE_APPINSIGHTS_CONNECTION_STRING` secret is set
- [ ] Check browser console for Application Insights errors
- [ ] Ensure connection string format is correct
- [ ] Wait 2-5 minutes for data to appear in Azure Portal

## Security

- [ ] Never commit `.env` files or secrets
- [ ] GitHub secrets are properly configured (not exposed)
- [ ] Azure deployment token is current
- [ ] Review Application Insights data retention policies
- [ ] Consider IP restrictions for production (if needed)

## Maintenance

- [ ] Plan for regular dependency updates
- [ ] Monitor Azure costs and usage
- [ ] Review telemetry data regularly
- [ ] Update documentation as needed
- [ ] Test disaster recovery process

---

## Quick Reference

**Repository**: Sentinel-Stratos-Strategies/Bro-Verse-BuildSoul  
**Frontend Path**: `frontend/`  
**Build Output**: `frontend/dist/`  
**Node Version**: 20.19.0  
**Deployment**: Automatic via GitHub Actions on push to `main`

**Documentation**:
- Full guide: [AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)
- Project README: [README.md](./README.md)

---

**Last Updated**: January 2026  
**Status**: ✅ Ready for Deployment
