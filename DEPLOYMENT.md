# Containerized Production Deployment Guide (`DEPLOYMENT.md`)

This guide explains how to build, run, and verify the production Docker image for **Voxel Realms RPG** using the root `Dockerfile` and `.dockerignore`.

---

## 1. Container Architecture Overview

- **Builder Stage (`node:26-alpine AS builder`)**: Copies `package.json` and `package-lock.json` first for layer caching, installs all dependencies (`npm ci`), and compiles the Vite production frontend bundle into `/app/dist` (`npm run build`).
- **Runtime Stage (`node:26-alpine AS runner`, default target)**:
  - Runs with `NODE_ENV=production` and `PORT=3000`.
  - Installs production dependencies only (`npm ci --omit=dev && npm cache clean --force`), excluding `devDependencies` from the final image.
  - Copies only the compiled `/app/dist` bundle and required runtime files (`server.ts`, `tsconfig.json`, `metadata.json`, `firebase-applet-config.json`, `src/`).
  - Drops root privileges via `USER node` and starts directly with Node as PID 1 (`CMD ["node", "--import", "tsx", "server.ts"]`) for graceful `SIGTERM`/`SIGINT` shutdowns.
- **Build Context Hygiene (`.dockerignore`)**: Excludes `node_modules`, `dist`, `data`, `.git`, `.env`, `.env.*` (except `.env.example`), `npm-debug.log`, `Dockerfile`, `.dockerignore`, and local build/signing artifacts.

---

## 2. Build the Production Image

From the project root directory (alongside `package.json` and `Dockerfile`):

```bash
docker build -t my-app:prod .
```

Optional static-only Nginx edge build (non-root `nginx:1.31-alpine` on port `8080`, using `nginx.conf`):

```bash
docker build --target nginx-runner -t my-app:nginx .
```

---

## 3. Run the Container

`server.ts` enforces **fail-closed security**: in `NODE_ENV=production`, the process refuses to start unless both `VOXEL_SESSION_SECRET` (`>= 32` chars, non-placeholder) and `VOXEL_ADMIN_PASSKEY` (`>= 12` chars, non-placeholder) are provided.

### Standard Verification Run (with Required Production Secrets)

```bash
docker run --rm -p 3000:3000 \
  -e VOXEL_SESSION_SECRET="$(openssl rand -hex 32)" \
  -e VOXEL_ADMIN_PASSKEY="replace-with-strong-admin-passkey" \
  my-app:prod
```

If you store secrets in an untracked local environment file (e.g., `.env.prod`):

```bash
docker run --rm -p 3000:3000 --env-file .env.prod my-app:prod
```

> **Note on Bare Run (`docker run -p 3000:3000 my-app:prod`)**: Running `docker run -p 3000:3000 my-app:prod` without passing `VOXEL_SESSION_SECRET` and `VOXEL_ADMIN_PASSKEY` will intentionally exit with status `1` and log `[SECURITY FATAL] Refusing to start server (fail-closed)`. This confirms fail-closed secret protection is active.

### Persistent Volume for Realm Snapshots

Mount `/app/data` so atomic realm snapshots survive container restarts (ensure UID `1000` / `node` has write access):

```bash
docker run -d --name voxel-realms \
  -p 3000:3000 \
  -v voxel_realms_data:/app/data \
  -e VOXEL_SESSION_SECRET="$(openssl rand -hex 32)" \
  -e VOXEL_ADMIN_PASSKEY="replace-with-strong-admin-passkey" \
  my-app:prod
```

---

## 4. Verify the Running Container

Once the container is listening on port `3000`, run the following checks:

### A. Liveness & Readiness Probes

```bash
curl -fsS http://localhost:3000/healthz
curl -fsS http://localhost:3000/readyz
```

Expected: HTTP `200 OK` JSON payloads reporting server health and readiness.

### B. Compiled Frontend & Production Security Headers

```bash
curl -sI http://localhost:3000/
```

Confirm the response returns `HTTP/1.1 200 OK` and includes:

- `Content-Security-Policy`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Frame-Options: SAMEORIGIN` (unless `ALLOW_PREVIEW_IFRAME=true`)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`

### C. Non-Root User & Container Health Check

```bash
docker exec voxel-realms id
docker inspect --format='{{.State.Health.Status}}' voxel-realms
```

Expected: `uid=1000(node) gid=1000(node)` and `healthy`.

### D. Graceful Shutdown

```bash
docker stop voxel-realms
```

Confirm `server.ts` logs graceful WebSocket draining and exits cleanly with code `0`.

---

## 5. Pre-Deployment Quality Gate

Run the local verification scripts before pushing an image to staging or production:

```bash
npm ci
npm run lint
npm test
npm run verify:ops
npm run build
```
