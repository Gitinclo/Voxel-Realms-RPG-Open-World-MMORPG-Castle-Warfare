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

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite dev server with Hot Module Replacement on `http://0.0.0.0:3000` |
| `npm run build` | Builds production client assets to `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs `tsc --noEmit` to validate strict TypeScript types across the codebase |
| `npm test` | Runs the Node.js test runner against all pure game logic test suites (`tsx --test src/game/*.test.ts`) |
| `npm run clean` | Cleans build artifacts (`dist/`, `server.js`) |

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

## Pull Request Process

1. **Verify your code locally:**
   ```bash
   npm run lint   # Ensure TypeScript builds with zero errors
   npm test       # Ensure all unit tests pass (50+ tests)
   npm run build  # Ensure production build completes cleanly
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
