# Debugging Guide (`DEBUGGING_GUIDE.md`)

Systematic diagnostics for client WebGL2 rendering, `20Hz` WebSocket siege netcode, HMAC session cookies, Cloud SQL Drizzle queries, and Firestore security rule failures in **Voxel Realms RPG (`v1.5.0`)**.

---

## 1. Quick Triage Matrix

| Symptom                                                         | Primary Subsystem                                              | Diagnostic Entry Point                                                                   |
| :-------------------------------------------------------------- | :------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| Black 3D viewport / low FPS                                     | `src/components/GameCanvas.tsx`, `src/game/proceduralWorld.ts` | Inspect WebGL context info & GPU/SwiftShader branch in `architectOptimization.ts`        |
| `HTTP 401` / `403` on `/api/admin/*` or `/api/online/siege/cmd` | `src/game/serverAuth.ts`, `server.ts`                          | Check `HttpOnly` cookie presence, CSRF `Origin`/`Referer`, and role revocation timestamp |
| `HTTP 401` on `/api/db/*`                                       | `src/middleware/auth.ts`, `src/lib/firebase-admin.ts`          | Inspect `Authorization: Bearer <idToken>` header & Firebase project ID alignment         |
| Siege troop rubberbanding or FNV-1a desync (`0x13`)             | `src/game/siegeNetProtocol.ts`                                 | Compare `stateHash` between `ClientPredictionRingBuffer` and server tick log             |
| `BigInt` crash (`Cannot mix BigInt and other types`)            | `src/game/math.ts`, `src/game/siegeNetProtocol.ts`             | Audit JSON serialization paths; ensure wire frames use decimal string encoding           |
| Save file corruption after crash                                | `src/game/serverPersistence.ts`                                | Inspect `data/online_realm_state.json`, `.bak`, and SHA-256 envelope logs                |

---

## 2. Debugging Server Auth, CSRF & Anti-Cheat (`server.ts`)

1. **Check live server readiness and active subsystems:**

   ```bash
   curl -s http://localhost:3000/healthz
   curl -s http://localhost:3000/readyz
   curl -s http://localhost:3000/api/ops/readiness
   ```

2. **Inspect Admin RBAC & Lockouts**:
   - After 5 failed `POST /api/auth/admin-login` attempts within 10 minutes, `serverHardening.ts` returns `HTTP 429` with `Retry-After`. Wait out the lockout window or restart the dev server to clear the in-memory lockout map.
   - Client-side `verifyAccountPrivileges` calls in `src/game/adminModeration.ts` are intentionally stamped `UNTRUSTED_CLIENT_PREVIEW`; mutating `localStorage` will never elevate server permissions.

3. **Quarantined Commander Investigation**:
   - Inspect live violation scores via `/api/online/anti-cheat`.
   - When `violationScore >= 100`, an authenticated Root Admin (`creatergame31@gmail.com`) can un-quarantine the session through `POST /api/admin/anti-cheat/pardon`.

---

## 3. Debugging 3D WebGL2 & Memory Leaks (`GameCanvas.tsx`)

- **Context Stability**: `GameCanvas.tsx` mounts the Three.js `WebGLRenderer` once (`useEffect(..., [])`) and reads updated React handlers via `useRef`. If a refactor introduces state dependencies into the renderer effect array, the WebGL context will reset on every HUD click.
- **Disposing Procedural Assets**: Verify that biome chunks, species trait groups, and avatar/clone/shadow meshes invoke `.geometry.dispose()`, `.material.dispose()`, and `.dispose()` on synthesized HTML5 `CanvasTexture` instances during tear-down.
- **In-App Cross-System Inspector**: Open **CppArchitectureModal** (`Dev Tools` -> `System Integrity`) to run `runFullSystemValidationReport()` (`100` deterministic cross-pillar invariants in real time).

---

## 4. Debugging Tests & Firestore Security Rules

- **Run a single targeted suite fast**:

  ```bash
  npx tsx --test src/game/siegeNetProtocol.test.ts
  npx tsx --test src/game/antiCheat.test.ts
  npm run test:rules
  ```

- **Firestore Rules Static & Adversarial Checks**:
  - Run `npm run lint:rules` to detect missing authorization checks or schema bypasses in `firestore.rules`.
  - Run `npm run test:rules` to execute the Dirty Dozen `#1–#12` adversarial rules test suite in `firestore.rules.test.ts`.
