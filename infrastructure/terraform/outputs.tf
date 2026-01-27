output "vm_public_ip" {
  description = "Public IP address of the VM"
  value       = azurerm_public_ip.forensics_pip.ip_address
}

output "vm_name" {
  description = "Name of the VM"
  value       = azurerm_windows_virtual_machine.forensics_vm.name
}

output "vm_id" {
  description = "ID of the VM"
  value       = azurerm_windows_virtual_machine.forensics_vm.id
}

output "storage_account_name" {
  description = "Name of the storage account"
  value       = azurerm_storage_account.forensics_storage.name
}

output "storage_container_name" {
  description = "Name of the storage container"
  value       = azurerm_storage_container.forensics_container.name
}

output "data_disk_id" {
  description = "ID of the 1TB data disk"
  value       = azurerm_managed_disk.forensics_data_disk.id
}

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.forensics_rg.name
}

output "rdp_connection_string" {
  description = "RDP connection command"
  value       = "mstsc /v:${azurerm_public_ip.forensics_pip.ip_address}"
}
