# BroVerse Deployment Guide

This guide will help you deploy your BroVerse app to production.

## 🚀 Azure Static Web Apps (Recommended)

Azure Static Web Apps is perfect for this React application with automatic CI/CD from GitHub.

### Prerequisites
- Azure account
- GitHub account (you already have this!)
- Azure CLI (optional, can use Azure Portal)

### Deploy via Azure Portal

1. **Go to Azure Portal** (https://portal.azure.com)

2. **Create Static Web App**:
   - Click "Create a resource"
   - Search for "Static Web Apps"
   - Click "Create"

3. **Configure**:
   - **Subscription**: Choose your subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `broverse` (or your preferred name)
   - **Plan type**: Free (perfect for getting started)
   - **Region**: Choose closest to your users
   - **Source**: GitHub
   - **Organization**: Sentinel-Stratos-Strategies
   - **Repository**: Bro-Verse-BuildSoul
   - **Branch**: main (or your preferred branch)

4. **Build Details**:
   - **App location**: `/frontend`
   - **Api location**: (leave empty)
   - **Output location**: `dist`

5. **Click "Review + Create"** then **"Create"**

6. **Automatic Deployment**:
   - Azure will automatically add a GitHub Actions workflow
   - Every push to your branch will trigger a deployment
   - First deployment starts immediately

### Your App Will Be Live At:
`https://broverse-<random>.azurestaticapps.net`

### Configure Custom Domain (Optional)
Once deployed, you can add your custom domain in the Azure Portal:
1. Go to your Static Web App resource
2. Click "Custom domains"
3. Follow the wizard to add your domain

## 🔧 Environment Variables in Azure

If you want to use Azure Application Insights:

1. In Azure Portal, go to your Static Web App
2. Click "Configuration" in the left menu
3. Add application setting:
   - **Name**: `VITE_APPINSIGHTS_CONNECTION_STRING`
   - **Value**: Your Application Insights connection string

## 🌐 Alternative Deployment Options

### GitHub Pages

1. Update `vite.config.js` to set base path:
   ```js
   export default defineConfig({
     base: '/Bro-Verse-BuildSoul/',
     plugins: [react()],
   })
   ```

2. Build and deploy:
   ```bash
   cd frontend
   npm run build
   npx gh-pages -d dist
   ```

### Netlify

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
3. Deploy!

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend: `cd frontend`
3. Run: `vercel`
4. Follow the prompts

## 📊 Monitoring (Optional)

### Azure Application Insights

1. Create an Application Insights resource in Azure
2. Copy the connection string
3. Add to your environment variables (see above)
4. Telemetry will automatically start flowing

### What You'll See:
- Page views and user sessions
- Custom events from the app
- Performance metrics
- Error tracking

## 🔒 Security Checklist

Before deploying to production:

- [ ] Environment variables are set in your hosting platform (not in code)
- [ ] `.env` file is in `.gitignore` (already done ✅)
- [ ] HTTPS is enabled (automatic with all recommended hosts)
- [ ] Custom domain configured (optional)
- [ ] Application Insights configured for monitoring (optional)

## 🎯 Quick Start Commands

**Build for production:**
```bash
cd frontend
npm run build
```

**Test production build locally:**
```bash
npm run preview
```

**Deploy to Azure (with Azure CLI):**
```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name broverse-rg --location eastus

# Deploy (Azure will guide you through setup)
az staticwebapp create \
  --name broverse \
  --resource-group broverse-rg \
  --source https://github.com/Sentinel-Stratos-Strategies/Bro-Verse-BuildSoul \
  --location eastus \
  --branch main \
  --app-location "/frontend" \
  --output-location "dist"
```

## 💡 Tips

- **Free Tiers**: All recommended hosting platforms offer free tiers perfect for getting started
- **CI/CD**: Azure and Vercel provide automatic deployments on every push
- **Preview Deployments**: Most platforms create preview URLs for pull requests
- **Rollback**: Easy to rollback to previous deployments if needed

## 🆘 Need Help?

- Azure Static Web Apps docs: https://docs.microsoft.com/azure/static-web-apps/
- Vite deployment guide: https://vitejs.dev/guide/static-deploy.html
- GitHub Actions for Azure: https://github.com/Azure/static-web-apps-deploy

---

**The BroVerse • Built by The Sentinel • Sacred Construction**
