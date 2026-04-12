variable "project" {
  default = "visionfield"
}

variable "environment" {
  default     = "dev"
  description = "dev | staging | prod"
}

variable "location" {
  default     = "westeurope"
  description = "Azure region — EU West for GDPR compliance"
}

variable "db_admin_password" {
  sensitive   = true
  description = "PostgreSQL admin password"
}

variable "jwt_secret" {
  sensitive   = true
  description = "JWT signing secret (min 64 chars)"
}

variable "encryption_key" {
  sensitive   = true
  description = "AES-256-GCM key (64 hex chars = 32 bytes)"
}
