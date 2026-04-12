#!/bin/bash
# VisionField VR — Deploy til Azure
# Forudsætninger: az login, terraform init, docker
#
# Brug: ./deploy.sh

set -euo pipefail

PROJECT="visionfield"
ENV="${1:-dev}"
REGISTRY=$(terraform -chdir=infra output -raw container_registry)

echo "=== Deploying VisionField VR ($ENV) ==="

# 1. Log ind i Container Registry
echo "→ Login til Azure Container Registry..."
az acr login --name "${REGISTRY%%.*}"

# 2. Byg og push Docker images
echo "→ Bygger backend..."
docker build -t "$REGISTRY/$PROJECT-backend:latest" backend/
docker push "$REGISTRY/$PROJECT-backend:latest"

echo "→ Bygger dashboard..."
docker build -t "$REGISTRY/$PROJECT-dashboard:latest" dashboard/
docker push "$REGISTRY/$PROJECT-dashboard:latest"

# 3. Opdatér Container Apps
echo "→ Opdaterer Container Apps..."
az containerapp update \
  --name "ca-$PROJECT-$ENV-backend" \
  --resource-group "rg-$PROJECT-$ENV" \
  --image "$REGISTRY/$PROJECT-backend:latest"

az containerapp update \
  --name "ca-$PROJECT-$ENV-dashboard" \
  --resource-group "rg-$PROJECT-$ENV" \
  --image "$REGISTRY/$PROJECT-dashboard:latest"

# 4. Kør database migration
echo "→ Kører Prisma migration..."
az containerapp exec \
  --name "ca-$PROJECT-$ENV-backend" \
  --resource-group "rg-$PROJECT-$ENV" \
  --command "npx prisma db push"

echo ""
echo "=== Deploy færdig ==="
terraform -chdir=infra output
