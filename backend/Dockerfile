# VisionField VR Backend — Multi-stage Docker build
# Klasse IIa medicinsk software — GDPR-kompatibel

FROM node:20-alpine AS builder

WORKDIR /app

# Kopiér package.json og installér dependencies
COPY package.json ./
RUN npm install

# Kopiér prisma schema og generér client
COPY prisma/ prisma/
RUN npx prisma generate

# Kopiér kildekode og byg
COPY src/ src/
COPY tsconfig.json ./
RUN npx tsc

# ─── Production image ─────────────────────────────────────────��──
FROM node:20-alpine AS production

WORKDIR /app

# Sikkerhed: kør ikke som root
RUN addgroup -S visionfield && adduser -S visionfield -G visionfield

# Installér kun production dependencies
COPY package.json ./
RUN npm install --omit=dev

# Kopiér prisma schema og generér client mod prod node_modules
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

# Kopiér kompileret kode
COPY --from=builder /app/dist ./dist

USER visionfield

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
