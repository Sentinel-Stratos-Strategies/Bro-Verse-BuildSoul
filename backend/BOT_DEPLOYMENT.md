# BroVerse Bot Deployment Guide

## Overview

This guide covers deploying containerized AI persona bots to Azure Container Apps.

## Architecture

```
┌─────────────────────┐
│  Frontend (SWA)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  API (App Service)  │
│  /ai-profiles/chat  │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Azure Container Apps Environment    │
│  ┌────────────┐  ┌────────────┐     │
│  │ Bot:       │  │ Bot:       │     │
│  │ dick-diggs │  │ harbor     │ ... │
│  └────────────┘  └────────────┘     │
└──────────────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Cosmos DB          │
│  (conversation)     │
└─────────────────────┘
```

## Components

### 1. Bot Service (`bot-service.js`)
- Node.js Express server (port 3001)
- Loads persona system prompt from `ai-personas/`
- Calls OpenAI API with system prompt + conversation history
- Stores messages in Cosmos DB
- Returns AI response to API

### 2. Docker Image (`Dockerfile.bot`)
- Based on `node:20-alpine`
- Includes bot service code + all persona prompts
- Health check endpoint: `/health`
- Environment variables:
  - `PERSONA_NAME` - Which persona to load (e.g., "dick-diggs")
  - `COSMOS_ENDPOINT` - Cosmos DB endpoint
  - `COSMOS_KEY` - Cosmos DB key
  - `OPENAI_API_KEY` - OpenAI API key
  - `OPENAI_MODEL` - Model to use (default: gpt-4)

### 3. Azure Resources
- **Azure Container Registry (ACR)** - Stores Docker images
- **Container Apps Environment** - Manages all bot containers
- **Container Apps** - Individual bot instances (1 per persona)

## Deployment Steps

### Prerequisites
```bash
# Ensure you're logged into Azure CLI
az login

# Set environment variables
export COSMOS_ENDPOINT="https://broverse-cosmos769602529.documents.azure.com:443/"
export COSMOS_KEY="<your-cosmos-key>"
export OPENAI_API_KEY="<your-openai-key>"
```

### Deploy Bots
```bash
cd backend
./deploy-bots.sh
```

This script:
1. Creates Azure Container Registry (`broverseacr`)
2. Builds Docker image and pushes to ACR
3. Creates Container Apps environment
4. Deploys 5 bot containers (dick-diggs, harbor, marvin, rgan-stone, rocky-top)
5. Configures environment variables for each bot

### Verify Deployment
```bash
# Check bot health
curl https://broverse-bot-dick-diggs.<domain>/health

# Response:
# {
#   "status": "healthy",
#   "persona": "dick-diggs",
#   "promptLoaded": true,
#   "timestamp": "2026-01-28T06:30:00.000Z"
# }

# Test chat
curl -X POST https://broverse-bot-dick-diggs.<domain>/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "message": "Help me close this deal",
    "conversationHistory": []
  }'
```

## API Integration

The main API (`/ai-profiles/:userId/personas/:personaId/chat`) routes requests to bot containers:

1. **Resolve bot URL**: Convert persona name to slug (e.g., "Dick Diggs" → "dick-diggs")
2. **Call bot service**: POST `/chat` with userId, message, recent history
3. **Store conversation**: Bot service stores messages in Cosmos DB
4. **Return response**: API returns bot response to frontend

### Environment Variables (API)
```bash
# Optional: Override bot service URLs
BOT_SERVICE_DICK_DIGGS_URL=https://broverse-bot-dick-diggs.internal
BOT_SERVICE_HARBOR_URL=https://broverse-bot-harbor.internal
# ... etc

# Container Apps domain (if using custom domain)
CONTAINER_APPS_DOMAIN=internal
```

## Scaling to 20 Personas

### Current Deployment (5 personas)
- dick-diggs
- harbor
- marvin
- rgan-stone
- rocky-top

### Phase 2 (Add 13 placeholders)
Edit `deploy-bots.sh` and add to `PERSONAS` array:
```bash
PERSONAS=(
  "dick-diggs"
  "harbor"
  "marvin"
  "rgan-stone"
  "rocky-top"
  "the-coach"
  "the-strategist"
  "the-healer"
  "the-warrior"
  "the-artist"
  "the-monk"
  "the-builder"
  "the-mentor"
  "the-rebel"
  "the-scientist"
  "the-storyteller"
  "the-navigator"
  "the-guardian"
)
```

Then redeploy:
```bash
./deploy-bots.sh
```

## Cost Estimation

### Per Bot Container
- CPU: 0.5 vCPU
- Memory: 1 GB
- Replicas: 1-3 (autoscale)
- Cost: ~$15-30/month per container (idle to active)

### Total Cost (20 personas)
- 20 containers × $20/month avg = **$400/month**
- OpenAI API calls: **Variable** (depends on usage)
- Total estimate: **$400-600/month**

### Cost Optimization
1. **Start with 5 personas** - Deploy only high-traffic bots first
2. **Scale down replicas** - Set min replicas to 0 for low-traffic bots
3. **Use cheaper models** - GPT-3.5-turbo for less critical personas
4. **Batch processing** - Combine low-traffic bots into single container

## Monitoring

### Health Checks
```bash
# Check all bots
for persona in dick-diggs harbor marvin rgan-stone rocky-top; do
  echo "Checking $persona..."
  curl -s https://broverse-bot-$persona.internal/health | jq .
done
```

### Logs
```bash
# View bot logs
az containerapp logs show \
  --name broverse-bot-dick-diggs \
  --resource-group broverse-rg \
  --follow
```

### Metrics
- Container Apps → Metrics → Request count, Response time
- Monitor OpenAI API usage in OpenAI dashboard
- Track Cosmos DB RU consumption

## Troubleshooting

### Bot Returns 500 Error
1. Check bot logs: `az containerapp logs show --name broverse-bot-<persona> --resource-group broverse-rg`
2. Verify environment variables are set
3. Test OpenAI API key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

### Persona Prompt Not Loading
1. Verify persona name matches file: `ai-personas/<persona-name>.txt`
2. Check Dockerfile.bot copies ai-personas/ folder
3. Rebuild image: `az acr build --registry broverseacr --image broverse-bot:latest --file Dockerfile.bot .`

### API Can't Reach Bot Service
1. Verify bot service is running: `curl https://<bot-url>/health`
2. Check ingress is set to 'internal' for Container Apps
3. Verify API and bots are in same virtual network/environment

## Next Steps

1. ✅ Deploy 5 initial bots (`./deploy-bots.sh`)
2. ✅ Test chat functionality via API
3. 🔲 Deploy remaining 13 placeholder bots
4. 🔲 Update frontend to call new chat endpoint
5. 🔲 Add conversation history UI
6. 🔲 Implement bot analytics/monitoring

## References

- [Azure Container Apps Docs](https://learn.microsoft.com/azure/container-apps/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Cosmos DB Node.js SDK](https://learn.microsoft.com/azure/cosmos-db/nosql/quickstart-nodejs)
