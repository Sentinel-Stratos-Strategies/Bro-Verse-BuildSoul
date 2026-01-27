# Quick Reference Guide

## Quick Start

```bash
# 1. Login to Azure
az login

# 2. Deploy the VM
cd infrastructure/azure
./deploy-vm.sh
# Or on Windows: .\deploy-vm.ps1

# 3. Connect via RDP with the provided IP address
```

## Common Operations

### Start VM
```bash
az vm start --resource-group forensic-vm-rg --name axiom-forensic-vm
```

### Stop VM (Deallocate to stop billing)
```bash
az vm deallocate --resource-group forensic-vm-rg --name axiom-forensic-vm
```

### Check VM Status
```bash
az vm get-instance-view \
  --name axiom-forensic-vm \
  --resource-group forensic-vm-rg \
  --query instanceView.statuses[1] \
  --output table
```

### Get Connection Info
```bash
# Get Public IP
az vm show -d \
  --resource-group forensic-vm-rg \
  --name axiom-forensic-vm \
  --query publicIps -o tsv

# Get FQDN
az network public-ip show \
  --resource-group forensic-vm-rg \
  --name forensic-public-ip \
  --query dnsSettings.fqdn -o tsv
```

### Add Additional Storage
```bash
# Create a new 2TB disk
az disk create \
  --resource-group forensic-vm-rg \
  --name extra-storage-disk \
  --size-gb 2048 \
  --sku Premium_LRS

# Attach to VM
az vm disk attach \
  --resource-group forensic-vm-rg \
  --vm-name axiom-forensic-vm \
  --name extra-storage-disk
```

### Resize VM (if needed)
```bash
# Stop/deallocate the VM first
az vm deallocate --resource-group forensic-vm-rg --name axiom-forensic-vm

# Resize to a different size (e.g., 64GB RAM)
az vm resize \
  --resource-group forensic-vm-rg \
  --name axiom-forensic-vm \
  --size Standard_D16s_v3

# Start the VM
az vm start --resource-group forensic-vm-rg --name axiom-forensic-vm
```

### Restrict RDP Access to Your IP
```bash
# Get your current IP
MY_IP=$(curl -s ifconfig.me)

# Update NSG rule
az network nsg rule update \
  --resource-group forensic-vm-rg \
  --nsg-name forensic-nsg \
  --name AllowRDP \
  --source-address-prefix "$MY_IP/32"
```

### View VM Costs
```bash
az consumption usage list \
  --start-date $(date -d '30 days ago' +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --query "[?contains(instanceName, 'axiom-forensic-vm')]" \
  --output table
```

### Backup VM
```bash
# Create Recovery Services Vault (one-time setup)
az backup vault create \
  --resource-group forensic-vm-rg \
  --name forensic-backup-vault \
  --location centralus

# Enable backup for VM
az backup protection enable-for-vm \
  --resource-group forensic-vm-rg \
  --vault-name forensic-backup-vault \
  --vm axiom-forensic-vm \
  --policy-name DefaultPolicy
```

### Delete Everything
```bash
# WARNING: This deletes ALL resources
az group delete --name forensic-vm-rg --yes --no-wait
```

## VM Size Options (if 32GB RAM is not enough)

| VM Size | vCPU | RAM | Max Data Disks | Approx. Cost/Month |
|---------|------|-----|----------------|-------------------|
| Standard_D8s_v3 | 8 | 32GB | 16 | $280-350 |
| Standard_D16s_v3 | 16 | 64GB | 32 | $560-700 |
| Standard_D32s_v3 | 32 | 128GB | 32 | $1,100-1,400 |
| Standard_E8s_v3 | 8 | 64GB | 16 | $380-480 |
| Standard_E16s_v3 | 16 | 128GB | 32 | $760-960 |

To change VM size, update the `vmSize` parameter in `forensic-vm.parameters.json` before deployment, or use the resize command shown above.

## Troubleshooting

### RDP Connection Issues
```bash
# Check if VM is running
az vm get-instance-view --name axiom-forensic-vm --resource-group forensic-vm-rg

# Restart VM
az vm restart --resource-group forensic-vm-rg --name axiom-forensic-vm

# Check NSG rules
az network nsg rule list \
  --resource-group forensic-vm-rg \
  --nsg-name forensic-nsg \
  --output table
```

### Reset Admin Password
```bash
az vm user update \
  --resource-group forensic-vm-rg \
  --name axiom-forensic-vm \
  --username azureuser \
  --password 'NewSecurePassword123!'
```

### View VM Logs
```bash
# Enable boot diagnostics (should be enabled by default)
az vm boot-diagnostics get-boot-log \
  --resource-group forensic-vm-rg \
  --name axiom-forensic-vm
```
