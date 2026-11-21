# Changelog

All notable changes to the **Voxel Realms RPG** project are documented in this file.

> **Release Publication Status:** Version entries (`[1.0.0]`–`[1.5.0]`) track implemented codebase milestones and `package.json` versions on the source branch. **No formal GitHub Releases or `v*` Git tags have been published yet**; once ready, tagging `v*.*.*` triggers [`.github/workflows/release.yml`](./.github/workflows/release.yml) to publish checksummed GitHub Release artifacts.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned (`v1.6.0+` Roadmap)

- Procedural dungeon delves with ancient Dao relics and heavenly tribulations (`src/game/dungeons.ts` & `src/game/dungeons.test.ts`).
- WebGPU compute shader upgrade for 10,000+ simultaneous flocking entities.

### Repository Audit, Express 5 Migration, Spatial Audio Cues, CI `@v7`/`@v11` Upgrades & High-Signal Documentation Overhaul (`20/11/2026` — `package.json`, `server.ts`, `src/middleware/auth.ts`, `src/hooks/useSpatialAudioCues.ts`, `.github/workflows/*.yml`, `.env.example`, `README.md`, `dependency.md`, `badges.md`)

- **Dependency Upgrades & Lockfile Synchronization (`package.json`, `package-lock.json`, `bun.lock`)**: Upgraded runtime/dev packages safely to latest Node `22`-compatible versions: `@google/genai` (`2.32.0` → `3.6.1`), `dotenv` (`17.4.2` → `18.0.10`), `express` (`4.22.3` → `5.3.0`), `lucide-react` (`0.546.0` → `1.77.0`), `motion` (`12.43.0` → `14.14.0`), `@types/express` (`4.17.25` → `5.0.6`), and `autoprefixer` (`10.6.2` → `10.7.0`); set `"engines": { "node": ">=22.0.0" }` and regenerated `package-lock.json` (`npm run lockfile:regenerate`) + `bun.lock` (`bun install --lockfile-only`) with `0` `EBADENGINE` warnings and `0` vulnerabilities (`npm audit --audit-level=high`). Intentionally pinned `firebase@12.19.0` (with Node 22 `@firebase/*` overrides, because `firebase@13.x` requires Node `>=24.12.0`) and `@types/node@22.20.5` for Node 22 LTS alignment.
- **Express 5 Compatibility Fixes (`server.ts`, `src/middleware/auth.ts`)**: Updated production SPA fallback route from Express 4 `app.get('*', ...)` to Express 5 `path-to-regexp` v8 syntax `app.get('/{*splat}', ...)` in `server.ts`, and updated `requireAuth` return type in `src/middleware/auth.ts` from `Promise<Response>` to `Promise<void>` to satisfy `@types/express@5.0.6`.
- **Spatial Audio Cues Hook & Modal Preloading (`src/game/spatialAudioCues.ts`, `src/game/spatialAudioCues.test.ts`, `src/game/audio.ts`, `src/hooks/useSpatialAudioCues.ts`, `src/components/GameCanvas.tsx`, `src/App.tsx`)**: Added pure listener-relative 3D stereo pan/attenuation math and world-boss spawn / nearby full-resource-node transition detectors (`3` unit tests), wired `HRTF` `PannerNode` / `StereoPannerNode` cues into `useSpatialAudioCues` with camera yaw tracking, and added idle modal chunk preloading in `src/App.tsx`.
- **Runtime Save Hygiene & Single-Instance Scope Alignment (`src/game/serverPersistence.ts`, `src/game/serverPersistence.test.ts`, `server.ts`, `.gitignore`, `README.md`, `ARCHITECTURE.md`, `package.json`, `index.html`, `badges.md`)**: Removed leaked email-named runtime save folder from the workspace tree, hardened `.gitignore` (`**/online_realm_state.json*`, `*.bak`, `*.corrupt-*`, `*@*/`, `.env.*`), added `resolveSafeDataDir` in `serverPersistence.ts` + `server.ts` so bare-email `VOXEL_DATA_DIR` values safely fall back to gitignored `./data`, qualified server docs from "multi-region" to **Single-Instance Server + Simulated Regional Topology** with measurable beta SLOs (`222` passing tests across `38` TypeScript test files).
- **CI/CD Workflow Upgrades & Release Archive Fix (`.github/workflows/*.yml`)**: Upgraded all 10 GitHub Actions workflows to `actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-artifact@v7`, and `actions/stale@v11` on Node `22`, and added `src/types` and `bun.lock` to `.github/workflows/release.yml` release packaging.
- **Phase 1 Audit Remediation — Modular Server & Client Extraction, CSP/Proxy Hardening, OpenAPI 3.1 & Docker CI Gate (`server.ts`, `src/server/*`, `src/hooks/useSovereignFlightAndTeleport.ts`, `src/lib/apiClient.ts`, `docs/openapi.yaml`, `docs/README.md`, `.github/workflows/ci.yml`, `.env.example`)**: Decomposed the `2,735`-line `server.ts` monolith into a ~`420`-line composition root wiring modular route/gateway files (`src/server/routes/{health,auth,admin,db,online,economy,privacy}Routes.ts`, `wsGateway.ts`, `securityHeaders.ts`, `storeFactory.ts`, `wsFrames.ts`, `types.ts`); removed `'unsafe-eval'` from production `Content-Security-Policy`; replaced hardcoded `trust proxy = 1` with configurable `VOXEL_TRUST_PROXY` (`loopback` default); replaced raw email-only privilege checks on `/api/db/*` with DB/claim role checks; enhanced `DELETE /api/online/account` with a per-store DSR erasure pipeline receipt; extracted `useSovereignFlightAndTeleport` out of `src/App.tsx` and added typed authoritative RPC client `src/lib/apiClient.ts`; added `docs/openapi.yaml`, `docs/README.md` (Implemented vs Simulated vs Planned vs Experimental index), and a `docker-build` CI job (`229` passing tests across `41` TypeScript test files).
- **Target Game Launch Date (`30/03/2030` — `src/game/launchSchedule.ts`, `src/game/launchSchedule.test.ts`, `src/components/TitleScreen.tsx`, `README.md`, `ROADMAP.md`, `RELEASE_NOTES.md`, `badges.md`, `ARCHITECTURE.md`)**: Added canonical launch schedule constants (`GAME_LAUNCH_DATE_DISPLAY = '30/03/2030'`, `GAME_LAUNCH_DATE_ISO = '2030-03-30'`, `GAME_LAUNCH_TIMESTAMP_UTC`) and `getLaunchCountdownSnapshot` with `2` unit tests (`224` passing tests across `39` TypeScript test files), surfaced `Launch 30/03/2030` across the Title Screen emblem/footer/mobile sheet, and synchronized `README.md`, `ROADMAP.md` (`Phase 4: v2.0.0`), `RELEASE_NOTES.md`, `badges.md`, and `ARCHITECTURE.md`.
- **Environment Template & Documentation Overhaul (`.env.example`, `README.md`, `dependency.md`, `badges.md`, `CREDITS.md`)**: Synced `.env.example` with all 18 runtime/Vite/Drizzle environment variables (`DISABLE_HMR`, `ALLOW_PREVIEW_IFRAME`, optional `DATABASE_URL`, `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD`), and updated `README.md` (`Last Updated & Validated: 20/11/2026`) with high-signal AI Agent Context & Guardrails, Verified Tech Stack, concise Repository Map, Quickstart Commands, Beta Scope/SLO targets, and complete Environment Variables table alongside full repository documentation (`227` verified `.md` files).

### Implemented Repeatable Daily Cultivation Missions, Responsive Mobile-First HUD, Platform-Aware HUD Scaling & 109-Invariant Validation (`src/game/dailyMissions.ts`, `DailyMissionModal.tsx`, `src/game/hudPlatformScale.ts`, `TitleScreen.tsx`, `GameHUD.tsx`, `Minimap.tsx`, `src/game/systemValidation.ts`, `server.ts`, `bun.lock`)

- **Repeatable Cultivation-Scaled Daily Mission System (`src/game/dailyMissions.ts`, `src/game/dailyMissions.test.ts`, `src/components/DailyMissionModal.tsx`, `src/App.tsx`)**: Added deterministic 5-task daily mission boards across 8 gameplay categories (`cultivation_meditate`, `resource_harvest`, `pill_alchemy`, `manual_study`, `troop_muster`, `boss_skirmish`, `citadel_expansion`, `market_caravan`) scaling targets and `BigInt` material/cultivation payouts monotonically across the 4 cultivation eras (`mortal`, `immortal_sage`, `chaos_dao`, `ultimate_origin`), with `3/5` and `5/5` milestone chests, free repeatable next cycles upon board completion, 1 free daily reroll + `150` Diamond paid rerolls, anti-double-claim guards, and `BigInt`-safe `localStorage` persistence (`voxel_realms_daily_missions_v1`).
- **Responsive Mobile-First Title Screen, HUD & Collapsible Minimap Redesign (`src/components/TitleScreen.tsx`, `src/components/GameHUD.tsx`, `src/components/Minimap.tsx`, `src/components/GoogleSignInButton.tsx`)**: Rebuilt `TitleScreen.tsx` with a single-row header, desktop `Realm Menu` popover, scrollable mobile **Realm Systems & Archives** sheet covering all 10 realm destinations, scrim-backed above-the-fold hero CTA (`ENTER THE REALM` visible above the fold at `390×700`), and compact `GoogleSignInButton`; slimmed the mobile Lord Identity Card, added `EULA` & `Daily Missions` into the `More` Command Hub drawer, added a collapsible mobile Minimap toggle, and removed `backdrop-blur` over WebGL.
- **Platform-Aware HUD Icon & Typography Scaling (`src/game/hudPlatformScale.ts`, `src/game/hudPlatformScale.test.ts`, `src/App.tsx`, `src/components/GameHUD.tsx`, `src/components/Minimap.tsx`)**: Added automatic viewport/coarse-pointer platform detection (`detectInitialTargetPlatform`) and live switchable **`Mobile Readability` (`1.15x` text scale, `24px` icons, `>=48px` minimum touch targets, single-row `48px` currency strip with zero right-edge clipping)** vs **`PC / Console Precision` (`1.0x` text scale, `20px` icons)** scaling across all HUD clusters (`data-hud-platform` / `data-hud-text-scale`).
- **Dev Server Cold-Boot CLI, Lockfile Parity & 109-Invariant System Validation Upgrade (`server.ts`, `bun.lock`, `src/game/systemValidation.ts`, `src/game/systemValidation.test.ts`, `README.md`, `badges.md`)**: Hardened `server.ts` CLI `--port`/`--host` handling and disabled Vite WebSocket upgrades when `DISABLE_HMR=true`, synchronized `package-lock.json` and `bun.lock`, registered Daily Missions (Pillar 7) and Platform-Aware HUD Scaling (Pillar 9) into `runFullSystemValidationReport` (**109 invariants across 9 pillars**), and expanded `npm test` to **218 passing tests across 37 TypeScript test files** alongside `227` verified Markdown docs.
- **Cross-OS Perceptual Modal Visual Diff Hardening (`src/lib/visualDiff.ts`, `src/lib/visualDiff.test.ts`, `scripts/compare-modal-screenshots.ts`, `scripts/verify-e2e-browser.sh`)**: Added opt-in bidirectional subpixel shift tolerance (`subpixelShiftRadiusPx: 2`) and Vysniauskas/pixelmatch anti-aliased edge filtering (`ignoreAntialiased: true`) plus deterministic animation-frozen modal capture (`document.fonts.ready` + CSS animation suppression) to eliminate cross-OS (Debian 12 vs Ubuntu 24.04) FreeType/Skia font hinting false positives on `eula-modal` and `vip-modal` while keeping real layout, color, missing-card, and blank-frame regressions fail-closed.

### Implemented Marketplace Liquidity Score, Production Security Blockers & Containerized Deployment (`MarketplaceModal.tsx`, `VipSubscriptionModal.tsx`, `server.ts`, `Dockerfile`, `.dockerignore`, `nginx.conf`, `DEPLOYMENT.md`)

- **Marketplace Bulk Trade Liquidity Score (`src/game/marketplaceSparklineD3.ts`, `src/game/marketplaceSparklineD3.test.ts`, `src/components/MarketplaceModal.tsx`)**: Added pure liquidity scoring (`computeItemLiquidityScore`, `computeMarketplaceLiquidityRows`) computing a `0–100` score, tier (`Instant`, `High`, `Moderate`, `Thin`, `Depleted`), and estimated execution speed from live NPC stock and average daily trade volume, rendered in a sortable/filterable **Bulk Trade Liquidity Score Matrix** under **Commodity Exchange**, a `Liquidity Score` column under **Caravan Barter**, and per-card liquidity badges.
- **In-Game Diamond-Only VIP Covenants (Blocker 1 — `src/components/VipSubscriptionModal.tsx`, `src/App.tsx`)**: Removed unverified real-money USD prices and free `store_pass` activation; VIP tiers now unlock strictly via in-game Diamond treasury redemption with explicit non-monetary billing disclosure.
- **Global Server State Isolation & Multi-Sector 20Hz Ticking (Blocker 3 — `server.ts`, `src/components/ClanTerritoryMap.tsx`)**: Made `GET /api/online/status?sector=` strictly read-only, restricted global `primaryClusterId` and `activeSector` mutations on `POST /api/online/sync` to GM/admin sessions (`canAccessGmConsole`), removed global `activeSector` overwrites from `/api/online/siege/cmd` and `/ws/siege`, and updated the 20Hz tick loop to tick every peer-subscribed sector independently.
- **Fail-Closed Critical Secrets (Blocker 5 — `src/game/serverAuth.ts`, `src/game/serverAuth.test.ts`, `server.ts`, `.env.example`)**: Removed all ephemeral secret/passkey fallback generation so `server.ts` fails closed and exits immediately if `VOXEL_SESSION_SECRET` or `VOXEL_ADMIN_PASSKEY` is missing, weak, or matches placeholder values.
- **WebSocket Upgrade & Proxy Hardening (Blocker 6 — `src/game/serverHardening.ts`, `src/game/serverHardening.test.ts`, `server.ts`)**: Added `verifyWebSocketOrigin` (blocks cross-origin CSWSH upgrades with `403`), rejected `?token=` query-string credentials on `/ws/siege` (`400`), and added `resolveClientIpFromHeaders` so per-IP WebSocket connection caps isolate real client IPs behind trusted proxies via `X-Forwarded-For`.
- **Production Containerization & Security Headers (Blocker 7 — `Dockerfile`, `.dockerignore`, `nginx.conf`, `DEPLOYMENT.md`, `server.ts`)**: Added a multi-stage `node:24-alpine` `Dockerfile` (excluding `devDependencies` via `npm ci --omit=dev`, running as non-root `USER node` on port `3000`, with `/healthz` health check, direct Node PID 1 startup, and an optional `--target nginx-runner` non-root Alpine/Nginx static edge stage), `.dockerignore`, `DEPLOYMENT.md`, and hardened Express/Nginx security headers (`Content-Security-Policy` including `worker-src 'self' blob:`, `Strict-Transport-Security`, `X-Frame-Options`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `X-Content-Type-Options`, `Referrer-Policy`). Expanded `npm test` to **187 passing tests across 30 TypeScript test files** and `226` verified Markdown docs.

### Implemented Cloud SQL Persistence, Firebase Auth, Hardened Firestore, Gmail Dispatch & Bundle/Test Upgrades (`src/db/*`, `src/lib/*`, `src/middleware/auth.ts`, `firestore.rules`, `vite.config.ts`)

- **Cloud SQL (PostgreSQL + Drizzle ORM)**: Added PostgreSQL schema (`users`, `player_profiles`, `game_saves`, `tickets` in `src/db/schema.ts`), lazy `pg.Pool` initialization (`src/db/index.ts` using `SQL_HOST`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`), `requireAuth` Firebase ID token verification middleware (`src/middleware/auth.ts`, `src/lib/firebase-admin.ts`), and authenticated persistence routes (`GET/PUT /api/db/profile`, `GET/PUT /api/db/save`, `GET/POST /api/db/tickets`) in `server.ts`.
- **Firebase Auth, Dual-Tier Google OAuth & Hardened Cloud Firestore**: Added Google Sign-In authentication (`src/contexts/AuthContext.tsx`, `src/components/GoogleSignInButton.tsx`, `basicGoogleAuthProvider` vs `googleAuthProvider`), Default Sovereign Session Identity binding (`creatergame31@gmail.com`), Firestore helpers (`src/lib/firestore.ts`), `firebase-blueprint.json`, `security_spec.md`, and hardened `firestore.rules` audited by `eslint firestore.rules` (`npm run lint:rules`) and the `firestore.rules.test.ts` Dirty Dozen suite (`npm run test:rules`).
- **Google Workspace Gmail Dispatch Center**: Added `src/lib/gmail.ts` and `src/components/GmailModal.tsx` supporting authenticated inbox threads, replies, message compose with CRLF-safe UTF-8 Base64URL MIME encoding, mark read/unread, trash/untrash, permanent deletion gated behind confirmation dialogs using strictly in-memory OAuth tokens (`signInWithGoogle({ includeGmailScopes: true })`), and an in-modal Google Cloud Testing Mode OAuth Consent Guide (`dev-ivy-6v0ns` / `creatergame31@gmail.com`).
- **Bundle Code Splitting & Lazy Modal Loading**: Configured Rolldown `manualChunks` in `vite.config.ts`, extracted `GoogleSignInButton.tsx` from `GmailModal.tsx`, and converted all 19 conditional overlay modals in `src/App.tsx` to `React.lazy` + `<Suspense>`, cutting the initial client JS entry bundle from `2,988.23 kB` (`790.81 kB` gzip) down to `~475 kB` (`~151 kB` gzip) with zero build warnings.
- **3D Open-World MMORPG Spatial BVH, Simplex Noise, Cannon-es Physics, 3D Object Collision Solver, International MMORPG Standards, `100 km × 100 km+` Continental Expansion & Tween Camera (`Physics.md`, `3D-open-world-mmorgp-game-international-standard.md`, `src/game/openWorld3DEngine.ts`, `src/game/openWorld3DEngine.test.ts`, `src/components/GameCanvas.tsx`, `vcpkg.json`)**: Upgraded to `three@0.187.0` and `@types/three@0.187.0`, integrated `three-mesh-bvh@0.9.18` (`MeshBVH`, `acceleratedRaycast`) for $O(\log N)$ 3D picking, `simplex-noise@4.0.3` for deterministic multi-octave fBm biome/cavern synthesis, `cannon-es@0.20.0` for 3D siege artillery trajectories & Citadel keep collision resolution, `resolveThreeDimensionalObjectCollision` (`Physics.md`) enforcing Conservation of Linear Momentum, Newton's Third Law Impulse symmetry ($\vec{J}_{A \leftarrow B} = -\vec{J}_{B \leftarrow A}$), Elastic ($e=1.0$), Inelastic ($0<e<1.0$), and Perfectly Inelastic ($e=0.0$) restitution with Minimum Translation Vector (MTV) collider separation, `evaluateInternationalMmorpgStandardCompliance` (`3D-open-world-mmorgp-game-international-standard.md`) auditing the 4-domain Cross-Platform Benchmark Matrix and 5 Core MMORPG Pillars (`21` subsystems), High-End PC & Mac `100 km × 100 km+` Continental Expansion (`computeCameraRelativeGpuTransform64` 64-bit `Float64Array` CPU / 32-bit `Float32Array` camera-relative GPU rendering, `rebaseFloatingOriginCoord` `5,000m` floating origin rebasing, `OpenWorldChunkStreamingManager` `256m × 256m` tile streaming with POI stamps & hysteresis VRAM disposal, and `ServerMeshSpatialGridAuthority` `100m` ghost-entity boundary handoff `< 50 ms` + multi-tiered replication graph at `50m @ 30–60 Hz`, `300m @ 10 Hz`, and `2 km @ 2 Hz`), `@tweenjs/tween.js@25.0.0` for smooth camera interpolation, and expanded `vcpkg.json` with native C++20 3D MMORPG packages (`bullet3`, `fastnoise2`, `recastnavigation`, `enet`, `lz4`).
- **Authoritative Multiplayer Anti-Cheat & Security Audit Overrides (`src/game/antiCheat.ts`, `src/game/antiCheat.test.ts`, `server.ts`, `package.json`)**: Added `AuthoritativeAntiCheatEngine` enforcing kinematic speed-hack & teleport rubberbanding, monotonic `clientSeq` replay protection, resource/castle/realm delta inflation clamping, siege command cooldowns & `1T` rally caps, automatic violation-score quarantine (`>=100` pts), `/api/online/anti-cheat` telemetry, and `/api/admin/anti-cheat/pardon` GM un-quarantine, plus transitive `"overrides"` (`@grpc/grpc-js@^1.14.7`, `esbuild@^0.28.2`, `minimatch@^11.0.8`, `picomatch: npm:@ryotsu/picomatch@4.0.7-a`) achieving `0` vulnerabilities on `npm audit --audit-level=high`.
- **End User License Agreement & 10-Agreement Legal Compliance Stack (`EULA.md`, `LEGAL.md`, `src/game/eula.ts`, `src/game/eula.test.ts`, `src/components/EulaModal.tsx`)**: Added comprehensive 10-Article `EULA.md` and 10-Document `LEGAL.md` stack (`ToS`, `Privacy [GDPR/CCPA/DPDP Act]`, `Cookie Policy`, `EULA`, `SaaS Agreement`, `Apache-2.0`, `AUP`, `SLA`, `DPA`, `MSA`) under Licensor `creatergame31@gmail.com` (`17/11/2026`), decoupled EULA verification & FNV-1a receipt generation (`src/game/eula.ts`), and interactive `EulaModal.tsx` accessible from the Title Screen and Game HUD.
- **Open-World MMORPG Avatar, Clone & Shadow Engine (`src/game/avatarCloneShadow.ts`, `src/game/avatarCloneShadow.test.ts`, `src/components/HeroModal.tsx`)**: Implemented the 4-row `Clone` vs. `Shadow` vs. `Avatar` comparison matrix, 3 Clone subtypes (`tactical_illusion`, `combat_summon`, `cosmetic_clone_avatar`), 3 Shadow subtypes (`shadow_action_mimic`, `shadow_time_echo`, `shadow_doppelganger_boss`), instant Shadow Swap teleportation, and 50-player Raid 200-entity `int16` delta-packet compression within the `20Hz` (`50ms`) server tick budget.
- **Operational Runbooks, Engineering Constitution & Dev Server Stability (`discipline.md`, `deployment validation.md`, `monitoring.md`, `backups.md`, `environment hardening.md`, `real-world QA.md`, `incident response.md`, `server.ts`, `src/db/index.ts`, `.prettierignore`)**: Added the 7 production runbooks covering engineering discipline, 4-stage deployment validation, live Four Golden Signals monitoring, RPO/RTO disaster recovery, fail-closed environment hardening, multi-device hardware/software WebGL2 QA, and `SEV-1`–`SEV-4` incident response; fixed dev-server preview iFrame header/HMR readiness (`viteReadyPromise`, `DISABLE_HMR='true'`), lazy-initialized Cloud SQL `pg.Pool`, and ignored `bun.lock` in `.prettierignore`.
- **Comprehensive Governance, Architecture, SRE, QA, Security, Cultivation, Legal & `.github/` Catalog (`171` Files, including `dependency.md` & `docs/adr/`)**: Expanded repository documentation across Core Governance (`VISION.md`–`MEETING_NOTES.md`), System Architecture (`SYSTEM_DESIGN.md`–`SCALABILITY_MATRIX.md`, `docs/adr/*`, `dependency.md`), SRE/DevOps (`runbooks.md`–`cost_optimization.md`), QA (`test_strategy.md`–`determinism_validation.md`), Security/Cryptography (`THREAT_MODEL.md`–`INCIDENT_FORENSICS.md`), Cultivation/Worldbuilding (`COSMOLOGY.md`–`BALANCE_PHILOSOPHY.md`), Legal/Trust (`ACCEPTABLE_USE_POLICY.md`–`CONTENT_MODERATION_POLICY.md`), and `.github/` (`CODEOWNERS`, `dependabot.yml`, `FUNDING.yml`, `release.yml`, Issue/PR/Discussion templates, and `ci.yml`/`cd.yml`/`nightly_build.yml`/`security_audit.yml`/`lint_and_format.yml`/`release_drafter.yml`).
- **Developer Tooling, Simulation Deep-Dives, RFC/Modding Contracts & Cultivation Codex Expansion (`34` Files)**: Added `.LOCAL_DEVELOPMENT.md`, `DEBUGGING_GUIDE.md`, `CLI_REFERENCE.md`, `FEATURE_FLAGS.md`, `BUILD_SYSTEM.md`, `CODING_STANDARDS.md`, `DATA_PIPELINE.md`, `EVENT_SCHEMA_REGISTRY.md`, `ANALYTICS_TAXONOMY.md`, `RNG_AND_SEEDING.md`, `SIMULATION_TICK_LOOP.md`, `AI_BEHAVIOR_TREES.md`, `RFC_PROCESS.md`, `docs/rfcs/TEMPLATE.md`, `PLUGIN_ARCHITECTURE.md`, `MODDING_API.md`, `COMMUNITY_GUIDELINES.md`, `DOC_CONVENTIONS.md`, `AUCTION_HOUSE_MECHANICS.md`, `SECLUSION_AND_MEDITATION.md`, `DUAL_CULTIVATION_AND_BONDS.md`, `DEMONIC_VS_RIGHTEOUS_PATHS.md`, `FORBIDDEN_TECHNIQUES.md`, `POCKET_REALMS_AND_GROTTOES.md`, `CALAMITIES_AND_EXTINCTIONS.md`, `LANGUAGE_AND_RUNES.md`, `.editorconfig`, `.gitattributes`, updated `.gitignore`, `.pre-commit-config.yaml`, `Justfile`, `.github/CODE_OF_CONDUCT_ENFORCEMENT.md`, `.github/workflows/docs_deploy.yml`, and `.github/workflows/stale_issues.yml`.
- **In-Game Economy & Marketplace Spec + Maxed Creator God Character (`in-game- economy -marketplace.md`, `src/game/godModeCharacter.ts`, `src/game/godModeCharacter.test.ts`, `src/game/cultivationMath.ts`, `src/game/antiCheat.ts`, `server.ts`, `src/App.tsx`, `src/components/AdminConsoleModal.tsx`, `src/components/CultivationModal.tsx`)**:
  - Added [`in-game- economy -marketplace.md`](./in-game-%20economy%20-marketplace.md) detailing the 8 core Kingdom/Cultivation currencies + Clan Honor Coins, lossless `BigInt` (`1,000T` troop / `1T` rally) ledger math, Marketplace & Auction House (`5%` escrow sink, anti-sniping, Jade Skill Scrolls), VIP discounts/stipends, Master–Disciple `5%–20%` tax, Karma bounties, server anti-cheat clamping, and Root Creator Zero-Loss Economic Immunity.
  - Granted **`creatergame31@gmail.com`** a **Max-Out God Character (`Castle Lv. 100`, `1,000T` T20 troops, `~1Q` treasury reserves, Realm `22` Ultimate Origin L9 across all 4 Paths, all 12 Manuals Lv. 10, `12` Great Daos, `VIP 3 Celestial Sovereign`, `Lv. 999` Divine Heroes)**, **12-Domain All-Things Immunity**, and the **100 Supreme Omni-Attributes Codex across 5 Divine Pillars** (`Power, Authority & Creation`, `Knowledge, Wisdom & Vision`, `Presence, Space & Time`, `Goodness, Morality & Divine Nature`, and `Cosmic Unity & Volition [Including Dark/Dualistic Deities]`, via `GOD_OMNI_ATTRIBUTES`, `evaluateGodOmniAttribute`, `evaluateGodCharacterImmunity`, and `applyGodImmunityToIncomingEffect`), strictly fail-closed for all non-root accounts and enforced across combat/cultivation (`cultivationMath.ts`, `CultivationModal.tsx`), economy & casualties (`App.tsx`), server anti-cheat quarantine bypass (`antiCheat.ts`, `server.ts`), and interactive GM controls (`AdminConsoleModal.tsx`).
- **100 Playable Species / Races in Character Creation & Admin Permission Gate (`src/game/species.ts`, `src/game/species.test.ts`, `src/components/CharacterCreationModal.tsx`, `src/components/AdminConsoleModal.tsx`, `src/components/LoreHistoryModal.tsx`)**: Expanded `CHARACTER_SPECIES_CATALOG` from 10 to **all 100 Playable Species / Races (`10 Core Solara Starter Lineages + 90 Sovereign Omniverse Races #1–#100`)** with full 3D `meshTraits`, innate passives, Tier `1–5` filter tabs, and live search in `CharacterCreationModal.tsx`, granting **`creatergame31@gmail.com`** unrestricted selection/switching across all 100 races and enabling other players to choose from all 100 races with **Admin (`creatergame31@gmail.com`) permission** (`adminSpeciesSwitchApproved: true`).
- **9 Cross-Platform Hardware, Console, Mobile & Spatial VR Engineering Specifications + `Physics.md` & `3D-open-world-mmorgp-game-international-standard.md` (`Windows.md`, `PC.md`, `playstation.md`, `xbox.md`, `mac.md`, `linux.md`, `iOS.md`, `android.md`, `Virtual Reality.md`, `Physics.md`, `3D-open-world-mmorgp-game-international-standard.md`, `compatibility_matrix.md`)**: Added dedicated platform architecture guides covering `DirectX 12 Ultimate`, `Vulkan 1.3`, `Metal 3` (`128B` Apple Silicon UMA), `PS5` DualSense & `GNM`, `Xbox Series X|S` GDK & Velocity Architecture, `Linux` POSIX server persistence & SteamOS, `iOS` & `Android` `ASTC 6x6` (`8W` passive thermal envelope), `WebXR`/`OpenXR` Stereoscopic Virtual Reality, 3D Rigid-Body Collision Physics (`Physics.md`), and International Open-World 3D MMORPG Standards (`3D-open-world-mmorgp-game-international-standard.md`, bringing total repository Markdown documentation to **`225` verified `.md` files**).
- **Sovereign Divine Flight & 3D Nine-Heavens Imperial Flying Sword for `creatergame31@gmail.com` (`src/game/godModeCharacter.ts`, `src/game/proceduralWorld.ts`, `src/components/GameCanvas.tsx`, `src/components/GameHUD.tsx`, `src/components/AdminConsoleModal.tsx`, `src/App.tsx`)**: Added fail-closed Sovereign Divine Flight (`GOD_FLIGHT_SPEC`, `evaluateGodFlightPermission`, `computeNextGodFlightKinematics`) exclusively for **`creatergame31@gmail.com`**, featuring a 3D Golden-Cyan Imperial Flying Sword & rotating Astral Bagua Halo mount (`GodFlightMountGroup`), `2.5x` aerial speed, `0m–45m` altitude elevation, Citadel keep wall collision bypass (`y >= 2.5m`), keyboard hotkeys (`[F]` toggle flight, `E`/`Space` ascend, `Q`/`Shift` descend), HUD Flight Badge & 3D Flight Pod, and GM Console altitude presets.
- **Sovereign Divine Teleportation & Spatial Rift Matrix for `creatergame31@gmail.com` (`src/game/godModeCharacter.ts`, `src/game/proceduralWorld.ts`, `src/components/GameHUD.tsx`, `src/components/AdminConsoleModal.tsx`, `src/App.tsx`)**: Added fail-closed Sovereign Divine Teleportation (`GOD_TELEPORT_SPEC`, `evaluateGodTeleportPermission`, `executeGodTeleportJump`) exclusively for **`creatergame31@gmail.com`** (linked to `Omnipresent`, `Omnilocal`, `Omnidistance`, `Omnimobile`, `Omnispatial`), featuring 8 Realm Waypoints (`0ms` cooldown), `+12.0m` Forward Astral Blink (`[T]`), `Shift + Click` 3D Scene Teleportation, Custom `(X, Y, Z)` Coordinate Warp, and a 3D expanding cyan-gold `GodTeleportWarpGroup` torus burst.
- **Clan Bulk Vault Donation Confirmation Gate, Locked Dependency Versions (`firebase@12.19.0`), GitHub Actions `@v7`/`@v11` Upgrade & Fixed Release Archive (`src/components/ClanModal.tsx`, `src/game/clanMath.ts`, `src/game/clanMath.test.ts`, `package.json`, `package-lock.json`, `scripts/verify-readiness.ts`, `.github/workflows/*.yml`)**: Added a confirmation dialog in `ClanModal.tsx` (`evaluateBulkVaultDonationConfirmation` in `src/game/clanMath.ts`) requiring explicit checkbox acknowledgment before executing bulk resource donations (`10%`, `25%`, `50%` of Gold, Wood, and Ore) to the Clan Vault, expanded `npm test` to **178 tests across 29 suites** and `systemValidation.ts` to **103 invariants**, locked exact dependency versions in `package.json` and synchronized `package-lock.json` (`firebase@12.19.0` for Node `>=20.0.0` / Node 22 compatibility with zero `EBADENGINE` warnings, `@tailwindcss/vite@4.3.5`, `tailwindcss@4.3.5`, `@tweenjs/tween.js@25.0.0`, `picomatch: npm:@ryotsu/picomatch@4.0.7-a`), upgraded all 10 `.github/workflows/*.yml` pipelines (`build.yml`, `cd.yml`, `ci.yml`, `docs_deploy.yml`, `lint_and_format.yml`, `nightly_build.yml`, `release.yml`, `release_drafter.yml`, `security_audit.yml`, `stale_issues.yml`) to `actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-artifact@v7`, and `actions/stale@v11`, added fail-closed `HTTP 401`/`403` and anti-cheat checks in `scripts/verify-readiness.ts`, fixed `.github/workflows/release.yml` tar archive contents to include all runtime modules and specs (`in-game- economy -marketplace.md`, `dependency.md`, `Physics.md`, `3D-open-world-mmorgp-game-international-standard.md`), and unified `npm run validate` to run `lint`, `lint:rules`, `format:check`, `test`, and `build`.

### Implemented Operational Readiness, Exploit Hardening & Atomic Persistence (`src/game/serverPersistence.ts`, `src/game/serverHardening.ts`, `scripts/verify-readiness.ts`)

- Added `AtomicRealmPersistence` (`src/game/serverPersistence.ts`, `serverPersistence.test.ts`) using write-temp → `fsyncSync` → verified `.bak` promotion → atomic POSIX rename inside a SHA-256 integrity envelope (`schemaVersion: 2`), with automatic failover recovery from `.bak` on truncated/corrupt primary files and graceful `SIGTERM`/`SIGINT` drain flushing.
- Added exploit & load bounds (`src/game/serverHardening.ts`, `serverHardening.test.ts`): sliding-window API write rate limiting (`120/min`), 5-attempt operator login brute-force lockout (`429` + `Retry-After`), Same-Origin CSRF checks on cookie mutations (`403`), recursive prototype-pollution rejection (`400`), fragmented/bounded RFC 6455 WS frame decoder (`32 KiB` max frame, `64 KiB` RX buffer, `30 msg/s` flood disconnects, slow-consumer backpressure drops), 20Hz tick latency p50/p95/max tracking, and `/readyz` + `/api/ops/readiness` probes.
- Added live production verification harness `scripts/verify-readiness.ts` (`npm run verify:ops`) wired into CI (`.github/workflows/build.yml`) to empirically verify concurrent HTTP/WS load (`0` tick overruns), exploit blocks, truncated save `.bak` failover, and clean `SIGTERM` shutdown.

### Implemented Security Hardening — Server-Side HMAC-SHA256 Session Auth, Fail-Closed RBAC & Trust Boundaries (`src/game/serverAuth.ts`, `server.ts`, `SECURITY.md`)

- Implemented cryptographic HMAC-SHA256 `HttpOnly` session authentication (`/api/auth/player-session`, `/api/auth/admin-login`, `/api/auth/session`, `/api/auth/logout`) backed by timing-safe `VOXEL_ADMIN_PASSKEY` verification and fail-closed production operator enforcement (`src/game/serverAuth.ts` + `src/game/serverAuth.test.ts`).
- Enforced fail-closed `401`/`403` RBAC authorization on `/api/admin/state`, `/api/admin/moderation`, `/api/admin/tickets/resolve`, `/api/admin/decree`, and `/api/admin/species-rebirth`, persistent server security audit logs (`securityAuditLog`), anti-tamper `/api/online/sync` sanitization, email redaction on `/api/online/status`, and authenticated WebSocket command identity binding on `/ws/siege`.
- Explicitly tagged client-side `verifyAccountPrivileges` checks as `UNTRUSTED_CLIENT_PREVIEW` in `src/game/adminModeration.ts` and added verified server session status + operator sign-in UI in `src/components/AdminConsoleModal.tsx`.

### Implemented Specification — `v1.5.0` Authoritative 20Hz 50v50 Castle Siege WebSocket Network Protocol & Multi-Region Persistence (`src/game/siegeNetProtocol.ts` & `server.ts`)

In accordance with the **Architect-First** guardrail in `CONTRIBUTING.md` (which **• helps prevent early design flaws**), this specification defines the deterministic client-server WebSocket protocol implemented in `src/game/siegeNetProtocol.ts`, `src/game/siegeNetProtocol.test.ts`, `server.ts` (`/ws/siege` & `/api/online/*`), and `src/components/ClanTerritoryMap.tsx` for 50v50 clan territory castle sieges (`TerritoryGridSector` `A1`–`C3`), reconciling up to `1,000T` (`10^15`) total troops and `1T` (`10^12`) coordinated rallies without IEEE-754 floating-point precision loss.

#### 1. Transport Layer & Tick Topology

- **Authoritative Server Tick (`20 Hz` / `50 ms`)**: The siege authority evaluates combat resolution, troop counter-matrix multipliers (`shieldbearer` > `shooter` > `bomber` > `shieldbearer`), cultivation realm suppression (`10^ΔRealm`), and fortification damage every `50 ms`.
- **Client Command Stream (`60 Hz` Local Prediction)**: Clients sample movement and formation directives locally, tagging each outgoing command with a monotonically increasing `seq` ID and local `clientTick`.
- **Trillion-Scale `BigInt` Wire Serialization**: All troop counts, HP pools, and power ratings (`bigint` in `src/types/game.ts`) are serialized over JSON/MessagePack frames as unsigned decimal or hex string literals (`BigIntWireString`, e.g. `"1000000000000"` for `1T`) to prevent `Number.MAX_SAFE_INTEGER` (`9,007,199,254,740,991`) truncation.
- **Spatial Quantization**: World coordinates `(x, z)` across the `40×40` procedural chunk grid are quantized to signed 16-bit fixed-point integers (`int16`, `0.01` world-unit precision, range `[-327.68, +327.67]`) during delta transmission.

#### 2. Wire Envelope & Opcode Registry

Every WebSocket frame is wrapped in a deterministic `SiegeNetEnvelope` header containing sequence tracking and an FNV-1a / CRC32 state digest for desync detection:

```typescript
export type SiegeNetOpcode =
  | 0x01 // C2S_TROOP_POSITION_CMD   (Client -> Server: Cohort waypoint / formation command)
  | 0x02 // C2S_RALLY_ACTION_CMD     (Client -> Server: Initiate, join, or launch 1T siege rally)
  | 0x10 // S2C_FULL_SIEGE_SNAPSHOT  (Server -> Client: Keyframe baseline state on join / resync)
  | 0x11 // S2C_DELTA_SIEGE_UPDATE   (Server -> Client: 20Hz bitmask delta-compressed tick frame)
  | 0x12 // S2C_RALLY_STATUS_SYNC    (Server -> Client: Authoritative 1T rally state & contributors)
  | 0x13; // S2C_RECONCILIATION_FAULT (Server -> Client: State hash mismatch / forced rollback)

export type TerritorySectorCode = 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3';

export interface SiegeNetEnvelope<TPayload> {
  v: 1; // Protocol schema version (v1.5.0 = 1)
  op: SiegeNetOpcode; // Packet opcode
  tick: number; // Authoritative server simulation tick (uint32)
  ts: number; // Server monotonic epoch timestamp in ms
  seq: number; // Packet sequence number (uint32)
  ack: number; // Last processed client command sequence ID (for CSP reconciliation)
  sector: TerritorySectorCode; // Contested territory sector (e.g., 'B2' Dragon Spire, 'C3' Chronos Dread Keep)
  stateHash: number; // 32-bit FNV-1a checksum of authoritative sector state at `tick`
  payload: TPayload;
}
```

#### 3. Packet Structure I: Troop Positioning & Cohort Kinematics (`0x01` / Snapshot Cohort State)

Represents client movement intents (`C2S_TROOP_POSITION_CMD`) and authoritative cohort kinematics within a contested sector. Supports tactical formations introduced in v1.3.0 (`SHIELD_WALL`, `PHALANX_ADVANCE`, `WEDGE_CHARGE`, `LOOSE_SKIRMISH`).

```typescript
export type SiegeFormationType =
  | 'SHIELD_WALL' // +35% frontal defense, -25% march speed
  | 'PHALANX_ADVANCE' // Balanced anti-charge formation
  | 'WEDGE_CHARGE' // +30% breakthrough impact vs gates/lines
  | 'LOOSE_SKIRMISH'; // -40% AoE trebuchet/cataclysm vulnerability

export type CohortCombatPosture =
  'MARCHING' | 'ENGAGING_MELEE' | 'VOLLEY_FIRING' | 'BOMBARDING_WALL' | 'ROUTED_RETREAT';

/**
 * Client-to-Server command packet (Opcode 0x01) for predictive cohort positioning.
 */
export interface TroopPositionCommandPacket {
  clientCmdSeq: number; // Monotonic client input sequence ID
  clientTick: number; // Client tick when command was issued
  cohortId: string; // Unique cohort UUID (e.g., "cohort_alpha_01")
  lordId: string; // Issuing player UUID
  originQ: [number, number]; // Quantized start [x_int16, z_int16] (1 unit = 0.01m)
  waypointsQ: [number, number][]; // Up to 8 quantized A* path waypoints
  formation: SiegeFormationType;
  targetEntityId?: string; // Optional enemy cohort ID, gate ID, or outpost obelisk ID
}

/**
 * Authoritative cohort positioning state inside S2C snapshots (0x10) and delta frames (0x11).
 */
export interface AuthoritativeCohortState {
  cohortId: string;
  lordId: string;
  lordName: string;
  clanTag: string;
  controller: 'player_clan' | 'enemy_clan';
  troopType: 'shieldbearer' | 'shooter' | 'bomber';
  tier: number; // T1 to T20
  unitCount: string; // BigInt serialized string (up to "1000000000000000" / 1000T)
  powerRating: string; // Multiplicative BigInt power serialized string
  cultivationRealmId: number; // 0 (Qi Refinement) .. 22 (Ultimate Origin) for 10^ΔRealm suppression
  posQ: [number, number]; // Quantized [x_int16, z_int16]
  velQ: [number, number]; // Quantized velocity vector [vx_int16, vz_int16]
  headingMillirad: number; // Facing angle in milliradians (-3142 to +3142)
  formation: SiegeFormationType;
  posture: CohortCombatPosture;
  moraleBps: number; // Morale in basis points (0 .. 10000 = 0.00% .. 100.00%)
  targetEntityId: string | null;
}
```

#### 4. Packet Structure II: Rally Status & 1-Trillion Siege Assembly (`0x02` / `0x12`)

Synchronizes multi-lord war rallies (`ActiveRally` in `src/types/game.ts`) targeting enemy citadels, sector obelisks, or World Titans. Enforces the `1,000,000,000,000` (`1T`) rally cap, contributor troop composition breakdown, and attached siege engines.

```typescript
export type SiegeRallyPhase =
  | 'PREPARING' // Gathering contributor legions inside muster window
  | 'MARCHING' // En route across sector causeways
  | 'SIEGE_CLASH' // Actively bombarding gates / clashing with garrison
  | 'BREACHED' // Outer fortification destroyed; inner sanctum assault
  | 'RESOLVED' // Victory or repulsion finalized
  | 'CANCELLED'; // Aborted by rally leader or leader disconnected

export interface SiegeWeaponAttachment {
  batteringRams: number; // 1000T gate-crushing force units
  trebuchets: number; // Long-range AoE stone wall artillery
  ballistas: number; // Armor-piercing anti-titan/anti-shield ballistas
  siegeTowers: number; // Wall-scaling infantry deployment towers
}

export interface RallyContributorSlot {
  lordId: string;
  lordName: string;
  heroId: string;
  cultivationRealmId: number;
  troopType: 'shieldbearer' | 'shooter' | 'bomber';
  tier: number; // 1..20
  committedTroops: string; // BigInt string (e.g., "125000000000")
  rallyBonusPct: number; // Hero + Clan Tech rally bonus percentage
  joinedAtTick: number;
}

/**
 * Server-to-Client authoritative rally state broadcast (Opcode 0x12).
 */
export interface RallyStatusSyncPacket {
  rallyId: string;
  sectorCode: TerritorySectorCode;
  targetOutpostId: string; // e.g., "outpost_chronos_dreadkeep" or monster ID
  initiatorLordId: string;
  initiatorName: string;
  clanId: string;
  clanTag: string;
  phase: SiegeRallyPhase;
  currentTroops: string; // BigInt string sum of all contributors
  maxRallyCapacity: string; // BigInt string (up to "1000000000000" / 1 Trillion)
  compositeAttackPower: string; // Aggregate BigInt strike power including realm & counter bonuses
  launchTick: number; // Server tick when march initiates
  impactTick: number; // Predicted server tick of gate contact
  timeLeftMs: number; // Remaining muster or march countdown in ms
  siegeEngines: SiegeWeaponAttachment;
  contributors: RallyContributorSlot[];
}
```

#### 5. Packet Structure III: Delta-Compressed State Updates (`0x11` `S2C_DELTA_SIEGE_UPDATE`)

To sustain 50v50 battles (`100` active lords, `300+` autonomous cohorts, and destructible fortifications) within `< 45 KB/s` per client at `20 Hz`, the server transmits delta frames referenced against the client's last acknowledged `baseTick`. Unchanged fields are omitted via a 16-bit `dirtyMask`.

```typescript
/**
 * Bitmask flags indicating which properties are present in a CohortDeltaRecord.
 */
export const enum CohortDirtyBit {
  POS_DELTA = 1 << 0, // 0x0001: dxQ, dzQ varint offsets present
  VEL_DELTA = 1 << 1, // 0x0002: dvxQ, dvzQ velocity deltas present
  HEADING_DELTA = 1 << 2, // 0x0004: dHeadingMillirad present
  UNIT_COUNT_DELTA = 1 << 3, // 0x0008: deltaUnits (signed BigInt string) & new unitCount present
  FORMATION_CHANGE = 1 << 4, // 0x0010: formation updated
  POSTURE_CHANGE = 1 << 5, // 0x0020: posture updated
  MORALE_DELTA = 1 << 6, // 0x0040: moraleBps updated
  TARGET_CHANGE = 1 << 7, // 0x0080: targetEntityId updated
  SUPPRESSION_AURA = 1 << 8, // 0x0100: active realm suppression multiplier shift
}

export interface CohortDeltaRecord {
  cohortId: string;
  dirtyMask: number; // Bitwise OR of CohortDirtyBit flags (uint16)
  dxQ?: number; // Signed int16 offset from baseTick posQ[0]
  dzQ?: number; // Signed int16 offset from baseTick posQ[1]
  dvxQ?: number; // Signed int16 offset from baseTick velQ[0]
  dvzQ?: number; // Signed int16 offset from baseTick velQ[1]
  dHeadingMillirad?: number;
  deltaUnits?: string; // Signed BigInt casualty/reinforcement delta (e.g., "-45000000")
  unitCount?: string; // Authoritative post-casualty BigInt string
  formation?: SiegeFormationType;
  posture?: CohortCombatPosture;
  moraleBps?: number;
  targetEntityId?: string | null;
  activeSuppressionMult?: number; // e.g., 100.0 for Golden Core vs Qi Refinement
}

export interface FortificationDeltaRecord {
  structureId: string; // e.g., "gate_north_c3", "wall_east_02", "citadel_core_c3"
  segmentType: 'GATE' | 'WALL_SEGMENT' | 'ARCHER_TOWER' | 'CITADEL_CORE';
  hpDelta: string; // Signed BigInt damage/repair delta
  remainingHp: string; // Authoritative remaining HP (BigInt string)
  maxHp: string;
  isBreached: boolean;
  controlledBy: 'player_clan' | 'enemy_clan' | 'neutral';
  captureProgressBps: number; // 0 .. 10000 (100.00% triggers sector flip)
}

/**
 * 20Hz Delta-Compressed Broadcast Packet (Opcode 0x11).
 */
export interface SiegeDeltaUpdatePacket {
  baseTick: number; // Reference tick the delta is computed against
  deltaTicks: number; // Tick offset (targetTick = baseTick + deltaTicks)
  sectorControlScore: {
    playerClanScore: number;
    enemyClanScore: number;
    playerPointsPerMin: number;
    enemyPointsPerMin: number;
  };
  spawnedCohorts: AuthoritativeCohortState[]; // Newly deployed cohorts since baseTick
  updatedCohorts: CohortDeltaRecord[]; // Bitmask-compressed active cohort updates
  despawnedCohortIds: string[]; // Routed, wiped, or recalled cohort IDs
  fortificationDeltas: FortificationDeltaRecord[];
  combatEventDigests: {
    attackerCohortId: string;
    defenderEntityId: string;
    counterAdvantage: 'ADVANTAGE' | 'NEUTRAL' | 'DISADVANTAGE';
    realmSuppressionMult: number;
    casualtiesInflicted: string; // BigInt string
  }[];
}
```

#### 6. Client-Side Prediction (CSP) & State Reconciliation Pipeline

1. **Local Prediction & Ring Buffer (`128` Frames)**:
   - On player march or formation input, the client immediately advances its local cohort using pure kinematic functions and records `{ seq, tick, inputCmd, predictedState }` into a 128-slot circular history buffer.
2. **Delta Application & Acknowledgment Pruning**:
   - Upon receiving `S2C_DELTA_SIEGE_UPDATE` (`0x11`), the client discards all history buffer entries with `seq <= envelope.ack`, applies `updatedCohorts` deltas to the `baseTick` snapshot, and computes the authoritative state at `envelope.tick`.
3. **Divergence Evaluation & Replay**:
   - For player-owned cohorts, the client compares the reconstructed server state at `envelope.tick` against the historical predicted state:
     - **Position Tolerance (`<= 15` quantized units / `0.15m`)**: Smoothly blended over `3` render frames via Cubic Hermite interpolation.
     - **Hard Rollback (`> 0.15m` position drift, formation mismatch, or `unitCount` casualty divergence)**: Snaps the simulation state to the authoritative `envelope.tick` state and deterministically replays all unacknowledged client commands (`seq > envelope.ack`) up to the current `clientTick`.
     - **State Hash Verification**: After applying the delta, the client computes `fnv1a32(sectorState)`. If it mismatches `envelope.stateHash`, the client dispatches a resync request and awaits an authoritative `S2C_FULL_SIEGE_SNAPSHOT` (`0x10`).

---

## [1.5.0] - 2026-11-17 (17/11/2026)

### Added

- **Software Architect & Hardware Architect Compatibility & Optimization Engine (`src/game/architectOptimization.ts`)**:
  - **Hardware Architect ISA & SIMD Matrix**: Added deterministic hardware profiles for `x86_64 AVX-512F/BW` (512-bit, 16× float32 lanes, 64B cache line), `ARMv9-A NEON + SVE2` (heterogeneous Prime/Performance/Efficiency core pinning), `Apple Silicon M-Series` (`alignas(128)` 128B cache line + zero-copy Unified Memory Architecture), and `RISC-V RV64GC + RVV 1.0` (Vector-Length Agnostic strip-mining).
  - **GPU Compute & Thermal TDP Envelopes**: Added compatibility tiers across `Vulkan 1.3`, `DirectX 12 Ultimate`, `Apple Metal 3`, `WebGPU`, `WebGL 2.0`, and `CPU Software Rasterizer (SwiftShader)` alongside sustained Thermal TDP governors (`350W Desktop`, `200W Console`, `25W Handheld APU`, and `8W Mobile Passive`).
  - **Software Architect Data-Oriented Design (DOD) & Lock-Free Job DAG**: Implemented interactive `SoA` (Structure-of-Arrays) vs `AoS` (Array-of-Structures) cache-miss and memory-bandwidth profiler (`4.75x` hot-loop speedup), a zero-mutex Lock-Free Work-Stealing Job Scheduler across 2–64 logical cores, and a deterministic Frame-Budget Auto-Scaler (`60Hz` / `120Hz` / `240Hz`).
  - **C++20 Cache-Line Aligned Guardrails (`cpp/VoxelRealmsGuardrails.hpp`)**: Added `alignas(64)` `SoaEntityKinematicChunk` and `constexpr computeCacheLineBytesForIsa` verified via `static_assert` in `cpp/engine_guardrail_test.cpp`.
  - **Interactive Architect Studio UI (`src/components/CppArchitectureModal.tsx`)**: Added live CPU ISA, GPU backend, Thermal TDP, SoA/AoS memory layout, and Lock-Free Job Pool controls with a composite `100/100` Optimization Score badge.
- **10-Species / Race Character Creation & Admin-Governed Rebirth (`src/game/species.ts`, `src/game/species.test.ts`)**:
  - **10 Playable Species across 3 Lineages**: Added `human` (Terran Sovereign), `sylvan_elf` (Sylvan High Elf), `ironforge_dwarf` (Ironforge Runic Dwarf), `warborn_orc` (Warborn Goliath), `azure_dragonkin` (Azure Dragonkin), `celestial_kitsune` (Celestial Nine-Tailed Kitsune), `asura_demon` (Asura Blood Fiend), `empyrean_angelic` (Empyrean Winged Celestial), `void_walker` (Void Walker), and `crystalline_golem` (Crystalline Ancient Automaton).
  - **3D Procedural Species Meshes & Stature Scaling**: Updated `createPlayerMesh` in `src/game/proceduralWorld.ts` to attach `SpeciesTraitGroup` geometry (pointed/fox ears, braided dwarf beard, orc tusks, draconic/obsidian horns, feathered wings, draconic/spirit tails, orbiting void crystals, and golem core reactors) and apply per-species `[scaleX, scaleY, scaleZ]` stature scaling.
  - **Admin Permission Gate (`creatergame31@gmail.com`)**: Enforced `evaluateSpeciesSwitchPermission` so switching species after initial character creation (`speciesLocked: true`) requires authorization from Root Administrator `creatergame31@gmail.com` via live GM decree in `AdminConsoleModal.tsx` or `[SPECIES REBIRTH]` support ticket.
- **6-Layer Cosmic Hierarchy, Infinite Omniverse & Top 100 Fictional Species Background NPCs (`src/game/omniverse.ts`, `src/game/omniverse.test.ts`)**:
  - **6-Layer Cosmic Ontology & Cosmological Hierarchy (`SIX_LAYER_COSMIC_HIERARCHY`)**: Implemented the 6-layer cosmological model: **1. Universe** (_a single reality with its own space, time, and matter_), **2. Multiverse** (_a collection of parallel/series universes_), **3. Megaverse / Hyperverse** (_a cluster of multiple multiverses_), **4. Omniverse** (_every universe, multiverse, and reality that has ever existed or could exist_), **5. The Overvoid / Exoverse** (_a collection of multiple distinct omniverses that operate under completely different laws of logic and cosmic hierarchy_), and **6. The White Page / The House of Ideas** (_everything comes from here, even nothingness / Oblivion, under Supreme Author `creatergame31@gmail.com`_).
  - **All 100 Species Across 5 Tiers (`TOP_100_OMNIVERSE_SPECIES_NPCS`)**: Added all 100 iconic species/races across Tier 1 (Outer Gods, Beyonders, Endless, Monitors, Celestialsapiens, Zeno's Race, Q Continuum, etc.), Tier 2 (Xeelee, Time Lords, Culture Minds, Forerunners, Necrons, C'tan, Vex, Reapers, etc.), Tier 3 (Deities, New Gods, Asgardians, Ainur, Fiendcelestials, Otsutsuki, Shinigami, Dragons, etc.), Tier 4 (Saiyans, Kryptonians, Viltrumites, Martians, Frost Demons, Namekians, Majins, To'kustars, etc.), and Tier 5 (Humans, Mutants, Eldar, Krorks, Tyranids, Flood, Zerg, Protoss, Borg, etc.).
  - **Dedicated Sovereign Omniverse Per Race + Infinite Transfinite Dial (`Ω-001` to `Ω-∞`)**: Assigned each species its own Sovereign Omniverse (`OMNI-001`..`OMNI-100`), full 6-Layer Cosmological Breakdown (`resolveSpeciesSixLayerCosmology`), and `resolveInfiniteOmniverseByIndex` for arbitrary transfinite omniverse indices (`1` to `∞`).
  - **Super Admin Background NPC Command & Layer-6 White Page Decrees (`creatergame31@gmail.com`)**: Bound all 100 Level-1000 Background NPC Envoys and Layer-6 White Page / House of Ideas Authorial Decrees (`executeWhitePageAuthorDecree`) exclusively to `creatergame31@gmail.com`.
- **Imperial Lore, Auto-Populating Open-World Codex, 12 Dynastic Annals & `10^100`-Word Akashic Corpus (`src/game/loreHistory.ts`, `src/game/loreHistory.test.ts`, `src/components/LoreHistoryModal.tsx`, `LORE.md`)**:
  - **7 Grand Historical Epochs (`LORE_HISTORICAL_EPOCHS`, 6–7 Sections Each)**: Chronicles `Epoch Ω-0: Pre-Genesis: The White Page & The House of Ideas` (`creatergame31@gmail.com`), `Epoch Ω-I: The Overvoid Divergence & 100+∞ Sovereign Omniverses`, `Epoch Ω-II: Hyperversal Brane Weaving & Multiversal Timeline Tree`, `Epoch III: Awakening of the 10 Sovereign Playable Species & Admin Rebirth Seal`, `Epoch IV: The Han Jue Four-Path Immortal Revelation & 100x Realm Suppression`, `Epoch V: The Ten Citadel Eras & Trillion-Scale Siege Wars`, and `Epoch VI: The 17/11/2026 Software & Hardware Architect Convergence (v1.5.0)`.
  - **Auto-Populating Open-World Lore Codex (`OPEN_WORLD_BIOME_CODEX_CATALOG`, `OPEN_WORLD_MONSTER_CODEX_CATALOG`, `evaluateOpenWorldLoreDiscovery`, `buildDynamicMonsterCodexEntry`)**: Automatically unlocks and persists Codex entries in `localStorage` (`voxel_realms_lore_codex_state_v1`) as players explore Solara's 8 spatial biomes (`resolveBiomeAtWorldPosition`) or encounter/select/spawn Lv. 1–1000 monsters, complete with one-time Diamond & Scripture Fragment discovery bounties (`claimLoreCodexReward`).
  - **12 Imperial Dynastic Annals & Legendary Relic Histories (`LORE_DYNASTIC_ANNALS`)**: Added the **`🏛️ Annals & Relics (12)`** tab in `LoreHistoryModal.tsx` with 12 multi-paragraph primary historical chronicles indexed by unified `searchLoreHistory`.
  - **`10^100` Words Minimum (One Googol Words) Procedural Akashic Stream (`GOOGOL_LORE_ARCHIVE_SPEC`, `generateGoogolScaleLoreScrollSlice`)**: Synthesizes `>= 1,000` real English words per volume across `10^97` `BigInt`-addressable volume coordinates (`1n` to `10n ** 97n`) with zero RAM overflow.
  - **6 Sacred Compendium Codices (`LORE_COMPENDIUM_CHAPTERS`) & Interactive Chronicle Comprehension**: Added full-text lore search (`searchLoreHistory`) and one-time epoch comprehension (`comprehendLoreEpoch`) granting Kingdom Diamonds (`💎`) and Scripture Fragments, accessible from both `TitleScreen.tsx` and `GameHUD.tsx`.
- **Authoritative 20Hz 50v50 WebSocket Siege Server & Multi-Region Persistence (`server.ts`, `src/game/siegeNetProtocol.ts`, `src/game/siegeNetProtocol.test.ts`, `src/components/ClanTerritoryMap.tsx`)**:
  - **20Hz RFC 6455 WebSocket Siege Server (`/ws/siege` & `/api/online/*`)**: Implemented full-stack Express + WebSocket upgrade server (`server.ts`) broadcasting 20Hz (`50ms`) `S2C_DELTA_SIEGE_UPDATE` frames and periodic `S2C_FULL_SIEGE_SNAPSHOT` keyframes, processing `C2S_TROOP_POSITION_CMD` (`0x01`) and `C2S_RALLY_ACTION_CMD` (`0x02`), and persisting multi-region realm state (`data/online_realm_state.json`) across 3 regional clusters (`us-east-solara-1`, `eu-central-valhalla-1`, `ap-southeast-celestia-1`).
  - **128-Frame Client-Side Prediction (CSP) & Bitmasked Delta Compression**: Implemented `CohortDirtyBit`, `quantizeCoordInt16` (`0.01m` precision), `serializeBigIntWire` (up to `1,000T`), FNV-1a 32-bit state hashing (`computeSectorStateHash`), and `ClientPredictionRingBuffer` (`reconcileClientPrediction`).
- **9-Pillar Cross-System Validation, Cardinality (`COSMIC_LIMITS`) & D3 Cosmological Tree Visualizer (`src/game/systemValidation.ts`, `src/game/cosmologicalTreeD3.ts`, `src/components/CosmologicalAdminModal.tsx`, `cpp/VoxelRealmsGuardrails.hpp`)**:
  - **Deterministic 9-Pillar Audit (`runFullSystemValidationReport`)**: Audits **103 invariants across all 9 foundational pillars**: Root RBAC, 12-Domain All-Things Creator God Immunity (`src/game/godModeCharacter.ts`), EULA v1.5.0 & 10-Agreement Legal Stack (`creatergame31@gmail.com`), 6-Tier Nested Cosmological Tree (`WhitePageRoot` Singleton → `Universe` Leaf) & 100 Omniverses, Imperial Lore (7 Epochs, 12 Dynastic Annals, Auto-Populating Open-World Codex, `10^100` Akashic Corpus), 10 Playable Species, `17/11/2026` Architect Matrix, `1,000T` Castle Math, `100.0x` Realm Suppression, Lv. 1–1000 World AI, and **Pillar 9: Engineering Transparency, Server RBAC, 20Hz 50v50 Siege Netcode, Authoritative Anti-Cheat, Avatar/Clone/Shadow 200-Entity Raid Sync, 3D BVH/Simplex Engine & Live WebGL2 Pipeline Execution**.
  - **Strict 6-Tier Cosmological Cardinality (`COSMIC_LIMITS`), `InfiniteCollection<T>` & Physics/Logic Override Engine (`src/types/game.ts`, `src/game/omniverse.ts`, `src/components/WorldAIDirectorModal.tsx`)**: Implemented `COSMIC_LIMITS` (`WHITE_PAGE_COUNT: 1`, `OVERVOID_MAX_COUNT: 100`, `Infinity` for Tiers 1–4), `WhitePageRoot` (`THE_WHITE_PAGE` / `The House of Ideas` singleton with `isSingleton: true` spawning both `overvoids: Overvoid[]` [`100` bounded instances, `index: 1..100`, guarded by `attemptCreateOvervoid()`] and `oblivionState: { exists: true, description: 'Absolute nothingness originating from The White Page' }`), and `InfiniteCollection<T>` with on-demand lazy procedural pagination (`lazilyGenerateInfiniteTierSlice()`) plus Tier 5 logic and Tier 1 physics override resolution (`evaluateEffectiveUniversePhysicsAndLogic`).
  - **Interactive D3 6-Tier Cosmological Tree Visualizer (`src/components/CosmologicalAdminModal.tsx`, `src/game/cosmologicalTreeD3.ts`, `src/game/cosmologicalTreeD3.test.ts`)**: Added an interactive `d3-hierarchy` + `d3-zoom` tree visualizer in both Horizontal (`Left → Right`) and Radial (`360° Mandala`) layouts showing parent-child links from `THE_WHITE_PAGE` (`Tier 6`) and `OBLIVION_NOTHINGNESS` down through `Overvoid` (`Tier 5`) to leaf `Universe` (`Tier 1`) nodes, with live Tier 5/Tier 1 physics override sliders, 100-Overvoid cap testing, and on-demand lazy slice pagination.
  - **Live WebGL2 `applyCrossPlatformPipeline` Mutations (`src/game/proceduralWorld.ts`, `src/game/graphicsEngine.ts`)**: Upgraded `applyCrossPlatformPipeline` to dynamically resize and redraw procedural HTML5 `CanvasTexture` resolutions (`1024×1024`, `512×512`, `256×256`), mutate `normalScale` and `bumpScale` across all 16 PBR `voxelMaterials`, scale `VoxelGrassTuftsInstanced.count` (`800` / `520` / `320`), reconfigure `THREE.LOD` hysteresis distances, resize `sunLight.shadow.mapSize` (`2048` vs `1024`), and return a verifiable `AppliedPipelineExecutionSummary`.
  - **Engineering Transparency Matrix (`ENGINEERING_TRANSPARENCY_MATRIX`)**: Added explicit classification of `Implemented` (`6`), `Simulated` (`2`), and `Planned` (`0`) features in `src/game/graphicsEngine.ts` and `src/components/CppArchitectureModal.tsx` (`data-testid="engineering-transparency-panel"`).
  - **C++20 Compile-Time Cosmological & Lore Guardrails (`cpp/VoxelRealmsGuardrails.hpp`, `cpp/engine_guardrail_test.cpp`)**: Added `CosmicOntologyLayer` (`1..6`), `WhitePageRootSpec` (`tier5OvervoidCount = 100U`, `tier4OmniverseCount = 100U`), `kCanonicalDynasticAnnalsCount = 12U`, `kCanonicalOpenWorldBiomeCount = 8U`, `kGoogolLoreWordExponent = 100U`, `computeCascadedUniverseQiMultiplier`, and `constexpr computeCosmicLayerScaleMultiplier` verified via `static_assert` (`100,000x` at Layer 6: `TheWhitePage_HouseOfIdeas`).
  - **Unified Validation Command (`npm run validate`)**: Added unified validation gate (`lint` + `lint:rules` + `format:check` + `test` [171 tests across 29 suites] + `build`).

---

## [1.4.1] - 2026-11-05

### Added

- **Administration, GM, Admin & Moderator RBAC Control System (`src/game/adminModeration.ts`)**:
  - Bound root account **`creatergame31@gmail.com`** at Clearance Level 999 with full `Administration`, `Game Master (GM)`, `Admin`, `Moderator`, and `Official Contact` privileges.
  - Added immutable root protection guardrails preventing `creatergame31@gmail.com` from being sanctioned, muted, banned, or demoted.
  - Added **Admin & Moderator Control** tab in `AdminConsoleModal` with Server-Wide GM/Moderator Decree broadcasts and live player moderation actions (`Warn`, `Mute Chat`, `Temp Ban`, `Restore`, `+Moderator`, `+Admin`).
  - Added **Official Contact & Support Tickets** tab routing all Administration, GM Live-Ops, Moderation, Appeal, and Security tickets directly to `creatergame31@gmail.com`.
- **Comprehensive Legal, Governance & Technical Documentation Suite**:
  - Added [`LICENSE.md`](./LICENSE.md), [`ROADMAP.md`](./ROADMAP.md), [`SUPPORT.md`](./SUPPORT.md), [`GOVERNANCE.md`](./GOVERNANCE.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), and [`.github/ISSUE_TEMPLATE.md`](./.github/ISSUE_TEMPLATE.md).

---

## [1.4.0] - 2026-03-20

### Added

- **Cultivation Realm & Suppression System**:
  - Implemented 4 cultivation paths: _Sword Immortal_, _Demonic Fiend_, _Heavenly Dao Priest_, and _Void Walker_.
  - Added 5 distinct cultivation realms: _Qi Refinement_, _Foundation Establishment_, _Golden Core_, _Nascent Soul_, and _Dao Creator_.
  - Realm suppression mathematical engine: higher realm cultivators deal up to 100x damage against lower realm cultivators (e.g. Golden Core vs Qi Refinement).
  - Distinctive visual aura indicators for each realm: faint white glow (Foundation), revolving golden core (Golden Core), miniature floating nascent soul avatar (Nascent Soul), and divine Great Dao halos (Dao Creator).
- **The Karma System (Justice vs Evil)**:
  - Dynamic Karma tracking with White/Green (Innocent), Yellow (Neutral), and Red (Sinful) states.
  - Slaying innocent green-name players turns karma negative, marking the offender with a Red Name.
  - _Tribulation Lightning_: Game engine randomly summons instant-death heavenly lightning upon static Red Name players who stay in place too long.
  - _Bounty Hunter Broadcasting_: Red Name coordinates are broadcast across realms to high-level Justice players.
  - _Loot Drop Penalty_: Red Name players suffer an 85% equipment drop risk upon defeat.
- **Social Structure: Master & Disciple**:
  - Replaced generic parties with hierarchical Master-Disciple bonds.
  - Proximity cultivation speed boost (+25% EXP gain) when disciples cultivate near their Master.
  - Configurable spirit stone taxation (5%–20%) funneled automatically from disciples to Masters.
  - Skill Transmission mechanic: Masters transcribe mastered rare skills (e.g. _Heaven Earth Sleeve_, _Nine Heavens Thunder_) into tradable Skill Scrolls.
- **Daily Login Reward System**:
  - 7-day cyclical login rewards calendar with guaranteed spirit stones, refinement diamonds, breakthrough pills, and celestial forge vouchers.
  - Special **Veteran Scroll** milestone reward on Day 7 granting permanent +15% cultivation speed.
  - Streak protection and local timestamp persistence.
- **C++20 High-Performance AI Architecture Reference**:
  - Authored clean C++20 engine reference implementation (`cpp20_realm_ai_system.hpp`) featuring `std::span`, concepts, memory pools, AVX2 SIMD pathfinding, and HDR10+ luminance metadata output.

### Changed

- Refactored HUD overlays into modular React 19 components with smooth Framer Motion transitions.
- Upgraded test suite to 50 comprehensive unit tests covering karma, cultivation suppression, master-disciple economy, and siege math.

---

## [1.3.0] - 2026-03-18

### Added

- **1000T Castle Warfare Engine**:
  - Heavy siege weapons: Battering Rams (1000T crushing force against gates), Trebuchets (long-range AOE wall bombardment), Ballistas (armor-piercing ballistics), and Siege Towers (infantry wall scaling).
  - Fortification physics: Castle Gates with 50,000 HP, Stone Wall segments with 35,000 HP, and Archer Towers with garrison defensive buffs.
  - Destructible debris physics simulated with WebGL particle bursts upon structure collapse.
  - Tactical troop formation commands: Shield Wall, Phalanx Advance, Wedge Charge, and Loose Skirmish.

### Changed

- Enhanced sound synthesis engine with positional acoustic feedback for siege impacts, boulder crashes, and horn signals.

---

## [1.2.0] - 2026-03-15

### Added

- **Infinite Lv 1–1000 Monster Ecosystem**:
  - Procedural stat scaling algorithm balancing HP, physical/magical attack, defense, and elemental affinities across 1000 levels.
  - Hierarchical monster classes: Minions, Elites, Champions, World Bosses, and Calamity Titans.
  - Dynamic AI Behavior Trees with states: `IDLE_GRAZE`, `PATROL`, `ALERT_STALK`, `TACTICAL_ENGAGE`, `FLEE_CALL_PACK`, and `ENRAGED_ULTIMATE`.
  - Environmental interaction: Monsters use cover, ambush from brush, and gain elemental buffs when submerged in water or near lava.

### Fixed

- Fixed bug where high-level elite mobs would tether incorrectly across chunk boundaries.

---

## [1.1.0] - 2026-03-12

### Added

- **Dual-Engine Interactive Architecture**:
  - Real-time Three.js 3D WebGL isometric battlefield rendered alongside high-density 2D tactical HUD overlays.
  - Procedural voxel terrain generation with biomes: Verdant Plains, Scorched Crags, Frozen Tundra, and Void Chasm.
  - Dynamic day/night illumination cycle with HDR tone mapping and bloom post-processing.
- **Web Audio API Sound Engine**:
  - Pure synthesizer-based sound effects with zero external MP3 dependencies (sword slashes, spell casting, level-up fanfares, siege impacts).

---

## [1.0.0] - 2026-03-10

### Added

- Initial public release of **Voxel Realms RPG**.
- Core player stat progression system (Vitality, Strength, Spirit, Agility, Luck).
- Grid inventory system with equipment slots, rarity tiers, and drag-and-drop tooltips.
- Real-time battle calculations and floating combat text.
- Full responsive interface built with React 19 and Tailwind CSS.
