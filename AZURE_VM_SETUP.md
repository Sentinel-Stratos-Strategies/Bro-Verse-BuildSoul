# Azure VM Setup Guide - Axiom Forensic Software

This guide provides quick instructions for deploying an Azure Virtual Machine configured for Axiom forensic software analysis.

## 🚀 Quick Start

### Prerequisites
- Azure subscription
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- [Terraform](https://www.terraform.io/downloads) installed (v1.0+)

### Deploy in 3 Steps

1. **Login to Azure**:
   ```bash
   az login
   ```

2. **Run the cloud agent**:
   ```bash
   cd infrastructure
   ./deploy-cloud-agent.sh
   ```

3. **Select option 8** for full deployment

That's it! The script will create your VM and display connection information.

## 📋 VM Specifications

| Component | Specification |
|-----------|---------------|
| **Region** | Central US |
| **OS** | Windows Server 2022 Datacenter |
| **vCPUs** | 8 |
| **RAM** | 32 GB |
| **OS Disk** | 256 GB Premium SSD |
| **Data Disk** | 1 TB Premium SSD |
| **Storage** | 100 GB Azure Storage Container |

## 🔐 Security Setup

Before first deployment, configure these in `infrastructure/terraform/terraform.tfvars`:

```hcl
# Set a strong admin password
admin_password = "YourStrongPassword123!"

# Restrict RDP to your IP (REQUIRED for security)
allowed_ip_range = "YOUR.IP.ADDRESS/32"

# Storage account name (must be globally unique)
storage_account_name = "yourforensicsstorage"
```

## 🖥️ Connecting to Your VM

After deployment:

1. **Get connection info**:
   ```bash
   cd infrastructure/terraform
   terraform output
   ```

2. **Connect via RDP**:
   - Windows: Use Remote Desktop Connection
   - Mac: Use Microsoft Remote Desktop
   - Linux: Use xfreerdp or remmina

3. **Credentials**:
   - Username: `azureuser`
   - Password: Your configured admin_password

## 📦 Installing Axiom

1. Connect to VM via RDP
2. Download Axiom from Magnet Forensics
3. Install Axiom to C: drive
4. Format the 1 TB data disk (D:) using Disk Management
5. Configure Axiom to store cases on D: drive

## 💰 Managing Costs

**Stop VM when not in use** to save money:
```bash
cd infrastructure
./deploy-cloud-agent.sh
# Select option 6 (Stop VM)
```

**Start VM** when needed:
```bash
cd infrastructure
./deploy-cloud-agent.sh
# Select option 5 (Start VM)
```

## 📚 Documentation

- **Detailed infrastructure docs**: [infrastructure/README.md](infrastructure/README.md)
- **Terraform configuration**: [infrastructure/terraform/README.md](infrastructure/terraform/README.md)
- **GitHub Actions deployment**: [.github/workflows/azure-vm-deployment.yml](.github/workflows/azure-vm-deployment.yml)

## 🆘 Troubleshooting

**Can't connect via RDP?**
- Ensure VM is running
- Check your IP is allowed in terraform.tfvars
- Verify correct password

**Terraform errors?**
- Storage account name must be unique globally
- Check Azure credentials: `az account show`
- Ensure subscription has VM quota

## 🔄 Updating Infrastructure

To modify the VM configuration:

1. Edit files in `infrastructure/terraform/`
2. Run plan to preview changes:
   ```bash
   cd infrastructure/terraform
   terraform plan
   ```
3. Apply changes:
   ```bash
   terraform apply
   ```

## 🗑️ Cleanup

When finished, destroy all resources:
```bash
cd infrastructure
./deploy-cloud-agent.sh
# Select option 7 (Destroy)
```

**⚠️ Warning**: This deletes everything. Backup your data first!

## 📞 Support

- Azure Issues: [Azure Docs](https://docs.microsoft.com/en-us/azure/)
- Terraform Issues: [Terraform Docs](https://www.terraform.io/docs)
- Axiom Support: [Magnet Forensics](https://www.magnetforensics.com/support/)

---

**Ready to deploy?** Navigate to `infrastructure/` and run `./deploy-cloud-agent.sh`
