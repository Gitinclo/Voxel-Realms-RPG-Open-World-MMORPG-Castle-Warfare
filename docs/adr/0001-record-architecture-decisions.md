# ADR 0001: Record Architecture Decisions & Functional Core Separation

- **Status:** Accepted (`2026-11-15`)
- **Deciders:** Lead Architect (`creatergame31@gmail.com`)

## Context

Open-world 3D MMORPGs accumulate spaghetti dependencies quickly when React hooks, Three.js scene mutations, BigInt math, and multiplayer packet parsing live in the same files.

## Decision

1. Adopt Architecture Decision Records under `docs/adr/` using [`docs/adr/TEMPLATE.md`](./TEMPLATE.md).
2. Place all deterministic game rules, RBAC evaluators, anti-cheat rules, and netcode serialization in pure TypeScript modules under `src/game/` with co-located `*.test.ts` suites (`26` suites) plus `src/lib/gmail.test.ts` and `firestore.rules.test.ts`.

## Consequences

- **Positive:** `168` tests run in `~4s` with zero headless browser overhead; `100` cross-module invariants validate continuously.
- **Negative:** Requires strict discipline (`discipline.md`) never to inline game formulas inside React JSX components.
