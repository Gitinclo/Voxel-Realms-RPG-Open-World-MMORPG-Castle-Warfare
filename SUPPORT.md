# 🛟 Support & Technical Guidance (`SUPPORT.md`)

Welcome to the official support guide for **Voxel Realms RPG: Open World MMORPG & Castle Warfare**. Whether you are a player encountering an in-game issue or a developer building and testing the codebase, this document explains how to get fast, effective help.

---

## 📬 1. Official Administration, GM & Moderator Contact Channels

All official executive administration, Game Master (GM) live-world interventions, community moderation reports, account appeals, and security/privacy inquiries are managed centrally by our Root Administration & GM Desk:

📧 **Primary Official Email:** **[creatergame31@gmail.com](mailto:creatergame31@gmail.com)**

| Support Department         | Role / Clearance        | Subject Line Prefix                 | Target SLA   | When to Use                                                                                                                 |
| :------------------------- | :---------------------- | :---------------------------------- | :----------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **Supreme Administration** | Administration / Owner  | `[ADMINISTRATION] Voxel Realms RPG` | **24 Hours** | Account ownership, VIP billing inquiries, governance, and partnerships                                                      |
| **Game Master (GM) Ops**   | Game Master (GM)        | `[GM CONTROL] Voxel Realms RPG`     | **12 Hours** | Stuck cultivation breakthroughs, `[SPECIES REBIRTH]` race switch decrees, world boss loot sync, or castle era recovery      |
| **Community Moderation**   | Admin / Moderator       | `[MODERATOR] Voxel Realms RPG`      | **4 Hours**  | Reporting chat harassment, griefing, clan emblem violations, or conduct abuse                                               |
| **Sanction & Ban Appeals** | Admin / Appeals         | `[APPEAL] Voxel Realms RPG`         | **48 Hours** | Appealing temporary bans, chat mutes, or account warnings                                                                   |
| **Security & Privacy**     | Security / GDPR Officer | `[SECURITY]` or `[PRIVACY]`         | **48 Hours** | Private vulnerability disclosure ([`SECURITY.md`](./SECURITY.md)) or GDPR/CCPA data requests ([`PRIVACY.md`](./PRIVACY.md)) |

### In-App Support & Ticket Dispatch

You can also submit and track tickets directly inside the running game:

1. Click the **`GM · MOD`** badge in the top Lord HUD (or press the `` ` `` / `~` key) to open the **Administration, GM & Moderator Control Center**.
2. Select the **`Official Contact & Tickets`** tab.
3. Choose the target department, enter your subject and details, and click **`Dispatch to creatergame31@gmail.com`**.

---

## 📚 2. Self-Service Documentation & Technical Guides

Before opening a ticket or GitHub issue, check our comprehensive documentation suite:

- **[`README.md`](./README.md)** — Quickstart guide, installation, npm scripts, and feature overview.
- **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** — Deep-dive into the React 19 + Three.js WebGL2 engine, `BigInt` trillion-scale math, A\* pathfinding, and C++20 SIMD guardrails.
- **[`ROADMAP.md`](./ROADMAP.md)** — Upcoming milestones (`v1.5.0` WebSocket 50v50 sieges, `v1.6.0` Secret Realms, `v1.7.0` WebGPU compute).
- **[`CONTRIBUTING.md`](./CONTRIBUTING.md)** — Developer setup, coding standards, and Pull Request workflow.
- **[`GOVERNANCE.md`](./GOVERNANCE.md)** — Project roles, RBAC clearance hierarchy, and RFC decision-making process.
- **[`CHANGELOG.md`](./CHANGELOG.md)** — Version history and technical release notes.

---

## 🔧 3. Common Troubleshooting & FAQ

### Q1: My Daily Login streak or VIP Subscription state needs to be reset locally.

Game state is persisted in your browser's `localStorage` under deterministic keys (`voxel_realms_daily_login_v1`, `voxel_realms_vip_subscription_v1`, `voxel_rpg_sound_muted`).

- **Fix:** Clear site data in your browser DevTools (`Application -> Local Storage`) or use the **GM / Admin Console** (`Godmode & Cheats` tab) to restore castle levels, resources, and troop cohorts immediately.

### Q2: 3D WebGL framerate feels slow on a laptop or virtual machine without a dedicated GPU.

- **Fix:** Click the **Settings (Gear)** icon in the top-right World Status bar and cycle the **Graphics Quality** button to **`BALANCED (60 FPS · 78K POLY)`** or toggle **Platform Override** to **`MOBILE [ASTC · LOD BIAS +1]`**. The engine automatically detects software WebGL renderers (SwiftShader / Mesa) and disables heavy post-processing passes.

### Q3: Running unit tests with `node --test` fails on TypeScript imports.

- **Fix:** Always run tests via `npm test` (which invokes `tsx --test src/game/*.test.ts`) or `npx --yes tsx --test <file>`. Node's built-in type stripper does not resolve extensionless TypeScript imports.

### Q4: How do I switch my character's Species after initial creation or command the 100 Omniverse Background NPCs?

- **Species Rebirth:** Switching among the 10 playable species after character creation requires authorization from Root Administrator **`creatergame31@gmail.com`** via the **GM / Admin Console (`Godmode & Cheats` → `10-Species / Race Rebirth Governance`)** or by dispatching a `[SPECIES REBIRTH]` ticket.
- **6-Layer Cosmology & 100 Omniverse NPCs:** Open the **World AI Director (`🌌 Infinite Omniverse & 100 Species NPCs`)** or **GM / Admin Console** while authenticated as **`creatergame31@gmail.com`** to inspect all 6 Cosmic Layers (**1. Universe** → **6. The White Page / The House of Ideas**), project/recall any of the 100 Species Background NPCs in the 3D Overworld, or issue Layer-6 White Page Authorial Decrees.

---

## 🐛 4. Filing Bug Reports & Feature Requests on GitHub

- **Bug Reports:** Use the **[`.github/ISSUE_TEMPLATE.md`](./.github/ISSUE_TEMPLATE.md)** or **[`.github/ISSUE_TEMPLATE/bug_report.md`](./.github/ISSUE_TEMPLATE/bug_report.md)** form. Include your OS, browser, graphics preset (`Ultra` / `High` / `Balanced`), console output, and exact reproduction steps.
- **Feature Requests:** Use **[`.github/ISSUE_TEMPLATE/feature_request.md`](./.github/ISSUE_TEMPLATE/feature_request.md)** to propose gameplay or engine enhancements.
- **Security Vulnerabilities:** **Never** open a public GitHub issue for security bugs. Follow [`SECURITY.md`](./SECURITY.md) and email **[creatergame31@gmail.com](mailto:creatergame31@gmail.com)** privately.
