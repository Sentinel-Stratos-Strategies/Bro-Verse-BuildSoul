#!/bin/bash

# BroVerse Bot Deployment Script
# Deploys containerized AI personas to Azure Container Apps

set -e

# Configuration
RESOURCE_GROUP="broverse-rg"
LOCATION="centralus"
ACR_NAME="broverseacr"
CONTAINER_ENV_NAME="broverse-container-env"
COSMOS_ENDPOINT="${COSMOS_ENDPOINT}"
COSMOS_KEY="${COSMOS_KEY}"
OPENAI_API_KEY="${OPENAI_API_KEY}"

# Personas to deploy (start with 5, scale to 20 later)
PERSONAS=(
  "dick-diggs"
  "harbor"
  "marvin"
  "rgan-stone"
  "rocky-top"
)

echo "🚀 BroVerse Bot Deployment"
echo "=================================="
echo ""

# Step 1: Create Azure Container Registry
echo "📦 Step 1: Create Azure Container Registry"
if ! az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
  echo "   Creating ACR: $ACR_NAME..."
  az acr create \
    --resource-group $RESOURCE_GROUP \
    --name $ACR_NAME \
    --sku Basic \
    --admin-enabled true \
    --location $LOCATION
  echo "   ✅ ACR created"
else
  echo "   ✅ ACR already exists"
fi

# Step 2: Build and push bot image
echo ""
echo "🐳 Step 2: Build Docker image"
echo "   Building broverse-bot:latest..."
cd "$(dirname "$0")/.."
az acr build \
  --registry $ACR_NAME \
  --image broverse-bot:latest \
  --file Dockerfile.bot \
  .
echo "   ✅ Image built and pushed to ACR"

# Step 3: Get ACR credentials
echo ""
echo "🔑 Step 3: Get ACR credentials"
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer --output tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query passwords[0].value --output tsv)
echo "   ✅ ACR Server: $ACR_LOGIN_SERVER"

# Step 4: Create Container Apps environment
echo ""
echo "🌍 Step 4: Create Container Apps environment"
if ! az containerapp env show --name $CONTAINER_ENV_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
  echo "   Creating environment: $CONTAINER_ENV_NAME..."
  az containerapp env create \
    --name $CONTAINER_ENV_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION
  echo "   ✅ Environment created"
else
  echo "   ✅ Environment already exists"
fi

# Step 5: Deploy each persona as a container app
echo ""
echo "🤖 Step 5: Deploy persona containers"
for PERSONA in "${PERSONAS[@]}"; do
  APP_NAME="broverse-bot-${PERSONA}"
  echo ""
  echo "   Deploying: $PERSONA"
  
  # Delete existing app if exists
  if az containerapp show --name $APP_NAME --resource-group $RESOURCE_GROUP &>/dev/null; then
    echo "      Deleting existing app..."
    az containerapp delete \
      --name $APP_NAME \
      --resource-group $RESOURCE_GROUP \
      --yes
  fi
  
  # Create new container app
  az containerapp create \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --environment $CONTAINER_ENV_NAME \
    --image "${ACR_LOGIN_SERVER}/broverse-bot:latest" \
    --registry-server $ACR_LOGIN_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --target-port 3001 \
    --ingress 'internal' \
    --min-replicas 1 \
    --max-replicas 3 \
    --cpu 0.5 \
    --memory 1Gi \
    --env-vars \
      PERSONA_NAME=$PERSONA \
      COSMOS_ENDPOINT=$COSMOS_ENDPOINT \
      COSMOS_KEY=$COSMOS_KEY \
      OPENAI_API_KEY=$OPENAI_API_KEY \
      OPENAI_MODEL=gpt-4 \
      PORT=3001
  
  # Get container app FQDN
  FQDN=$(az containerapp show \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query properties.configuration.ingress.fqdn \
    --output tsv)
  
  echo "      ✅ Deployed: https://$FQDN"
done

echo ""
echo "=================================="
echo "✅ Deployment complete!"
echo ""
echo "📋 Deployed personas:"
for PERSONA in "${PERSONAS[@]}"; do
  APP_NAME="broverse-bot-${PERSONA}"
  FQDN=$(az containerapp show \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --query properties.configuration.ingress.fqdn \
    --output tsv 2>/dev/null || echo "ERROR")
  echo "   • $PERSONA: https://$FQDN"
done

echo ""
echo "🔧 Next steps:"
echo "   1. Test bot endpoints: curl https://<fqdn>/health"
echo "   2. Update API to route chat requests to bot containers"
echo "   3. Deploy remaining 15 personas"
echo ""
