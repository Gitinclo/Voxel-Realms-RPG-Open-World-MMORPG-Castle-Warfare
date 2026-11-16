# Feature Flags & Runtime Controls (`FEATURE_FLAGS.md`)

Policy, registry, and kill-switch governance for URL query toggles, environment-gated features, and VIP/Admin runtime capabilities in **Voxel Realms RPG (`v1.5.0`)**.

---

## 1. Flag Classification

1. **Bootstrap & QA URL Flags (Client-Side Read-Only UX)**:
   - `?autostart=1`: Bypasses `TitleScreen` cleanly to mount `GameCanvas` + `GameHUD` immediately during automated browser QA and local iteration. Never grants elevated permissions.
2. **Environment Flags (Server-Side Process Control, `.env.example`)**:
   - `NODE_ENV`: Switches development fallback vs. fail-closed production secret enforcement (`VOXEL_SESSION_SECRET`, `VOXEL_ADMIN_PASSKEY`).
   - `DISABLE_HMR`: Set `'true'` in hosted iframe sandboxes to avoid Vite HMR WebSocket noise.
   - `PORT`: Listening HTTP/WS port (fixed to `3000` inside AI Studio preview runtime).
   - `SQL_HOST` / `SQL_USER` / `SQL_PASSWORD` / `SQL_DB_NAME`: Enables lazy Cloud SQL PostgreSQL connection pool initialization in `src/db/index.ts`.
3. **Architecture & Graphics Quality Toggles (`src/game/graphicsEngine.ts`)**:
   - Platform presets (`pc_console`, `mobile_astc`, `balanced`, `software_fallback`) dynamically reconfigure `EffectComposer` post-processing, `THREE.LOD` distances, texture canvas resolution (`1024px` / `512px` / `256px`), and `InstancedMesh` foliage budgets.
4. **Authoritative Server Feature Gates (`server.ts` & `src/game/adminModeration.ts`)**:
   - **Species Rebirth Gate**: Once `speciesLocked: true`, race changes require Root Admin (`creatergame31@gmail.com`) clearance or an approved `[SPECIES REBIRTH]` decree (`POST /api/admin/species-rebirth`).
   - **Tier 5 Overvoid & Tier 1 Universe Overrides**: Feature-gated to Clearance Lv. `999` inside `CosmologicalAdminModal.tsx`.
   - **VIP Covenant Gates**: Extra march queues, upgrade discounts, and custom Realm Auras gated by `src/game/vipSubscription.ts` tier verification.

---

## 2. Lifecycle & Hygiene Rules

- Every flag MUST declare an **Owner**, **Default State**, **Rollback Switch**, and **Removal Target Milestone** (`ROADMAP.md`).
- Security boundaries and RBAC privileges (`creatergame31@gmail.com`) are **never** controlled by client-side URL flags or `localStorage`.
- Ephemeral experiment flags must be cleaned up within **two minor releases** after full rollout to prevent conditional branch bloat (`discipline.md`).
