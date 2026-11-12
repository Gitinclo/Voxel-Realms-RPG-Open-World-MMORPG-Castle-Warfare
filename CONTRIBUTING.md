# Contributing to Voxel Realms RPG

First off, thank you for taking the time to contribute! 🎉

Welcome to **Voxel Realms RPG: Open World MMORPG & Castle Warfare**. Whether you are fixing bugs, optimizing the 3D WebGL renderer, balancing cultivation realm multipliers, fine-tuning monster AI behavior trees, or expanding castle warfare siege weapons, your contributions are warmly welcomed.

Please take a moment to review this document to ensure a smooth and productive collaboration process.

---

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to **[creatergame31@gmail.com](mailto:creatergame31@gmail.com)**.

---

## Getting Started

### Prerequisites

- **Node.js**: v20.x or higher (LTS recommended)
- **npm**: v10.x or higher (or equivalent `pnpm`/`yarn`)
- **Git**: Installed and configured on your machine

### Local Development Setup

1. **Fork and clone the repository:**

   ```bash
   git clone https://github.com/<your-username>/voxel-realms-rpg.git
   cd voxel-realms-rpg
   ```

2. **Install project dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` to supply any optional configuration such as `GEMINI_API_KEY` or custom `PORT`.

4. **Launch the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the game.

---

## Scripts & Development Commands

| Command                        | Purpose                                                                                                                          |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                  | Starts Vite dev server on `http://0.0.0.0:3000`                                                                                  |
| `npm run build`                | Builds production client assets to `dist/`                                                                                       |
| `npm run preview`              | Previews the production build locally                                                                                            |
| `npm run lint`                 | Runs `tsc --noEmit` (with `noUnusedLocals` & `noUnusedParameters`) to catch syntax errors, type mismatches, and unused variables |
| `npm run format`               | Formats the entire repository consistently using Prettier (`prettier --write .`)                                                 |
| `npm run format:check`         | Verifies code style compliance via Prettier (`prettier --check .`)                                                               |
| `npm audit --audit-level=high` | Scans dependencies against known security vulnerabilities and deprecated packages                                                |
| `npm test`                     | Runs the Node.js test runner against all 15 pure game logic & 3D scene-graph test suites (`98` tests)                            |
| `npm run clean`                | Cleans build artifacts (`dist/`, `server.js`)                                                                                    |

---

## Repository Architecture

For a comprehensive technical deep-dive, see **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** and **[`GOVERNANCE.md`](./GOVERNANCE.md)**.

```text
/
├── .github/                  # CI/CD workflows & Issue/PR templates
├── cpp/                      # C++20 RAII & SIMD engine guardrail headers & CTest suite
├── src/
│   ├── components/           # React 19 UI overlays, HUD, Modals & 3D Canvas
│   │   ├── GameCanvas.tsx          # Three.js WebGL2 canvas & scene lifecycle
│   │   ├── GameHUD.tsx             # Consolidated HUD, touch D-pad & 5-tab command dock
│   │   ├── AdminConsoleModal.tsx   # GM cheats, T20 spawner, RBAC, Species & Omniverse hub
│   │   ├── CharacterCreationModal.tsx # 10-Species selector, 3D turntable & Admin permission gate
│   │   ├── CultivationModal.tsx    # Four-Path cultivation, manuals, pills & tribulations
│   │   ├── DailyLoginModal.tsx     # Daily login decrees & Veteran Scroll sanctum
│   │   ├── VipSubscriptionModal.tsx# VIP Tiers 0-3, daily stipends & loyalty progression
│   │   └── ...
│   ├── game/                 # Pure decoupled game logic & co-located *.test.ts suites
│   │   ├── adminModeration.ts      # Root RBAC (creatergame31@gmail.com), moderation & tickets
│   │   ├── architectOptimization.ts# 06/11/2026 Software & Hardware Architect optimization engine
│   │   ├── clanMath.ts             # Clan buffs, vault rations & 9-sector outpost math
│   │   ├── cultivationMath.ts      # 4 paths, 100x realm suppression, karma & disciples
│   │   ├── dailyLogin.ts           # 7-day reward streak & Veteran Scroll scaling
│   │   ├── graphicsEngine.ts       # PC/Console BC7 vs Mobile ASTC LOD pipeline logic
│   │   ├── heroSkins.ts            # Hero aesthetic skins & particle aura catalog
│   │   ├── math.ts                 # Castle Lv 0-100, 1000T capacity & T1-T20 troop math
│   │   ├── omniverse.ts            # Top 100 Species Background NPCs & Infinite Omniverse Engine
│   │   ├── proceduralWorld.ts      # Deterministic 3D voxel terrain, castle, species & aura meshes
│   │   ├── species.ts              # 10-Species catalog, 3D mesh specs & Admin switch permission gate
│   │   ├── troopTraining.ts        # Real-time troop training queue & speedup math
│   │   ├── vipSubscription.ts      # VIP tiers, discounts & feature access gates
│   │   ├── weather.ts              # Weather cycle & gathering/combat multipliers
│   │   └── worldAI.ts              # Lv 1-1000 monster brackets, A* pathfinding & NPC roles
│   ├── types/                # TypeScript interfaces and domain models
│   ├── App.tsx               # Main application state orchestrator
│   └── main.tsx              # React application root
├── ARCHITECTURE.md           # Functional Core / Imperative Shell technical reference
├── CHANGELOG.md              # Version release history & v1.5.0 network protocol
├── CODE_OF_CONDUCT.md        # Contributor Covenant v2.1
├── CONTRIBUTING.md           # Contribution guidelines (this file)
├── GOVERNANCE.md             # Roles, RBAC clearances & RFC decision-making process
├── LICENSE.md                # Apache License 2.0 summary & full legal text
├── PRIVACY.md                # User privacy, localStorage & GDPR/CCPA policy
├── ROADMAP.md                # Upcoming milestones (v1.5.0 - v2.0.0)
├── SECURITY.md               # Private vulnerability disclosure policy
├── SUPPORT.md                # Official contact directory (creatergame31@gmail.com) & FAQ
└── TERMS.md                  # Terms and Conditions of use
```

---

## Development & Architecture Guidelines

### 1. Pure Decoupled Logic

- All game mechanics (realm suppression formulas, karma calculations, siege calculations, AI behavior logic, RBAC moderation) **must** reside in pure functions under `src/game/`.
- Never couple gameplay math directly to React hooks or UI component state.
- Always accompany new game mechanics with corresponding unit tests in `src/game/*.test.ts`.

### 2. TypeScript Discipline

- Write strict TypeScript.
- Avoid using `any` or `@ts-ignore`. If a type is complex, create a descriptive interface or type alias in `src/types/`.
- Ensure `npm run lint` (`tsc --noEmit`) passes with zero errors before opening a pull request.

### 3. Three.js & WebGL Memory Management

- In Three.js components (such as `GameCanvas.tsx` and `src/game/proceduralWorld.ts`), always ensure proper lifecycle cleanup.
- Dispose of geometries, materials, and textures when objects or scenes are unmounted:
  ```typescript
  geometry.dispose();
  material.dispose();
  ```
- Cancel animation frames (`cancelAnimationFrame`) in `useEffect` cleanup blocks to prevent memory leaks.

### 4. Styling & UI

- Use **Tailwind CSS v4** classes exclusively.
- Do not add external heavy CSS frameworks or write ad-hoc inline styles unless dynamically calculating coordinate transforms.
- Ensure the HUD remains responsive across desktop, tablet, and mobile viewport orientations.

---

## Git Workflow & Conventions

### Branch Naming

Create a feature or bugfix branch with a descriptive name:

- `feat/siege-trebuchet-upgrade`
- `fix/karma-bounty-drop-calculation`
- `perf/threejs-particle-pooling`
- `docs/update-cultivation-realm-table`

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:

```text
<type>(<optional scope>): <short description in imperative mood>

[optional body explaining rationale]

[optional footer(s), e.g., Closes #123]
```

**Common types:**

- `feat`: A new feature or gameplay mechanic
- `fix`: A bug fix
- `docs`: Documentation updates or additions
- `refactor`: Code refactoring without behavioral changes
- `perf`: Performance improvements (e.g. rendering speed, math optimization)
- `test`: Adding or updating test suites
- `chore`: Tooling, dependency, or configuration updates

**Example:**

```text
feat(karma): implement tribulation lightning random strike on static red names

Add a movement timer check that triggers an instant-kill tribulation lightning
strike if a red-name player remains within a 5-unit radius for longer than 3.5 seconds.
```

---

## Automated Supervision & Anti-Spaghetti Process ("Guardrails")

When using AI-assisted coding workflows, treat the AI as an engineer that requires automated supervision and structured architectural direction. We enforce a two-part system to prevent "Spaghetti Code":

### Part 1: The Technical Fix (Automated CI Guardrails in `.github/workflows/build.yml`)

Every push and Pull Request must pass both our **Web/TypeScript Guardrails** and our **C++20 Guardrail Stack** before merging:

#### A. TypeScript & WebGL Guardrails (`quality-check` job)

1. **The Linter (`npm run lint`)**: Enforces strict TypeScript compilation with `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`. Any unused variable, dead import, or type mismatch immediately fails the build.
2. **The Deprecation & Vulnerability Checker (`npm audit --audit-level=high`)**: Blocks outdated or vulnerable third-party packages.
3. **The Formatter (`npx prettier --check .`)**: Enforces uniform formatting (`.prettierrc`) so every file in the repository looks like it was written by a single author.
4. **The Regression Test Suite (`npm test`)**: Executes all 98 unit and regression tests across 15 suites (`src/game/*.test.ts`) to ensure new features never break existing systems.

#### B. C++20 Engine Guardrail Stack (`cpp20-guardrails` job)

1. **Linter / Static Analyzer (`clang-tidy` via `.clang-tidy`)**: Catches memory leaks, forces modern C++20 smart pointers (`std::unique_ptr` and `std::shared_ptr` via `std::make_unique` / `std::make_shared`) instead of raw pointers, and treats all warnings as errors.
2. **Formatter (`clang-format` via `.clang-format`)**: Enforces `BasedOnStyle: LLVM`, `IndentWidth: 4`, `Standard: Latest`, and `ColumnLimit: 100`.
3. **Package Manager (`vcpkg` via `vcpkg.json` & `CMakeLists.txt`)**: Locks C++20 libraries (`entt`, `fmt`, `glm`, `sdl2`, `gtest`) to a verified `builtin-baseline` commit and runs C++20 unit tests via `ctest`.

### Part 2: The Process Fix (Prompting & Architecture Strategy)

Tools catch syntax and formatting issues, while disciplined prompting preserves clean architecture:

1. **The "Architect First" Rule**:
   - Never ask an AI assistant to _"just write the code"_.
   - **Bad Prompt**: _"Make the character jump."_
   - **Good Prompt**: _"Plan the logic for the character jump. Check `src/game/` for existing physics or movement functions we can reuse. Don't write code yet—just give me the plan."_
2. **The Refactor Session (Every 3–4 Features)**:
   - After completing 3–4 features, pause feature work and run a dedicated refactor pass on modified files.
   - **Refactor Prompt**: _"Review this file. Identify any duplicate logic, unused variables, raw pointers, or deprecated methods. Refactor it to be cleaner and more modular without changing the functionality, then run `npm run lint` and `npm test`."_

---

## Pull Request Process

1. **Run the full Guardrails suite locally:**

   ```bash
   npm run lint                  # 1. Catch messy code & unused variables
   npm audit --audit-level=high  # 2. Check for vulnerable/deprecated packages
   npx prettier --check .        # 3. Verify consistent code formatting (or run `npm run format`)
   npm test                      # 4. Run all 98 unit & regression tests across 15 suites
   npm run build                 # 5. Verify production bundle compiles cleanly
   ```

2. **Push your branch:**

   ```bash
   git push origin feat/your-feature-name
   ```

3. **Open a Pull Request:**
   - Provide a clear summary of the changes and motivation.
   - Link related issue numbers (e.g., `Resolves #42`).
   - If UI or 3D visuals are modified, include before/after screenshots or GIFs.

4. **Code Review:**
   - Maintainers will review your submission and may request revisions.
   - Be receptive to feedback and keep conversations constructive.

---

## Reporting Issues & Feature Requests

- **Bug Reports:** Open an issue describing the expected vs. actual behavior, steps to reproduce, and your browser/OS environment.
- **Feature Requests:** Share your concept in an issue detailing the gameplay mechanics, lore/fantasy fit, and proposed balance implications.
- **Security Concerns:** Please review [SECURITY.md](SECURITY.md) and email **[creatergame31@gmail.com](mailto:creatergame31@gmail.com)** instead of creating public issues.

Thank you for contributing to the realms! ⚔️
