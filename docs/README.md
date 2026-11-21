# Voxel Realms RPG — Documentation Index

**Canonical Project Maturity:** `Pre-Production Prototype` (`v1.5.0`)
**Target Public Game Launch Date:** `30/03/2030` (`2030-03-30`)
**Last Updated:** `20/11/2026`

This index classifies repository documentation strictly into **Implemented**, **Simulated**, **Planned**, and **Experimental** tracks so human engineers and AI coding agents can distinguish executable code from architectural specifications.

---

## 1. Core Entry Points & API Contracts (Implemented)

| Document                                   | Purpose                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| [`../README.md`](../README.md)             | High-signal quickstart, verified tech stack, repository map, commands, and env vars       |
| [`./openapi.yaml`](./openapi.yaml)         | OpenAPI 3.1 HTTP/REST contract for `server.ts` + `src/server/routes/*`                    |
| [`../ARCHITECTURE.md`](../ARCHITECTURE.md) | Modular frontend/backend architecture, functional-core domain boundaries, and 3D pipeline |
| [`../SECURITY.md`](../SECURITY.md)         | Threat boundaries, HMAC session auth, fail-closed secrets, CSP, CSRF, and Firestore rules |
| [`../DEPLOYMENT.md`](../DEPLOYMENT.md)     | Multi-stage non-root Docker build, Nginx edge config, health/readiness/metrics probes     |
| [`../CHANGELOG.md`](../CHANGELOG.md)       | Chronological record of implemented codebase milestones                                   |

---

## 2. Implementation Status Matrix (No Marketing Overclaims)

| Subsystem                                                             | Status                                                                | Authoritative Source                                                                                         |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| React 19 + Three.js 0.187 3D Voxel World & Lazy Modals                | **Implemented**                                                       | `src/App.tsx`, `src/components/GameCanvas.tsx`, `src/hooks/*`                                                |
| Modular Express 5 Server (`src/server/routes/*` + `wsGateway.ts`)     | **Implemented**                                                       | `server.ts`, `src/server/*`                                                                                  |
| 20Hz Multi-Sector Siege Loop & RFC 6455 `/ws/siege` Gateway           | **Implemented** (Single-Instance)                                     | `src/server/wsGateway.ts`, `src/game/siegeNetProtocol.ts`                                                    |
| Hash-Chained Authoritative Economy Ledger & Idempotency               | **Implemented** (Disk + Optional PG Schema)                           | `src/game/economyLedger.ts`, `src/server/routes/economyRoutes.ts`, `src/db/schema.ts`                        |
| HMAC Session Auth, Fail-Closed Secrets, RBAC & Anti-Cheat             | **Implemented**                                                       | `src/game/serverAuth.ts`, `src/game/antiCheat.ts`, `src/server/securityHeaders.ts`                           |
| Self-Service PII Export & Multi-Store DSR Erasure Receipt             | **Implemented** (Memory/Disk/PG; Firebase/Firestore noted in receipt) | `src/server/routes/privacyRoutes.ts`                                                                         |
| PostgreSQL + Drizzle ORM Schema & User Persistence                    | **Implemented** (Optional runtime; requires external Postgres)        | `src/db/schema.ts`, `src/db/users.ts`, `src/server/routes/dbRoutes.ts`                                       |
| Regional Topology Routing (`us-east-solara-1`, `eu-west`, `ap-south`) | **Simulated** (Single-Instance Node.js process)                       | `src/game/siegeNetProtocol.ts`                                                                               |
| Distributed Multi-Pod Scaling, Redis Session/Rate-Limit & Shard Mesh  | **Planned** (Phase 2 — Pre-Launch Roadmap)                            | [`../ROADMAP.md`](../ROADMAP.md)                                                                             |
| Native C++20 / Vulkan / DirectX 12 / Metal / Console / WebXR Ports    | **Experimental / Spec Only**                                          | [`../vcpkg.json`](../vcpkg.json), [`../PC.md`](../PC.md), [`../Virtual Reality.md`](../Virtual%20Reality.md) |

---

## 3. Architecture Decision Records & RFCs

- **ADRs:** [`./adr/`](./adr/)
- **RFC Template & Process:** [`./rfcs/TEMPLATE.md`](./rfcs/TEMPLATE.md) & [`../RFC_PROCESS.md`](../RFC_PROCESS.md)

---

## 4. Operations, Security & Quality Runbooks

- **Testing & Verification:** [`../test_strategy.md`](../test_strategy.md), [`../real-world QA.md`](../real-world%20QA.md), [`../determinism_validation.md`](../determinism_validation.md)
- **Production Operations:** [`../deployment validation.md`](../deployment%20validation.md), [`../monitoring.md`](../monitoring.md), [`../backups.md`](../backups.md), [`../incident response.md`](../incident%20response.md), [`../environment hardening.md`](../environment%20hardening.md)
- **Roadmap & Release History:** [`../ROADMAP.md`](../ROADMAP.md), [`../RELEASE_NOTES.md`](../RELEASE_NOTES.md), [`../dependency.md`](../dependency.md)
