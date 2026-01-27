variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "forensics-axiom-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "centralus"
}

variable "vm_name" {
  description = "Name of the virtual machine"
  type        = string
  default     = "axiom-forensics-vm"
}

variable "vm_size" {
  description = "Size of the VM (Standard_D8s_v3 = 8 vCPUs, 32 GB RAM)"
  type        = string
  default     = "Standard_D8s_v3"
}

variable "admin_username" {
  description = "Admin username for the VM"
  type        = string
  default     = "azureuser"
}

variable "admin_password" {
  description = "Admin password for the VM (use Azure Key Vault in production)"
  type        = string
  sensitive   = true
}

variable "storage_account_name" {
  description = "Name of the storage account (must be globally unique)"
  type        = string
  default     = "forensicsaxiomstorage"
}

variable "allowed_ip_range" {
  description = "IP range allowed to RDP into the VM (use specific IP in production)"
  type        = string
  default     = "*"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Environment = "Forensics"
    Purpose     = "Axiom Software"
    ManagedBy   = "Terraform"
  }
}
