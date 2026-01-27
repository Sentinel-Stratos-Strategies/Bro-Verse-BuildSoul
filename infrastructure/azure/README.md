# Azure VM Infrastructure for Axiom Forensic Software

This directory contains Azure infrastructure code to deploy a Windows VM configured for running Axiom forensic software.

## VM Specifications

- **Region**: US Central
- **OS**: Windows Server 2022 Datacenter Azure Edition
- **VM Size**: Standard_D8s_v3 (8 vCPU, 32GB RAM)
- **OS Disk**: 100GB Premium SSD
- **Data Disk**: 1TB (1024GB) Premium SSD for forensic data storage
- **Networking**: Public IP with RDP access (port 3389)

## Why Standard_D8s_v3?

The Standard_D8s_v3 VM size provides:
- 8 vCPUs for processing power
- 32GB RAM as requested
- Premium SSD support for fast I/O operations
- Good balance of performance and cost for forensic workloads
- Supports up to 16 data disks if you need to add more storage later

## Storage Configuration

### OS Disk (100GB)
- Premium SSD for OS and Axiom software installation
- Sufficient for Windows Server 2022 and Axiom installation

### Data Disk (1TB)
- Premium SSD for forensic data and case files
- Fast read/write performance for large forensic images
- Can be expanded or additional disks added as needed

### Connecting External Drives
The VM configuration allows you to:
- Attach additional managed disks through Azure Portal
- Add up to 16 data disks (up to 32TB each)
- Connect network-attached storage
- Mount Azure File Shares for additional storage

## Prerequisites

1. **Azure CLI** - [Installation Guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Azure Subscription** - Active Azure subscription with permission to create resources
3. **Azure Login** - Run `az login` before deployment

## Deployment Options

### Option 1: Using Bash Script (Linux/macOS/WSL)

```bash
cd infrastructure/azure
./deploy-vm.sh
```

### Option 2: Using PowerShell Script (Windows)

```powershell
cd infrastructure/azure
.\deploy-vm.ps1
```

### Option 3: Manual Deployment with Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name forensic-vm-rg --location centralus

# Deploy the Bicep template
az deployment group create \
  --name forensic-vm-deployment \
  --resource-group forensic-vm-rg \
  --template-file forensic-vm.bicep \
  --parameters forensic-vm.parameters.json \
  --parameters adminPassword='<YourSecurePassword>'
```

### Option 4: Using Azure Portal

1. Navigate to [Azure Portal](https://portal.azure.com)
2. Go to "Deploy a custom template"
3. Click "Build your own template in the editor"
4. Copy the contents of `forensic-vm.bicep`
5. Save and fill in the parameters
6. Review and create

## Post-Deployment Steps

### 1. Connect to the VM

Use Remote Desktop Protocol (RDP) to connect:
- Windows: Press `Win+R`, type `mstsc`, enter the public IP or FQDN
- macOS: Use Microsoft Remote Desktop from App Store
- Linux: Use Remmina or another RDP client

```bash
# Connection info will be displayed after deployment
mstsc /v:<public-ip-address>
```

### 2. Initialize the Data Disk

After connecting to the VM:

1. Open **Disk Management** (Win+X → Disk Management or run `diskmgmt.msc`)
2. You'll see a 1TB disk as "Not Initialized"
3. Right-click the disk and select "Initialize Disk"
4. Choose GPT partition style (recommended)
5. Right-click the unallocated space and select "New Simple Volume"
6. Follow the wizard to format (NTFS recommended) and assign a drive letter (e.g., D: or E:)

### 3. Install Axiom Forensic Software

1. Download Axiom from Magnet Forensics website
2. Install to the OS disk (C:)
3. Configure case storage location to the data disk (D: or E:)

### 4. Windows Configuration

Recommended configurations:
- Disable Windows Search indexing on the data disk (for performance)
- Configure Windows Defender exclusions for forensic tools
- Set up automatic Windows updates or configure maintenance windows
- Consider disabling sleep/hibernation for long-running processes

### 5. Attach Additional Drives (Optional)

If you need to connect existing Azure storage:

```bash
# Create and attach an additional managed disk
az disk create \
  --resource-group forensic-vm-rg \
  --name additional-data-disk \
  --size-gb 2048 \
  --sku Premium_LRS

az vm disk attach \
  --resource-group forensic-vm-rg \
  --vm-name axiom-forensic-vm \
  --name additional-data-disk
```

## Cost Optimization

### Estimated Monthly Costs (US Central region)
- Standard_D8s_v3 VM: ~$280-350/month (depending on usage)
- 100GB Premium SSD (OS): ~$15/month
- 1TB Premium SSD (Data): ~$150/month
- Public IP: ~$4/month
- **Total**: ~$450-520/month

### Cost Savings Tips
1. **Deallocate when not in use**: Stop the VM from Azure Portal to avoid compute charges
   ```bash
   az vm deallocate --resource-group forensic-vm-rg --name axiom-forensic-vm
   ```
2. **Use Auto-Shutdown**: Configure automatic shutdown during non-working hours
3. **Reserved Instances**: Consider 1-year or 3-year reserved instances for 40-60% savings
4. **Spot Instances**: If workload allows interruptions, use Spot VMs for up to 90% savings

## Security Considerations

### Current Configuration
- RDP access is allowed from any IP (`*`)
- Network Security Group restricts to port 3389 only
- Premium SSD with encryption at rest

### Recommended Security Enhancements
1. **Restrict RDP Access**: Update NSG to allow RDP only from your IP
   ```bash
   az network nsg rule update \
     --resource-group forensic-vm-rg \
     --nsg-name forensic-nsg \
     --name AllowRDP \
     --source-address-prefix <your-ip-address>
   ```

2. **Use Azure Bastion**: For secure RDP without exposing public IP
3. **Enable Azure Disk Encryption**: For additional data protection
4. **Configure Azure Backup**: Regular backups of VM and data disks
5. **Enable Microsoft Defender for Cloud**: Advanced threat protection

## Troubleshooting

### Cannot connect via RDP
1. Verify the VM is running: `az vm get-instance-view --name axiom-forensic-vm --resource-group forensic-vm-rg`
2. Check NSG rules allow your IP
3. Verify public IP address
4. Try using the FQDN instead of IP

### Data disk not visible
1. Check if disk is attached in Azure Portal
2. Open Disk Management in Windows
3. Initialize and format the disk if it shows as "Not Initialized"

### Performance issues
1. Verify Premium SSD configuration
2. Check if Windows Search is indexing forensic data (disable if needed)
3. Monitor VM metrics in Azure Portal
4. Consider upgrading to a larger VM size if consistently hitting resource limits

## Cleanup

To delete all resources and stop incurring costs:

```bash
# Delete the entire resource group (WARNING: This deletes EVERYTHING)
az group delete --name forensic-vm-rg --yes --no-wait
```

## Additional Resources

- [Azure VM Sizes](https://docs.microsoft.com/en-us/azure/virtual-machines/sizes)
- [Azure Premium SSD](https://docs.microsoft.com/en-us/azure/virtual-machines/disks-types#premium-ssd)
- [Azure Bastion Documentation](https://docs.microsoft.com/en-us/azure/bastion/)
- [Magnet Axiom Documentation](https://www.magnetforensics.com/resources/axiom-user-guide/)

## Support

For issues with:
- Azure infrastructure: Contact Azure Support
- Axiom software: Contact Magnet Forensics Support
- This deployment: Open an issue in the repository
