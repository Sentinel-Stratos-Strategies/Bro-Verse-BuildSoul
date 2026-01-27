# Azure VM Architecture for Axiom Forensic Software

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Azure Cloud                              │
│                      (US Central Region)                         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Resource Group: forensic-vm-rg               │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │         Virtual Network: forensic-vnet              │  │  │
│  │  │         Address Space: 10.0.0.0/16                  │  │  │
│  │  │                                                      │  │  │
│  │  │  ┌───────────────────────────────────────────────┐ │  │  │
│  │  │  │  Subnet: forensic-subnet (10.0.0.0/24)       │ │  │  │
│  │  │  │                                               │ │  │  │
│  │  │  │  ┌────────────────────────────────────────┐  │ │  │  │
│  │  │  │  │   VM: axiom-forensic-vm                │  │ │  │  │
│  │  │  │  │   Size: Standard_D8s_v3                │  │ │  │  │
│  │  │  │  │   • 8 vCPUs                            │  │ │  │  │
│  │  │  │  │   • 32GB RAM                           │  │ │  │  │
│  │  │  │  │   • Windows Server 2022                │  │ │  │  │
│  │  │  │  │                                        │  │ │  │  │
│  │  │  │  │   Storage:                             │  │ │  │  │
│  │  │  │  │   ┌──────────────────────────────┐    │  │ │  │  │
│  │  │  │  │   │ OS Disk (C:)                 │    │  │ │  │  │
│  │  │  │  │   │ 100GB Premium SSD            │    │  │ │  │  │
│  │  │  │  │   │ • Windows Server 2022        │    │  │ │  │  │
│  │  │  │  │   │ • Axiom Software             │    │  │ │  │  │
│  │  │  │  │   └──────────────────────────────┘    │  │ │  │  │
│  │  │  │  │                                        │  │ │  │  │
│  │  │  │  │   ┌──────────────────────────────┐    │  │ │  │  │
│  │  │  │  │   │ Data Disk (D:/E:)            │    │  │ │  │  │
│  │  │  │  │   │ 1TB (1024GB) Premium SSD     │    │  │ │  │  │
│  │  │  │  │   │ • Forensic Case Files        │    │  │ │  │  │
│  │  │  │  │   │ • Evidence Data              │    │  │ │  │  │
│  │  │  │  │   │ • Investigation Results      │    │  │ │  │  │
│  │  │  │  │   └──────────────────────────────┘    │  │ │  │  │
│  │  │  │  │                                        │  │ │  │  │
│  │  │  │  │   Network Interface                    │  │ │  │  │
│  │  │  │  │   Private IP: 10.0.0.x (Dynamic)      │  │ │  │  │
│  │  │  │  └────────────────────────────────────────┘  │ │  │  │
│  │  │  └───────────────────────────────────────────────┘ │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Network Security Group: forensic-nsg              │  │  │
│  │  │  Rules:                                             │  │  │
│  │  │  • Allow RDP (TCP 3389) from Internet              │  │  │
│  │  │  • Deny all other inbound traffic                  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Public IP: forensic-public-ip                     │  │  │
│  │  │  • Static IP Address                               │  │  │
│  │  │  • Auto-generated FQDN                             │  │  │
│  │  │  • Standard SKU                                    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ RDP (Port 3389)
                            │
                            ▼
                  ┌──────────────────┐
                  │  Your Computer   │
                  │  (RDP Client)    │
                  └──────────────────┘
```

## Component Details

### Virtual Machine
- **Name**: axiom-forensic-vm
- **Size**: Standard_D8s_v3
  - 8 vCPUs (Intel Xeon or AMD EPYC)
  - 32GB RAM
  - 64GB local SSD (temporary storage)
  - Max data disks: 16
  - Max throughput: 12,800 IOPS, 192 MB/s
- **OS**: Windows Server 2022 Datacenter Azure Edition
- **Boot Diagnostics**: Enabled

### Storage Configuration

#### OS Disk (100GB)
- **Type**: Premium SSD (P10)
- **Performance**: 500 IOPS, 100 MB/s
- **Purpose**: Operating system and Axiom software installation
- **Caching**: ReadWrite

#### Data Disk (1TB)
- **Type**: Premium SSD (P30)
- **Performance**: 5,000 IOPS, 200 MB/s
- **Purpose**: Forensic evidence and case files
- **Caching**: ReadWrite
- **Expandable**: Yes (can expand to 32TB)

### Network Configuration

#### Virtual Network
- **Address Space**: 10.0.0.0/16 (65,536 addresses)
- **Subnet**: 10.0.0.0/24 (256 addresses)
- **DNS**: Azure-provided DNS

#### Public IP Address
- **Type**: Static
- **SKU**: Standard
- **FQDN**: Auto-generated (format: `<vmname>-<unique-string>.centralus.cloudapp.azure.com`)
- **Assignment**: Dedicated to the VM

#### Network Security Group
- **Inbound Rules**:
  - Allow RDP (TCP 3389) from any source
  - Default deny all other inbound
- **Outbound Rules**:
  - Allow all outbound (default)

### Security Features

#### Built-in Security
- **Encryption at Rest**: Enabled by default on Azure Managed Disks
- **Boot Diagnostics**: Enabled for troubleshooting
- **Azure Platform Security**: Automatic security updates and patches
- **Network Isolation**: Dedicated virtual network

#### Recommended Additional Security
- **Azure Bastion**: Secure RDP without public IP exposure
- **Azure Disk Encryption**: BitLocker encryption for data disks
- **Azure Backup**: Regular VM and disk backups
- **Microsoft Defender for Cloud**: Advanced threat protection
- **Just-in-Time VM Access**: Time-limited RDP access
- **IP Allowlisting**: Restrict RDP to specific IP addresses

## Scalability Options

### Vertical Scaling (Resize VM)
Easily resize to larger VMs without data loss:

| VM Size | vCPU | RAM | Cost Multiplier |
|---------|------|-----|-----------------|
| Standard_D8s_v3 | 8 | 32GB | 1x (baseline) |
| Standard_D16s_v3 | 16 | 64GB | 2x |
| Standard_D32s_v3 | 32 | 128GB | 4x |
| Standard_E8s_v3 | 8 | 64GB | 1.3x |
| Standard_E16s_v3 | 16 | 128GB | 2.6x |

### Horizontal Scaling (Add Storage)
- Add up to 16 data disks
- Each disk can be up to 32TB
- Total potential storage: 512TB per VM

## Data Flow

```
┌──────────────────────┐
│  Forensic Evidence   │
│  (External Sources)  │
└──────────┬───────────┘
           │
           │ Upload via RDP
           │ or Azure Storage
           ▼
┌──────────────────────┐
│   Axiom Forensic VM  │
│   (Processing)       │
│                      │
│  ┌────────────────┐  │
│  │ Axiom Software │  │
│  └────────┬───────┘  │
│           │          │
│           ▼          │
│  ┌────────────────┐  │
│  │ 1TB Data Disk  │  │
│  │ (D: or E:)     │  │
│  │ • Case Files   │  │
│  │ • Reports      │  │
│  │ • Artifacts    │  │
│  └────────────────┘  │
└──────────────────────┘
           │
           │ Export Results
           ▼
┌──────────────────────┐
│  Investigation       │
│  Reports & Results   │
└──────────────────────┘
```

## Deployment Flow

```
1. Developer/Operator
   │
   │ Run deployment script
   │
   ▼
2. Azure CLI
   │
   │ Authenticate with Azure
   │ Create resource group
   │
   ▼
3. Bicep Template Processing
   │
   │ Parse forensic-vm.bicep
   │ Validate parameters
   │ Convert to ARM template
   │
   ▼
4. Azure Resource Manager
   │
   │ Deploy resources in order:
   │  1. Network Security Group
   │  2. Virtual Network
   │  3. Public IP Address
   │  4. Network Interface
   │  5. Virtual Machine
   │  6. OS Disk
   │  7. Data Disk
   │
   ▼
5. Resource Provisioning
   │
   │ Allocate compute resources
   │ Install Windows Server 2022
   │ Configure networking
   │ Attach disks
   │
   ▼
6. VM Ready
   │
   │ Return connection info
   │ Display IP, FQDN, credentials
   │
   ▼
7. User Connection
   │
   │ Connect via RDP
   │ Initialize data disk
   │ Install Axiom software
   │
   ▼
8. Ready for Forensic Work
```

## Cost Breakdown

Monthly costs (US Central region, pay-as-you-go):

```
┌─────────────────────────────┬──────────────┐
│ Component                   │ Monthly Cost │
├─────────────────────────────┼──────────────┤
│ VM (Standard_D8s_v3)        │ $280-350     │
│ • Compute (8 vCPU, 32GB)    │              │
│ • 730 hours/month           │              │
├─────────────────────────────┼──────────────┤
│ OS Disk (100GB Premium SSD) │ ~$15         │
├─────────────────────────────┼──────────────┤
│ Data Disk (1TB Premium SSD) │ ~$150        │
├─────────────────────────────┼──────────────┤
│ Public IP (Static)          │ ~$4          │
├─────────────────────────────┼──────────────┤
│ Bandwidth (outbound)        │ ~$5-10       │
├─────────────────────────────┼──────────────┤
│ TOTAL                       │ ~$450-520    │
└─────────────────────────────┴──────────────┘

Cost Optimization:
• Deallocate VM when not in use: Save 60-70% on compute
• Use Azure Hybrid Benefit: Save up to 40% with existing licenses
• Reserved Instances (1-year): Save 40%
• Reserved Instances (3-year): Save 60%
```

## Expansion Capabilities

### Add More Storage
```
Current: 1.1TB total (100GB OS + 1TB data)
Maximum: 512TB total (16 × 32TB data disks)
```

### Add Network Drives
- Azure Files: SMB/NFS network shares
- Azure Blob Storage: Object storage via mounting tools
- Azure NetApp Files: Enterprise-grade NFS/SMB

### Connect to Other Services
- **Azure Blob Storage**: Long-term evidence archival
- **Azure SQL Database**: Case management databases
- **Azure Key Vault**: Secure credential storage
- **Azure Monitor**: Performance monitoring and alerts
- **Azure Backup**: Automated backup solutions

## Best Practices

### Performance Optimization
1. Keep OS and Axiom on OS disk (C:)
2. Store case files on data disk (D: or E:)
3. Disable Windows Search indexing on data disk
4. Use Premium SSD for best performance
5. Enable write caching for data disks

### Security Hardening
1. Restrict RDP access to specific IPs
2. Use Azure Bastion for secure access
3. Enable Azure Disk Encryption
4. Configure Windows Firewall
5. Install antivirus/antimalware
6. Enable audit logging

### Backup Strategy
1. Enable Azure Backup (daily snapshots)
2. Retain backups for 30 days minimum
3. Test restore procedures regularly
4. Export critical data to Azure Storage
5. Document recovery procedures

### Cost Management
1. Deallocate VM during non-working hours
2. Use auto-shutdown schedules
3. Monitor costs with Azure Cost Management
4. Delete unused resources promptly
5. Consider reserved instances for long-term use

## Maintenance Windows

Recommended schedule:
- **Weekly**: Windows Updates (automated)
- **Monthly**: VM restart for updates
- **Quarterly**: Security review and hardening
- **Annually**: Azure resource review and optimization

---

**For deployment instructions, see:**
- Quick start: `infrastructure/DEPLOYMENT_GUIDE.md`
- Detailed docs: `infrastructure/azure/README.md`
- Command reference: `infrastructure/azure/QUICK_REFERENCE.md`
