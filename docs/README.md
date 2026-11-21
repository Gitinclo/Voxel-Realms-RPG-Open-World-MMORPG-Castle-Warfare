# Voxel Realms RPG — Documentation Index

**Canonical Project Maturity:** `Pre-Production Prototype` (`v1.5.0`)
**Target Public Game Launch Date:** `30/03/2030` (`2030-03-30`)
**Last Updated:** `20/11/2026`

This index classifies repository documentation strictly into **Implemented**, **Simulated**, **Planned**, and **Experimental** tracks so human engineers and AI coding agents can distinguish executable code from architectural specifications.

---

## 1. Core Entry Points & API Contracts (Implemented)

| Document                                                                                             | Purpose                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`../README.md`](../README.md)                                                                       | High-signal quickstart, verified tech stack, repository map, commands, and env vars                                      |
| [`../AGENTS.md`](../AGENTS.md)                                                                       | OpenAPI 3.2 Agent Reference & 4-Layer MMORPG protocol stack guardrails for coding agents                                 |
| [`./openapi.yaml`](./openapi.yaml)                                                                   | Layer 4: OpenAPI 3.2.0 HTTP/REST contract (34 operations, hierarchical tags, `$self`) for `server.ts` + `src/server/*`   |
| [`./openapi.3.1.yaml`](./openapi.3.1.yaml)                                                           | Layer 4 Fallback: OpenAPI 3.1.0 downlevel contract (strips 3.2-only fields for legacy generators/linters)                |
| [`./asyncapi.yaml`](./asyncapi.yaml)                                                                 | Layer 2 (Live): AsyncAPI 3.0.0 contract for the RFC 6455 20Hz `/ws/siege` WebSocket gateway (`src/server/wsGateway.ts`)  |
| [`../schemas/flatbuffers/voxel_siege_protocol.fbs`](../schemas/flatbuffers/voxel_siege_protocol.fbs) | Layer 1 (Binary Wire Spec): Zero-copy FlatBuffers schema mirroring `src/game/siegeNetProtocol.ts` (planned UDP/C++20)    |
| [`../schemas/proto/voxel_realm_internal.proto`](../schemas/proto/voxel_realm_internal.proto)         | Layer 3 (Planned Multi-Shard): gRPC / `proto3` internal services (zone handoff, ledger, anti-cheat, guild locks)         |
| [`../ARCHITECTURE.md`](../ARCHITECTURE.md)                                                           | Modular frontend/backend architecture, functional-core domain boundaries, and 3D pipeline                                |
| [`../SECURITY.md`](../SECURITY.md)                                                                   | Threat boundaries, HMAC session auth, fail-closed secrets, CSP, CSRF, and Firestore rules                                |
| [`../DEPLOYMENT.md`](../DEPLOYMENT.md)                                                               | Multi-stage non-root Docker build, Nginx edge config, health/readiness/metrics probes                                    |
| [`../CHANGELOG.md`](../CHANGELOG.md)                                                                 | Chronological record of implemented codebase milestones                                                                  |
| [`./PRE_LAUNCH_CHECKLIST_2030.md`](./PRE_LAUNCH_CHECKLIST_2030.md)                                   | Live Cloud SQL verification + Kustomize/TLS/Redis, 4h soak, security audit, legal review & signed `v*` release checklist |
| [`./release-evidence-template.md`](./release-evidence-template.md)                                   | 24-gate pre-tag release evidence & independent approver sign-off record                                                  |

---

## 2. Implementation Status Matrix (No Marketing Overclaims)

| Subsystem                                                             | Status                                                                                                        | Authoritative Source                                                                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| React 19 + Three.js 0.187 3D Voxel World & Lazy Modals                | **Implemented**                                                                                               | `src/App.tsx`, `src/components/GameCanvas.tsx`, `src/hooks/*`                                                                          |
| Modular Express 5 Server (`src/server/routes/*` + `wsGateway.ts`)     | **Implemented**                                                                                               | `server.ts`, `src/server/*`                                                                                                            |
| 20Hz Multi-Sector Siege Loop & RFC 6455 `/ws/siege` Gateway           | **Implemented** (Single-Instance)                                                                             | `src/server/wsGateway.ts`, `src/game/siegeNetProtocol.ts`                                                                              |
| Hash-Chained Authoritative Economy Ledger & Idempotency               | **Implemented** (Auto-enables PostgreSQL ACID `SELECT ... FOR UPDATE` when `SQL_*` is present; disk fallback) | `src/server/economyService.ts`, `src/db/economyRepository.ts`, `src/game/economyLedger.ts`                                             |
| Managed Cloud SQL PostgreSQL + Drizzle ORM (7 Tables)                 | **Provisioned & Migrated Live** (`ai-studio-416287a7`, `asia-southeast1`, verified via `information_schema`)  | `src/db/schema.ts`, `src/db/index.ts`, `src/db/users.ts`, `src/server/routes/dbRoutes.ts`                                              |
| HMAC Session Auth, Fail-Closed Secrets, Revocation & Anti-Cheat       | **Implemented** (Server-side revocation via `InMemory` or `REDIS_REST_URL`)                                   | `src/game/serverAuth.ts`, `src/server/coordinationStore.ts`, `src/server/securityHeaders.ts`                                           |
| Self-Service PII Export & Multi-Store DSR Erasure Receipt             | **Implemented** (Memory/Disk/PG + session revocation; Firebase/Firestore noted in receipt)                    | `src/server/routes/privacyRoutes.ts`                                                                                                   |
| Kustomize Overlays, ExternalSecret, NetworkPolicy & Prometheus CRDs   | **Implemented in Repo** (Ready for external GKE staging rollout via `.github/workflows/deploy-staging.yml`)   | `k8s/base/*`, `k8s/overlays/*`, `k8s/{networkpolicy,external-secret,service-monitor,pod-monitor}.yaml`                                 |
| Hardened 4h `k6` (20Hz WS) & `Artillery` Soak Suites & Runbooks       | **Implemented in Repo** (Ready for `>=4h` staging execution via `.github/workflows/staging-soak.yml`)         | `loadtest/k6-soak.js`, `loadtest/artillery-siege.yml`, `runbooks/*.md`                                                                 |
| Regional Topology Routing (`us-east-solara-1`, `eu-west`, `ap-south`) | **Simulated** (Single-Instance Node.js process)                                                               | `src/game/siegeNetProtocol.ts`                                                                                                         |
| External Security Audit, Legal Review & Signed `v*` GitHub Release    | **Planned Pre-Launch Gates** (24-gate sign-off tracked toward `30/03/2030`)                                   | [`./PRE_LAUNCH_CHECKLIST_2030.md`](./PRE_LAUNCH_CHECKLIST_2030.md), [`./release-evidence-template.md`](./release-evidence-template.md) |
| Native C++20 / Vulkan / DirectX 12 / Metal / Console / WebXR Ports    | **Experimental / Spec Only**                                                                                  | [`../vcpkg.json`](../vcpkg.json), [`../PC.md`](../PC.md), [`../Virtual Reality.md`](../Virtual%20Reality.md)                           |

---

## 3. Architecture Decision Records & RFCs

- **ADRs:** [`./adr/`](./adr/)
- **RFC Template & Process:** [`./rfcs/TEMPLATE.md`](./rfcs/TEMPLATE.md) & [`../RFC_PROCESS.md`](../RFC_PROCESS.md)

---

## 4. Operations, Security & Quality Runbooks

- **Testing & Verification:** [`../test_strategy.md`](../test_strategy.md), [`../real-world QA.md`](../real-world%20QA.md), [`../determinism_validation.md`](../determinism_validation.md)
- **Production Operations:** [`../deployment validation.md`](../deployment%20validation.md), [`../monitoring.md`](../monitoring.md), [`../backups.md`](../backups.md), [`../incident response.md`](../incident%20response.md), [`../environment hardening.md`](../environment%20hardening.md)
- **Roadmap & Release History:** [`../ROADMAP.md`](../ROADMAP.md), [`../RELEASE_NOTES.md`](../RELEASE_NOTES.md), [`../dependency.md`](../dependency.md)
