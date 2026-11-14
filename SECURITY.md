# Security Policy & Server-Side Architecture

The **Voxel Realms RPG** team takes security seriously. This document explains our **server-side enforcement architecture**, **explicit client vs. server trust boundaries**, **production deployment requirements**, and how to responsibly disclose vulnerabilities.

---

## Supported Versions

We provide security updates and critical patches for the following versions of the project:

| Version | Supported | Status                                         |
| :------ | :-------: | :--------------------------------------------- |
| `1.5.x` |    ✅     | Active support & security updates (06/11/2026) |
| `1.4.x` |    ✅     | Active support & security updates              |
| `1.3.x` |    ✅     | Critical security patches only                 |
| `1.2.x` |    ❌     | End of Life (upgrade recommended)              |
| `< 1.2` |    ❌     | End of Life                                    |

---

## Server-Side Enforcement Architecture (`server.ts` + `src/game/serverAuth.ts`)

Client-side roles, email selectors, React state, and browser `localStorage` **are never treated as security boundaries**. Privileged RBAC actions and multiplayer state mutations are enforced by the Express + RFC 6455 WebSocket backend (`server.ts`):

1. **Cryptographic HMAC-SHA256 Sessions (`/api/auth/*`)**:
   - `POST /api/auth/player-session`: Mints an `HttpOnly; SameSite=Lax` HMAC-SHA256 signed session cookie scoped strictly to `role: 'player'` (Clearance `Lv.1`). Passing a staff email (including `creatergame31@gmail.com`) to `/api/auth/player-session` **never** grants staff or admin privileges.
   - `POST /api/auth/admin-login`: Verifies staff roster membership plus timing-safe SHA-256 comparison (`crypto.timingSafeEqual`) against `VOXEL_ADMIN_PASSKEY` before issuing an operator session token. Failed logins return `HTTP 401`/`403` and are recorded in the persistent security audit log.
   - `GET /api/auth/session` & `POST /api/auth/logout`: Validates session signatures with `crypto.timingSafeEqual`, checks token expiration (`exp`), and re-evaluates live server roster status on every request so role revocations or bans take effect immediately.
2. **Fail-Closed RBAC Authorization (`/api/admin/*`)**:
   - `GET /api/admin/state`, `POST /api/admin/moderation`, `POST /api/admin/tickets/resolve`, `POST /api/admin/decree`, and `POST /api/admin/species-rebirth` fail closed with `HTTP 401` when unauthenticated and `HTTP 403` when the verified session lacks the required RBAC capability (`canAccessGmConsole`, `canModeratePlayers`, `canManageRoles`, `canHandleSupportTickets`, `canModerateChat`).
   - All moderation actions ignore client-supplied `actorEmail` fields and bind the actor strictly from the verified server session (`session.email`), enforcing root immutability protection for `creatergame31@gmail.com` server-side.
   - All allow/deny/clamped security events are written to the server-persisted `securityAuditLog` inside `data/online_realm_state.json`.
3. **Anti-Tamper State Validation & WebSocket Session Binding (`/api/online/*`, `/ws/siege`)**:
   - `POST /api/online/sync` and `POST /api/online/siege/cmd` require a valid HMAC-signed session (`HTTP 401` otherwise). Non-staff sessions cannot use `/api/online/sync` to spoof `commanderId`, `email`, `castleLevel`, `cultivationRealmIndex`, `vipTier`, `karma`, or `garrisonTroopsWire`; restricted or out-of-range fields are stripped/clamped server-side and logged (`SYNC_SANITIZED`).
   - `GET /api/online/status` redacts account email addresses (`emailRedacted: true`) from public responses unless requested by a verified staff session.
   - WebSocket connections on `/ws/siege` allow read-only telemetry streaming for spectating peers, but reject unauthenticated `C2S_TROOP_POSITION_CMD` and `C2S_RALLY_ACTION_CMD` mutations with `S2C_AUTH_ERROR` (`401`) and bind authenticated commands to `peer.session.commanderId`.
4. **Security Response Headers & Fail-Closed Operator Config**:
   - `server.ts` disables `x-powered-by`, enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Cache-Control: no-store` on `/api/*`.
   - Operator logins (`/api/auth/admin-login`) fail closed (`503`) in production unless `VOXEL_ADMIN_PASSKEY` (`>= 12` chars) is explicitly configured in environment secrets. If `VOXEL_SESSION_SECRET` is omitted, the server generates an ephemeral per-instance 256-bit CSPRNG HMAC signing key in memory (sessions do not persist across restarts unless `VOXEL_SESSION_SECRET` is set). No secrets are ever hardcoded in client bundles or `.env.example`.

---

## Explicit Trust Boundary Disclosure

- **Untrusted Client Sandbox**: Single-player 3D canvas progression, local resource counters, local `verifyAccountPrivileges(..., 'UNTRUSTED_CLIENT_PREVIEW')`, and `localStorage` caches run in the user's browser for offline convenience and sandbox testing only. Browser DevTools modifications to React state or `localStorage` **do not** bypass server `/api/admin/*` or `/api/online/*` checks.
- **Production Hardening Checklist**: Before exposing `server.ts` on the public internet, deploy behind a TLS-terminating reverse proxy (`HTTPS`/`WSS` so `HttpOnly; Secure` session cookies are encrypted in transit), set high-entropy `VOXEL_SESSION_SECRET` and `VOXEL_ADMIN_PASSKEY` environment secrets, and place rate limiting at your ingress/load balancer.

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

If you believe you have discovered a security vulnerability in this project, please report it privately via email:

📧 **Email:** [creatergame31@gmail.com](mailto:creatergame31@gmail.com)  
📌 **Subject:** `[SECURITY] Voxel Realms RPG - <Brief Vulnerability Title>`

### What to Include in Your Report

To help us investigate and resolve the issue quickly, please include as much of the following information as possible:

1. **Vulnerability Type:** (e.g., Auth/RBAC Bypass, Session Forgery, Cross-Site Scripting [XSS], WebSocket Impersonation, Server-Side State Tampering).
2. **Impact Assessment:** A description of what an attacker could accomplish by exploiting this vulnerability.
3. **Affected Components:** The specific files, functions, routes, or modules involved.
4. **Step-by-Step Reproduction:** Exact steps, payload samples, or a minimal proof of concept (PoC) demonstrating the issue.
5. **Proposed Remediation:** If you have identified a fix or mitigation, please feel free to share it.

---

## Response & Resolution Process

When you report a vulnerability to [creatergame31@gmail.com](mailto:creatergame31@gmail.com), you can expect the following response timeline:

1. **Initial Acknowledgment:** Within **48 hours**, we will confirm receipt of your report.
2. **Triage & Validation:** Within **72 hours**, we will validate the vulnerability, determine its severity, and open a private fix tracking channel.
3. **Mitigation & Fix:** We will work on a patch and coordinate a release window.
4. **Public Disclosure:** Once a fix is verified and deployed in a new version release, we will credit you (unless you request anonymity) in the release notes and [CHANGELOG.md](CHANGELOG.md).

---

## Safe Harbor & Responsible Disclosure

We commit to not pursuing legal action or reporting security researchers to law enforcement provided that you:

- Act in good faith to avoid privacy violations, data destruction, and service disruption.
- Give us reasonable time to resolve the issue before publishing or sharing details publicly.
- Do not exploit the vulnerability beyond what is strictly necessary to prove its existence.
- Do not perform social engineering, phishing, or denial-of-service attacks against our infrastructure or community members.

Thank you for helping us maintain a safe and enjoyable environment for all cultivators and warriors in the realms! 🛡️
