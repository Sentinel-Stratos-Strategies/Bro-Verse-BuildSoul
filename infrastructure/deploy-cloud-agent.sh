#!/bin/bash

# Cloud Agent Deployment Script for Azure VM
# This script helps delegate cloud infrastructure deployment tasks

set -e

echo "============================================="
echo "Azure VM Cloud Agent - Deployment Delegator"
echo "============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if running in GitHub Actions
if [ -n "$GITHUB_ACTIONS" ]; then
    print_info "Running in GitHub Actions environment"
    CI_MODE=true
else
    print_info "Running in local environment"
    CI_MODE=false
fi

# Check prerequisites
echo ""
echo "Checking prerequisites..."

# Check for Azure CLI
if command -v az &> /dev/null; then
    print_success "Azure CLI is installed"
    AZ_VERSION=$(az version --query '"azure-cli"' -o tsv)
    print_info "Azure CLI version: $AZ_VERSION"
else
    print_error "Azure CLI is not installed"
    print_info "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check for Terraform
if command -v terraform &> /dev/null; then
    print_success "Terraform is installed"
    # Simple and reliable version extraction
    TF_VERSION=$(terraform version | head -1 | sed 's/Terraform v//' | cut -d' ' -f1)
    print_info "Terraform version: $TF_VERSION"
else
    print_error "Terraform is not installed"
    print_info "Install from: https://www.terraform.io/downloads"
    exit 1
fi

# Check Azure authentication
echo ""
echo "Checking Azure authentication..."
if az account show &> /dev/null; then
    print_success "Authenticated to Azure"
    SUBSCRIPTION=$(az account show --query name -o tsv)
    print_info "Active subscription: $SUBSCRIPTION"
else
    print_error "Not authenticated to Azure"
    print_info "Run: az login"
    exit 1
fi

# Navigate to terraform directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TF_DIR="$SCRIPT_DIR/terraform"

if [ ! -d "$TF_DIR" ]; then
    print_error "Terraform directory not found: $TF_DIR"
    exit 1
fi

cd "$TF_DIR"
print_success "Changed to terraform directory: $TF_DIR"

# Check for terraform.tfvars
echo ""
if [ ! -f "terraform.tfvars" ]; then
    print_warning "terraform.tfvars not found"
    print_info "Creating from template..."
    
    if [ -f "terraform.tfvars.example" ]; then
        cp terraform.tfvars.example terraform.tfvars
        print_warning "IMPORTANT: Edit terraform.tfvars and set REQUIRED values:"
        print_info "  - admin_password: Set a strong password (12+ chars)"
        print_info "  - storage_account_name: Must be globally unique (3-24 lowercase alphanumeric)"
        print_info "  - allowed_ip_range: MUST set your IP for security (use 'curl https://api.ipify.org' to find it)"
        echo ""
        print_warning "SECURITY WARNING: Do NOT use '*' for allowed_ip_range in production!"
        
        if [ "$CI_MODE" = false ]; then
            read -p "Press Enter after editing terraform.tfvars..."
        else
            print_error "In CI mode - terraform.tfvars must be pre-configured"
            exit 1
        fi
    else
        print_error "terraform.tfvars.example not found"
        exit 1
    fi
else
    print_success "terraform.tfvars found"
    
    # Check for security issues in tfvars (escape the asterisk in regex)
    if grep -q 'allowed_ip_range.*=.*"\*"' terraform.tfvars 2>/dev/null || grep -q "allowed_ip_range.*=.*'\*'" terraform.tfvars 2>/dev/null; then
        print_warning "SECURITY WARNING: allowed_ip_range is set to '*' (all IPs)"
        print_info "This allows RDP access from anywhere. Consider restricting to your IP."
    fi
fi

# Deployment options
echo ""
echo "Cloud Agent Deployment Options:"
echo "1) Initialize Terraform"
echo "2) Plan deployment (preview changes)"
echo "3) Apply deployment (create infrastructure)"
echo "4) Show outputs (connection info)"
echo "5) Start VM"
echo "6) Stop VM"
echo "7) Destroy infrastructure"
echo "8) Full deployment (init + apply)"
echo "0) Exit"
echo ""

if [ "$CI_MODE" = true ]; then
    # In CI mode, use environment variable to determine action
    CHOICE="${CLOUD_AGENT_ACTION:-8}"
    print_info "CI Mode - Action: $CHOICE"
else
    read -p "Select option: " CHOICE
fi

case $CHOICE in
    1)
        print_info "Initializing Terraform..."
        terraform init
        print_success "Terraform initialized"
        ;;
    2)
        print_info "Planning deployment..."
        terraform plan
        ;;
    3)
        print_info "Applying deployment..."
        terraform apply
        print_success "Deployment complete!"
        echo ""
        print_info "Connection information:"
        terraform output
        ;;
    4)
        print_info "Deployment outputs:"
        terraform output
        ;;
    5)
        print_info "Starting VM..."
        RG_NAME=$(terraform output -raw resource_group_name 2>/dev/null || echo "forensics-axiom-rg")
        VM_NAME=$(terraform output -raw vm_name 2>/dev/null || echo "axiom-forensics-vm")
        az vm start --resource-group "$RG_NAME" --name "$VM_NAME"
        print_success "VM started"
        ;;
    6)
        print_info "Stopping VM..."
        RG_NAME=$(terraform output -raw resource_group_name 2>/dev/null || echo "forensics-axiom-rg")
        VM_NAME=$(terraform output -raw vm_name 2>/dev/null || echo "axiom-forensics-vm")
        az vm deallocate --resource-group "$RG_NAME" --name "$VM_NAME"
        print_success "VM stopped"
        ;;
    7)
        print_warning "This will destroy all infrastructure!"
        if [ "$CI_MODE" = false ]; then
            read -p "Are you sure? (yes/no): " CONFIRM
            if [ "$CONFIRM" != "yes" ]; then
                print_info "Cancelled"
                exit 0
            fi
        fi
        terraform destroy
        print_success "Infrastructure destroyed"
        ;;
    8)
        print_info "Running full deployment..."
        print_info "Step 1: Initializing Terraform..."
        terraform init
        print_success "Terraform initialized"
        
        echo ""
        print_info "Step 2: Planning deployment..."
        terraform plan
        
        echo ""
        print_info "Step 3: Applying deployment..."
        terraform apply -auto-approve
        
        print_success "Full deployment complete!"
        echo ""
        print_info "Connection information:"
        terraform output
        
        echo ""
        print_info "Next steps:"
        print_info "1. Use the RDP connection string to connect to the VM"
        print_info "2. Format the 1TB data disk in Windows Disk Management"
        print_info "3. Install Axiom forensic software"
        print_info "4. Configure storage access if needed"
        ;;
    0)
        print_info "Exiting"
        exit 0
        ;;
    *)
        print_error "Invalid option"
        exit 1
        ;;
esac

echo ""
print_success "Cloud agent task completed"
