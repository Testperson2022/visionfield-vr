output "backend_url" {
  value = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
}

output "dashboard_url" {
  value = "https://${azurerm_container_app.dashboard.ingress[0].fqdn}"
}

output "container_registry" {
  value = azurerm_container_registry.main.login_server
}

output "database_host" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "key_vault_name" {
  value = azurerm_key_vault.main.name
}
