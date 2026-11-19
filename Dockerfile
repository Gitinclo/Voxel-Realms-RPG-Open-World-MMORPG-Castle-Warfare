# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Build Stage (Node.js 24 Alpine)
# Installs all dependencies (including devDependencies) and compiles the Vite
# production frontend bundle into /app/dist.
# ==============================================================================
FROM node:24-alpine AS builder

WORKDIR /app

# Copy lockfiles first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including build/dev toolchain)
RUN npm ci

# Copy application source and compile the production bundle
COPY . .
RUN npm run build

# ==============================================================================
# Optional Stage: Static Edge Serving (Nginx Alpine, non-root UID 10001)
# Build explicitly with: docker build --target nginx-runner -t voxel-web:prod .
# Skipped automatically by BuildKit during default full-stack builds.
# ==============================================================================
FROM nginx:1.27-alpine AS nginx-runner

ENV NODE_ENV=production \
    PORT=8080

RUN rm -f /etc/nginx/conf.d/default.conf \
    && addgroup -g 10001 -S voxel \
    && adduser -u 10001 -S -D -H -s /sbin/nologin -G voxel voxel \
    && mkdir -p /var/cache/nginx /var/log/nginx /usr/share/nginx/html \
    && chown -R voxel:voxel /var/cache/nginx /var/log/nginx /usr/share/nginx/html

COPY --chown=voxel:voxel nginx.conf /etc/nginx/nginx.conf
COPY --from=builder --chown=voxel:voxel /app/dist /usr/share/nginx/html

USER 10001:10001
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null 2>&1 || exit 1

ENTRYPOINT []
CMD ["nginx", "-c", "/etc/nginx/nginx.conf", "-g", "daemon off;"]

# ==============================================================================
# Optional Stage: Headless Browser E2E Runner (Node 24 Debian + Playwright Chromium)
# Build explicitly with: docker build --target e2e-runner -t voxel-e2e:ci .
# Run with: docker run --rm voxel-e2e:ci
# Skipped automatically by BuildKit during default production builds.
# ==============================================================================
FROM node:24-bookworm-slim AS e2e-runner

WORKDIR /app

ENV NODE_ENV=test \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN apt-get update \
    && apt-get install -y --no-install-recommends bash curl ca-certificates fonts-noto-core fonts-noto-color-emoji fonts-jetbrains-mono \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --no-audit \
    && npx playwright install --with-deps chrome-for-testing \
    && npm install -g @playwright/cli \
    && playwright-cli install-browser chrome-for-testing --with-deps \
    && npm cache clean --force

COPY . .
COPY --from=builder /app/dist ./dist

CMD ["npm", "run", "verify:e2e"]

# ==============================================================================
# Stage 2 (Default): Production Runtime (Node.js 24 Alpine)
# Serves the compiled Vite bundle (/app/dist), Express API (/api/*), and 20Hz
# WebSocket Siege server (/ws/siege) as non-root user `node` on port 3000.
# ==============================================================================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    VOXEL_DATA_DIR=/app/data

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled frontend bundle and authoritative server runtime
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/server.ts /app/tsconfig.json /app/metadata.json /app/firebase-applet-config.json ./
COPY --from=builder --chown=node:node /app/src ./src

# Prepare writable data directory owned by the non-root `node` user
RUN mkdir -p /app/data && chown -R node:node /app/data

# Drop root privileges for container security
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/healthz').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start directly with Node as PID 1 for clean SIGTERM/SIGINT graceful shutdown
# Mandatory runtime secrets: VOXEL_SESSION_SECRET (>=32 chars) and VOXEL_ADMIN_PASSKEY (>=12 chars)
CMD ["node", "--import", "tsx", "server.ts"]
