# Azure VM Infrastructure for Axiom Forensic Software

This directory contains Terraform configuration to deploy an Azure Virtual Machine optimized for running Axiom forensic software.

## Infrastructure Components

### Virtual Machine Specifications
- **Region**: Central US
- **OS**: Windows Server 2022 Datacenter (Azure Edition)
- **Size**: Standard_D8s_v3 (8 vCPUs, 32 GB RAM)
- **OS Disk**: 256 GB Premium SSD
- **Data Disk**: 1 TB Premium SSD (for forensic data storage)

### Storage
- **Storage Account**: Standard LRS storage
- **Storage Container**: 100 GB private container for forensic data
- **Boot Diagnostics**: Enabled for troubleshooting

### Networking
- **Virtual Network**: 10.0.0.0/16
- **Subnet**: 10.0.1.0/24
- **Public IP**: Static IP for RDP access
- **NSG**: Network Security Group with RDP access (port 3389)

## Prerequisites

1. **Azure Subscription**: Active Azure subscription
2. **Azure CLI**: Install from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
3. **Terraform**: Install from https://www.terraform.io/downloads
4. **Credentials**: Azure authentication configured

## Setup Instructions

### 1. Azure Authentication

Login to Azure:
```bash
az login
```

Set your subscription (if you have multiple):
```bash
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

### 2. Configure Variables

Copy the example variables file:
```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set at minimum:
- `admin_password`: Strong password for VM admin account
- `allowed_ip_range`: Your IP address for RDP access (recommended for security)
- `storage_account_name`: Must be globally unique (lowercase, alphanumeric)

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Review the Deployment Plan

```bash
terraform plan
```

### 5. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm deployment.

### 6. Get Connection Information

After deployment completes, view the outputs:
```bash
terraform output
```

This will show:
- VM public IP address
- RDP connection string
- Storage account details
- Resource group name

## Connecting to the VM

### Using Windows
1. Open Remote Desktop Connection (mstsc.exe)
2. Enter the public IP address from outputs
3. Use credentials:
   - Username: `azureuser` (or your configured admin_username)
   - Password: The password you set in terraform.tfvars

### Using Mac/Linux
Install Microsoft Remote Desktop from the App Store or use:
```bash
xfreerdp /v:<PUBLIC_IP> /u:azureuser /p:<PASSWORD>
```

## Post-Deployment Steps

1. **Connect to VM**: Use RDP to connect to the VM
2. **Format Data Disk**: In Windows, open Disk Management and initialize/format the 1TB data disk
3. **Install Axiom**: Download and install Axiom forensic software
4. **Configure Storage**: Mount the Azure storage container if needed
5. **Security Hardening**: 
   - Update Windows
   - Configure Windows Firewall
   - Install antivirus software
   - Set up regular backups

## Managing the VM

### Start the VM
```bash
az vm start --resource-group forensics-axiom-rg --name axiom-forensics-vm
```

### Stop the VM (to save costs)
```bash
az vm deallocate --resource-group forensics-axiom-rg --name axiom-forensics-vm
```

### Check VM Status
```bash
az vm get-instance-view --resource-group forensics-axiom-rg --name axiom-forensics-vm --query instanceView.statuses[1].displayStatus
```

## Cost Optimization

- **Deallocate VM when not in use**: Stops compute charges
- **Use Azure Hybrid Benefit**: If you have Windows Server licenses
- **Schedule auto-shutdown**: Configure in Azure Portal
- **Monitor storage usage**: Delete unnecessary data

## Destroying Infrastructure

When you no longer need the infrastructure:

```bash
terraform destroy
```

**Warning**: This will delete all resources including the VM, disks, and storage. Back up any important data first!

## Troubleshooting

### Cannot RDP to VM
- Check NSG rules allow your IP address
- Verify VM is running: `az vm get-instance-view`
- Check public IP: `terraform output vm_public_ip`

### Storage account name conflict
- Storage account names must be globally unique
- Change `storage_account_name` in terraform.tfvars

### Terraform state issues
- State is stored locally in `terraform.tfstate`
- For team collaboration, consider using Azure Storage backend

## Security Best Practices

1. **Restrict RDP Access**: Set `allowed_ip_range` to your specific IP
2. **Use Azure Key Vault**: Store admin password in Key Vault
3. **Enable Azure Security Center**: Monitor for security threats
4. **Regular Updates**: Keep Windows and Axiom updated
5. **Backup Strategy**: Use Azure Backup for VM and data
6. **Audit Logs**: Enable Azure Monitor and logging
7. **Network Segmentation**: Adjust NSG rules as needed

## Support

For Terraform issues: https://www.terraform.io/docs
For Azure issues: https://docs.microsoft.com/en-us/azure/
For Axiom support: Contact Magnet Forensics

## License

See repository LICENSE file.
