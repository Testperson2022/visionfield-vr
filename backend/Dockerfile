# VisionField VR Backend — Multi-stage Docker build
# Klasse IIa medicinsk software — GDPR-kompatibel

FROM node:20-alpine AS builder

WORKDIR /app

# Kopiér package files først (caching)
COPY package.json package-lock.json* ./
COPY backend/package.json backend/
COPY shared/package.json shared/

# Installér alle dependencies (inkl. devDependencies til build)
RUN cd backend && npm install

# Kopiér kildekode
COPY shared/ shared/
COPY backend/ backend/

# Generér Prisma client + byg TypeScript
RUN cd backend && npx prisma generate && npx tsc

# ─── Production image ────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Sikkerhed: kør ikke som root
RUN addgroup -S visionfield && adduser -S visionfield -G visionfield

COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma

USER visionfield

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
