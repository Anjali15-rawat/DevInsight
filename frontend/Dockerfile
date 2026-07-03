# ─── Build Stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (Docker layer cache optimization)
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source and build the Nitro production bundle
COPY . .
RUN npm run build

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Security: Create and use a non-privileged system user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy built server assets
COPY --from=builder /app/.output ./.output

USER nodejs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start the compiled Nitro server
CMD ["node", ".output/server/index.mjs"]
