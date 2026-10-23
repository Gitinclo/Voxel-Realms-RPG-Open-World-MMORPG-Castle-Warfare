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
| `npm test`                     | Runs the Node.js test runner against all 6 pure game logic & 3D scene-graph test suites (`55` tests)                             |
| `npm run clean`                | Cleans build artifacts (`dist/`, `server.js`)                                                                                    |

---

## Repository Architecture

```text
/
├── .github/workflows/    # CI/CD pipelines (build, test, lint)
├── src/
│   ├── components/       # React 19 UI overlays, HUD, Daily Login, Realm Panels
│   │   ├── ThreeBattlefield.tsx # Three.js WebGL canvas & scene lifecycle
│   │   ├── DailyLoginModal.tsx  # Daily login rewards & streak progression
│   │   └── ...
│   ├── game/             # Pure decoupled game logic & mathematical engines
│   │   ├── cultivation.ts      # 4 cultivation paths, realm suppression formulas
│   │   ├── cultivation.test.ts # Unit tests for realm power scaling
│   │   ├── karma.ts            # Karma counter, Tribulation Lightning, Red Name bounty
│   │   ├── karma.test.ts       # Unit tests for karma transitions & drops
│   │   ├── siegeEngine.ts      # 1000T Castle Warfare, siege weaponry, gate HP
│   │   ├── siegeEngine.test.ts # Unit tests for siege damage calculation
│   │   ├── monsterEcosystem.ts # Lv 1-1000 procedural stats, agro behavior
│   │   ├── monsterEcosystem.test.ts # Unit tests for scaling & loot tables
│   │   ├── masterDisciple.ts   # Master-Disciple hierarchy, tax, skill transmission
│   │   ├── masterDisciple.test.ts # Unit tests for disciple buff & scroll creation
│   │   └── dailyRewards.ts     # 7-day reward streak & VIP bonus calculations
│   ├── types/            # TypeScript interfaces, enums, and data definitions
│   ├── App.tsx           # Main application state orchestrator
│   └── main.tsx          # React application root
├── public/               # Static assets, textures, and sounds
├── CHANGELOG.md          # Version release history
├── CODE_OF_CONDUCT.md    # Contributor Covenant v2.1
├── CONTRIBUTING.md       # Contribution guidelines (this file)
└── SECURITY.md           # Vulnerability disclosure policy
```

---

## Development & Architecture Guidelines

### 1. Pure Decoupled Logic

- All game mechanics (realm suppression formulas, karma calculations, siege calculations, AI behavior logic) **must** reside in pure functions under `src/game/`.
- Never couple gameplay math directly to React hooks or UI component state.
- Always accompany new game mechanics with corresponding unit tests in `src/game/*.test.ts`.

### 2. TypeScript Discipline

- Write strict TypeScript.
- Avoid using `any` or `@ts-ignore`. If a type is complex, create a descriptive interface or type alias in `src/types/`.
- Ensure `npm run lint` (`tsc --noEmit`) passes with zero errors before opening a pull request.

### 3. Three.js & WebGL Memory Management

- In Three.js components (such as `ThreeBattlefield.tsx`), always ensure proper lifecycle cleanup.
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
4. **The Regression Test Suite (`npm test`)**: Executes all 55 unit and regression tests across 6 suites (`src/game/*.test.ts`) to ensure new features never break existing systems.

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
   npm test                      # 4. Run all 55 unit & regression tests
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
