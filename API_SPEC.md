# 🔌 HTTP REST & WebSocket API Specification (`API_SPEC.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

| Endpoint                   |   Method   | Auth          | Request / Purpose                                                                |
| :------------------------- | :--------: | :------------ | :------------------------------------------------------------------------------- |
| `/healthz`                 |   `GET`    | Public        | Returns `{ ok, status, uptimeSec }` (`503` while draining).                      |
| `/readyz`                  |   `GET`    | Public        | 5-check readiness gate (storage, tick budget, WS peer capacity).                 |
| `/api/ops/readiness`       |   `GET`    | Public        | Detailed 20Hz p50/p95/max latency & exploit counter telemetry.                   |
| `/api/auth/player-session` |   `POST`   | Public        | Mints `HttpOnly` HMAC cookie scoped strictly to `role: 'player'`.                |
| `/api/auth/admin-login`    |   `POST`   | Passkey       | Timing-safe check against `VOXEL_ADMIN_PASSKEY` (lockout after 5 fails).         |
| `/api/admin/*`             | `GET/POST` | Staff HMAC    | Moderation, tickets, decrees, species rebirth, anti-cheat pardons (`401`/`403`). |
| `/api/online/sync`         |   `POST`   | Session HMAC  | Sanitizes/clamps stats and runs `AuthoritativeAntiCheatEngine`.                  |
| `/api/db/profile           |    save    | tickets`      | `GET/PUT/POST`                                                                   | Firebase Bearer | `requireAuth` verifies ID token via `firebase-admin`, scoped to `req.uid`. |
| `/ws/siege`                |    `WS`    | Optional/HMAC | 20Hz read telemetry for all; `C2S_*` commands require valid HMAC session.        |
