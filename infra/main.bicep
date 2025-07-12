targetScope = 'resourceGroup'

// Parameters
@description('Name of the the environment which is used to generate a short unique hash used in all resources.')
param environmentName string

@description('Primary location for all resources')
param location string = resourceGroup().location

@description('Location for the resource group')
param resourceGroupName string

@description('API Base URL for the frontend application')
param apiBaseUrl string = 'https://apissvq.azurewebsites.net/api'

// Variables
var resourceToken = toLower(uniqueString(subscription().id, resourceGroup().id, environmentName))
var tags = {
  'azd-env-name': environmentName
  'azd-service-name': 'frontflota-web'
}

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'law-${resourceToken}'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'ai-${resourceToken}'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// User Assigned Managed Identity
resource userAssignedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'id-${resourceToken}'
  location: location
  tags: tags
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: 'kv-${resourceToken}'
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenant().tenantId
    enabledForTemplateDeployment: true
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: false
    publicNetworkAccess: 'Enabled'
    accessPolicies: []
  }
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: 'asp-${resourceToken}'
  location: location
  tags: tags
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: true  // true para Linux, false para Windows
  }
}

// App Service
resource webApp 'Microsoft.Web/sites@2024-04-01' = {
  name: 'app-${resourceToken}'
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userAssignedIdentity.id}': {}
    }
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      ftpsState: 'FtpsOnly'
      linuxFxVersion: 'NODE|18-lts'  // Especificar versión de Node.js para Linux
      requestTracingEnabled: true
      httpLoggingEnabled: true
      detailedErrorLoggingEnabled: true
      healthCheckPath: '/'
      appSettings: [
        {
          name: 'API_BASE_URL'
          value: apiBaseUrl
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~2'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '0'  // Cambiado de '1' a '0' para permitir builds en tiempo de despliegue
        }
      ]
      cors: {
        allowedOrigins: ['*']
        supportCredentials: false
      }
      defaultDocuments: [
        'index.html'
        'index.htm'
        'default.htm'
      ]
    }
  }
}

// Site Extension for Node.js
resource siteExtension 'Microsoft.Web/sites/siteextensions@2024-04-01' = {
  parent: webApp
  name: 'Microsoft.ApplicationInsights.AzureWebSites'
}

// Diagnostic Settings for Web App
resource webAppDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'webAppDiagnostics'
  scope: webApp
  properties: {
    workspaceId: logAnalyticsWorkspace.id
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
        retentionPolicy: {
          enabled: false
          days: 0
        }
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
        retentionPolicy: {
          enabled: false
          days: 0
        }
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
        retentionPolicy: {
          enabled: false
          days: 0
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: false
          days: 0
        }
      }
    ]
  }
}

// Outputs
output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = tenant().tenantId
output AZURE_RESOURCE_GROUP string = resourceGroupName
output RESOURCE_GROUP_ID string = resourceGroup().id

output SERVICE_FRONTFLOTA_WEB_IDENTITY_PRINCIPAL_ID string = userAssignedIdentity.properties.principalId
output SERVICE_FRONTFLOTA_WEB_NAME string = webApp.name
output SERVICE_FRONTFLOTA_WEB_URI string = 'https://${webApp.properties.defaultHostName}'
output SERVICE_FRONTFLOTA_WEB_HOSTNAME string = webApp.properties.defaultHostName

output APPLICATIONINSIGHTS_CONNECTION_STRING string = applicationInsights.properties.ConnectionString
output AZURE_KEY_VAULT_ENDPOINT string = keyVault.properties.vaultUri
output AZURE_LOG_ANALYTICS_WORKSPACE_ID string = logAnalyticsWorkspace.id
