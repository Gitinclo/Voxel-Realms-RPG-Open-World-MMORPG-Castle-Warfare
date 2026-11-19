# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Build Stage (Node.js 22 Alpine)
# Copies dependency manifests first for optimal layer caching, installs exact
# locked dependencies, sets NODE_ENV=production, and builds the Vite bundle.
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy lockfiles first so dependency installation is cached across source edits
COPY package.json package-lock.json ./

# Install exact dependencies (including Vite/TypeScript/Tailwind build toolchain)
RUN npm ci

# Set production build environment after installing dev/build dependencies
ENV NODE_ENV=production

# Copy application source and compile the production frontend bundle into /app/dist
COPY . .
RUN npm run build

# ==============================================================================
# Stage 2: Production Serving Stage (Lightweight Nginx on Alpine Linux)
# Serves the compiled static assets as a dedicated non-root user on port 8080
# with hardened HTTP security headers and unprivileged runtime paths.
# ==============================================================================
FROM nginx:1.27-alpine AS runner

ENV NODE_ENV=production \
    PORT=8080

# Remove default root-oriented Nginx site configuration
RUN rm -f /etc/nginx/conf.d/default.conf

# Create a dedicated non-root system user and group (UID/GID 10001)
RUN addgroup -g 10001 -S voxel \
    && adduser -u 10001 -S -D -H -s /sbin/nologin -G voxel voxel \
    && mkdir -p /var/cache/nginx /var/log/nginx /usr/share/nginx/html \
    && chown -R voxel:voxel /var/cache/nginx /var/log/nginx /usr/share/nginx/html

# Copy hardened non-root Nginx configuration
COPY --chown=voxel:voxel nginx.conf /etc/nginx/nginx.conf

# Copy compiled production bundle from the Node.js builder stage
COPY --from=builder --chown=voxel:voxel /app/dist /usr/share/nginx/html

# Drop root privileges (numeric UID:GID guarantees non-root enforcement in K8s/Docker)
USER 10001:10001

# Unprivileged HTTP port
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null 2>&1 || exit 1

# Bypass default root-oriented /docker-entrypoint.sh scripts and run nginx directly as PID 1
ENTRYPOINT []
CMD ["nginx", "-c", "/etc/nginx/nginx.conf", "-g", "daemon off;"]
