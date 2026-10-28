# Multi-stage Dockerfile for Google Cloud Run
FROM node:22-slim AS builder

WORKDIR /app

# Dependency manifest
COPY package*.json tsconfig.json ./
RUN npm ci

# Source code
COPY src ./src
COPY 2R_BRAIN ./2R_BRAIN

# Build TypeScript to JavaScript
RUN npm run build

# Production runner image
FROM node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Copy compiled files and production dependencies only
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/2R_BRAIN ./2R_BRAIN
COPY --from=builder /app/src/public ./dist/public

# Security: run as non-root user
USER node

EXPOSE 8080

CMD ["node", "dist/index.js"]
