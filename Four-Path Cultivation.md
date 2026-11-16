# 🧘 Four-Path Immortal Cultivation Guide & Local Development Setup (`Four-Path Cultivation.md`)

[![Version](<https://img.shields.io/badge/Version-v1.5.0_(15%2F11%2F2026)-10b981?style=flat-square>)](./CHANGELOG.md)
[![Engine Module](https://img.shields.io/badge/Core_Module-src%2Fgame%2FcultivationMath.ts-f59e0b?style=flat-square)](./src/game/cultivationMath.ts)
[![Unit Tests](https://img.shields.io/badge/Test_Suite-src%2Fgame%2FcultivationMath.test.ts-38bdf8?style=flat-square)](./src/game/cultivationMath.test.ts)
[![Sovereign Root Owner](https://img.shields.io/badge/Sovereign_Root_Owner-creatergame31%40gmail.com-8b5cf6?style=flat-square)](./GOVERNANCE.md)

This document provides a complete developer and player reference for the **Four-Path Immortal Cultivation & Han Jue Secluded Providence System** in **Voxel Realms RPG: Open World MMORPG & Castle Warfare**, including:

1. **[Getting Started (Local Development & Testing)](#1--getting-started-local-development--testing)**
2. **[Environment Variables Setup (`.env.example`)](#2--environment-variables-setup-envexample)**
3. **[Summary of the Four-Path Cultivation System (`Qi`, `Body`, `Soul`, `Mind`)](#3--summary-of-the-four-path-cultivation-system)**
4. **[All 23 Realms × 9 Layers Across 4 Cosmic Eras](#4--all-23-realms--9-layers-across-4-cosmic-eras)**
5. **[Mathematical Formulas, Four-Path Resonance & `100.0x` Realm Suppression](#5--mathematical-formulas-four-path-resonance--1000x-realm-suppression)**
6. **[Sacred Cultivation Manuals (12) & Alchemy Pills](#6--sacred-cultivation-manuals-12--alchemy-pills)**
7. **[The Karma System, Stationary Tribulation Lightning & Loot Drop](#7--the-karma-system-stationary-tribulation-lightning--loot-drop)**
8. **[Master & Disciple Social Hierarchy, Proximity Buffs & Skill Scrolls](#8--master--disciple-social-hierarchy-proximity-buffs--skill-scrolls)**
9. **[3D Scene-Graph & HDR10+ Cultivation Aura Visualization](#9--3d-scene-graph--hdr10-cultivation-aura-visualization)**

---

## 1. 🚀 Getting Started (Local Development & Testing)

### A. System Prerequisites

Ensure your local workstation meets the following requirements:

- **Node.js**: `v20.x` or higher (`v22 LTS` recommended)
- **npm**: `v10.x` or higher
- **Git**: For version control and branch workflows
- **Modern WebGL2-Capable Browser**: Chrome, Edge, Firefox, or Safari for Three.js PBR + HDR10+ cultivation aura rendering

### B. Step-by-Step Local Installation

1. **Clone the repository and navigate to the project root:**

   ```bash
   git clone <repository-url>
   cd voxel-realms-rpg
   ```

2. **Install all project dependencies:**

   ```bash
   npm install
   ```

3. **Create your local environment file from `.env.example`:**

   ```bash
   cp .env.example .env
   ```

   _(See [Section 2: Environment Variables Setup (`.env.example`)](#2--environment-variables-setup-envexample) below for detailed configuration of every variable.)_

4. **Start the Full-Stack Development Server (Port `3000`):**

   ```bash
   npm run dev
   ```

   This launches `tsx server.ts`, mounting both the Express REST/WebSocket backend (`/api/*`, `/ws/siege`) and the Vite React 19 + Three.js frontend on **[http://localhost:3000](http://localhost:3000)**:
   - Open `http://localhost:3000` to view the Title Screen and EULA/Legal modal.
   - Or open `http://localhost:3000/?autostart=1` to enter the 3D Voxel Overworld directly, then click the **🧘 Cultivate (`CultivationModal`)** button in the bottom Command Dock.

### C. Running Cultivation & Full-System Tests

All Four-Path Cultivation math is 100% decoupled from React UI state in [`src/game/cultivationMath.ts`](./src/game/cultivationMath.ts) and verified via Node's native test runner:

```bash
# Run only the Four-Path Cultivation unit test suite
npx tsx --test src/game/cultivationMath.test.ts

# Run all 162 unit, EULA/Legal, MIME, security & Firestore rule tests across 27 suites
npm test

# Run the full 5-stage validation gate (TypeScript lint + Firestore rules lint + Prettier + 162 tests + Vite build)
npm run validate
```

---

## 2. 🔐 Environment Variables Setup (`.env.example`)

Copy [`.env.example`](./.env.example) to `.env` in the workspace root (`cp .env.example .env`). Never commit `.env` to Git (enforced by [`.gitignore`](./.gitignore)).

Below is the complete reference for all **11 environment variables** defined in `.env.example`:

### A. Server & Runtime Configuration

| Variable         | Default in `.env.example`    | Required? | Purpose & Local Setup Instructions                                                                                                                                                                           |
| :--------------- | :--------------------------- | :-------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`           | `3000`                       |  **Yes**  | The TCP port where `server.ts` (Express + `/ws/siege` WebSocket + Vite middleware) listens. **Keep set to `3000`** for compatibility with AI Studio preview and `npm run verify:ops`.                        |
| `NODE_ENV`       | `development`                |  **Yes**  | Controls runtime mode (`development` \| `production` \| `test`). In `development`, `server.ts` mounts Vite middleware and generates an ephemeral fallback admin passkey if `VOXEL_ADMIN_PASSKEY` is omitted. |
| `GEMINI_API_KEY` | `"your-gemini-api-key-here"` | Optional  | Used for optional server-side Gemini AI features. In AI Studio, this is injected automatically from the Secrets panel; locally, leave as placeholder or paste a valid Gemini API key.                        |
| `APP_URL`        | `"http://localhost:3000"`    |  **Yes**  | Base URL used for self-referential links, Same-Origin CSRF validation, and API callbacks. Set to `"http://localhost:3000"` locally (automatically overridden with the Cloud Run URL in production).          |

### B. Server-Side Session & Operator RBAC Security (`server.ts` / `src/game/serverAuth.ts`)

| Variable               | Default in `.env.example`                       |           Required?           | Purpose & Local Setup Instructions                                                                                                                                                                                                                                                                |
| :--------------------- | :---------------------------------------------- | :---------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VOXEL_SESSION_SECRET` | `"replace-with-at-least-32-char-csprng-secret"` |          Recommended          | A **32+ character CSPRNG secret** used to sign and verify HMAC-SHA256 `HttpOnly` session cookies (`/api/auth/*`). Generate locally via: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. If omitted in `development`, falls back to an ephemeral per-boot 256-bit key. |
| `VOXEL_ADMIN_PASSKEY`  | `"replace-with-strong-operator-passkey"`        | Required for Prod Admin Login | Server-side operator passkey (`>= 12` characters) verified using timing-safe comparison on `POST /api/auth/admin-login` for Sovereign Root Owner **`creatergame31@gmail.com`**. Fails closed (`HTTP 503`) in `production` if unset or left as placeholder.                                        |

### C. Operational Storage & Rate-Limit Tuning (`server.ts` / `src/game/serverHardening.ts`)

| Variable                        | Default in `.env.example` | Required? | Purpose & Local Setup Instructions                                                                                                                                          |
| :------------------------------ | :------------------------ | :-------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VOXEL_DATA_DIR`                | `"./data"`                | Optional  | Filesystem directory where `src/game/serverPersistence.ts` writes atomic SHA-256 checksummed `online_realm_state.json` and `.bak` failover snapshots. Defaults to `./data`. |
| `VOXEL_API_WRITE_LIMIT_PER_MIN` | `"120"`                   | Optional  | Per-IP sliding-window rate limit for mutating HTTP endpoints (`/api/online/*`, `/api/admin/*`) per 60-second window. Defaults to `120`.                                     |

### D. Cloud SQL (PostgreSQL + Drizzle ORM) Connection Variables (`src/db/index.ts`)

| Variable       | Default in `.env.example`     |    Required?     | Purpose & Local Setup Instructions                                                                                                                                            |
| :------------- | :---------------------------- | :--------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SQL_HOST`     | `"127.0.0.1"`                 | Optional Locally | Hostname or IP address of the PostgreSQL instance (`127.0.0.1` for local Postgres or Unix socket / Cloud SQL IP in Cloud Run).                                                |
| `SQL_USER`     | `"postgres"`                  | Optional Locally | PostgreSQL database user for Drizzle ORM queries (`users`, `commander_profiles`, `realm_saves`, `support_tickets`).                                                           |
| `SQL_PASSWORD` | `"replace-with-sql-password"` | Optional Locally | Password for `SQL_USER`. Note: All Four-Path Cultivation mechanics run 100% deterministically in-memory + `localStorage` + Firestore even if local PostgreSQL is not running. |
| `SQL_DB_NAME`  | `"voxel_realms_db"`           | Optional Locally | Target PostgreSQL database name. To push schema changes to a running database, use `npx drizzle-kit push --config=src/db/drizzle.config.ts`.                                  |

### E. Quick One-Liner to Generate a Ready-to-Run Local `.env`

```bash
cp .env.example .env && \
  sed -i "s/replace-with-at-least-32-char-csprng-secret/$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")/" .env && \
  sed -i "s/replace-with-strong-operator-passkey/SolaraSovereignPasskey2026!/" .env
```

---

## 3. 🧘 Summary of the Four-Path Cultivation System

Inspired by authentic Xianxia progression and **Han Jue's _Top Tier Providence, Secretly Cultivate for a Thousand Years_**, every Commander in **Voxel Realms RPG** simultaneously cultivates **four distinct yet synergistic Immortal Paths** (`CULTIVATION_PATH_META` in [`src/game/cultivationMath.ts`](./src/game/cultivationMath.ts)):

|  Path ID   | Path Name & Chinese Title                      | Core Energy & Internal Vessel                  | Action Verb             |   Weather Synergy   | Combat & Kingdom Specialization                                                                                                                               |
| :--------: | :--------------------------------------------- | :--------------------------------------------- | :---------------------- | :-----------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|  **`qi`**  | **🧘 Qi Cultivation**<br>_(气修 · 灵气大道)_   | **Spiritual Qi** inside the **Dantian Sea**    | _Circulate Qi Breath_   | **Storm (`1.50x`)** | Primary foundation multiplier; amplifies overall **Kingdom Spiritual Might** & **Elemental Spell Damage**.                                                    |
| **`body`** | **🛡️ Body Cultivation**<br>_(体修 · 肉身成圣)_ | **Blood Essence** inside **Marrow & Physique** | _Temper Flesh & Marrow_ | **Storm (`1.65x`)** | Grants **`+18%` Troop HP & Citadel Siege Defense per step** (`realmIndex * 9 + layer`) and resists Tribulation Lightning.                                     |
| **`soul`** | **👁️ Soul Cultivation**<br>_(魂修 · 元神不灭)_ | **Soul Force** inside **Sea of Consciousness** | _Refine Divine Sense_   | **Snow (`1.40x`)**  | Grants **`+16%` Army Attack Precision & Critical Strike Damage per step** (`realmIndex * 9 + layer`) and expands Rally Command.                               |
| **`mind`** | **🪷 Mind Cultivation**<br>_(心修 · 无暇道心)_ | **Dao Willpower** inside the **Dao Heart**     | _Contemplate Dao Heart_ | **Rain (`1.40x`)**  | Boosts **All-Path Cultivation Speed (`1 + steps * 0.08`x)**, **Breakthrough Success Rate (`+2%` to `+38%`)**, and **Inner Demon Immunity (`15%` to `100%`)**. |

---

## 4. 🌌 All 23 Realms × 9 Layers Across 4 Cosmic Eras

Each of the four paths spans **23 Major Realms** (`index: 0..22`), and each Major Realm is subdivided into **9 Layers** (`layer: 1..9`), totaling **207 progression steps per path** (`828` total cultivation layers across all four paths):

| Index  |        Era        | 🧘 Qi Path (`QI_REALMS`)                     | 🛡️ Body Path (`BODY_REALMS`)                        | 👁️ Soul Path (`SOUL_REALMS`)                        | 🪷 Mind Path (`MIND_REALMS`)                           |      Base Power Mult      | Base Qi / Layer (L1)  | Tribulation Rounds |
| :----: | :---------------: | :------------------------------------------- | :-------------------------------------------------- | :-------------------------------------------------- | :----------------------------------------------------- | :-----------------------: | :-------------------: | :----------------: |
| **0**  |      Mortal       | Qi Refinement _(练气境)_                     | Skin & Flesh Tempering _(淬皮炼肉境)_               | Mortal Soul Awakening _(开窍启灵境)_                | Calm Water Heart _(止水凡心境)_                        |          `1.1x`           |        `5,000`        |        `0`         |
| **1**  |      Mortal       | Foundation Establishment _(筑基境)_          | Iron Bone Forging _(锻骨易筋境)_                    | Spirit Sense Condensation _(凝识成丝境)_            | Clear Mirror Mind _(明镜台心境)_                       |          `2.0x`           |       `80,000`        |        `1`         |
| **2**  |      Mortal       | Golden Core Realm _(金丹境)_                 | Five Viscera Renewal _(洗髓炼脏境)_                 | Yin Spirit Manifestation _(阴神出窍境)_             | Unwavering Rock Will _(磐石道志境)_                    |          `5.0x`           |        `1.2M`         |        `2`         |
| **3**  |      Mortal       | Nascent Soul Realm _(元婴境)_                | Golden Marrow Realm _(金髓玉骨境)_                  | Yang Spirit Projection _(阳神显化境)_               | Flawless Dao Heart _(无暇道心境)_                      |          `15.0x`          |         `18M`         |        `3`         |
| **4**  |      Mortal       | Soul Formation Realm _(化神境)_              | Sacred Martial Physique _(圣体初成境)_              | Astral Soul Formation _(星魂化神境)_                | Inner Demon Slaying Heart _(斩魔诛妄境)_               |          `50.0x`          |        `250M`         |        `3`         |
| **5**  |      Mortal       | Void Returning Realm _(返虚境)_              | Void Imperishable Body _(虚空不灭体)_               | Void Divine Sense _(洞虚神念境)_                    | Void Tranquility Mind _(太虚寂静心)_                   |         `180.0x`          |        `3.5B`         |        `4`         |
| **6**  |      Mortal       | Body Integration Realm _(合体境)_            | Bloodline Nirvana Realm _(涅槃金身境)_              | Primordial Spirit / Yuan Shen _(元神真仙境)_        | Heaven-Defying Will _(逆天唯我意)_                     |         `650.0x`          |         `50B`         |        `5`         |
| **7**  |      Mortal       | Tribulation Transcendence _(渡劫境)_         | Tribulation Lightning Body _(雷劫战体境)_           | Thunder-Baptized Soul _(雷炼元神境)_                | Tribulation Fearless Heart _(渡劫无畏心)_              |         `2,500x`          |        `700B`         |        `6`         |
| **8**  |      Mortal       | Mahayana Realm _(大乘境)_                    | Mahayana Diamond Vessel _(大乘金刚体)_              | Mahayana Divine Spirit _(大乘神魂境)_               | Mahayana Enlightened Mind _(大乘圆满道心)_             |         `10,000x`         |         `10T`         |        `7`         |
| **9**  |  Immortal & Sage  | Loose Immortal _(散仙境)_                    | Loose Immortal Physique _(散仙灵躯)_                | Loose Immortal Soul _(散仙仙魂)_                    | Loose Immortal Detachment _(散仙超凡心)_               |         `50,000x`         |        `150T`         |        `4`         |
| **10** |  Immortal & Sage  | Earth Immortal _(地仙境)_                    | Earth Immortal Titan Body _(地仙山岳体)_            | Earth Immortal Spirit _(地仙神识)_                  | Earth Immortal Serenity _(地仙厚德心)_                 |        `250,000x`         |   `2,000T` (`2Qa`)    |        `4`         |
| **11** |  Immortal & Sage  | Heaven Immortal _(天仙境)_                   | Heaven Immortal Astral Body _(天仙星辰体)_          | Heaven Immortal Divine Sense _(天仙真魂)_           | Heaven Immortal Firmament Will _(天仙苍穹意)_          |         `1.2M x`          |        `30Qa`         |        `5`         |
| **12** |  Immortal & Sage  | Grand Xuan Immortal _(玄仙境)_               | Grand Xuan Profound Vessel _(玄仙不坏体)_           | Grand Xuan Astral Soul _(玄仙通幽魂)_               | Grand Xuan Profound Mind _(玄仙妙悟心)_                |         `6.0M x`          |        `450Qa`        |        `5`         |
| **13** |  Immortal & Sage  | Golden Immortal _(金仙境)_                   | Golden Immortal Indestructible _(万劫不灭金身)_     | Golden Immortal True Spirit _(金仙不朽真灵)_        | Golden Immortal Eternal Heart _(金仙不朽道心)_         |          `35M x`          |   `6Qi` (`6×10^18`)   |        `6`         |
| **14** |  Immortal & Sage  | Taiyi Golden Immortal _(太乙金仙)_           | Taiyi Origin Physique _(太乙先天道体)_              | Taiyi Fate-Reading Soul _(太乙衍天魂)_              | Taiyi Karma-Free Mind _(太乙无因果心)_                 |         `200M x`          |        `85Qi`         |        `6`         |
| **15** |  Immortal & Sage  | Zenith Heaven Golden Immortal _(大罗金仙)_   | Zenith Heaven Immortal Body _(大罗混元战体)_        | Zenith Heaven Timeless Soul _(大罗超脱神魂)_        | Zenith Heaven Transcendent Will _(大罗唯一道意)_       |         `1.2B x`          | `1.2Sx` (`1.2×10^21`) |        `7`         |
| **16** |  Immortal & Sage  | Pseudo-Sage / Deity _(准圣 / 神境)_          | Pseudo-Sage Ancestral Body _(准圣祖巫战躯)_         | Pseudo-Sage Divine Sense _(准圣浩瀚圣念)_           | Pseudo-Sage Three-Corpse Heart _(准圣斩三尸道心)_      |         `8.0B x`          |        `18Sx`         |        `7`         |
| **17** |  Immortal & Sage  | Sage / Heavenly Dao Sage _(天道圣人)_        | Heavenly Dao Indestructible _(天道不朽圣躯)_        | Heavenly Dao Sage Soul _(天道圣魂)_                 | Heavenly Dao Impartial Mind _(天道无私圣心)_           |          `60B x`          |        `250Sx`        |        `8`         |
| **18** |  Immortal & Sage  | Freedom Sage Realm _(混元大罗 / 自由圣人)_   | Freedom Chaotic Physique _(混元无极战体)_           | Freedom Sage Yuan Shen _(混元无拘圣魂)_             | Freedom Unbound Dao Heart _(混元自在道心)_             |         `500B x`          | `3.5Sp` (`3.5×10^24`) |        `8`         |
| **19** | Chaos & Great Dao | Great Dao Sage _(大道圣人)_                  | Great Dao Fiendcelestial Body _(大道魔神真身)_      | Great Dao Sacred Soul _(大道圣魂)_                  | Great Dao Law Will _(大道法则道心)_                    |         `4.5T x`          |        `50Sp`         |        `9`         |
| **20** | Chaos & Great Dao | Great Dao Supreme _(大道至尊)_               | Great Dao Supreme Vessel _(大道至尊宝体)_           | Great Dao Supreme Spirit _(大道至尊神魂)_           | Great Dao Supreme Mind _(大道至尊道心)_                |          `40T x`          |        `750Sp`        |        `9`         |
| **21** | Chaos & Great Dao | Dao Creator _(大道神灵 / 创造者)_            | Chaos Creator Physique _(创世造化神躯)_             | Dao Creator Omniscient Soul _(创世全知神魂)_        | Dao Creator Omnipotent Will _(创世无上道意)_           |         `500T x`          |   `10Oc` (`10^28`)    |        `9`         |
| **22** |  Ultimate Origin  | **Ultimate Origin Supreme** _(终元至高境界)_ | **Ultimate Origin Eternal Body** _(终元永恒不灭躯)_ | **Ultimate Origin Eternal Soul** _(终元至高永生魂)_ | **Ultimate Origin Supreme Heart** _(终元至高无上道心)_ | **`10,000T x`** (`10^16`) |  `200Oc` (`2×10^29`)  |        `9`         |

---

## 5. 📐 Mathematical Formulas, Four-Path Resonance & `100.0x` Realm Suppression

All formulas below are implemented in [`src/game/cultivationMath.ts`](./src/game/cultivationMath.ts) and verified by [`src/game/cultivationMath.test.ts`](./src/game/cultivationMath.test.ts):

### A. Energy Required Per Layer (`calculateRequiredQiForLayer`)

Within any realm `realmIndex`, energy requirements scale exponentially by `1.35x` per layer (`layer` `1..9`):

$$\text{RequiredEnergy}(\text{realm}, \text{layer}) = \lfloor \text{baseQiPerLayer} \times 1.35^{\text{layer} - 1} \rfloor$$

### B. Single-Path Power Multiplier (`calculateCultivationMultiplier`)

Each layer above Layer 1 adds `+12%` to the realm's base power multiplier:

$$\text{PathMult}(\text{realm}, \text{layer}) = \text{basePowerMultiplier} \times \left(1 + 0.12 \times (\text{layer} - 1)\right)$$

### C. Four-Path Harmony Resonance (`calculateFourPathSynergy`)

When a cultivator advances **all four paths simultaneously** without leaving any path behind, the minimum realm index across the four paths ($\text{minRealmIndex} = \min(R_{\text{qi}}, R_{\text{body}}, R_{\text{soul}}, R_{\text{mind}})$) drives the **Four-Path Resonance Bonus**:

$$\text{ResonanceBonusMult} = 1 + 0.35 \times \text{minRealmIndex}$$

$$\text{SecondaryHarmony} = 1 + 0.45\log_{10}(\text{BodyMult}) + 0.45\log_{10}(\text{SoulMult}) + 0.35\log_{10}(\text{MindMult})$$

$$\text{TotalCombinedMultiplier} = \text{QiMult} \times \text{SecondaryHarmony} \times \text{ResonanceBonusMult}$$

### D. Major Realm Suppression (`calculateRealmSuppression` — `100.0x` Core Fantasy)

In authentic Xianxia combat, higher realms effortlessly crush lower realms by a factor of $10^{\Delta \text{Realm}}$:

$$\text{DamageMultiplier} = 10^{\text{AttackerRealmIndex} - \text{DefenderRealmIndex}}$$

- **Equal Realm ($\Delta = 0$)**: `1.0x` Damage, `0%` Damage Reduction.
- **+1 Major Realm ($\Delta = 1$, e.g., Foundation vs. Qi Refinement)**: **`10.0x` Damage**, **`90.0%` Incoming Damage Reduction**.
- **+2 Major Realms ($\Delta = 2$, e.g., Golden Core vs. Qi Refinement)**: **`100.0x` Damage**, **`99.0%` Incoming Damage Reduction** _(verified at compile time in C++20 `cpp/VoxelRealmsGuardrails.hpp` and at runtime in Pillar 7 of `src/game/systemValidation.ts`)_.
- **+3 Major Realms ($\Delta = 3$, e.g., Nascent Soul vs. Qi Refinement)**: **`1,000.0x` Damage**, **`99.9%` Incoming Damage Reduction**.

### E. Breakthroughs & Heavenly Lightning Tribulations (`evaluateBreakthroughAttempt`)

- **Minor Layer Breakthroughs (`Layer 1 → 8`)**: Base `80%` success rate, increased by Alchemy Pills (`+35%` to `+90%`), Mind Cultivation (`+2%` to `+38%`), and Equipped Cultivation Manuals (`+6%` to `+60%`).
- **Major Realm Leap (`Layer 9 → Next Realm Layer 1`)**: Base `60%` success rate and triggers **`tribulationRounds` (`1` to `9` strikes)** of Heavenly Lightning Tribulation. Surviving requires sufficient Kingdom & Cultivator Combat Power (`playerCombatPower >= strikeDamage / 3n`).

---

## 6. 📜 Sacred Cultivation Manuals (12) & Alchemy Pills

Players can unearth **12 Canonical Cultivation Manuals** (`rollManualDiscovery`) from the Ancient Sect Scripture Pavilion and upgrade them from **Level 1 to Level 10** using **Scripture Fragments** and **Kingdom Diamonds (`💎`)**:

|   Path   |      Tier       | Manual Name & Chinese Title                                     | Lv. 1 Passive Rate Boost | Per-Level Passive Boost | Lv. 1 Breakthrough Boost | Max Level |
| :------: | :-------------: | :-------------------------------------------------------------- | :----------------------: | :---------------------: | :----------------------: | :-------: |
|  **Qi**  |     Mortal      | 📜 _Jade Pure Nine-Heavens Mantra (玉清九天玄功)_               |          `+35%`          |       `+18% / Lv`       |    `+6%` (`+2% / Lv`)    | `Lv. 10`  |
|  **Qi**  |    Immortal     | ☯️ _Six Paths Reincarnation Art (六道轮回仙经)_                 |          `+95%`          |       `+40% / Lv`       |   `+12%` (`+3% / Lv`)    | `Lv. 10`  |
|  **Qi**  | Ultimate Origin | 🌌 _Ultimate Origin Great Dao Sutra (终元鸿蒙大道经)_           |         `+240%`          |       `+85% / Lv`       |   `+22%` (`+4% / Lv`)    | `Lv. 10`  |
| **Body** |     Mortal      | 🛡️ _Indestructible Vajra Marrow Sutra (不坏金刚洗髓经)_         |          `+40%`          |       `+20% / Lv`       |    `+7%` (`+2% / Lv`)    | `Lv. 10`  |
| **Body** |    Immortal     | 🩸 _Twelve Ancestral Titan Blood Art (十二祖巫真血诀)_          |         `+105%`          |       `+45% / Lv`       |   `+13%` (`+3% / Lv`)    | `Lv. 10`  |
| **Body** |    Chaos Dao    | 👹 _Primordial Fiendcelestial Body Codex (混沌魔神不灭体典)_    |         `+210%`          |       `+75% / Lv`       |   `+20%` (`+4% / Lv`)    | `Lv. 10`  |
| **Soul** |     Mortal      | 🌟 _Nine-Stars Divine Sense Visualization (九曜神识观想法)_     |          `+38%`          |       `+19% / Lv`       |    `+6%` (`+2% / Lv`)    | `Lv. 10`  |
| **Soul** |    Immortal     | 👁️ _Myriad Primordial Spirit Splitting Art (万化元神分念诀)_    |         `+110%`          |       `+46% / Lv`       |   `+14%` (`+3% / Lv`)    | `Lv. 10`  |
| **Soul** |    Chaos Dao    | 🔮 _Great Dao Omniscient True Spirit Canon (大道全知真灵宝典)_  |         `+220%`          |       `+78% / Lv`       |   `+21%` (`+4% / Lv`)    | `Lv. 10`  |
| **Mind** |     Mortal      | 🪷 _Quiet Seclusion Longevity Heart Sutra (苦修长生静心咒)_     |          `+42%`          |       `+22% / Lv`       |    `+8%` (`+2% / Lv`)    | `Lv. 10`  |
| **Mind** |    Immortal     | ⚔️ _Simulated Trial Demon-Slaying Canon (模拟试炼斩魔心经)_     |         `+115%`          |       `+48% / Lv`       |   `+15%` (`+3% / Lv`)    | `Lv. 10`  |
| **Mind** | Ultimate Origin | 👑 _Eternal Transcendence Supreme Heart Art (永恒超脱至高心典)_ |         `+250%`          |       `+90% / Lv`       |   `+24%` (`+4% / Lv`)    | `Lv. 10`  |

---

## 7. 🩸 The Karma System, Stationary Tribulation Lightning & Loot Drop

To prevent high-realm immortals from slaughtering low-level novices with impunity, the game enforces a deterministic **Heavenly Dao Karma & Red-Name Justice System** (`evaluatePvPKillKarma`, `tickRedNameStationaryLightning`, `resolveRedNameDeathLootDrop`):

1. **Karma Alignments (`getKarmaAlignment`)**:
   - **Gold Justice (`karmaValue >= 300`)**: Righteous enforcer of the Heavenly Dao.
   - **Green Innocent (`50 <= karmaValue < 300`)**: Orthodox Sect Disciple (starting state: `120`).
   - **White Neutral (`0 <= karmaValue < 50`)**: Wandering cultivator.
   - **Red Fiend (`karmaValue < 0`)**: Demonic slaughterer marked for heavenly execution.
2. **Consequence #1 — Global Coordinate Reveal & Spirit Stone Bounty**:
   - Slaughtering a lower-realm Green-Name player drops Karma below `-100`, sets `isLocationRevealed = true` on the world map, and posts a Spirit Stone bounty (`realmGap * 50,000` Spirit Stones).
3. **Consequence #2 — Stationary Heavenly Judgment Lightning (`tickRedNameStationaryLightning`)**:
   - If a Red-Name player remains stationary (`isMoving === false`) for **`>= 8` seconds (`maxStationaryThresholdSec: 8`)**, the Heavenly Dao locks on (warning at `<= 3s` remaining) and strikes them with an **Instant-Kill Crimson Tribulation Bolt**. Moving resets `stationarySeconds` to `0`.
4. **Consequence #3 — High-Risk Full Loot Drop (`resolveRedNameDeathLootDrop`)**:
   - When a Red-Name player dies, they drop an **Equipped Cultivation Manual** (or a Spirit Pill / `10,000 Spirit Stones Pouch` if no manual is equipped), which is logged in `droppedLootHistory`.

---

## 8. 🏮 Master & Disciple Social Hierarchy, Proximity Buffs & Skill Scrolls

Cultivators who reach higher realms can take **Disciples** (`INITIAL_DISCIPLES`: _Yang Tiandong_, _Su Qi_, _Tu Ling'er_, _Murong Qi_) inside their secluded cave abode (`calculateMasterDiscipleEconomy` & `createTransmissionSkillScroll`):

- **Proximity Cultivation Speed Buff (`distanceMeters <= 50m`)**:
  - Disciples cultivating within **50 meters** of a Master of equal or higher realm receive a massive **Proximity Cultivation Speed Buff**:
    $$\text{ProximityBuffPct} = 40\% + \min(160\%, \text{MasterRealmIndex} \times 12\%)$$
- **Configurable Spirit Stone & Qi Taxation (`masterTaxRatePct`: `5%–50%`)**:
  - The Master funnels `masterTaxRatePct` of each disciple's gross Spirit Stones/sec and Qi/sec directly into the Master's treasury while the disciple retains the net remainder.
- **Mystical Power Skill Scroll Transmission (`createTransmissionSkillScroll`)**:
  - Masters who comprehend rare **Mystical Powers (`MYSTICAL_POWER_SKILLS`)**—such as _Heaven Earth Sleeve (袖里乾坤)_, _Six Paths Reincarnation Seal (六道轮回印)_, _Primordial Chaos Sword Qi (鸿蒙剑气)_, or _Book of Misfortune & Karma (厄运天书)_—can transcribe transferable **Jade Skill Scrolls (`传功玉简`)** to bestow upon disciples (`+35%` output per equipped skill) or trade in the sect market.

---

## 9. ✨ 3D Scene-Graph & HDR10+ Cultivation Aura Visualization

Instead of immersion-breaking floating level numbers over characters' heads (`suppressOverheadLevelTag: true`), **Voxel Realms RPG** visualizes a cultivator's realm directly in the **Three.js 3D Scene Graph (`src/game/proceduralWorld.ts`)** using `getCultivationAuraVisualSpec`:

|                  Realm Index Range                   | Visual Cue ID (`cueType`) | 3D Scene-Graph & Shader Manifestation                                                                                                                                                  | HDR10+ Peak Luminance |
| :--------------------------------------------------: | :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------: |
|            **Realm 0** _(Qi Refinement)_             | `none`                    | Mortal vessel; Qi circulates silently inside meridians with no external glow.                                                                                                          |      `120 nits`       |
|              **Realm 1** _(Foundation)_              | `faint_white_glow`        | Translucent white-cyan spiritual mist radiates softly around the cultivator's torso.                                                                                                   |      `420 nits`       |
|             **Realm 2** _(Golden Core)_              | `spinning_golden_core`    | A literal solid **Golden Core** revolves behind the back and gleams inside a translucent chest dantian (`hasTranslucentChestCore: true`).                                              |     `1,150 nits`      |
| **Realms 3–20** _(Nascent Soul → Great Dao Supreme)_ | `floating_nascent_baby`   | A luminous astral **Nascent Soul baby avatar** (`hasFloatingBabyAvatar: true`) floats above the cultivator's crown in lotus meditation posture (plus `2` astral rings at `Realm 15+`). |     `1,850 nits`      |
|  **Realms 21–22** _(Dao Creator & Ultimate Origin)_  | `divine_halos`            | Revolving **Great Dao Divine Rings (Halos)** behind the sovereign (`1` to `12` halos matching `masteredGreatDaos`), paired with a radiant chest core.                                  |   **`4,000 nits`**    |

---

## 🔗 Related Documentation

- **[`README.md`](./README.md)** — Master project overview, architecture matrix & 17 feature pillars.
- **[`LORE.md`](./LORE.md)** — Epoch IV (_The Han Jue Four-Path Immortal Revelation & 100x Realm Suppression_) and the `10^100`-Word Akashic Archive.
- **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** — Functional Core / Imperative Shell design and C++20 `static_assert` guardrails (`cpp/VoxelRealmsGuardrails.hpp`).
- **[`LEGAL.md`](./LEGAL.md)** & **[`EULA.md`](./EULA.md)** — Complete 10-Agreement Legal Stack & EULA (`v1.5.0 · 15/11/2026`).
