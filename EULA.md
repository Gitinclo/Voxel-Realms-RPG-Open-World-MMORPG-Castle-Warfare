# End User License Agreement (EULA)

**Effective Date & Last Updated:** November 15, 2026 (`15/11/2026`)  
**EULA Version:** `1.5.0-2026-11-15`  
**Licensor & Root Sovereign Administrator:** Voxel Realms RPG Studio Contributors (`Gitinclo` · [creatergame31@gmail.com](mailto:creatergame31@gmail.com))

IMPORTANT — READ CAREFULLY: This End User License Agreement ("**EULA**" or "**Agreement**") is a binding agreement between you ("**User**", "**Player**", "**Commander**", or "**You**") and the **Voxel Realms RPG Studio Contributors** ("**Licensor**", "**we**", "**us**", or "**our**", administered by **[creatergame31@gmail.com](mailto:creatergame31@gmail.com)**) governing your download, installation, access to, and use of the **Voxel Realms RPG: Open World MMORPG & Castle Warfare** client application, 3D WebGL2 assets, authoritative 20Hz multiplayer siege servers, Cloud SQL / Cloud Firestore persistence services, and related online features (collectively, the "**Game**" or "**Licensed Application**").

By clicking **"Accept EULA"**, **"Enter the Realm"**, creating or linking an account, or otherwise accessing or playing the Game, You acknowledge that You have read, understood, and agree to be bound by this EULA, our [Complete 10-Agreement Legal Stack (`LEGAL.md` — SaaS, AUP, SLA, DPA, Cookie & MSA)](./LEGAL.md), our [Terms and Conditions (`TERMS.md`)](./TERMS.md), our [Privacy Policy (`PRIVACY.md`)](./PRIVACY.md), and our [Code of Conduct (`CODE_OF_CONDUCT.md`)](./CODE_OF_CONDUCT.md). If You do not agree to the terms of this EULA, do not install, access, or play the Game.

---

## 1. Relationship Between This EULA and the Apache-2.0 Open-Source License

1. **Dual-Layer Licensing Structure:**
   - **Open-Source Repository Code (`Apache-2.0`):** The underlying source code files in the public repository are licensed under the [Apache License, Version 2.0 (`LICENSE.md`)](./LICENSE.md) subject to the mandatory attribution terms in [`NOTICE`](./NOTICE). Nothing in this EULA restricts your rights under the Apache License 2.0 to inspect, fork, modify, or redistribute the open-source source code in compliance with Apache-2.0 Section 4.
   - **Hosted Game Service, Live Multiplayer Realms & Account Access (`EULA`):** Your access to the official hosted Game instances, authoritative 20Hz WebSocket Siege servers (`/ws/siege`), official regional clusters (`us-east-solara-1`, `eu-central-valhalla-1`, `ap-southeast-celestia-1`), Cloud SQL / Firestore databases, virtual economy, and official branding is governed strictly by this EULA.
2. **Trademark & Official Identity Reservation:** In accordance with Section 6 of the Apache License 2.0, this EULA does not grant You any right to use the trade names, trademarks, service marks, or official administrative identity (`Voxel Realms RPG`, `creatergame31@gmail.com`, or official clan/server emblems) to misrepresent an unofficial fork as the official hosted Game.

---

## 2. Grant of Limited End-User License & Usage Restrictions

1. **Limited License Grant:** Subject to your continuous compliance with this EULA, Licensor grants You a personal, revocable, non-exclusive, non-transferable, non-sublicensable, limited license to access and play the Game on compatible desktop (`PC/Console`) or mobile (`Android/Touch`) devices for your personal, non-commercial entertainment.
2. **Prohibited Actions:** When accessing the hosted Game or multiplayer servers, You agree **not** to:
   - Use speed-hacks, teleportation injectors, memory editors, packet replay tools, unapproved automation scripts (bots/macros), or modified client payloads to falsify movement kinematics, troop counts, castle levels, cultivation realms, or resource balances.
   - Circumvent, disable, or tamper with the Game's cryptographic HMAC-SHA256 session cookies, Firebase Authentication tokens, Same-Origin CSRF protections, or Cloud Firestore security rules (`firestore.rules`).
   - Launch denial-of-service (DoS) floods, oversized WebSocket frames (`> 32 KiB`), or message floods (`> 30 msg/s`) against `/ws/siege`, `/api/online/*`, `/api/admin/*`, or `/api/db/*`.
   - Sell, rent, lease, trade, or transfer your Commander account, virtual currencies, or virtual items for real-world money or cryptocurrency outside the Game.

---

## 3. Authoritative Multiplayer Anti-Cheat & Telemetry Consent

1. **Server-Authoritative Verification (`src/game/antiCheat.ts`):** To preserve fair play across 50v50 Clan Territory Wars (`Sectors A1–C3`), `1,000T` Castle Warfare, and `1T` World Boss Rallies, the Game operates a server-authoritative anti-cheat engine (`AuthoritativeAntiCheatEngine`).
2. **Automated Monitoring & Rubberbanding:** By playing the Game, You consent to automated server-side auditing of:
   - **Movement Kinematics:** Velocity validation (`<= 28 units/s` with jitter tolerance) and instant server rubberbanding of unauthorized teleports (`> 65 units`).
   - **Packet Sequence Integrity:** Monotonic `clientSeq` verification to block duplicate or replayed siege commands.
   - **Economy & Progression Bounds:** Clamping of anomalous per-sync resource gains, castle level jumps, or cultivation realm jumps.
   - **Automated Quarantine:** Accumulation of `>= 100` anti-cheat violation points automatically places the offending Commander session into **Anti-Cheat Quarantine**, blocking multiplayer mutations until reviewed or pardoned by a verified Game Master (`creatergame31@gmail.com`).

---

## 4. User Accounts, Cloud Persistence & Google Workspace Integration

1. **Account Credentials & Responsibility:** You may play in local sandbox mode or sign in via Google Authentication (Firebase Auth). You are solely responsible for safeguarding your Google account and session credentials and for all actions taken under your Commander profile.
2. **Cloud SQL & Firestore Storage:** When signed in, your Commander profile, realm save snapshot, and support tickets are synchronized across Cloud SQL (PostgreSQL) and Cloud Firestore (`/users/{userId}/public/profile` and `/users/{userId}/private/account`) in accordance with our [Privacy Policy (`PRIVACY.md`)](./PRIVACY.md).
3. **Optional Gmail Dispatch Center (`src/components/GmailModal.tsx`):**
   - Connecting Google Workspace Gmail is strictly optional and uses dedicated OAuth consent (`GMAIL_SCOPES`).
   - Your OAuth access token is held **exclusively in volatile browser memory (`React` state)** and is immediately purged on sign-out or tab closure.
   - Every mutating or destructive Gmail action (sending an email, saving a draft, creating a label, marking read/unread, or moving a message to Trash) requires your **explicit confirmation** via an in-app confirmation dialog before execution.

---

## 5. Virtual Currencies, Virtual Goods & VIP Subscriptions

1. **No Ownership or Monetary Value:** All virtual currencies (including _Kingdom Diamonds_, _Spirit Stones_, _Clan Coins_, and _Wood/Steel/Copper/Grain/Oil_) and virtual items (including _T1–T20 Troops_, _Hero Skins_, _Cultivation Manuals_, _Veteran Scrolls_, and _VIP Member Passes_) are licensed digital features of the Game, not personal property. They have **no real-world monetary value** and cannot be cashed out, refunded, or exchanged for legal tender.
2. **VIP Member Covenant (`VIP Tiers 0–3`):** Monthly and Annual VIP Passes grant in-game perks (daily stipends, gathering march slots, cultivation speed bonuses, and castle upgrade discounts) for the duration of the active cycle. All virtual pass activations and digital purchases are final and non-refundable except where mandated by applicable statutory consumer law.

---

## 6. Sovereign Root Authority, Species Rebirth & Cosmological Governance

1. **Root Sovereign Administrator (`creatergame31@gmail.com`):** The account **`creatergame31@gmail.com`** holds immutable Root Owner & Supreme Administrator clearance (`Clearance Lv. 999`) over official Game governance, server moderation, and Layer-6 Cosmological decrees (_The White Page / The House of Ideas_).
2. **Species Rebirth Governance (`src/game/species.ts`):** While initial character creation permits free selection among the 10 playable species, subsequent species/race rebirth switches on a locked profile require explicit administrative authorization from **`creatergame31@gmail.com`** or an authorized Game Master.

---

## 7. Community Conduct, Chat Moderation & Sanctions

1. **Standards of Conduct:** All communications in Clan Chat, Territory War dispatches, Commander names, and support tickets must comply with our [Code of Conduct (`CODE_OF_CONDUCT.md`)](./CODE_OF_CONDUCT.md).
2. **Enforcement Sanctions:** Verified Administrators, Game Masters, and Moderators may issue **Warnings**, **Chat Mutes**, **Temporary Suspensions**, **Anti-Cheat Quarantines**, or **Permanent Account Terminations** ("Ban Hammer") for violations of this EULA or the Code of Conduct. Upon termination for cause, all licenses granted herein immediately cease without refund.

---

## 8. Health & Photosensitivity Warning (3D WebGL2 & HDR Bloom)

A very small percentage of individuals may experience epileptic seizures, dizziness, or blackouts when exposed to certain flashing lights, procedural particle effects, lightning tribulations, or high-contrast HDR bloom shaders (`UnrealBloomPass`).

- If You or anyone in your household has an epileptic condition, consult a physician before playing.
- You may reduce visual intensity at any time by switching the in-game graphics preset to **Balanced** or **Mobile** inside the HUD or Architect Studio (`CppArchitectureModal`).
- Immediately discontinue use and consult a physician if You experience dizziness, altered vision, eye or muscle twitches, or disorientation.

---

## 9. Disclaimer of Warranties & Limitation of Liability

1. **"AS IS" AND "AS AVAILABLE":** TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE GAME, SERVER INFRASTRUCTURE, CLOUD SAVES, AND ALL VIRTUAL GOODS ARE PROVIDED **"AS IS"** AND **"AS AVAILABLE"**, WITHOUT WARRANTIES OF ANY KIND, EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, OR NON-INFRINGEMENT.
2. **LIMITATION OF LIABILITY:** IN NO EVENT SHALL THE LICENSOR, MAINTAINERS, OR CONTRIBUTORS (`creatergame31@gmail.com`) BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF DATA, ACCOUNT PROGRESSION, VIRTUAL ITEMS, OR GOODWILL ARISING OUT OF OR IN CONNECTION WITH THIS EULA OR YOUR USE OF THE GAME.

---

## 10. Changes to This EULA & Official Contact Information

1. **Updates to EULA:** We may revise this EULA from time to time to reflect new engine features, regulatory requirements, or security updates. When we publish a new `EULA_VERSION`, the updated Effective Date will be displayed at the top of this document and inside the in-app **EULA Modal**, where You may review and record your updated acceptance.
2. **Official Contact & Legal Inquiries:** All questions, licensing requests, moderation appeals, or legal notices regarding this EULA should be directed to:
   - **Root Owner & Legal/Admin Contact:** [creatergame31@gmail.com](mailto:creatergame31@gmail.com)
   - **In-App Support Center:** Open the **GM / Admin / Mod Console** $\rightarrow$ **Official Contact & Support Tickets** tab.
