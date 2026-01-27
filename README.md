# Bro-Verse-BuildSoul
Rebuilding Better

## Repository Contents

### Frontend Application
Web application built with modern web technologies, deployed to Azure Static Web Apps.

### Infrastructure
Azure infrastructure code for deploying supporting services and environments.

#### Azure VM for Axiom Forensic Software
Complete infrastructure setup for deploying a Windows VM configured for running Axiom forensic software.

**Quick Start:**
```bash
cd infrastructure/azure
./deploy-vm.sh  # Linux/macOS/WSL
# or
.\deploy-vm.ps1  # Windows PowerShell
```

**Documentation:**
- [Deployment Guide](infrastructure/DEPLOYMENT_GUIDE.md) - Complete step-by-step deployment instructions
- [Architecture](infrastructure/ARCHITECTURE.md) - System architecture and component details
- [Azure README](infrastructure/azure/README.md) - Comprehensive reference
- [Quick Reference](infrastructure/azure/QUICK_REFERENCE.md) - Common commands

**VM Specifications:**
- **Region**: US Central
- **OS**: Windows Server 2022
- **Size**: Standard_D8s_v3 (8 vCPU, 32GB RAM)
- **Storage**: 100GB OS + 1TB data disk (Premium SSD)
- **Cost**: ~$450-520/month

See the [infrastructure directory](infrastructure/) for complete documentation.
