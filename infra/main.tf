# VisionField VR — Azure Infrastructure
# Klasse IIa medicinsk software — GDPR EU West deployment
#
# Ressourcer:
#   - Resource Group
#   - Container Registry (Docker images)
#   - PostgreSQL Flexible Server (GDPR encrypted at rest)
#   - Key Vault (secrets management)
#   - Container Apps Environment + 2 Container Apps (backend + dashboard)
#   - Log Analytics Workspace (audit trail)

terraform {
  required_version = ">= 1.5"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.90"
    }
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false # GDPR: behold slettede secrets
    }
  }
}

locals {
  prefix = "${var.project}-${var.environment}"
  tags = {
    project     = var.project
    environment = var.environment
    managed_by  = "terraform"
    compliance  = "MDR-2017-745-ClassIIa"
  }
}

# ─── Resource Group ───────────────────────────────────────────────

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.prefix}"
  location = var.location
  tags     = local.tags
}

# ─── Log Analytics (audit trail + monitoring) ─────────────────────

resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 90 # GDPR audit trail retention
  tags                = local.tags
}

# ─── Container Registry ──────────────────────────────────────────

resource "azurerm_container_registry" "main" {
  name                = replace("cr${local.prefix}", "-", "")
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Basic"
  admin_enabled       = true
  tags                = local.tags
}

# ─── PostgreSQL Flexible Server ──────────────────────────────────

resource "azurerm_postgresql_flexible_server" "main" {
  name                = "psql-${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  administrator_login    = "visionfield"
  administrator_password = var.db_admin_password

  sku_name   = "B_Standard_B1ms" # Burstable, billigste
  version    = "15"
  storage_mb = 32768 # 32 GB

  backup_retention_days = 30 # GDPR compliance

  tags = local.tags
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "${var.project}_${var.environment}"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Tillad Azure services at forbinde
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# ─── Key Vault ───────────────────────────────────────────────────

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                = "kv-${local.prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  purge_protection_enabled   = true # GDPR: forhindre permanent sletning
  soft_delete_retention_days = 90

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = ["Get", "List", "Set", "Delete"]
  }

  tags = local.tags
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = var.jwt_secret
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "encryption_key" {
  name         = "encryption-key"
  value        = var.encryption_key
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = var.db_admin_password
  key_vault_id = azurerm_key_vault.main.id
}

# ─── Container Apps Environment ──────────────────────────────────

resource "azurerm_container_app_environment" "main" {
  name                       = "cae-${local.prefix}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  tags                       = local.tags
}

# ─── Backend Container App ───────────────────────────────────────

resource "azurerm_container_app" "backend" {
  name                         = "ca-${local.prefix}-backend"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.tags

  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "registry-password"
  }

  secret {
    name  = "registry-password"
    value = azurerm_container_registry.main.admin_password
  }

  secret {
    name  = "database-url"
    value = "postgresql://visionfield:${var.db_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.project}_${var.environment}?sslmode=require"
  }

  secret {
    name  = "jwt-secret"
    value = var.jwt_secret
  }

  secret {
    name  = "encryption-key"
    value = var.encryption_key
  }

  template {
    min_replicas = 1
    max_replicas = 3

    container {
      name   = "backend"
      image  = "${azurerm_container_registry.main.login_server}/${var.project}-backend:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }
      env {
        name        = "JWT_SECRET"
        secret_name = "jwt-secret"
      }
      env {
        name        = "ENCRYPTION_KEY"
        secret_name = "encryption-key"
      }
      env {
        name  = "PORT"
        value = "3001"
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "ALLOWED_ORIGINS"
        value = "https://ca-${local.prefix}-dashboard.${azurerm_container_app_environment.main.default_domain}"
      }
      env {
        name  = "JWT_EXPIRES_IN"
        value = "8h"
      }
      env {
        name  = "BCRYPT_COST"
        value = "12"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3001
    transport        = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

# ─── Dashboard Container App ─────────────────────────────────────

resource "azurerm_container_app" "dashboard" {
  name                         = "ca-${local.prefix}-dashboard"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.tags

  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "registry-password"
  }

  secret {
    name  = "registry-password"
    value = azurerm_container_registry.main.admin_password
  }

  template {
    min_replicas = 1
    max_replicas = 2

    container {
      name   = "dashboard"
      image  = "${azurerm_container_registry.main.login_server}/${var.project}-dashboard:latest"
      cpu    = 0.25
      memory = "0.5Gi"
    }
  }

  ingress {
    external_enabled = true
    target_port      = 80
    transport        = "auto"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}
