# Azure VM Deployment Summary

## What Has Been Created

This repository now includes a complete Azure infrastructure setup for deploying a Windows VM configured specifically for running Axiom forensic software.

## Files Added

### Infrastructure Templates
- **`forensic-vm.bicep`** - Azure Bicep Infrastructure-as-Code template defining all resources
- **`forensic-vm.parameters.json`** - Configuration parameters for the deployment

### Deployment Scripts
- **`deploy-vm.sh`** - Automated deployment script for Linux/macOS/WSL
- **`deploy-vm.ps1`** - Automated deployment script for Windows PowerShell

### Documentation
- **`README.md`** - Comprehensive guide covering deployment, configuration, and management
- **`QUICK_REFERENCE.md`** - Quick command reference for common operations
- **`.gitignore`** - Git ignore rules to prevent committing sensitive files

## VM Specifications

### Compute & Storage
- **VM Size**: Standard_D8s_v3
  - 8 vCPUs
  - 32GB RAM
  - Sufficient for Axiom forensic processing
- **OS Disk**: 100GB Premium SSD
  - For Windows Server 2022 and Axiom software
- **Data Disk**: 1TB (1024GB) Premium SSD
  - For forensic case files and evidence data
  - High-performance storage for large forensic images

### Location & Operating System
- **Region**: US Central (as requested)
- **Operating System**: Windows Server 2022 Datacenter Azure Edition
  - Latest Windows Server with Azure optimizations
  - Fully licensed and supported

### Networking
- **Virtual Network**: Isolated network environment
- **Public IP**: Static IP address for RDP access
- **Network Security Group**: Firewall rules (RDP port 3389)
- **FQDN**: Auto-generated domain name for easier connections

## Cost Estimate

Approximate monthly cost in US Central region:
- **VM (Standard_D8s_v3)**: $280-350/month
- **OS Disk (100GB Premium SSD)**: $15/month
- **Data Disk (1TB Premium SSD)**: $150/month
- **Public IP**: $4/month
- **Total**: ~$450-520/month

**Cost Savings**: The VM can be deallocated when not in use to stop compute charges, reducing costs by 60-70% for VMs used part-time.

## How to Deploy

### Prerequisites
1. Azure subscription with active credits/billing
2. Azure CLI installed ([Download](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
3. Login to Azure: `az login`

### Quick Deployment

**On Linux/macOS/WSL:**
```bash
cd infrastructure/azure
./deploy-vm.sh
```

**On Windows:**
```powershell
cd infrastructure\azure
.\deploy-vm.ps1
```

The script will:
1. Prompt for admin password (keep this secure!)
2. Create a resource group named `forensic-vm-rg`
3. Deploy all infrastructure (takes 5-10 minutes)
4. Display connection information

## After Deployment

### Step 1: Connect to the VM
Use the public IP address provided by the deployment:
```bash
# On Windows
mstsc /v:<public-ip>

# On macOS
# Use Microsoft Remote Desktop app from App Store

# On Linux
# Use Remmina or xfreerdp
xfreerdp /v:<public-ip> /u:azureuser
```

### Step 2: Initialize the Data Disk
1. Open Disk Management (`diskmgmt.msc`)
2. Initialize the 1TB disk (choose GPT)
3. Create a new volume and format as NTFS
4. Assign drive letter (e.g., D: or E:)

### Step 3: Install Axiom
1. Download Axiom from Magnet Forensics
2. Install to C: (OS disk)
3. Configure case storage to use the data disk (D: or E:)

### Step 4: Secure the VM (Important!)
By default, RDP is accessible from any IP. After first connection, restrict access:
```bash
# Get your IP
MY_IP=$(curl -s ifconfig.me)

# Update firewall rule
az network nsg rule update \
  --resource-group forensic-vm-rg \
  --nsg-name forensic-nsg \
  --name AllowRDP \
  --source-address-prefix "$MY_IP/32"
```

## Additional Storage Options

### Option 1: Attach More Azure Managed Disks
The VM supports up to 16 data disks. Add more as needed:
```bash
# Create a 2TB disk
az disk create \
  --resource-group forensic-vm-rg \
  --name extra-disk-01 \
  --size-gb 2048 \
  --sku Premium_LRS

# Attach to VM
az vm disk attach \
  --resource-group forensic-vm-rg \
  --vm-name axiom-forensic-vm \
  --name extra-disk-01
```

### Option 2: Use Azure File Shares
Mount network storage for shared access:
```bash
# Create storage account and file share
# Then mount in Windows using net use command
```

### Option 3: Connect Existing Storage
The VM can connect to:
- Azure Blob Storage
- Azure File Storage
- Network attached storage (NAS)
- Other Azure VMs with shared disks

## Managing the VM

### Start the VM
```bash
az vm start --resource-group forensic-vm-rg --name axiom-forensic-vm
```

### Stop the VM (stops billing)
```bash
az vm deallocate --resource-group forensic-vm-rg --name axiom-forensic-vm
```

### Check VM status
```bash
az vm show -d --resource-group forensic-vm-rg --name axiom-forensic-vm --query powerState
```

### View all resources
```bash
az resource list --resource-group forensic-vm-rg --output table
```

## Scaling Options

If you need more resources later:

### More RAM
Resize to Standard_D16s_v3 (16 vCPU, 64GB RAM):
```bash
az vm deallocate --resource-group forensic-vm-rg --name axiom-forensic-vm
az vm resize --resource-group forensic-vm-rg --name axiom-forensic-vm --size Standard_D16s_v3
az vm start --resource-group forensic-vm-rg --name axiom-forensic-vm
```

### More Storage
Expand the data disk:
```bash
az disk update \
  --resource-group forensic-vm-rg \
  --name axiom-forensic-vm-datadisk-forensic \
  --size-gb 2048
```
Then extend the volume in Windows Disk Management.

## Cleanup

When you're done, delete all resources to stop charges:
```bash
az group delete --name forensic-vm-rg --yes --no-wait
```

**Warning**: This deletes everything including all data on the disks!

## Security Best Practices

1. **Restrict RDP Access**: Limit to your IP address or use Azure Bastion
2. **Enable Azure Backup**: Regular backups of VM and disks
3. **Enable Disk Encryption**: Azure Disk Encryption for data at rest
4. **Use Strong Passwords**: Complex admin password with MFA if possible
5. **Keep Windows Updated**: Enable automatic updates
6. **Monitor Activity**: Use Azure Monitor for VM metrics and alerts
7. **Regular Snapshots**: Take disk snapshots before major changes

## Support & Resources

- **Azure Documentation**: [Virtual Machines](https://docs.microsoft.com/en-us/azure/virtual-machines/)
- **Bicep Documentation**: [Azure Bicep](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- **Axiom Documentation**: [Magnet Forensics](https://www.magnetforensics.com/resources/)

## Troubleshooting

### Cannot connect via RDP
1. Verify VM is running: `az vm show -d --name axiom-forensic-vm --resource-group forensic-vm-rg`
2. Check NSG allows your IP
3. Try using FQDN instead of IP address
4. Restart VM: `az vm restart --resource-group forensic-vm-rg --name axiom-forensic-vm`

### Deployment fails
1. Check Azure CLI is logged in: `az account show`
2. Verify subscription has quota for Standard_D8s_v3 VMs
3. Check for resource name conflicts
4. Review error messages in deployment output

### Performance issues
1. Monitor VM metrics in Azure Portal
2. Check if Windows Search is indexing forensic data (disable if needed)
3. Verify using Premium SSD (not Standard HDD)
4. Consider upgrading to larger VM size

## Next Steps

1. ✅ Deploy the VM using the deployment script
2. ✅ Connect via RDP
3. ✅ Initialize the data disk
4. ✅ Secure RDP access
5. ✅ Install Axiom forensic software
6. ✅ Configure backup strategy
7. ✅ Set up monitoring and alerts

For detailed information, see the README.md and QUICK_REFERENCE.md files in the infrastructure/azure directory.
