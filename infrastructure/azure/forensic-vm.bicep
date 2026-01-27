// Azure VM for Axiom Forensic Software
// Region: US Central
// VM Size: 32GB RAM, 100GB OS disk
// Additional storage for forensic data

@description('Location for all resources')
param location string = 'centralus'

@description('Admin username for the VM')
param adminUsername string

@description('Admin password for the VM')
@secure()
param adminPassword string

@description('Name of the Virtual Machine')
param vmName string = 'axiom-forensic-vm'

@description('Size of the Virtual Machine')
param vmSize string = 'Standard_D8s_v3' // 8 vCPU, 32GB RAM

@description('Windows OS version')
param osVersion string = '2022-datacenter-azure-edition'

@description('Size of OS disk in GB')
param osDiskSizeGB int = 100

@description('Size of data disk in GB for forensic storage')
param dataDiskSizeGB int = 1024 // 1TB for forensic data

@description('Name of the virtual network')
param vnetName string = 'forensic-vnet'

@description('Name of the subnet')
param subnetName string = 'forensic-subnet'

@description('Name of the network security group')
param nsgName string = 'forensic-nsg'

@description('Name of the public IP address')
param publicIPName string = 'forensic-public-ip'

@description('Name of the network interface')
param nicName string = 'forensic-nic'

// Network Security Group
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: nsgName
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowRDP'
        properties: {
          priority: 1000
          protocol: 'Tcp'
          access: 'Allow'
          direction: 'Inbound'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '3389'
        }
      }
    ]
  }
}

// Virtual Network
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: subnetName
        properties: {
          addressPrefix: '10.0.0.0/24'
          networkSecurityGroup: {
            id: nsg.id
          }
        }
      }
    ]
  }
}

// Public IP Address
resource publicIP 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: publicIPName
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
    dnsSettings: {
      domainNameLabel: toLower('${vmName}-${uniqueString(resourceGroup().id)}')
    }
  }
}

// Network Interface
resource nic 'Microsoft.Network/networkInterfaces@2023-05-01' = {
  name: nicName
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          subnet: {
            id: vnet.properties.subnets[0].id
          }
          privateIPAllocationMethod: 'Dynamic'
          publicIPAddress: {
            id: publicIP.id
          }
        }
      }
    ]
  }
}

// Virtual Machine
resource vm 'Microsoft.Compute/virtualMachines@2023-03-01' = {
  name: vmName
  location: location
  properties: {
    hardwareProfile: {
      vmSize: vmSize
    }
    osProfile: {
      computerName: vmName
      adminUsername: adminUsername
      adminPassword: adminPassword
      windowsConfiguration: {
        enableAutomaticUpdates: true
        provisionVMAgent: true
      }
    }
    storageProfile: {
      imageReference: {
        publisher: 'MicrosoftWindowsServer'
        offer: 'WindowsServer'
        sku: osVersion
        version: 'latest'
      }
      osDisk: {
        name: '${vmName}-osdisk'
        caching: 'ReadWrite'
        createOption: 'FromImage'
        managedDisk: {
          storageAccountType: 'Premium_LRS'
        }
        diskSizeGB: osDiskSizeGB
      }
      dataDisks: [
        {
          name: '${vmName}-datadisk-forensic'
          diskSizeGB: dataDiskSizeGB
          lun: 0
          createOption: 'Empty'
          managedDisk: {
            storageAccountType: 'Premium_LRS'
          }
          caching: 'ReadWrite'
        }
      ]
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: nic.id
        }
      ]
    }
    diagnosticsProfile: {
      bootDiagnostics: {
        enabled: true
      }
    }
  }
}

// Outputs
output vmName string = vm.name
output publicIPAddress string = publicIP.properties.ipAddress
output fqdn string = publicIP.properties.dnsSettings.fqdn
output adminUsername string = adminUsername
output vmSize string = vmSize
output location string = location
output dataDiskSize string = '${dataDiskSizeGB}GB'
output osDiskSize string = '${osDiskSizeGB}GB'
