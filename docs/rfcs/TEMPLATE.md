# RFC-NNNN: [Short Descriptive Title]

- **RFC Number**: `NNNN`
- **Author(s)**: `@handle` / `<email>`
- **Status**: `Draft` | `In Review` | `Accepted` | `Rejected` | `Superseded`
- **Target Version**: `v1.x.x`
- **Created Date**: `YYYY-MM-DD`
- **Related ADR / Issues**: `#issue`

---

## 1. Summary & Motivation

Explain the gameplay, engineering, security, or performance problem this proposal solves and why existing systems (`src/game/`, `server.ts`, `cpp/`) cannot address it cleanly without this change.

---

## 2. Architect-First Design Specification

### A. Domain Types (`src/types/`) & Pure Logic (`src/game/`)

- New or updated TypeScript interfaces (`BigInt` constraints documented explicitly).
- Decoupled pure functions and zero DOM coupling verification.

### B. Persistence, Wire Protocol & RBAC Impact

- Impact on `serverPersistence.ts` (`schemaVersion: 2`), `src/db/schema.ts`, `firestore.rules`, or `/ws/siege` opcodes.
- Server-side validation & anti-cheat invariants (`AuthoritativeAntiCheatEngine`).

---

## 3. Alternatives Considered & Trade-Offs

| Option                | Pros                | Cons | Verdict     |
| :-------------------- | :------------------ | :--- | :---------- |
| Option A (Proposed)   | ...                 | ...  | Recommended |
| Option B (Status Quo) | Zero migration cost | ...  | Rejected    |

---

## 4. Verification & Rollback Plan

- Unit tests required (`src/game/*.test.ts`), Dirty Dozen rule checks (`firestore.rules.test.ts`), and 9-Pillar invariants (`systemValidation.ts`).
- Safe rollback procedure (`rollback_procedures.md`).
