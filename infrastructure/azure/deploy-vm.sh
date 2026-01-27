#!/bin/bash
# Deploy Axiom Forensic VM to Azure
# This script deploys a Windows VM with 32GB RAM for running Axiom forensic software

set -e

# Configuration
RESOURCE_GROUP_NAME="forensic-vm-rg"
LOCATION="centralus"
DEPLOYMENT_NAME="forensic-vm-deployment-$(date +%Y%m%d-%H%M%S)"
TEMPLATE_FILE="forensic-vm.bicep"
PARAMETERS_FILE="forensic-vm.parameters.json"

echo "==========================================="
echo "Azure VM Deployment for Axiom Forensic Software"
echo "==========================================="
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Please install it first."
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
echo "Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "You are not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Display current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo "Current Azure Subscription: $SUBSCRIPTION"
echo ""

# Prompt for admin password
echo "Please enter the admin password for the VM:"
read -s ADMIN_PASSWORD
echo ""

if [ -z "$ADMIN_PASSWORD" ]; then
    echo "Error: Admin password cannot be empty."
    exit 1
fi

# Create resource group
echo "Creating resource group: $RESOURCE_GROUP_NAME in $LOCATION..."
az group create \
    --name "$RESOURCE_GROUP_NAME" \
    --location "$LOCATION" \
    --output table

echo ""
echo "Deploying VM infrastructure..."
echo "This may take 5-10 minutes..."
echo ""

# Deploy the Bicep template
az deployment group create \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --template-file "$TEMPLATE_FILE" \
    --parameters "$PARAMETERS_FILE" \
    --parameters adminPassword="$ADMIN_PASSWORD" \
    --output table

echo ""
echo "==========================================="
echo "Deployment completed successfully!"
echo "==========================================="
echo ""

# Get deployment outputs
echo "Retrieving connection information..."
VM_NAME=$(az deployment group show \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --query properties.outputs.vmName.value -o tsv)

PUBLIC_IP=$(az deployment group show \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --query properties.outputs.publicIPAddress.value -o tsv)

FQDN=$(az deployment group show \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --query properties.outputs.fqdn.value -o tsv)

ADMIN_USER=$(az deployment group show \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --query properties.outputs.adminUsername.value -o tsv)

VM_SIZE=$(az deployment group show \
    --name "$DEPLOYMENT_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --query properties.outputs.vmSize.value -o tsv)

echo ""
echo "VM Connection Information:"
echo "-------------------------"
echo "VM Name:          $VM_NAME"
echo "VM Size:          $VM_SIZE (8 vCPU, 32GB RAM)"
echo "Public IP:        $PUBLIC_IP"
echo "FQDN:             $FQDN"
echo "Admin Username:   $ADMIN_USER"
echo "RDP Port:         3389"
echo ""
echo "To connect via RDP:"
echo "  mstsc /v:$PUBLIC_IP"
echo ""
echo "Or use the FQDN:"
echo "  mstsc /v:$FQDN"
echo ""
echo "Data Disk Information:"
echo "----------------------"
echo "A 1TB data disk has been attached to the VM."
echo "After connecting, you'll need to:"
echo "  1. Open Disk Management (diskmgmt.msc)"
echo "  2. Initialize the new disk (GPT recommended)"
echo "  3. Create a new volume and format it (NTFS recommended)"
echo "  4. Assign a drive letter (e.g., D: or E:)"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Connect to the VM using RDP"
echo "2. Initialize and format the data disk"
echo "3. Install Axiom forensic software"
echo "4. Configure additional drives as needed"
echo ""
