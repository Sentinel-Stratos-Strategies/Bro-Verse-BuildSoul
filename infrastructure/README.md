# Infrastructure

This directory contains Infrastructure-as-Code (IaC) for deploying and managing Azure resources for the Bro-Verse-BuildSoul project.

## Available Infrastructure

### Azure VM for Axiom Forensic Software

Complete infrastructure setup for deploying a Windows VM configured to run Axiom forensic software.

**Location**: `azure/`

**Quick Deploy:**
```bash
cd azure
./deploy-vm.sh  # Linux/macOS/WSL
```
or
```powershell
cd azure
.\deploy-vm.ps1  # Windows PowerShell
```

**VM Specifications:**
- **Region**: US Central
- **OS**: Windows Server 2022 Datacenter Azure Edition
- **VM Size**: Standard_D8s_v3 (8 vCPU, 32GB RAM)
- **Storage**: 
  - 100GB Premium SSD (OS disk)
  - 1TB Premium SSD (Data disk for forensic files)
- **Network**: Public IP with RDP access
- **Estimated Cost**: ~$450-520/month

**Prerequisites:**
- Azure CLI installed ([Download](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
- Active Azure subscription
- Logged in to Azure (`az login`)

## Documentation

### Getting Started
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete step-by-step deployment instructions
- **[Architecture](ARCHITECTURE.md)** - Visual diagrams and technical architecture

### Detailed Documentation
- **[Azure README](azure/README.md)** - Comprehensive guide with all details
- **[Quick Reference](azure/QUICK_REFERENCE.md)** - Common commands and operations

## What Gets Deployed

The infrastructure deployment creates:
- ✅ Resource Group (`forensic-vm-rg`)
- ✅ Virtual Network with subnet
- ✅ Network Security Group with RDP access
- ✅ Public IP address (Static)
- ✅ Network Interface
- ✅ Windows Server 2022 VM
- ✅ 100GB Premium SSD OS disk
- ✅ 1TB Premium SSD data disk

## Common Operations

### Deploy Infrastructure
```bash
cd azure
./deploy-vm.sh
```

### Start/Stop VM
```bash
# Start
az vm start --resource-group forensic-vm-rg --name axiom-forensic-vm

# Stop (deallocate to stop billing)
az vm deallocate --resource-group forensic-vm-rg --name axiom-forensic-vm
```

### Get Connection Info
```bash
az vm show -d \
  --resource-group forensic-vm-rg \
  --name axiom-forensic-vm \
  --query publicIps -o tsv
```

### Delete Everything
```bash
az group delete --name forensic-vm-rg --yes
```

## File Structure

```
infrastructure/
├── README.md                    # This file
├── DEPLOYMENT_GUIDE.md          # Complete deployment guide
├── ARCHITECTURE.md              # Architecture diagrams
├── .gitignore                   # Git ignore rules
└── azure/
    ├── forensic-vm.bicep        # Main Bicep template
    ├── forensic-vm.json         # Compiled ARM template
    ├── forensic-vm.parameters.json  # Deployment parameters
    ├── deploy-vm.sh             # Bash deployment script
    ├── deploy-vm.ps1            # PowerShell deployment script
    ├── README.md                # Azure-specific documentation
    └── QUICK_REFERENCE.md       # Quick command reference
```

## Security Notes

⚠️ **Important**: The initial configuration allows RDP access from any IP address for ease of setup. After deployment, restrict access to your IP:

```bash
MY_IP=$(curl -s ifconfig.me)
az network nsg rule update \
  --resource-group forensic-vm-rg \
  --nsg-name forensic-nsg \
  --name AllowRDP \
  --source-address-prefix "$MY_IP/32"
```

For production use, consider:
- Azure Bastion for secure RDP without public IP
- Azure Disk Encryption for data protection
- Azure Backup for disaster recovery
- Just-in-Time VM access

## Cost Management

**Estimated monthly cost**: ~$450-520
- VM: $280-350
- Storage: $165
- Network: $5-10

**Save costs by**:
- Deallocating VM when not in use (saves 60-70%)
- Using Reserved Instances (saves 40-60%)
- Auto-shutdown during non-working hours

## Support

For issues or questions:
1. Check the [Troubleshooting section](azure/README.md#troubleshooting)
2. Review [Azure VM documentation](https://docs.microsoft.com/en-us/azure/virtual-machines/)
3. Open an issue in this repository

## Next Steps

1. ✅ Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. ✅ Ensure Azure CLI is installed and configured
3. ✅ Run `az login`
4. ✅ Execute deployment script
5. ✅ Connect via RDP
6. ✅ Initialize data disk
7. ✅ Install Axiom software
8. ✅ Secure RDP access
