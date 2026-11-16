# Request for Comments (RFC) Process (`RFC_PROCESS.md`)

Structured design-review workflow enforcing the **Architect-First Rule** (`CONTRIBUTING.md`, `discipline.md`) before major protocol, economy, schema, or cosmological changes land in **Voxel Realms RPG (`v1.5.0`)**.

---

## 1. When an RFC Is Required

Submit an RFC under `docs/rfcs/NNNN-short-title.md` before writing implementation code when a proposal:

- Modifies RFC 6455 `/ws/siege` binary/JSON opcodes (`src/game/siegeNetProtocol.ts`) or Cloud SQL / Firestore schemas (`src/db/schema.ts`, `firebase-blueprint.json`).
- Alters **Four-Path Cultivation** multipliers, `BigInt` castle scaling caps (`1,000T`), or **COSMIC_LIMITS** (`1` White Page → `100` Overvoids → `∞` Realities).
- Introduces a new external dependency (`package.json`, `vcpkg.json`) or changes RBAC trust boundaries (`serverAuth.ts`, `firestore.rules`).

---

## 2. RFC Lifecycle Stages

1. **Draft (`docs/rfcs/TEMPLATE.md`)**: Author copies the RFC template, specifies pure types (`src/types/`), invariants (`src/game/systemValidation.ts`), and backward compatibility / migration plan.
2. **Community & Maintainer Review (Min. 5 Business Days)**: Discussed in GitHub Discussions (`ideas.yml`) or PR review comments. Root Maintainer (`creatergame31@gmail.com`) holds final veto on breaking network or security boundaries.
3. **Accepted → ADR Extraction**: Once approved, irreversible architectural choices receive a corresponding Architecture Decision Record (`docs/adr/TEMPLATE.md`) and unit test targets before merging code.
4. **Superseded / Rejected**: Preserved with rationale so future contributors do not revisit dead-end approaches.
