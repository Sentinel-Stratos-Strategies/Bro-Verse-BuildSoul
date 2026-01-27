# Bro-Verse-BuildSoul
Rebuilding Better

## 🌟 Features

- **Frontend**: React-based web application deployed on Azure Static Web Apps
- **Cloud Infrastructure**: Azure VM deployment for forensic software (Axiom)

## 🚀 Azure VM for Axiom Forensics

This repository includes infrastructure-as-code for deploying an Azure Virtual Machine optimized for running Axiom forensic software.

**Quick Start**: See [AZURE_VM_SETUP.md](AZURE_VM_SETUP.md) for deployment instructions.

### VM Specifications
- **Region**: Central US
- **OS**: Windows Server 2022
- **RAM**: 32 GB
- **Storage**: 1 TB data disk + 100 GB Azure Storage

### Deployment Options

**Option 1: Local Deployment**
```bash
cd infrastructure
./deploy-cloud-agent.sh
```

**Option 2: GitHub Actions**
- Navigate to Actions tab
- Select "Azure VM Cloud Deployment"
- Choose deployment action

For detailed documentation, see:
- [Infrastructure README](infrastructure/README.md)
- [Azure VM Setup Guide](AZURE_VM_SETUP.md)
- [Terraform Configuration](infrastructure/terraform/README.md)

## 📦 Frontend Development

The frontend is a React + Vite application located in the `frontend/` directory.

```bash
cd frontend
npm install
npm run dev
```

## 📚 Documentation

- [Azure VM Setup Guide](AZURE_VM_SETUP.md) - Quick start for Azure VM
- [Infrastructure Documentation](infrastructure/README.md) - Detailed infrastructure guide
- [Security Policy](SECURITY.md) - Security guidelines

## 🔒 Security

Please see [SECURITY.md](SECURITY.md) for information about reporting security vulnerabilities.

## 📄 License

See [LICENSE](LICENSE) file for details.
