# Azure Infrastructure for Multi-Cloud QR Code Generator
terraform {
  required_version = ">= 1.5"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "azurerm" {
    resource_group_name  = "qr-generator-terraform-state"
    storage_account_name = "qrgenterraformstate"
    container_name       = "tfstate"
    key                  = "azure/terraform.tfstate"
  }
}

# Configure Azure Provider
provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

# Data sources
data "azurerm_client_config" "current" {}

# Local values
locals {
  resource_group_name = "${var.project_name}-${var.environment}-rg"
  cluster_name        = "${var.project_name}-${var.environment}-aks"
  
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = "devops-team"
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = local.resource_group_name
  location = var.azure_region

  tags = local.common_tags
}

# Virtual Network Module
module "vnet" {
  source = "../modules/azure-vnet"
  
  project_name        = var.project_name
  environment         = var.environment
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  vnet_cidr          = var.vnet_cidr
  
  tags = local.common_tags
}

# AKS Module
module "aks" {
  source = "../modules/azure-aks"
  
  cluster_name        = local.cluster_name
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  
  vnet_subnet_id = module.vnet.aks_subnet_id
  
  kubernetes_version = var.aks_kubernetes_version
  node_pools        = var.aks_node_pools
  
  tags = local.common_tags
  
  depends_on = [module.vnet]
}

# Storage Account Module
module "storage" {
  source = "../modules/azure-storage"
  
  project_name        = var.project_name
  environment         = var.environment
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  
  storage_account_name = "${var.project_name}${var.environment}storage"
  container_name      = "qr-codes"
  
  tags = local.common_tags
}

# PostgreSQL Module (optional)
module "postgresql" {
  source = "../modules/azure-postgresql"
  count  = var.enable_postgresql ? 1 : 0
  
  project_name        = var.project_name
  environment         = var.environment
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  
  vnet_id           = module.vnet.vnet_id
  database_subnet_id = module.vnet.database_subnet_id
  
  server_name = "${var.project_name}-${var.environment}-psql"
  database_name = var.postgresql_database_name
  admin_username = var.postgresql_admin_username
  
  tags = local.common_tags
  
  depends_on = [module.vnet]
}

# Redis Cache Module (optional)
module "redis" {
  source = "../modules/azure-redis"
  count  = var.enable_redis ? 1 : 0
  
  project_name        = var.project_name
  environment         = var.environment
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  
  vnet_id     = module.vnet.vnet_id
  subnet_id   = module.vnet.redis_subnet_id
  
  redis_name = "${var.project_name}-${var.environment}-redis"
  sku_name   = var.redis_sku_name
  
  tags = local.common_tags
  
  depends_on = [module.vnet]
}

# Key Vault for secrets management
resource "azurerm_key_vault" "main" {
  name                = "${var.project_name}-${var.environment}-kv"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  enabled_for_disk_encryption     = true
  enabled_for_deployment          = true
  enabled_for_template_deployment = true
  purge_protection_enabled        = false

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    key_permissions = [
      "Get", "List", "Update", "Create", "Import", "Delete", "Recover", "Backup", "Restore"
    ]

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Recover", "Backup", "Restore"
    ]

    certificate_permissions = [
      "Get", "List", "Update", "Create", "Import", "Delete", "Recover", "Backup", "Restore"
    ]
  }

  # Access policy for AKS
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = module.aks.kubelet_identity_object_id

    secret_permissions = [
      "Get", "List"
    ]
  }

  tags = local.common_tags
}

# Application Gateway for ingress
resource "azurerm_public_ip" "app_gateway" {
  name                = "${var.project_name}-${var.environment}-appgw-pip"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  allocation_method   = "Static"
  sku                 = "Standard"

  tags = local.common_tags
}

resource "azurerm_application_gateway" "main" {
  name                = "${var.project_name}-${var.environment}-appgw"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  sku {
    name     = "Standard_v2"
    tier     = "Standard_v2"
    capacity = 2
  }

  gateway_ip_configuration {
    name      = "appGatewayIpConfig"
    subnet_id = module.vnet.app_gateway_subnet_id
  }

  frontend_port {
    name = "port_80"
    port = 80
  }

  frontend_port {
    name = "port_443"
    port = 443
  }

  frontend_ip_configuration {
    name                 = "appGwPublicFrontendIp"
    public_ip_address_id = azurerm_public_ip.app_gateway.id
  }

  backend_address_pool {
    name = "defaultaddresspool"
  }

  backend_http_settings {
    name                  = "defaulthttpsetting"
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 60
  }

  http_listener {
    name                           = "defaulthttplistener"
    frontend_ip_configuration_name = "appGwPublicFrontendIp"
    frontend_port_name             = "port_80"
    protocol                       = "Http"
  }

  request_routing_rule {
    name                       = "defaultrule"
    rule_type                  = "Basic"
    http_listener_name         = "defaulthttplistener"
    backend_address_pool_name  = "defaultaddresspool"
    backend_http_settings_name = "defaulthttpsetting"
    priority                   = 1
  }

  tags = local.common_tags

  depends_on = [module.vnet]
}

# Log Analytics Workspace for monitoring
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-${var.environment}-law"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = var.log_retention_days

  tags = local.common_tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "${var.project_name}-${var.environment}-ai"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  tags = local.common_tags
}

# Container Registry
resource "azurerm_container_registry" "main" {
  name                = "${var.project_name}${var.environment}acr"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Standard"
  admin_enabled       = false

  tags = local.common_tags
}

# Grant AKS access to ACR
resource "azurerm_role_assignment" "aks_acr" {
  principal_id                     = module.aks.kubelet_identity_object_id
  role_definition_name             = "AcrPull"
  scope                           = azurerm_container_registry.main.id
  skip_service_principal_aad_check = true
}
