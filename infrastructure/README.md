# Infrastructure - Azure VM for Axiom Forensics

This directory contains infrastructure-as-code for deploying an Azure Virtual Machine optimized for running Axiom forensic software.

## Quick Start

### Option 1: Local Deployment (Recommended for first-time setup)

1. **Prerequisites**:
   - Install [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
   - Install [Terraform](https://www.terraform.io/downloads) (version >= 1.0)
   - Azure subscription with appropriate permissions

2. **Authenticate to Azure**:
   ```bash
   az login
   ```

3. **Run the cloud agent script**:
   ```bash
   cd infrastructure
   ./deploy-cloud-agent.sh
   ```
   
   The script will:
   - Check prerequisites
   - Verify Azure authentication
   - Guide you through deployment options
   - Help you configure terraform.tfvars
   - Deploy the infrastructure

### Option 2: GitHub Actions Deployment

1. **Set up GitHub Secrets**:
   Navigate to your repository Settings > Secrets and add:
   
   - `AZURE_CREDENTIALS`: Azure service principal credentials (JSON format)
     ```json
     {
       "clientId": "xxx",
       "clientSecret": "xxx",
       "subscriptionId": "xxx",
       "tenantId": "xxx"
     }
     ```
   - `VM_ADMIN_PASSWORD`: Strong password for VM administrator account
   - `STORAGE_ACCOUNT_NAME`: Globally unique storage account name (lowercase, alphanumeric)
   - `ALLOWED_IP_RANGE`: Your IP address for RDP access (e.g., "1.2.3.4/32")

2. **Trigger the workflow**:
   - Go to Actions tab in your GitHub repository
   - Select "Azure VM Cloud Deployment"
   - Click "Run workflow"
   - Choose action: `plan`, `apply`, `start-vm`, `stop-vm`, or `destroy`

## Infrastructure Components

### Azure Resources Created

1. **Resource Group**: `forensics-axiom-rg`
   - Location: Central US
   - Contains all forensic infrastructure

2. **Virtual Machine**: `axiom-forensics-vm`
   - Size: Standard_D8s_v3 (8 vCPUs, 32 GB RAM)
   - OS: Windows Server 2022 Datacenter (Azure Edition)
   - OS Disk: 256 GB Premium SSD
   - Data Disk: 1 TB Premium SSD (attached, needs formatting)

3. **Storage Account**: For forensic data
   - Standard LRS replication
   - Private container: 100 GB allocated
   - Boot diagnostics enabled

4. **Networking**:
   - Virtual Network: 10.0.0.0/16
   - Subnet: 10.0.1.0/24
   - Static Public IP
   - Network Security Group with RDP access

## VM Specifications for Axiom

The VM is configured to meet Axiom forensic software requirements:

- **Operating System**: Windows Server 2022 (compatible with Axiom)
- **Memory**: 32 GB RAM (sufficient for large forensic cases)
- **Storage**: 
  - 256 GB OS disk (for system and applications)
  - 1 TB data disk (for forensic evidence and case files)
  - 100 GB Azure Storage container (for cloud backup/sharing)
- **Region**: Central US (low latency, compliance)

## Directory Structure

```
infrastructure/
├── deploy-cloud-agent.sh       # Main deployment script
├── terraform/                   # Terraform configuration
│   ├── main.tf                 # Main infrastructure definition
│   ├── variables.tf            # Input variables
│   ├── outputs.tf              # Output values
│   ├── terraform.tfvars.example # Example configuration
│   ├── .gitignore              # Git ignore rules
│   └── README.md               # Detailed Terraform docs
└── README.md                   # This file
```

## Deployment Workflow

### Initial Deployment

```bash
# 1. Navigate to infrastructure directory
cd infrastructure

# 2. Run deployment script
./deploy-cloud-agent.sh

# 3. Select option 8 (Full deployment)
# This will:
#   - Initialize Terraform
#   - Plan the deployment
#   - Apply the configuration
#   - Display connection information
```

### Managing the VM

**Start VM**:
```bash
./deploy-cloud-agent.sh
# Select option 5
```

**Stop VM** (saves costs):
```bash
./deploy-cloud-agent.sh
# Select option 6
```

**View connection info**:
```bash
./deploy-cloud-agent.sh
# Select option 4
```

## Post-Deployment Steps

After the infrastructure is deployed:

1. **Connect via RDP**:
   - Use the public IP from terraform output
   - Username: `azureuser` (or configured admin_username)
   - Password: As set in terraform.tfvars

2. **Initialize Data Disk**:
   - Open Disk Management in Windows
   - Initialize the 1 TB disk
   - Create a new volume and format as NTFS
   - Assign drive letter (e.g., D:)

3. **Install Axiom**:
   - Download Axiom from Magnet Forensics
   - Install to the OS disk (C:)
   - Configure case storage to use data disk (D:)

4. **Configure Storage Access** (optional):
   - Use Azure Storage Explorer to access the storage container
   - Or mount as network drive for backup purposes

5. **Security Hardening**:
   - Run Windows Update
   - Configure Windows Firewall
   - Install antivirus/antimalware
   - Enable Azure Backup
   - Review and restrict NSG rules

## Cost Management

**Estimated Monthly Costs** (US Central, as of 2024):
- VM (Standard_D8s_v3): ~$280/month when running
- Premium SSD Storage (1.25 TB): ~$200/month
- Standard Storage: ~$5/month
- Bandwidth: Variable

**Cost Optimization Tips**:
- Stop (deallocate) VM when not in use
- Use Azure Hybrid Benefit if you have Windows licenses
- Set up auto-shutdown schedule
- Monitor storage usage and clean up old data

## Security Considerations

1. **Network Security**:
   - RDP access should be restricted to specific IP addresses
   - Change `allowed_ip_range` in terraform.tfvars
   - Never use `*` (all IPs) in production

2. **Credentials**:
   - Use strong passwords (min 12 characters, mixed case, numbers, symbols)
   - Consider Azure Key Vault for password management
   - Enable MFA on Azure account

3. **Data Protection**:
   - Enable encryption at rest (enabled by default)
   - Configure Azure Backup for VM and data
   - Implement data retention policies
   - Consider Azure Private Link for storage

4. **Compliance**:
   - Ensure data residency requirements (using Central US)
   - Enable Azure Policy for compliance monitoring
   - Review and accept forensic data handling policies

## Troubleshooting

### Common Issues

**Cannot connect via RDP**:
- Verify VM is running: Check Azure Portal or run `az vm show`
- Check NSG rules allow your current IP
- Verify public IP address is correct
- Test connectivity: `ping <public-ip>`

**Terraform errors**:
- Storage account name must be globally unique (3-24 chars, lowercase alphanumeric)
- Ensure Azure credentials are valid
- Check subscription has sufficient quota for VM size
- Verify terraform.tfvars is properly configured

**Performance issues**:
- Ensure VM is running (not stopped)
- Check disk performance metrics in Azure Portal
- Verify sufficient RAM for Axiom workload
- Consider upgrading to larger VM size if needed

### Getting Help

- **Terraform**: [Official Documentation](https://www.terraform.io/docs)
- **Azure**: [Azure Documentation](https://docs.microsoft.com/en-us/azure/)
- **Axiom**: [Magnet Forensics Support](https://www.magnetforensics.com/support/)

## Destroying Infrastructure

When you no longer need the infrastructure:

```bash
./deploy-cloud-agent.sh
# Select option 7 (Destroy)
```

**⚠️ Warning**: This permanently deletes:
- The VM and all its data
- All attached disks
- Storage account and containers
- Network resources

**Before destroying**:
- Backup all important case files
- Export any forensic reports
- Save Axiom license information
- Document any custom configurations

## Contributing

When modifying infrastructure:
1. Test changes in a separate resource group first
2. Update documentation
3. Follow Terraform best practices
4. Review security implications

## License

See repository LICENSE file.
