# 🏰 Voxel Realms RPG: Open World MMORPG & Castle Warfare

A high-performance, full-featured 3D Open-World MMORPG, Castle Warfare Strategy, and Four-Path Immortal Cultivation game built with **React 19**, **Three.js**, **TypeScript**, **Tailwind CSS**, and **Vite**.

Designed for both desktop (WASD + mouse drag) and mobile/Android (virtual touch D-pad & gesture navigation) with support for HDR10+ tone-mapped visuals and SIMD C++20 engine architectures.

---

## 🎮 Key Features

### 1. 🌍 3D Procedural Voxel World & HDR Engine
- **Procedural Landscape**: Endless voxel biome terrain with dynamic day/night cycles, atmospheric scattering, and lighting effects.
- **Cross-Platform Input**: Full keyboard/mouse controls for PC/Mac, and responsive virtual on-screen D-pad and action buttons for Android and touchscreen devices.
- **HDR10+ Color Grading**: High-dynamic-range pipeline with tone-mapping and bloom post-processing shaders.

### 2. 🏰 Castle Progression & 10 Eras (Lv. 0 – 100)
- **Multiplicative Scaling**: Expands from a primitive wooden outpost to an omnipotent cosmic citadel.
  - **10 Distinct Eras**: Wooden Outpost, Stone Palisade, Fortified Keep, Iron Citadel, Obsidian Fortress, Dragon Bastion, Void Stronghold, Celestial Spire, Primordial Sanctum, and Omnipotent Citadel.
  - **Massive Troop Capacities**: Scales up to **1,000 Trillion (1,000T)** garrisoned troops.
  - **World Rallies**: Rally armies up to **1 Trillion (1T)** against colossal world raid bosses.
- **Kingdom Economy**: Strategic resource gathering and management for Gold, Wood, Stone, Iron, Crystals, Diamonds, Spirit Stones, and Scripture Fragments.

### 3. ⚔️ Troop Barracks & T1–T20 Tri-Branch Combat
- **Tri-Type Strategic Counter Matrix**:
  - 🛡️ **Shieldbearers** (Defensive frontline tanks; counter Shooters, vulnerable to Bombers)
  - 🏹 **Shooters** (Long-range precision DPS; counter Bombers, vulnerable to Shieldbearers)
  - 💣 **Bombers** (Siege artillery & explosive splash; counter Shieldbearers, vulnerable to Shooters)
- **20 Tiers of Power**: Progression ranging from T1 Militia recruits up to T20 Primordial Cosmic Dreadnoughts.

### 4. 🧘 Four-Path Immortal Cultivation & Han Jue Progression
- **Four Distinct Paths**:
  - **Qi Path**: Spiritual energy, spell potency, and elemental affinity.
  - **Body Path**: Physical constitution, HP scaling, and blunt damage negation.
  - **Soul Path**: Divine sense, mental fortitude, and spiritual perception.
  - **Mind Path**: Enlightenment, breakthrough chance, and insight comprehension.
- **Immortal Realms**: Qi Refinement, Foundation Establishment, Golden Core, Nascent Soul, Soul Formation, Void Refining, Body Integration, Great Vehicle, Tribulation Transcending, and Dao Creator.
- **Realm Suppression**: Authentic xianxia power differentials where higher realms effortlessly suppress lower realms (e.g. Golden Core deals 100x damage to Qi Refinement).
- **The Karma System**:
  - Attacking innocent low-level players turns Karma negative, triggering **Red Name** status.
  - **Tribulation Lightning**: Strikes red-name players with instant-kill heavenly lightning if they linger in one place.
  - **Justice Bounties & Full Loot Drop**: Red names are marked globally on the map and drop equipped gear upon defeat.
- **Master & Disciple Hierarchy**:
  - Proximity cultivation speed buffs for disciples.
  - Resource funneling (master receives a percentage of disciple earnings).
  - Skill Transmission: Masters can transcribe rare mystical powers (e.g. *Heaven Earth Sleeve*) into tradeable Skill Scrolls.
- **Visualizing Power (Aura System)**:
  - Dynamic visual cues: Faint white glow (Foundation), rotating Golden Core, floating infant avatar (Nascent Soul), and divine halo rings scaling with mastered Great Daos (Dao Creator).
- **Secluded Cultivation**: Fast-forward secluded meditation inside personal cave abodes.

### 5. 🧠 Advanced World AI (Monsters Lv. 1–1000 & Role-Based NPCs)
- **Monster Complexity Scaling**:
  - **Tier 1 (Lv. 1–50)**: Basic instincts, direct aggro, and territorial roaming.
  - **Tier 2 (Lv. 51–200)**: Pack coordination, flanking maneuvers, and tactical retreats.
  - **Tier 3 (Lv. 201–500)**: Dynamic spell-casting rotations, enrage phases, and environmental interactions.
  - **Tier 4 (Lv. 501–800)**: Battlefield domain control, aura summons, and elemental resistances.
  - **Tier 5 (Lv. 801–1000)**: Reality distortion, spatial rifts, and complex multi-phase raid boss mechanics.
- **A\* Grid Pathfinding**: Real-time obstacle avoidance navigating around keeps, cliffs, and environmental barriers.
- **NPC Archetypes**:
  - **Guards**: Perimeter patrol, aggressive threat suppression, and defense alerts.
  - **Traders**: Dynamic pricing, buy/sell exchange, and resource arbitrage.
  - **Blacksmiths**: Equipment repair, weapon forging, and scrap dismantling.
  - **Mystics**: Spiritual attunement, karma cleansing, and fortune divination.
  - **Quest-Givers**: Dynamic procedural bounties and storyline decrees.
- **C++20 SIMD Engine**: Architecture blueprint for high-throughput mobile multithreading and low-latency ECS.

### 6. 🌦️ Dynamic Weather System
- Dynamic atmospheric cycle: **Clear**, **Rain**, **Snow**, and **Storm**.
- Weather modifiers impact resource gathering (e.g. rain increases timber and grain harvests, snow boosts diamond yields, storms accelerate oil extraction) and battle unit performance.

### 7. 🎁 Daily Login Rewards & Veteran Scrolls
- **7-Day Consecutive Decree Cycle**: Daily scaling rewards of diamonds, spirit stones, resources, and scripture fragments.
- **Realm & Castle Scaling**: Yields dynamically scale with both Citadel Level and Cultivation Realm.
- **Veteran Scroll Sanctum**: Imbue sacred scrolls across all cultivation paths for permanent lineage mastery buffs.

### 8. 🛡️ Clan Alliances & Global Leaderboards
- Create and customize clan emblems, manage membership hierarchies, coordinate world boss rallies, and compete on the global multi-trillion power rankings.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 20+ (Node.js 22 recommended)
- **Package Manager**: `npm`

### Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd <repository-folder>
npm install
```

### Development Server
Run the local Vite development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Unit Tests
Execute the unit test suite covering cultivation math, castle scaling, clan mechanics, weather modifiers, and world AI:
```bash
npm test
```

### Type Checking & Linting
Validate TypeScript code without emitting output:
```bash
npm run lint
```

### Production Build
Build the optimized production bundle:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```

---

## 📁 Project Structure

```text
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md           # Bug report template
│   │   ├── feature_request.md      # Feature request template
│   │   └── release_checklist.md    # Final release signoff issue template
│   ├── PULL_REQUEST_TEMPLATE.md    # Pull Request verification checklist
│   └── workflows/
│       └── build.yml               # GitHub Actions CI/CD (lint, test, build, artifact upload)
├── src/
│   ├── components/                 # React UI Modals & HUD Overlays
│   │   ├── AdminConsoleModal.tsx   # GM / Admin dev console
│   │   ├── CastleModal.tsx         # Citadel upgrade & era progression UI
│   │   ├── CharacterCreationModal.tsx # Character creation & customization
│   │   ├── ClanEmblemView.tsx      # SVG clan banner & insignia renderer
│   │   ├── ClanModal.tsx           # Clan management & alliances
│   │   ├── CppArchitectureModal.tsx# C++20 engine blueprint & SIMD viewer
│   │   ├── CultivationModal.tsx    # 4-path cultivation & realm ascension
│   │   ├── DailyLoginModal.tsx     # 7-day login rewards & Veteran Scroll UI
│   │   ├── GameCanvas.tsx          # Three.js 3D viewport & voxel renderer
│   │   ├── GameHUD.tsx             # Main game HUD & status displays
│   │   ├── HeroModal.tsx           # Hero equipment & talent tree
│   │   ├── LeaderboardModal.tsx    # Global power rankings
│   │   ├── ResourceGatherModal.tsx # Resource node collection
│   │   ├── TitleScreen.tsx         # Game startup & save slot selection
│   │   ├── TroopBarracksModal.tsx  # T1-T20 troop recruitment & counters
│   │   ├── WeatherModal.tsx        # Weather forecasts & atmospheric buffs
│   │   ├── WorldAIDirectorModal.tsx# Monster scaling & NPC behavior director
│   │   └── WorldBossRallyModal.tsx # 1T troop world boss rally coordination
│   ├── game/                       # Core Game Engine & Simulation Logic
│   │   ├── audio.ts                # Web Audio sound FX synthesizer
│   │   ├── clanMath.ts             # Clan buffs & territorial calculations
│   │   ├── clanMath.test.ts        # Clan math unit tests
│   │   ├── cppEngine.ts            # C++20 SIMD engine blueprint & code generators
│   │   ├── cultivationMath.ts      # 4 paths, suppression, karma, master-disciple logic
│   │   ├── cultivationMath.test.ts # Cultivation math unit tests
│   │   ├── dailyLogin.ts           # Daily login streak & reward scaling logic
│   │   ├── dailyLogin.test.ts      # Daily login system unit tests
│   │   ├── initialData.ts          # Default game state, heroes, and configurations
│   │   ├── math.ts                 # Castle level, eras, T1-T20 troop math
│   │   ├── math.test.ts            # Castle progression unit tests
│   │   ├── proceduralWorld.ts      # Voxel terrain generation & biome features
│   │   ├── weather.ts              # Weather engine & environmental multipliers
│   │   ├── weather.test.ts         # Weather unit tests
│   │   ├── worldAI.ts              # A* pathfinding, Lv 1-1000 monsters, NPC behaviors
│   │   └── worldAI.test.ts         # World AI unit tests
│   ├── types/                      # TypeScript definitions & data models
│   ├── App.tsx                     # Main application container & state provider
│   ├── index.css                   # Tailwind CSS styling
│   └── main.tsx                    # Application entry point
├── .env.example                    # Environment variable template (safe placeholders)
├── .gitignore                      # Git ignore rules (node_modules, dist, .env, keystores)
├── CHANGELOG.md                    # Chronological release history
├── CODE_OF_CONDUCT.md              # Contributor Covenant Code of Conduct
├── CONTRIBUTING.md                 # Developer setup, testing & PR guidelines
├── LICENSE                         # Apache License 2.0
├── PRIVACY.md                      # User Privacy Policy (GDPR/CCPA, localStorage, payments, ads)
├── SECURITY.md                     # Private vulnerability disclosure policy
├── TERMS.md                        # Terms and Conditions of use
├── metadata.json                   # Applet configuration & metadata
├── package.json                    # Project dependencies, metadata & npm scripts
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                  # Vite build configuration
```

---

## 🧪 Testing Coverage

The project includes unit test suites powered by Node's native test runner (`tsx --test`):
- **Cultivation & Xianxia Mechanics**: Verifies 4-path progression, 100x Realm Suppression (Golden Core vs Qi Refinement), Karma degradation to Red Name, stationary Tribulation Lightning, disciple taxation, and aura visual states.
- **Castle & Troop Progression**: Validates 10-era transitions, multiplicative power rankings, 1,000T troop capacities, 1T rallies, and T1–T20 balance.
- **World AI & Pathfinding**: Validates Lv. 1–1000 monster tier scaling, A* obstacle pathfinding around keep structures, and distinct behaviors for Guards, Traders, Blacksmiths, Mystics, and Quest-Givers.
- **Environmental Weather**: Confirms cyclical state transitions and dynamic resource/combat multipliers.
- **Daily Login & Veteran Scrolls**: Tests calendar day deltas, streak rollover, castle/realm reward scaling, and lineage comprehension.

Run all tests:
```bash
npm test
```

---

## ✅ Final Pre-Release Gate Checklist

Before tagging or publishing a release, confirm all release gates pass:

- [x] `npm install` completes cleanly with consistent `package-lock.json`
- [x] `npm run lint` (`tsc --noEmit`) passes with zero TypeScript errors
- [x] `npm test` passes all 50 unit tests across 5 test suites
- [x] `npm run build` succeeds and outputs production bundle under `dist/`
- [x] App runs in browser (`npm run dev`) with all core flows verified on desktop and mobile
- [x] GitHub Actions CI workflow (`.github/workflows/build.yml`) is green
- [x] No `.env` secrets, API keys, or Android signing keystores (`*.jks`, `*.keystore`) are exposed

---

## 🛠️ Tech Stack

- **Framework**: React 19
- **3D Graphics**: Three.js (WebGL with software fallback support)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Bundler**: Vite 8
- **Icons**: Lucide React
- **Audio**: Web Audio API Procedural Synthesizer
- **CI/CD**: GitHub Actions

---

## 📚 Documentation, Community & Legal

- **[Contributing Guide](./CONTRIBUTING.md)** — How to set up the repo, run tests, and submit Pull Requests.
- **[Code of Conduct](./CODE_OF_CONDUCT.md)** — Community standards and expectations.
- **[Changelog](./CHANGELOG.md)** — Version history and release notes (`v1.0.0` – `v1.2.0`).
- **[Security Policy](./SECURITY.md)** — How to privately report security vulnerabilities (`creatergame31@gmail.com`).
- **[Privacy Policy](./PRIVACY.md)** — How user data, `localStorage`, accounts, payments, and ads are handled.
- **[Terms & Conditions](./TERMS.md)** — Rules of conduct, virtual goods policy, subscriptions, and liability disclaimers.

---

## 📜 License

Licensed under the **[Apache License 2.0](./LICENSE)**. Crafted for high-scale browser and mobile MMORPG experiences.
