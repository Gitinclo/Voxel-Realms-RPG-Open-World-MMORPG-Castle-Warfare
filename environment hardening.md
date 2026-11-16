# 🔒 Environment, Runtime & Infrastructure Hardening (`environment hardening.md`)

- **Application**: Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)
- **Security Authority**: [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)
- **Implementation Modules**: `src/game/serverAuth.ts`, `src/game/serverHardening.ts`, `src/game/antiCheat.ts`, `src/middleware/auth.ts`, `firestore.rules`, `server.ts`

---

## 1. Fail-Closed Environment Variable Hardening (`resolveServerRuntimeSecurityConfig`)

`src/game/serverAuth.ts` audits environment variables (`process.env`) at process startup before binding port `3000`:

| Variable                                                 | Development Behavior (`NODE_ENV=development`)                                                                             | Production Requirement (`NODE_ENV=production`)                                                                                | Fail-Closed Guardrail                                                                                                                        |
| :------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| `VOXEL_SESSION_SECRET`                                   | Generates an ephemeral 256-bit CSPRNG key (`crypto.randomBytes(32)`) if omitted or left as `.env.example` placeholder.    | Must be an explicit CSPRNG secret of **`>= 32` characters** (`256+ bits` entropy) and not match `.env.example` placeholders.  | Server logs `[SECURITY FATAL]` and exits immediately (`process.exit(1)`) if missing or weak in production.                                   |
| `VOXEL_ADMIN_PASSKEY`                                    | Generates an ephemeral per-boot operator passkey (`dev-op-...`) printed once to local stdout.                             | Must be **`>= 12` characters** and verified via constant-time `crypto.timingSafeEqual` on `POST /api/auth/admin-login`.       | Operator passkey login fails closed with **`HTTP 503`** if unset or left as placeholder in production.                                       |
| `SQL_HOST` / `SQL_USER` / `SQL_PASSWORD` / `SQL_DB_NAME` | Connects via local Cloud SQL Auth Proxy Unix socket (`/app/cloudsql/...`) or local Postgres instance (`src/db/index.ts`). | Connects over IAM-impersonated Cloud SQL Auth Proxy socket with lazy `pg.Pool` (`max: 10`, `connectionTimeoutMillis: 15000`). | Parameterized Drizzle ORM queries (`src/db/users.ts`) prevent SQL injection; all routes require verified Firebase ID tokens (`requireAuth`). |
| `GEMINI_API_KEY`                                         | Read exclusively on the server (`process.env.GEMINI_API_KEY`).                                                            | Never exposed in `VITE_*` client bundle variables or returned by `/api/*` endpoints.                                          | Enforced by `.gitignore` and build bundle inspection.                                                                                        |

---

## 2. HTTP, Cookie & Session Hardening (`server.ts` & `src/game/serverAuth.ts`)

### A. Cryptographic `HttpOnly` Session Cookies

- Session tokens (`voxel_realm_session`) are signed with **HMAC-SHA256** (`base64url(payload).base64url(hmac)`) and verified using `crypto.timingSafeEqual` to prevent timing side-channel attacks.
- Cookie attributes enforced by `buildSessionSetCookieHeader`:
  - `HttpOnly` (prevents `document.cookie` XSS exfiltration)
  - `SameSite=Lax` (mitigates cross-site request forgery)
  - `Path=/`
  - `Secure` (automatically enabled whenever `req.secure` or `X-Forwarded-Proto: https` is present)
  - `Max-Age=43200` (`12 hours` hard expiration)

### B. Same-Origin CSRF & Prototype Pollution Defenses (`src/game/serverHardening.ts`)

- **Same-Origin Verification (`verifySameOriginRequest`)**: Every mutating `/api/*` request (`POST`, `PUT`, `DELETE`, `PATCH`) carrying a session cookie must present a matching `Origin` or `Referer` header (`req.headers.host` or `APP_URL`), or it is rejected with **`HTTP 403`** (`opsCounters.csrfBlocks`).
- **Recursive Prototype Pollution Filter (`containsUnsafePrototypeKey`)**: Every incoming JSON body is recursively scanned (up to depth `12`) for `__proto__`, `constructor`, and `prototype` keys before route handlers execute; offending payloads are rejected with **`HTTP 400`** (`opsCounters.prototypePollutionBlocks`).
- **Payload Size & Rate Limits**:
  - `express.json({ limit: '512kb' })` prevents memory-exhaustion JSON bombs.
  - `SlidingWindowRateLimiter` caps mutating API writes at **`120 req/min/IP`** (`HTTP 429` + `Retry-After`).
  - `BruteForceLockoutGuard` locks `/api/auth/admin-login` for **`15 minutes` (`900s`)** after **`5` failed attempts** from the same IP.

### C. Response Header & Cross-Origin Preview Hardening

- Every response sets:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Cache-Control: no-store` on all `/api/*` responses
  - `app.disable('x-powered-by')`
- Frame embedding is governed by the edge Nginx proxy (`Content-Security-Policy: frame-ancestors 'self' https://*.google.com ...`), avoiding conflicting `X-Frame-Options: SAMEORIGIN` headers in preview iframe environments.

---

## 3. RFC 6455 WebSocket & Authoritative Anti-Cheat Hardening (`/ws/siege`)

1. **Bounded Frame Decoder (`decodeWsFramesHardened`)**:
   - Rejects unmasked client frames (RFC 6455 §5.1 compliance).
   - Enforces a **`32 KiB`** maximum single-frame payload (`1009 Message Too Big`) and **`64 KiB`** maximum per-peer accumulation buffer.
   - Disconnects peers exceeding **`30 messages / second`** after 3 warnings (`1008 Policy Violation`).
   - Disconnects slow consumers whose socket write buffer (`socket.writableLength`) exceeds **`256 KiB`**.
2. **Authoritative Multiplayer Anti-Cheat (`src/game/antiCheat.ts`)**:
   - Validates cohort movement velocity (`<= 45.0 m/s`), teleports (`<= 120.0 m/tick`), monotonic `clientSeq` numbers, rally troop caps (`<= 1T`), and cloud save stat deltas (`sanitizeCloudProfilePatch`), automatically quarantining repeat offenders (`>= 6` strikes).

---

## 4. Cloud Firestore & Secret Hygiene Hardening

1. **Zero-Trust `firestore.rules`**:
   - Default-deny (`allow read, write: if false;`) on all unenumerated paths.
   - Immutable `uid` ownership checks, strict string-length and integer-range bounds, and role-escalation locks (`role == 'player'` unless authenticated as `creatergame31@gmail.com`).
   - Verified against all **12 Dirty Dozen** adversarial rule patterns via `npm run test:rules` and `npm run lint:rules`.
2. **Git & Artifact Hygiene (`.gitignore`)**:
   - `.env`, `.env.*` (except `.env.example`), Android signing keystores (`*.jks`, `*.keystore`, `*.p12`, `*.pem`, `*.key`), and runtime `data/` files are strictly excluded from version control.
