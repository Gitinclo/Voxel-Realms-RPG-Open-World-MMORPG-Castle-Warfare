# 🏛️ Project Governance (`GOVERNANCE.md`)

This document defines the governance model, role hierarchy, role-based access control (RBAC) clearances, and decision-making processes for **Voxel Realms RPG: Open World MMORPG & Castle Warfare**.

---

## 1. Governance Philosophy

**Voxel Realms RPG** operates under a **Meritocratic Benevolent Dictator / Lead Architect Model** combined with strict automated technical guardrails:

1. **Clear Executive Stewardship**: Ultimate administrative, architectural, and moderation authority rests with the Project Creator & Supreme Administrator (**[creatergame31@gmail.com](mailto:creatergame31@gmail.com)**).
2. **Code Quality Over Politics**: No code—regardless of author role—may bypass the repository's automated CI/CD gates (`npm run lint`, `npm test`, `npx prettier --check .`, and C++20 `clang-tidy`/`clang-format` checks in [`.github/workflows/build.yml`](./.github/workflows/build.yml)).
3. **Transparent Community Moderation**: All in-game and community enforcement actions follow the standards in [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) and are logged with an explicit audit reason and actor email.

---

## 2. Roles & RBAC Clearance Hierarchy

The governance structure mirrors the deterministic Role-Based Access Control (RBAC) engine implemented in [`src/game/adminModeration.ts`](./src/game/adminModeration.ts):

| Role Title                             | Internal Role ID | Clearance Level | Designated Holder / Scope                                     | Core Responsibilities & Permissions                                                                                                                                                       |
| :------------------------------------- | :--------------- | :-------------: | :------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Root Owner & Supreme Administrator** | `owner_admin`    |   **Lv. 999**   | **[creatergame31@gmail.com](mailto:creatergame31@gmail.com)** | Full repository, legal, release, GM, Admin, Moderator, and Official Contact authority. Protected by root immutability guardrails (`cannotSanctionRootAdmin`).                             |
| **Game Master (GM)**                   | `game_master`    |   **Lv. 800**   | Appointed Live-Ops Staff                                      | Live world state management, weather/time overrides, castle/resource recovery, T20 cohort spawning for balance testing, player moderation, and support ticket triage.                     |
| **Core Maintainer / Administrator**    | `administrator`  |   **Lv. 600**   | Core Committers & Admins                                      | Reviewing and merging Pull Requests, managing staff/moderator roles, enforcing architectural guardrails, and handling ban appeals.                                                        |
| **Community Moderator**                | `moderator`      |   **Lv. 300**   | Appointed Realm Moderators                                    | Enforcing [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) in World/Clan chat, issuing warnings, muting disruptive accounts, applying temporary suspensions, and triaging moderation reports. |
| **Contributor & Realm Player**         | `player`         |    **Lv. 1**    | Community Members & Players                                   | Submitting bug reports, feature requests, documentation improvements, and Pull Requests; participating in gameplay and reporting issues via [`SUPPORT.md`](./SUPPORT.md).                 |

---

## 3. Decision-Making & RFC Process

### A. Routine Bug Fixes, UI Polish & Test Additions

- May be submitted directly via a Pull Request following [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md).
- Requires all automated CI checks (`108` unit tests across 17 suites, TypeScript strict lint, Prettier formatting) to pass and approval from at least one **Core Maintainer / Administrator** (`Lv. 600+`) or the **Root Owner** (`creatergame31@gmail.com`).

### B. Major Gameplay, Mathematical or Engine Changes ("Architect-First" RFCs)

Any change that alters:

- Trillion-scale Castle or Troop power math (`src/game/math.ts`),
- Four-Path Cultivation realms, suppression exponents, or Karma rules (`src/game/cultivationMath.ts`),
- 10-Species / Race catalog, 3D procedural traits, or Admin species rebirth rules (`src/game/species.ts`),
- 6-Layer Cosmic Hierarchy (`1. Universe` → `6. The White Page / The House of Ideas`), Infinite Omniverse & 100 Species Background NPCs (`src/game/omniverse.ts`),
- Imperial Lore & 7 Grand Historical Epochs (`src/game/loreHistory.ts`),
- 9-Pillar Cross-System Validation & Integrity Audit (`src/game/systemValidation.ts`),
- Engineering Transparency Matrix (`Implemented` vs. `Simulated` vs. `Planned`) & live WebGL2 pipeline (`src/game/graphicsEngine.ts` & `src/game/proceduralWorld.ts`),
- Software & Hardware Architect ISA/GPU/TDP/SoA optimization (`src/game/architectOptimization.ts`),
- Network wire schemas (`CHANGELOG.md` / `v1.5.0` Siege Protocol), or
- C++20 RAII / SIMD headers (`cpp/VoxelRealmsGuardrails.hpp`),

must follow the **Architect-First Rule**:

1. **Proposal Specification**: Document the proposed data structures, pure functions, and backward-compatibility impact in an issue or architecture draft before writing UI code.
2. **Pure Logic & Unit Tests First**: Implement the decoupled logic in `src/game/<module>.ts` alongside deterministic `node:test` assertions in `src/game/<module>.test.ts`.
3. **Maintainer Sign-Off**: Final approval on core balance formulas, monetization/VIP tiers, and security policies is reserved for the Root Owner (**[creatergame31@gmail.com](mailto:creatergame31@gmail.com)**).

---

## 4. Moderator Appointment, Accountability & Appeals

- **Appointment**: Community Moderators (`moderator`) and Administrators (`administrator`) are appointed by **[creatergame31@gmail.com](mailto:creatergame31@gmail.com)** based on sustained constructive contributions and adherence to [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).
- **Audit Logging**: Every moderation action (`warn`, `mute`, `temp_ban`, `perm_ban`, `restore_active`, `grant_moderator`, `grant_admin`) records `lastActionBy`, `lastActionTimestamp`, and `sanctionReason` in the moderation ledger.
- **Appeals**: Any contributor or player who believes a moderation action was taken in error may appeal directly to **[creatergame31@gmail.com](mailto:creatergame31@gmail.com)** with the subject prefix `[APPEAL] Voxel Realms RPG`.
