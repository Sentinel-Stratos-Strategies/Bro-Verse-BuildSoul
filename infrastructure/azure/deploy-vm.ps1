# Deploy Axiom Forensic VM to Azure
# This script deploys a Windows VM with 32GB RAM for running Axiom forensic software

$ErrorActionPreference = "Stop"

# Configuration
$ResourceGroupName = "forensic-vm-rg"
$Location = "centralus"
$DeploymentName = "forensic-vm-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$TemplateFile = "forensic-vm.bicep"
$ParametersFile = "forensic-vm.parameters.json"

Write-Host "==========================================="
Write-Host "Azure VM Deployment for Axiom Forensic Software"
Write-Host "==========================================="
Write-Host ""

# Check if Azure CLI is installed
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Azure CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Check if logged in to Azure
Write-Host "Checking Azure login status..."
try {
    $null = az account show 2>&1
} catch {
    Write-Host "You are not logged in to Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

# Display current subscription
$Subscription = az account show --query name -o tsv
Write-Host "Current Azure Subscription: $Subscription"
Write-Host ""

# Prompt for admin password
$AdminPassword = Read-Host "Please enter the admin password for the VM" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($AdminPassword)
$AdminPasswordPlainText = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ([string]::IsNullOrEmpty($AdminPasswordPlainText)) {
    Write-Host "Error: Admin password cannot be empty." -ForegroundColor Red
    exit 1
}

# Create resource group
Write-Host "Creating resource group: $ResourceGroupName in $Location..."
az group create `
    --name $ResourceGroupName `
    --location $Location `
    --output table

Write-Host ""
Write-Host "Deploying VM infrastructure..."
Write-Host "This may take 5-10 minutes..."
Write-Host ""

# Deploy the Bicep template
az deployment group create `
    --name $DeploymentName `
    --resource-group $ResourceGroupName `
    --template-file $TemplateFile `
    --parameters $ParametersFile `
    --parameters adminPassword=$AdminPasswordPlainText `
    --output table

Write-Host ""
Write-Host "==========================================="
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "==========================================="
Write-Host ""

# Get deployment outputs
Write-Host "Retrieving connection information..."
$VmName = az deployment group show `
    --name $DeploymentName `
    --resource-group $ResourceGroupName `
    --query properties.outputs.vmName.value -o tsv

$PublicIP = az deployment group show `
    --name $DeploymentName `
    --resource-group $ResourceGroupName `
    --query properties.outputs.publicIPAddress.value -o tsv

$Fqdn = az deployment group show `
    --name $DeploymentName `
    --resource-group $ResourceGroupName `
    --query properties.outputs.fqdn.value -o tsv

$AdminUser = az deployment group show `
    --name $DeploymentName `
    --resource-group $ResourceGroupName `
    --query properties.outputs.adminUsername.value -o tsv

$VmSize = az deployment group show `
    --name $DeploymentName `
    --resource-group $ResourceGroupName `
    --query properties.outputs.vmSize.value -o tsv

Write-Host ""
Write-Host "VM Connection Information:"
Write-Host "-------------------------"
Write-Host "VM Name:          $VmName"
Write-Host "VM Size:          $VmSize (8 vCPU, 32GB RAM)"
Write-Host "Public IP:        $PublicIP"
Write-Host "FQDN:             $Fqdn"
Write-Host "Admin Username:   $AdminUser"
Write-Host "RDP Port:         3389"
Write-Host ""
Write-Host "To connect via RDP:"
Write-Host "  mstsc /v:$PublicIP"
Write-Host ""
Write-Host "Or use the FQDN:"
Write-Host "  mstsc /v:$Fqdn"
Write-Host ""
Write-Host "Data Disk Information:"
Write-Host "----------------------"
Write-Host "A 1TB data disk has been attached to the VM."
Write-Host "After connecting, you'll need to:"
Write-Host "  1. Open Disk Management (diskmgmt.msc)"
Write-Host "  2. Initialize the new disk (GPT recommended)"
Write-Host "  3. Create a new volume and format it (NTFS recommended)"
Write-Host "  4. Assign a drive letter (e.g., D: or E:)"
Write-Host ""
Write-Host "Next Steps:"
Write-Host "-----------"
Write-Host "1. Connect to the VM using RDP"
Write-Host "2. Initialize and format the data disk"
Write-Host "3. Install Axiom forensic software"
Write-Host "4. Configure additional drives as needed"
Write-Host ""

# Clear the password from memory
$AdminPasswordPlainText = $null
$AdminPassword = $null
[System.GC]::Collect()
