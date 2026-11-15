# ⚖️ Complete Legal Agreements, Policies & Compliance Stack (`LEGAL.md`)

**Effective Date & Last Updated:** November 15, 2026 (`15/11/2026`)  
**Document Stack Version:** `v1.5.0-2026-11-15`  
**Service Provider / Licensor / Data Controller:** Voxel Realms RPG Studio & Sovereign Root Administrator (**[creatergame31@gmail.com](mailto:creatergame31@gmail.com)**)

---

## 1. Product Architecture & Legal Stack Determination

Because **Voxel Realms RPG: Open World MMORPG & Castle Warfare** combines **(A) an installable/downloadable 3D video game client** (Desktop PC/Console & Mobile/Android), **(B) a cloud-hosted real-time web platform** (`20Hz` `/ws/siege` WebSocket multiplayer & `/api/*` backend), **(C) personal user data & cloud persistence** (Firebase Authentication, Cloud SQL PostgreSQL, Cloud Firestore, and optional Google Workspace Gmail OAuth), and **(D) recurring digital subscriptions & virtual goods** (VIP Member Covenant Tiers 0–3 & Kingdom Diamonds), it utilizes a **10-document legal and compliance stack** organized into three tiers:

| Legal Tier                                | Agreement / Policy                            | Canonical File / Section                                                                      | Primary Focus                                                              | Typical Context & Application in Voxel Realms RPG                                                           |
| :---------------------------------------- | :-------------------------------------------- | :-------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| **I. Core User & Website Agreements**     | **1. Terms of Service (ToS)**                 | [`TERMS.md`](./TERMS.md)                                                                      | General rules for platform access, accounts, payments & conduct            | Governs web platform access, user accounts, virtual goods, VIP billing, and dispute resolution.             |
| **I. Core User & Website Agreements**     | **2. Privacy Policy**                         | [`PRIVACY.md`](./PRIVACY.md)                                                                  | Personal data collection, storage, sharing & user rights                   | Complies with **GDPR** (EU/UK), **CCPA/CPRA** (California), and **India's DPDP Act (2023)**.                |
| **I. Core User & Website Agreements**     | **3. Cookie & LocalStorage Policy**           | [`LEGAL.md §3`](#-3-cookie--localstorage-policy) & [`PRIVACY.md §6`](./PRIVACY.md)            | Active cookies, `localStorage` keys, purpose & opt-out controls            | Details `HttpOnly` session cookies (`voxel_session`) and deterministic `localStorage` state keys.           |
| **II. Software & Licensing Variations**   | **4. End User License Agreement (EULA)**      | [`EULA.md`](./EULA.md) (`EulaModal.tsx`)                                                      | Software installation, game client usage rights & anti-cheat consent       | Governs the 3D WebGL2/Desktop/Android game client, 20Hz siege rules, and cryptographic FNV-1a consent.      |
| **II. Software & Licensing Variations**   | **5. Software as a Service (SaaS) Agreement** | [`LEGAL.md §4`](#-4-software-as-a-service-saas--cloud-subscription-agreement)                 | Cloud software access, hosted multiplayer & VIP subscription terms         | Governs hosted Cloud Run / WebSocket realm access and recurring VIP Member Covenant (`Tiers 0–3`) passes.   |
| **II. Software & Licensing Variations**   | **6. Open-Source Software (OSS) License**     | [`LICENSE.md`](./LICENSE.md), [`LICENSE`](./LICENSE), [`NOTICE`](./NOTICE)                    | Source code inspection, modification, distribution & attribution           | **Apache License 2.0** governing the public TypeScript, React 19, Three.js, and C++20 repository code.      |
| **II. Software & Licensing Variations**   | **7. Acceptable Use Policy (AUP)**            | [`LEGAL.md §5`](#-5-acceptable-use-policy-aup) & [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) | Strictly prohibited network, cloud, anti-cheat & community actions         | Forbids packet replay, speed-hacks, API/WS flooding, CSRF/prototype pollution, and chat harassment.         |
| **III. Enterprise & Service Commitments** | **8. Service Level Agreement (SLA)**          | [`LEGAL.md §6`](#-6-service-level-agreement-sla) & [`SUPPORT.md`](./SUPPORT.md)               | Uptime guarantees, 20Hz tick benchmarks, support response times & remedies | Defines `99.5%` target uptime (`/healthz`, `/readyz`), `50ms` siege tick budgets, and `4h–48h` ticket SLAs. |
| **III. Enterprise & Service Commitments** | **9. Data Processing Agreement (DPA)**        | [`LEGAL.md §7`](#-7-data-processing-agreement-dpa--sub-processor-register)                    | Binding data controller / processor security & sub-processor registry      | Governs Cloud SQL (`ai-studio-416287a7`), Firebase/Firestore (`dev-ivy-6v0ns`), and volatile Gmail OAuth.   |
| **III. Enterprise & Service Commitments** | **10. Master Services Agreement (MSA)**       | [`LEGAL.md §8`](#-8-master-services-agreement-msa--enterprise-sow-framework)                  | Overarching B2B/enterprise contract & Statement of Work (SOW) terms        | Covers dedicated clan server clusters, sponsored esports tournaments, and custom commercial licensing.      |

---

## 📊 2. Quick Comparison Matrix

| Agreement Type                                                                                  | Primary Focus                                              | Typical Context                                        | Where Enforced in Codebase                                                |
| :---------------------------------------------------------------------------------------------- | :--------------------------------------------------------- | :----------------------------------------------------- | :------------------------------------------------------------------------ |
| **EULA** ([`EULA.md`](./EULA.md))                                                               | Software installation and game usage rights                | Desktop apps, mobile apps, video games                 | `src/game/eula.ts`, `src/components/EulaModal.tsx`                        |
| **Terms of Service** ([`TERMS.md`](./TERMS.md))                                                 | General rules for platform access and conduct              | Websites, social networks, e-commerce, online portals  | `server.ts`, `src/game/adminModeration.ts`                                |
| **SaaS Agreement** ([`§4 below`](#-4-software-as-a-service-saas--cloud-subscription-agreement)) | Cloud software access and subscription terms               | Web-based cloud apps, recurring VIP passes             | `src/game/vipSubscription.ts`, `/api/db/*`, `/ws/siege`                   |
| **SLA** ([`§6 below`](#-6-service-level-agreement-sla))                                         | Uptime guarantees and support benchmarks                   | Enterprise software, cloud hosting, live-ops MMORPGs   | `server.ts` (`/healthz`, `/readyz`, `/api/ops/readiness`), `SUPPORT.md`   |
| **Privacy Policy** ([`PRIVACY.md`](./PRIVACY.md))                                               | Personal data collection and handling (GDPR / CCPA / DPDP) | Any app or website collecting user data                | `firestore.rules`, `src/db/schema.ts`, `src/contexts/AuthContext.tsx`     |
| **Cookie Policy** ([`§3 below`](#-3-cookie--localstorage-policy))                               | Tracking technologies, session cookies & `localStorage`    | Web platforms, authenticated SPAs                      | `src/game/serverAuth.ts` (`HttpOnly` cookie), `src/App.tsx`               |
| **OSS License** ([`LICENSE.md`](./LICENSE.md))                                                  | Public source code rights, patents & attribution           | Open-source repositories & SDKs                        | `LICENSE`, `LICENSE.md`, `NOTICE` (`Apache-2.0`)                          |
| **AUP** ([`§5 below`](#-5-acceptable-use-policy-aup))                                           | Prohibited network abuse, cheating & security exploits     | Cloud platforms, multiplayer game networks             | `src/game/antiCheat.ts`, `src/game/serverHardening.ts`                    |
| **DPA** ([`§7 below`](#-7-data-processing-agreement-dpa--sub-processor-register))               | Controller-to-processor data security & sub-processors     | Cloud databases, auth providers, enterprise customers  | `src/lib/firebase.ts`, `src/db/index.ts`, `security_spec.md`              |
| **MSA** ([`§8 below`](#-8-master-services-agreement-msa--enterprise-sow-framework))             | Overarching commercial terms & Statements of Work (SOW)    | B2B partnerships, custom realm hosting, esports events | Governed by **[creatergame31@gmail.com](mailto:creatergame31@gmail.com)** |

---

## 🍪 3. Cookie & LocalStorage Policy

This Cookie & LocalStorage Policy explains what browser storage mechanisms and cookies are active when you use **Voxel Realms RPG**, why they are used, and how you can control or opt out of them.

### 3.1 Strictly Necessary Cryptographic Cookies

| Cookie Name     | Type & Security Flags                                 | Expiration                                       | Purpose                                                                                                                                                           |
| :-------------- | :---------------------------------------------------- | :----------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `voxel_session` | `HttpOnly; SameSite=Lax; Path=/` (HMAC-SHA256 signed) | `24 Hours` (Player) / `8 Hours` (Staff Operator) | Authenticates your Commander session with `/api/online/*`, `/api/admin/*`, and `/ws/siege` while preventing client-side JavaScript (`document.cookie`) XSS theft. |

### 3.2 Deterministic Browser `localStorage` Keys

| Storage Key                        | Category           | Purpose & Data Stored                                                                                                        |
| :--------------------------------- | :----------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| `voxel_realms_eula_acceptance_v1`  | Legal Compliance   | Stores your accepted `EULA_VERSION` (`1.5.0-2026-11-15`), timestamp, email, and 32-bit FNV-1a receipt hash (`EULA-ACK-...`). |
| `voxel_realms_daily_login_v1`      | Gameplay State     | Tracks your 7-day consecutive login streak and Veteran Scroll comprehension progress.                                        |
| `voxel_realms_vip_subscription_v1` | Subscription State | Caches your local VIP Member Covenant tier (`0–3`), billing cycle, daily stipend claim date, and loyalty points.             |
| `voxel_realms_lore_codex_state_v1` | Gameplay State     | Persists unlocked Open-World Biome (`8`) and Monster (`Lv. 1–1000`) Lore Codex entries and claimed bounty flags.             |
| `voxel_realms_admin_moderation_v1` | Moderation Preview | Local sandbox preview cache for the GM/Moderation roster (`UNTRUSTED_CLIENT_PREVIEW`).                                       |
| `voxel_rpg_sound_muted`            | User Preference    | Remembers whether procedural Web Audio API sound synthesis is muted (`true`/`false`).                                        |

### 3.3 Volatile In-Memory Tokens (Never Stored in Cookies or `localStorage`)

- **Google Workspace Gmail OAuth Token (`workspaceAccessToken`)**: Held exclusively in volatile React memory (`src/contexts/AuthContext.tsx`) for the duration of your active browser tab and immediately discarded on tab close or sign-out.

### 3.4 How to Manage or Clear Cookies & LocalStorage

- You may revoke your EULA consent receipt at any time inside the **EULA Modal (`Reset / Revoke Consent`)**, sign out via `/api/auth/logout`, or clear all site cookies and `localStorage` via your browser's Developer Tools (`Application → Storage → Clear site data`).

---

## ☁️ 4. Software as a Service (SaaS) & Cloud Subscription Agreement

While the downloadable/client-side code is governed by the [`EULA.md`](./EULA.md) and [`LICENSE.md`](./LICENSE.md), your access to the **hosted cloud platform, real-time multiplayer servers (`/ws/siege`), Cloud SQL / Firestore persistence, and recurring VIP Member Covenant subscriptions** is governed by this **SaaS Agreement**:

1. **Hosted Cloud Access Grant**: Subject to your compliance with the EULA, ToS, and AUP, we grant you a revocable, non-exclusive right to access our hosted Cloud Run application instances, 3 regional replication clusters (`us-east-solara-1`, `eu-central-valhalla-1`, `ap-southeast-celestia-1`), and cloud save synchronization APIs (`/api/db/*`).
2. **VIP Member Covenant Subscriptions (`src/game/vipSubscription.ts`)**:
   - **Subscription Tiers**: `Tier 0 (Free Sovereign)`, `Tier 1 (Silver Archon — Monthly/Annual)`, `Tier 2 (Golden Sovereign — Monthly/Annual)`, and `Tier 3 (Celestial Emperor — Monthly/Annual)`.
   - **Billing & Renewal**: Paid subscriptions grant access to daily VIP Stipend Chests, Castle Upgrade resource discounts (`5%–20%`), extra gathering/march queues, and cultivation speed bonuses for the purchased term (`30 days` Monthly or `365 days` Annual).
   - **Cancellation**: You may cancel recurring renewal at any time; your VIP benefits remain active through the end of the current paid billing period.

---

## 🛡️ 5. Acceptable Use Policy (AUP)

This **Acceptable Use Policy (AUP)** outlines strictly prohibited technical, network, and behavioral actions across all **Voxel Realms RPG** servers, APIs, WebSockets, and community channels:

1. **No Network Flooding or DoS**: You may not exceed our automated rate limits (`120 write requests/min` per IP on `/api/*`, `30 frames/sec` per peer on `/ws/siege`, `32 KiB` max WebSocket frame size, `20` concurrent WS peers per IP) enforced by `src/game/serverHardening.ts`.
2. **No Packet Tampering, Replay, or Exploit Injection**:
   - Sending non-monotonic `clientSeq` replay packets, out-of-bounds coordinates (`|x|, |z| > 120.0m`), unowned cohort commands (`COHORT_OWNERSHIP_HIJACK`), or unauthorized rally launches (`RALLY_AUTHORITY_HIJACK`) is strictly prohibited and audited by `src/game/antiCheat.ts`.
   - Sending prototype-pollution payloads (`__proto__`, `constructor`, `prototype`) or cross-origin forged cookie mutations (CSRF) is blocked with `HTTP 400`/`403` and logged to `securityAuditLog`.
3. **No Unauthorized Account or OAuth Abuse**: You may not attempt brute-force passkey attacks against `/api/auth/admin-login` (automatically locked out after 5 failed attempts with `HTTP 429`), forge Firebase ID tokens on `/api/db/*`, or use the Gmail Dispatch Center (`GmailModal.tsx`) to send unsolicited spam or malicious content.
4. **Enforcement**: Violations of this AUP result in automatic `AntiCheatGuard` quarantine, IP rate-limiting, or account suspension/termination under [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

---

## 📈 6. Service Level Agreement (SLA)

This **Service Level Agreement (SLA)** defines target operational performance benchmarks, real-time telemetry probes, support response targets, and service-credit remedies for hosted **Voxel Realms RPG** realms:

### 6.1 System Uptime & Real-Time Simulation Benchmarks

| Metric / Probe                    | Target Benchmark                                     | Verification Endpoint / Tool                                           |
| :-------------------------------- | :--------------------------------------------------- | :--------------------------------------------------------------------- |
| **Monthly Platform Uptime**       | **`>= 99.5%`** (excluding scheduled maintenance)     | `GET /healthz` & `GET /readyz`                                         |
| **Authoritative Siege Tick Rate** | **`20 Hz` (`50 ms` nominal tick budget)**            | `GET /api/ops/readiness` (`tickMetrics.p95Ms <= 50ms`)                 |
| **Atomic Persistence Recovery**   | **Zero data corruption** via SHA-256 `.bak` failover | `src/game/serverPersistence.ts` (`schemaVersion: 2`)                   |
| **Multi-Region Quorum**           | **`3/3` Regional Clusters in Quorum**                | `us-east-solara-1`, `eu-central-valhalla-1`, `ap-southeast-celestia-1` |

### 6.2 Support Response Time Benchmarks (`creatergame31@gmail.com`)

| Support Department                                          | Subject Prefix                          | Target Response SLA |
| :---------------------------------------------------------- | :-------------------------------------- | :-----------------: |
| **Community Moderation & Abuse**                            | `[MODERATOR] Voxel Realms RPG`          |  **`<= 4 Hours`**   |
| **Game Master (GM) Live-Ops & Species Rebirth**             | `[GM CONTROL] Voxel Realms RPG`         |  **`<= 12 Hours`**  |
| **Supreme Administration & VIP Billing**                    | `[ADMINISTRATION] Voxel Realms RPG`     |  **`<= 24 Hours`**  |
| **Security Disclosure, Privacy (GDPR/CCPA/DPDP) & Appeals** | `[SECURITY]` / `[PRIVACY]` / `[APPEAL]` |  **`<= 48 Hours`**  |

### 6.3 SLA Remedies & Compensation Decrees

- If unscheduled hosted downtime drops monthly availability below `99.5%`, affected Commanders receive an automatic **Imperial Compensation Decree** (Kingdom Diamonds `💎`, Spirit Stones, and VIP duration extension) issued by **[creatergame31@gmail.com](mailto:creatergame31@gmail.com)**.

---

## 🔐 7. Data Processing Agreement (DPA) & Sub-Processor Register

This **Data Processing Agreement (DPA)** governs how personal data is processed on behalf of users in compliance with **Article 28 of the GDPR**, the **California Consumer Privacy Act (CCPA/CPRA)**, and **India's Digital Personal Data Protection Act, 2023 (DPDP Act)**:

1. **Roles of the Parties**:
   - **Data Controller / Data Fiduciary**: Voxel Realms RPG Studio (**[creatergame31@gmail.com](mailto:creatergame31@gmail.com)**).
   - **Data Subjects / Data Principals**: Registered players, Commanders, and contributors.
2. **Security & PII Isolation Controls (`security_spec.md` & `firestore.rules`)**:
   - Public non-PII gameplay profiles are stored in `/users/{userId}/public/profile`, while sensitive account PII (such as email addresses) is strictly isolated inside `/users/{userId}/private/account` accessible only to the authenticated owner (`request.auth.uid == userId`) or verified Root Administrator (`creatergame31@gmail.com`).
   - All Cloud SQL PostgreSQL queries (`src/db/users.ts`) use parameterized Drizzle ORM statements bound to server-verified Firebase Auth UIDs (`requireAuth` middleware).
3. **Authorized Sub-Processor Register**:

| Sub-Processor                                          | Service Provided                                                                                  | Data Processed                                                                             | Location / Project Scope                              |
| :----------------------------------------------------- | :------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------- | :---------------------------------------------------- |
| **Google Cloud Platform (Cloud SQL PostgreSQL)**       | Relational database persistence (`users`, `commander_profiles`, `realm_saves`, `support_tickets`) | Firebase UID, display name, email, sanitized game save JSON                                | GCP Instance `ai-studio-416287a7` (`asia-southeast1`) |
| **Google Firebase (Authentication & Cloud Firestore)** | Identity verification (`GoogleAuthProvider`) & real-time NoSQL cloud sync                         | Firebase UID, email, OAuth identity profile, realm save documents                          | GCP Project `dev-ivy-6v0ns`                           |
| **Google Workspace Gmail API (Client-Side Only)**      | Optional player-initiated email dispatch (`GmailModal.tsx`)                                       | Volatile in-memory OAuth `accessToken` (never transmitted to or stored on backend servers) | Direct browser-to-`gmail.googleapis.com` TLS          |

---

## 🤝 8. Master Services Agreement (MSA) & Enterprise SOW Framework

For esports organizations, educational institutions, gaming guilds, or commercial partners seeking **custom dedicated realm clusters, sponsored tournament events, or white-label licensing**, this **Master Services Agreement (MSA)** establishes the overarching legal framework:

1. **Statements of Work (SOW)**: Specific deliverables, dedicated WebSocket shard capacities (`> 250` concurrent peers via Redis/Agones), custom 3D voxel maps, and fee schedules are executed via modular **Statements of Work (SOW)** referencing this MSA.
2. **Intellectual Property**: All underlying engine enhancements remain licensed under **Apache License 2.0** ([`LICENSE.md`](./LICENSE.md)), while custom partner branding and tournament assets remain the property of the respective party as specified in the applicable SOW.
3. **Enterprise & Legal Contact**: To request a countersigned DPA, SLA addendum, or Enterprise SOW under this MSA, contact **[creatergame31@gmail.com](mailto:creatergame31@gmail.com)** with the subject line `[ADMINISTRATION] Enterprise MSA / SOW Inquiry`.
