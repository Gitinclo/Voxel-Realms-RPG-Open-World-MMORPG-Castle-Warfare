# Coding Standards (`CODING_STANDARDS.md`)

Language-level rules for TypeScript 7, React 19, Three.js WebGL2, Tailwind CSS v4, and C++20 across **Voxel Realms RPG (`v1.5.0`)**.

---

## 1. Architectural Separation (Functional Core / Imperative Shell)

- Pure gameplay calculations (realm suppression, `BigInt` castle power, combat matrices, A\* pathfinding, anti-cheat scoring, EULA receipt hashing, D3 tree coordinates) belong exclusively in `src/game/` and `src/lib/`.
- React components (`src/components/`) must never embed core physics loops or mutate module-global game math tables directly.
- Every new module in `src/game/` requires a co-located `*.test.ts` file executed by `npm test`.

---

## 2. TypeScript Rules

- **Strict Types**: Never use `any` or `@ts-ignore` to silence compiler diagnostics; define explicit interfaces in `src/types/`.
- **`BigInt` Safety**: Troop counts, kingdom power, resource stores (`<= 1,000T`), and Akashic volume indices (`10^97`) must use native `bigint`. Convert explicitly via `BigInt(...)` or string wire helpers (`BigIntWireString`)—never mix `number` and `bigint` in arithmetic.
- **No Dead Code**: `noUnusedLocals` and `noUnusedParameters` fail `npm run lint` cleanly.

---

## 3. React 19 & Three.js WebGL2 Conventions

- **Mount Renderer Once**: In `GameCanvas.tsx`, keep the Three.js scene setup inside an empty-dependency `useEffect`, forwarding live callbacks/settings via `useRef`.
- **Explicit GPU Cleanup**: Dispose dynamically generated `BufferGeometry`, `Material`, and HTML5 `CanvasTexture` assets on unmount or tier swap.
- **Tailwind CSS v4 Only**: Style components exclusively with utility classes defined via `@import "tailwindcss";`—avoid ad-hoc inline `style` objects except for computed dynamic transforms/coordinates.

---

## 4. C++20 & Formatting Enforcement

- **C++20 (`cpp/`)**: Enforce `.clang-tidy` (`cppcoreguidelines-owning-memory`, `modernize-use-nullptr`) and `.clang-format` (LLVM base, 4-space indent, 100-col limit). Use `std::unique_ptr` / `std::shared_ptr` via `make_unique` / `make_shared`.
- **Formatter**: Prettier (`.prettierrc`) governs all TypeScript, TSX, JSON, YAML, CSS, and Markdown files (`npm run format:check`).
