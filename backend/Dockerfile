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

# Installér kun production dependencies i separat folder
RUN mkdir /app/prod_modules && cp package.json /app/prod_modules/ && cd /app/prod_modules && npm install --omit=dev
# Kopiér Prisma generated client til prod modules
RUN cp -r /app/node_modules/.prisma /app/prod_modules/node_modules/.prisma 2>/dev/null || true
RUN cp -r /app/node_modules/@prisma /app/prod_modules/node_modules/@prisma 2>/dev/null || true

# ─── Production image ────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Sikkerhed: kør ikke som root
RUN addgroup -S visionfield && adduser -S visionfield -G visionfield

COPY --from=builder /app/prod_modules/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

USER visionfield

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
