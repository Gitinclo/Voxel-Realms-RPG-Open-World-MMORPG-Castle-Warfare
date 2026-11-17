# 🛡️ Engineering Discipline & Anti-Spaghetti Constitution (`discipline.md`)

- **Application**: Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)
- **Sovereign Root Owner & Lead Architect**: [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)
- **Enforcement Gate**: `npm run validate` (`lint` + `lint:rules` + `format:check` + `test` [`171` tests across `29` suites] + `build`)

---

## 1. Core Philosophy: Functional Core, Imperative Shell

Complex MMORPG systems—such as `1,000-Trillion` (`10^15`) troop combat, 23-Realm Four-Path Cultivation suppression (`100.0x`), 6-Tier Cosmological Cardinality (`COSMIC_LIMITS`), 20Hz delta-compressed siege networking, and authoritative anti-cheat—rapidly degrade into untestable "spaghetti code" if domain math is mixed with React component state or Three.js scene mutations.

To prevent state entanglement, **Voxel Realms RPG** enforces a strict two-layer boundary:

| Layer                | Directory Scope                                                                                            | Allowed Responsibilities                                                                                                                                              | Forbidden Patterns                                                                                                                    |
| :------------------- | :--------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| **Functional Core**  | `src/game/*.ts` (excluding `audio.ts`), `src/lib/gmail.ts` (MIME helpers), `cpp/VoxelRealmsGuardrails.hpp` | Pure, deterministic functions, immutable state transitions, `BigInt` math, binary/delta serialization, RBAC/anti-cheat validation, and co-located `*.test.ts` suites. | No React hooks (`useState`, `useEffect`), no DOM queries (`document.*`, `window.alert`), and no network I/O inside pure math modules. |
| **Imperative Shell** | `src/App.tsx`, `src/components/*.tsx`, `src/contexts/*.tsx`, `server.ts`, `src/db/*.ts`                    | React 19 UI rendering, Three.js WebGL2 canvas lifecycle, Web Audio synthesis, Express/WebSocket I/O, Cloud SQL Drizzle queries, and Firestore listeners.              | Never embed complex game formulas inline inside JSX handlers; always delegate to a tested function in `src/game/`.                    |

---

## 2. The "Architect-First" Rule & Refactor Cadence

### A. Pre-Flight Specification Before Coding

Before adding any new gameplay feature, network packet, or database table:

1. **Inspect Existing Domain Modules**: Search `src/game/` and `src/types/` to reuse existing types, `BigInt` formatters, and validation helpers rather than duplicating logic.
2. **Design Pure Types & Functions First**: Define the TypeScript interfaces and pure state-transition functions in `src/game/<feature>.ts`.
3. **Write Deterministic Unit Tests Immediately**: Create `src/game/<feature>.test.ts` using `node:test` and `node:assert/strict` covering normal paths, boundary caps, and adversarial inputs.
4. **Register Cross-System Invariants**: Add the feature's structural invariants to `src/game/systemValidation.ts` (`runFullSystemValidationReport`, verifying **103 invariants across 9 pillars**).
5. **Wire into the Imperative Shell Last**: Connect the verified pure functions to React modals (`React.lazy`) or `server.ts` routes.

### B. The 3–4 Feature Refactor Cadence

After every **3 to 4 features**, pause feature work and perform a dedicated **Hygiene & Refactor Pass**:

- Remove dead exports, unused local variables, and redundant helper functions.
- Extract shared constants into canonical catalogs.
- Re-run `npm run validate` and `npm run verify:ops` to confirm zero regressions.

---

## 3. Non-Negotiable Code & Memory Discipline

### 1. Strict TypeScript & Zero-Warning Compilation

- `tsconfig.json` enforces `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`, and `"noFallthroughCasesInSwitch": true`.
- Never use `@ts-ignore`, `@ts-expect-error`, or untyped `any` to silence compiler errors. Narrow union types explicitly across closure boundaries.

### 2. Trillion-Scale `BigInt` Precision Discipline

- Never convert troop counts (`<= 1,000T`), rally capacities (`<= 1T`), Kingdom Power, or `10^97` Akashic Volume indices to IEEE-754 `number` for arithmetic, as `Number.MAX_SAFE_INTEGER` (`9,007,199,254,740,991`) silently truncates values above `9 Quadrillion`.
- Always use native `bigint` (`0n`, `1_000_000_000_000_000n`) in TypeScript and serialize over JSON/WebSocket using `BigIntWireString` (`serializeBigIntWire` / `parseBigIntWire`).

### 3. Three.js WebGL2 & GPU Memory Discipline

- Mount the `THREE.WebGLRenderer` once per `GameCanvas` lifecycle (`useEffect(..., [])`) and read React callbacks via `useRef` so HUD updates never recreate the WebGL context.
- Always dispose of `BufferGeometry`, `Material`, `Texture`, and `MeshBVH` trees (`disposeSceneBVHTrees`) when tearing down meshes or scenes.
- Enforce per-Avatar duplication caps (`<= 3` Clones, `<= 2` Shadows in `src/game/avatarCloneShadow.ts`) so a 50-player raid never exceeds `200` tracked character entities.

### 4. C++20 Smart-Pointer & SIMD Alignment Discipline (`cpp/`)

- Raw owning `new` and `delete` are strictly forbidden by `.clang-tidy` (`cppcoreguidelines-owning-memory`, `WarningsAsErrors: '*'`).
- Always use RAII smart pointers (`std::unique_ptr`, `std::shared_ptr`, `std::make_unique`, `std::make_shared`).
- Maintain `alignas(64)` (`x86_64 AVX-512`) and `alignas(128)` (`Apple Silicon M-Series`) alignment on Structure-of-Arrays (`SoA`) kinematic chunks.

### 5. Security & Trust-Boundary Discipline

- Treat all browser state (`localStorage`, client email selectors, client-side `verifyAccountPrivileges`) as **`UNTRUSTED_CLIENT_PREVIEW`**.
- Every privileged admin/GM action (`/api/admin/*`) and multiplayer write (`/api/online/*`, `/ws/siege`, `/api/db/*`) must be authenticated and authorized on the server (`src/game/serverAuth.ts`, `src/middleware/auth.ts`, `src/game/antiCheat.ts`).

---

## 4. Pre-Commit Verification Commands

Run these commands before every commit or Pull Request:

```bash
npm run format                # Format all TypeScript, JSON, CSS & Markdown files with Prettier
npm run validate              # Run lint + lint:rules + format:check + 171 unit tests + production build
npm run verify:ops            # Run live server load, exploit, crash-recovery & SIGTERM readiness suite
npm audit --audit-level=high  # Verify 0 high/critical dependency vulnerabilities
```
