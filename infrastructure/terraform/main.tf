# Azure VM for Axiom Forensic Software
# Region: US Central
# OS: Windows
# RAM: 32 GB
# Storage: 1 TB + 100 GB storage bucket

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "forensics_rg" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

# Virtual Network
resource "azurerm_virtual_network" "forensics_vnet" {
  name                = "${var.vm_name}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.forensics_rg.location
  resource_group_name = azurerm_resource_group.forensics_rg.name
  tags                = var.tags
}

# Subnet
resource "azurerm_subnet" "forensics_subnet" {
  name                 = "${var.vm_name}-subnet"
  resource_group_name  = azurerm_resource_group.forensics_rg.name
  virtual_network_name = azurerm_virtual_network.forensics_vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Public IP
resource "azurerm_public_ip" "forensics_pip" {
  name                = "${var.vm_name}-pip"
  location            = azurerm_resource_group.forensics_rg.location
  resource_group_name = azurerm_resource_group.forensics_rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = var.tags
}

# Network Security Group
resource "azurerm_network_security_group" "forensics_nsg" {
  name                = "${var.vm_name}-nsg"
  location            = azurerm_resource_group.forensics_rg.location
  resource_group_name = azurerm_resource_group.forensics_rg.name
  tags                = var.tags

  # RDP access (restrict to specific IP ranges in production)
  security_rule {
    name                       = "AllowRDP"
    priority                   = 1000
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3389"
    source_address_prefix      = var.allowed_ip_range
    destination_address_prefix = "*"
  }
}

# Network Interface
resource "azurerm_network_interface" "forensics_nic" {
  name                = "${var.vm_name}-nic"
  location            = azurerm_resource_group.forensics_rg.location
  resource_group_name = azurerm_resource_group.forensics_rg.name
  tags                = var.tags

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.forensics_subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.forensics_pip.id
  }
}

# Associate NSG with NIC
resource "azurerm_network_interface_security_group_association" "forensics_nic_nsg" {
  network_interface_id      = azurerm_network_interface.forensics_nic.id
  network_security_group_id = azurerm_network_security_group.forensics_nsg.id
}

# Storage Account for forensics data
resource "azurerm_storage_account" "forensics_storage" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.forensics_rg.name
  location                 = azurerm_resource_group.forensics_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                     = var.tags
}

# Storage Container (100 GB bucket)
resource "azurerm_storage_container" "forensics_container" {
  name                  = "forensics-data"
  storage_account_id    = azurerm_storage_account.forensics_storage.id
  container_access_type = "private"
}

# Windows Virtual Machine
resource "azurerm_windows_virtual_machine" "forensics_vm" {
  name                = var.vm_name
  resource_group_name = azurerm_resource_group.forensics_rg.name
  location            = azurerm_resource_group.forensics_rg.location
  size                = var.vm_size
  admin_username      = var.admin_username
  admin_password      = var.admin_password
  tags                = var.tags

  network_interface_ids = [
    azurerm_network_interface.forensics_nic.id,
  ]

  os_disk {
    name                 = "${var.vm_name}-osdisk"
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = 256
  }

  source_image_reference {
    publisher = "MicrosoftWindowsServer"
    offer     = "WindowsServer"
    sku       = "2022-datacenter-azure-edition"
    version   = "latest"
  }

  # Enable boot diagnostics
  boot_diagnostics {
    storage_account_uri = azurerm_storage_account.forensics_storage.primary_blob_endpoint
  }
}

# Data Disk for forensics work (1 TB)
resource "azurerm_managed_disk" "forensics_data_disk" {
  name                 = "${var.vm_name}-data-disk"
  location             = azurerm_resource_group.forensics_rg.location
  resource_group_name  = azurerm_resource_group.forensics_rg.name
  storage_account_type = "Premium_LRS"
  create_option        = "Empty"
  disk_size_gb         = 1024
  tags                 = var.tags
}

# Attach data disk to VM
resource "azurerm_virtual_machine_data_disk_attachment" "forensics_data_disk_attach" {
  managed_disk_id    = azurerm_managed_disk.forensics_data_disk.id
  virtual_machine_id = azurerm_windows_virtual_machine.forensics_vm.id
  lun                = 0
  caching            = "ReadWrite"
}
