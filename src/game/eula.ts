/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PRIMARY_ADMIN_EMAIL } from './adminModeration';

export const EULA_VERSION = '1.5.0-2026-11-17' as const;
export const EULA_EFFECTIVE_DATE_DISPLAY = '17/11/2026' as const;
export const EULA_EFFECTIVE_DATE_ISO = '2026-11-17' as const;
export const EULA_LICENSOR_EMAIL = PRIMARY_ADMIN_EMAIL;
export const EULA_STORAGE_KEY = 'voxel_realms_eula_acceptance_v1' as const;

export type EulaCategory =
  | 'license'
  | 'anti_cheat'
  | 'cloud_privacy'
  | 'virtual_goods'
  | 'governance'
  | 'health'
  | 'liability';

export interface EulaArticle {
  id: string;
  articleNumber: number;
  title: string;
  category: EulaCategory;
  summary: string;
  clauses: string[];
}

export interface EulaAcceptanceState {
  accepted: boolean;
  acceptedVersion: string | null;
  acceptedAtIso: string | null;
  acceptedByEmail: string;
  receiptHash: string | null;
}

export interface EulaComplianceReport {
  isCompliant: boolean;
  currentVersion: string;
  effectiveDateDisplay: string;
  licensorEmail: string;
  requiresReacceptance: boolean;
  reason: string;
  state: EulaAcceptanceState;
}

export const EULA_ARTICLES: readonly EulaArticle[] = [
  {
    id: 'eula_art_1_apache_dual_layer',
    articleNumber: 1,
    title: 'Relationship Between This EULA & Apache-2.0 Open-Source License',
    category: 'license',
    summary:
      'Clarifies how the Apache-2.0 source code license and this Hosted Game Service EULA work together.',
    clauses: [
      'Open-Source Repository Code (Apache-2.0): The underlying repository source code is licensed under Apache License 2.0 (LICENSE.md and NOTICE). Nothing in this EULA restricts your Apache-2.0 rights to inspect, fork, modify, or redistribute the source code with proper attribution.',
      'Hosted Game Service & Live Realms (EULA): Your access to official hosted Game instances, 20Hz WebSocket Siege servers (/ws/siege), regional clusters, Cloud SQL / Firestore databases, and virtual economy is governed by this EULA.',
      'Trademark & Official Identity Reservation: Under Apache-2.0 Section 6, unofficial forks may not misrepresent themselves as the official Voxel Realms RPG service or impersonate Root Administrator creatergame31@gmail.com.',
    ],
  },
  {
    id: 'eula_art_2_license_grant',
    articleNumber: 2,
    title: 'Grant of Limited End-User License & Usage Restrictions',
    category: 'license',
    summary:
      'Grants a personal, revocable, non-exclusive license to play and defines prohibited network/client abuses.',
    clauses: [
      'Limited License Grant: Licensor grants you a personal, revocable, non-exclusive, non-transferable license to access and play Voxel Realms RPG on desktop (PC/Console) and mobile (Android/Touch) devices for personal entertainment.',
      'No Exploit or Packet Tampering: You may not use speed-hacks, teleportation injectors, memory editors, packet replay tools, or unapproved bots to falsify movement kinematics, troop counts, castle levels, cultivation realms, or resources.',
      'No Security Circumvention: You may not bypass HMAC-SHA256 session cookies, Firebase Auth tokens, Same-Origin CSRF checks, or Cloud Firestore security rules, nor flood /ws/siege or /api/* endpoints.',
    ],
  },
  {
    id: 'eula_art_3_anti_cheat',
    articleNumber: 3,
    title: 'Authoritative Multiplayer Anti-Cheat & Telemetry Consent',
    category: 'anti_cheat',
    summary:
      'Covers server-authoritative kinematic velocity checks, sequence validation, resource delta bounds, and quarantine.',
    clauses: [
      'Server-Authoritative Auditing (AuthoritativeAntiCheatEngine): To protect 50v50 Clan Territory Wars (Sectors A1–C3), 1,000T Castle Warfare, and 1T World Boss Rallies, the server audits all multiplayer movement, syncs, and siege commands.',
      'Kinematic Rubberbanding & Replay Defense: Movement exceeding 28 units/s or teleports exceeding 65 units are rubberbanded to the last authoritative server coordinate, and non-monotonic clientSeq packets are rejected.',
      'Violation Quarantine (>= 100 pts): Accumulating 100 or more violation points places the Commander session into Anti-Cheat Quarantine until reviewed or pardoned by a verified Game Master (creatergame31@gmail.com).',
    ],
  },
  {
    id: 'eula_art_4_accounts_cloud_gmail',
    articleNumber: 4,
    title: 'User Accounts, Cloud Persistence & Google Workspace Integration',
    category: 'cloud_privacy',
    summary:
      'Explains Dual-Tier Google Sign-In, Cloud SQL / Firestore saves, and confirmation-gated in-memory Gmail Dispatch.',
    clauses: [
      'Account Security: Standard Commander & Admin Console sign-in uses basic Google identity scopes (openid, email, profile). You are responsible for safeguarding your account credentials.',
      'Cloud SQL & Firestore Persistence: Authenticated profiles, realm saves, and support tickets synchronize across Cloud SQL (PostgreSQL) and PII-isolated Cloud Firestore collections (/users/{userId}/public/profile and /users/{userId}/private/account).',
      'Optional Gmail Dispatch Center: Connecting Gmail uses dedicated OAuth consent (GMAIL_SCOPES) with the access token stored strictly in volatile React memory (never localStorage) and mandatory confirmation dialogs before sending, drafting, labeling, or trashing any email.',
    ],
  },
  {
    id: 'eula_art_5_virtual_goods_vip',
    articleNumber: 5,
    title: 'Virtual Currencies, Virtual Goods & VIP Subscriptions',
    category: 'virtual_goods',
    summary:
      'Defines licensed virtual items (Diamonds, Spirit Stones, T1–T20 Troops, VIP Tiers 0–3) as having no real-money value.',
    clauses: [
      'No Monetary Value: Kingdom Diamonds, Spirit Stones, Clan Coins, T1–T20 Troops, Hero Skins, Cultivation Manuals, Veteran Scrolls, and VIP Passes are licensed in-game features with no real-world cash value.',
      'VIP Member Covenant (Tiers 0–3): Monthly and Annual VIP Passes unlock daily stipends, extra march queues, cultivation speed bonuses, and castle upgrade discounts for the active term. All digital activations are final except where required by statutory consumer law.',
    ],
  },
  {
    id: 'eula_art_6_sovereign_governance',
    articleNumber: 6,
    title: 'Sovereign Root Authority, Species Rebirth & Cosmological Governance',
    category: 'governance',
    summary:
      'Establishes immutable Root Owner authority (creatergame31@gmail.com) and Species Rebirth governance rules.',
    clauses: [
      'Root Sovereign Administrator (creatergame31@gmail.com): The account creatergame31@gmail.com holds immutable Clearance Level 999 over official Game governance, RBAC moderation, and Layer-6 Cosmological decrees (The White Page / The House of Ideas).',
      'Species Rebirth Gate: Initial character creation allows free selection among all 10 playable species; switching species after profile lock requires authorization from creatergame31@gmail.com or an authorized Game Master.',
    ],
  },
  {
    id: 'eula_art_7_conduct_moderation',
    articleNumber: 7,
    title: 'Community Conduct, Chat Moderation & Sanctions',
    category: 'governance',
    summary:
      'Enforces the Code of Conduct across Clan Chat, emblems, and tickets with graduated moderation sanctions.',
    clauses: [
      'Code of Conduct Compliance: All Clan Chat messages, Territory War dispatches, Commander names, and support tickets must abide by CODE_OF_CONDUCT.md.',
      'Sanctions & Termination: Verified Staff may issue Warnings, Chat Mutes, Temporary Bans, Anti-Cheat Quarantines, or Permanent Account Terminations for EULA violations without refund of virtual items.',
    ],
  },
  {
    id: 'eula_art_8_photosensitivity',
    articleNumber: 8,
    title: 'Health & Photosensitivity Warning (3D WebGL2 & HDR Bloom)',
    category: 'health',
    summary:
      'Provides standard photosensitivity guidance and explains how to lower HDR bloom and particle intensity.',
    clauses: [
      'Photosensitivity Notice: A small percentage of individuals may experience seizures or dizziness when exposed to flashing lights, lightning tribulation effects, or HDR bloom shaders (UnrealBloomPass).',
      'Visual Comfort Controls: Players can reduce shader and bloom intensity at any time by switching the graphics preset to Balanced or Mobile in the HUD or Architect Studio.',
    ],
  },
  {
    id: 'eula_art_9_warranty_liability',
    articleNumber: 9,
    title: 'Disclaimer of Warranties ("AS IS") & Limitation of Liability',
    category: 'liability',
    summary:
      'Disclaims implied warranties and limits liability to the maximum extent permitted by applicable law.',
    clauses: [
      'Provided "AS IS": The Game, 20Hz siege servers, cloud databases, and virtual goods are provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied.',
      'Limitation of Liability: To the fullest extent permitted by law, Licensor and contributors (creatergame31@gmail.com) shall not be liable for indirect, incidental, consequential, or punitive damages or loss of virtual progression.',
    ],
  },
  {
    id: 'eula_art_10_updates_contact',
    articleNumber: 10,
    title: 'Updates to This EULA & Official Legal Contact (creatergame31@gmail.com)',
    category: 'governance',
    summary:
      'Details EULA version tracking, cryptographic acceptance receipts, and official contact routing.',
    clauses: [
      'Versioned EULA Acceptance: Material updates increment EULA_VERSION (currently 1.5.0-2026-11-17) and prompt Commanders to review and record updated acceptance.',
      'Official Contact Directory: Direct all EULA questions, licensing inquiries, or moderation appeals to creatergame31@gmail.com or submit a verified ticket via the in-app GM / Admin / Mod Console.',
    ],
  },
] as const;

/**
 * Computes a deterministic 32-bit FNV-1a hexadecimal receipt hash for EULA acceptance records.
 */
export function computeEulaReceiptHash(
  version: string,
  email: string,
  acceptedAtIso: string
): string {
  const payload = `VOXEL_REALMS_EULA|${version}|${email.trim().toLowerCase()}|${acceptedAtIso}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `EULA-ACK-${hash.toString(16).toUpperCase().padStart(8, '0')}`;
}

export function createInitialEulaAcceptanceState(
  defaultEmail: string = EULA_LICENSOR_EMAIL
): EulaAcceptanceState {
  const normalizedEmail = defaultEmail.trim().toLowerCase() || EULA_LICENSOR_EMAIL;
  const acceptedAtIso = `${EULA_EFFECTIVE_DATE_ISO}T00:00:00.000Z`;
  return {
    accepted: true,
    acceptedVersion: EULA_VERSION,
    acceptedAtIso,
    acceptedByEmail: normalizedEmail,
    receiptHash: computeEulaReceiptHash(EULA_VERSION, normalizedEmail, acceptedAtIso),
  };
}

export function acceptEulaVersion(
  email: string,
  nowIso: string = new Date().toISOString(),
  version: string = EULA_VERSION
): EulaAcceptanceState {
  const cleanedEmail = email.trim().toLowerCase() || 'guest@voxelrealms.example';
  return {
    accepted: true,
    acceptedVersion: version,
    acceptedAtIso: nowIso,
    acceptedByEmail: cleanedEmail,
    receiptHash: computeEulaReceiptHash(version, cleanedEmail, nowIso),
  };
}

export function revokeEulaAcceptance(email: string): EulaAcceptanceState {
  const cleanedEmail = email.trim().toLowerCase() || 'guest@voxelrealms.example';
  return {
    accepted: false,
    acceptedVersion: null,
    acceptedAtIso: null,
    acceptedByEmail: cleanedEmail,
    receiptHash: null,
  };
}

export function evaluateEulaCompliance(state: EulaAcceptanceState): EulaComplianceReport {
  if (!state.accepted || !state.acceptedVersion || !state.receiptHash) {
    return {
      isCompliant: false,
      currentVersion: EULA_VERSION,
      effectiveDateDisplay: EULA_EFFECTIVE_DATE_DISPLAY,
      licensorEmail: EULA_LICENSOR_EMAIL,
      requiresReacceptance: true,
      reason: `EULA v${EULA_VERSION} (${EULA_EFFECTIVE_DATE_DISPLAY}) requires your review and acceptance.`,
      state,
    };
  }

  if (state.acceptedVersion !== EULA_VERSION) {
    return {
      isCompliant: false,
      currentVersion: EULA_VERSION,
      effectiveDateDisplay: EULA_EFFECTIVE_DATE_DISPLAY,
      licensorEmail: EULA_LICENSOR_EMAIL,
      requiresReacceptance: true,
      reason: `Previously accepted EULA (${state.acceptedVersion}) is older than current v${EULA_VERSION}.`,
      state,
    };
  }

  return {
    isCompliant: true,
    currentVersion: EULA_VERSION,
    effectiveDateDisplay: EULA_EFFECTIVE_DATE_DISPLAY,
    licensorEmail: EULA_LICENSOR_EMAIL,
    requiresReacceptance: false,
    reason: `EULA v${EULA_VERSION} (${EULA_EFFECTIVE_DATE_DISPLAY}) accepted by ${state.acceptedByEmail} [${state.receiptHash}].`,
    state,
  };
}

export function searchEulaArticles(
  query: string,
  categoryFilter: EulaCategory | 'all' = 'all'
): EulaArticle[] {
  const normalizedQuery = query.trim().toLowerCase();
  return EULA_ARTICLES.filter((article) => {
    if (categoryFilter !== 'all' && article.category !== categoryFilter) {
      return false;
    }
    if (!normalizedQuery) return true;
    const haystack = [article.title, article.summary, article.category, ...article.clauses]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export type LegalDocumentGroup = 'core_user_website' | 'software_licensing' | 'enterprise_service';

export interface LegalStackDocument {
  id: string;
  name: string;
  shortCode: string;
  group: LegalDocumentGroup;
  groupTitle: string;
  canonicalFile: string;
  primaryFocus: string;
  typicalContext: string;
  voxelRealmsImplementation: string[];
}

export interface LegalQuickComparisonRow {
  agreementType: string;
  primaryFocus: string;
  typicalContext: string;
  canonicalReference: string;
}

/**
 * Complete 10-Document Legal & Compliance Stack for Voxel Realms RPG
 * (Downloadable/3D Video Game + Hosted Web/Cloud Multiplayer Platform + VIP SaaS + Enterprise SLA/DPA/MSA).
 */
export const LEGAL_DOCUMENT_STACK: readonly LegalStackDocument[] = [
  {
    id: 'legal_tos',
    name: 'Terms of Service (ToS / Terms & Conditions)',
    shortCode: 'ToS',
    group: 'core_user_website',
    groupTitle: 'Core User & Website Agreements',
    canonicalFile: 'TERMS.md',
    primaryFocus:
      'Broad rules for using the web platform, user accounts, conduct, payment terms & dispute resolution',
    typicalContext: 'Websites, social networks, online portals & e-commerce',
    voxelRealmsImplementation: [
      'Governs Commander accounts, online conduct, virtual goods & VIP subscription payment rules.',
      'Establishes account suspension/termination rules and informal dispute resolution via creatergame31@gmail.com.',
    ],
  },
  {
    id: 'legal_privacy',
    name: 'Privacy Policy (GDPR, CCPA & India DPDP Act)',
    shortCode: 'Privacy',
    group: 'core_user_website',
    groupTitle: 'Core User & Website Agreements',
    canonicalFile: 'PRIVACY.md',
    primaryFocus:
      'Legally required disclosure of how personal user data is collected, stored, used, and shared',
    typicalContext:
      'Any app or website collecting personal data under GDPR, CCPA/CPRA, or India DPDP Act 2023',
    voxelRealmsImplementation: [
      'Discloses Firebase Auth UID/email collection, Cloud SQL PostgreSQL & PII-isolated Cloud Firestore storage.',
      'Provides a 30-day Right to Delete / Right to be Forgotten workflow via creatergame31@gmail.com.',
    ],
  },
  {
    id: 'legal_cookies',
    name: 'Cookie & LocalStorage Policy',
    shortCode: 'Cookies',
    group: 'core_user_website',
    groupTitle: 'Core User & Website Agreements',
    canonicalFile: 'LEGAL.md (§3) & PRIVACY.md (§6)',
    primaryFocus:
      'Specific disclosure of active cookies, localStorage keys, tracking technologies & opt-out controls',
    typicalContext: 'Web platforms, authenticated single-page applications (SPAs)',
    voxelRealmsImplementation: [
      'Documents the strictly necessary HMAC-SHA256 HttpOnly session cookie (voxel_session) and deterministic localStorage keys (voxel_realms_eula_acceptance_v1, voxel_realms_daily_login_v1, voxel_realms_vip_subscription_v1, voxel_realms_lore_codex_state_v1).',
      'Confirms Google Workspace Gmail OAuth tokens are held strictly in volatile React memory and never stored in cookies or localStorage.',
    ],
  },
  {
    id: 'legal_eula',
    name: 'End User License Agreement (EULA)',
    shortCode: 'EULA',
    group: 'software_licensing',
    groupTitle: 'Software & Licensing Variations',
    canonicalFile: 'EULA.md',
    primaryFocus:
      'Software installation, game client usage rights, anti-cheat consent & virtual economy license',
    typicalContext: 'Desktop apps, mobile apps, 3D video games',
    voxelRealmsImplementation: [
      'Grants a personal, revocable license to use the 3D WebGL2/Desktop/Android game client while preserving Apache-2.0 source code rights.',
      'Records cryptographic FNV-1a acceptance receipts (EULA-ACK-...) in src/game/eula.ts and EulaModal.tsx.',
    ],
  },
  {
    id: 'legal_saas',
    name: 'Software as a Service (SaaS) Cloud Agreement',
    shortCode: 'SaaS',
    group: 'software_licensing',
    groupTitle: 'Software & Licensing Variations',
    canonicalFile: 'LEGAL.md (§4)',
    primaryFocus:
      'Cloud-hosted software access, multi-region WebSocket realm access & recurring VIP subscription terms',
    typicalContext: 'Web-based cloud platforms, recurring subscription services',
    voxelRealmsImplementation: [
      'Governs cloud-hosted access to /ws/siege (20Hz), /api/online/*, /api/db/*, and 3 regional replication clusters.',
      'Defines Monthly (30d) and Annual (365d) VIP Member Covenant (Tiers 0–3) subscription terms and cancellation rights.',
    ],
  },
  {
    id: 'legal_oss',
    name: 'Open-Source Software (OSS) License (Apache-2.0)',
    shortCode: 'Apache-2.0',
    group: 'software_licensing',
    groupTitle: 'Software & Licensing Variations',
    canonicalFile: 'LICENSE.md, LICENSE & NOTICE',
    primaryFocus:
      'Public source code inspection, modification, distribution, patent grant & Section 4(d) attribution',
    typicalContext: 'Open-source repositories, engines & developer SDKs',
    voxelRealmsImplementation: [
      'Licenses all TypeScript, React 19, Three.js, and C++20 source code under Apache License 2.0.',
      'Requires preservation of copyright notices and NOTICE attribution while reserving official service trademarks under Section 6.',
    ],
  },
  {
    id: 'legal_aup',
    name: 'Acceptable Use Policy (AUP)',
    shortCode: 'AUP',
    group: 'software_licensing',
    groupTitle: 'Software & Licensing Variations',
    canonicalFile: 'LEGAL.md (§5) & CODE_OF_CONDUCT.md',
    primaryFocus: 'Strictly prohibited network, cloud, anti-cheat, exploit & community actions',
    typicalContext: 'Cloud platforms, multiplayer game networks & API services',
    voxelRealmsImplementation: [
      'Prohibits HTTP/WS flooding (>120 req/min or >30 msg/s), packet replay, speed-hacks, cohort hijacking, CSRF, and __proto__ injection.',
      'Enforced in real time by src/game/antiCheat.ts (AntiCheatGuard) and src/game/serverHardening.ts.',
    ],
  },
  {
    id: 'legal_sla',
    name: 'Service Level Agreement (SLA)',
    shortCode: 'SLA',
    group: 'enterprise_service',
    groupTitle: 'Enterprise & Service Commitments',
    canonicalFile: 'LEGAL.md (§6) & SUPPORT.md',
    primaryFocus:
      'Expected uptime guarantees, 20Hz simulation benchmarks, support response SLAs & service-credit remedies',
    typicalContext: 'Enterprise software, cloud hosting & live-ops multiplayer servers',
    voxelRealmsImplementation: [
      'Targets >= 99.5% monthly uptime monitored via /healthz, /readyz, and /api/ops/readiness (20Hz / 50ms siege tick budget).',
      'Commits to 4h Moderation, 12h GM Live-Ops, 24h Administration, and 48h Security/Privacy ticket response SLAs with Diamond/VIP compensation decrees.',
    ],
  },
  {
    id: 'legal_dpa',
    name: 'Data Processing Agreement (DPA)',
    shortCode: 'DPA',
    group: 'enterprise_service',
    groupTitle: 'Enterprise & Service Commitments',
    canonicalFile: 'LEGAL.md (§7) & security_spec.md',
    primaryFocus:
      'Binding data controller / processor contract ensuring secure third-party vendor handling & PII isolation',
    typicalContext: 'Cloud database sub-processors, GDPR Art. 28 / CCPA / DPDP Act compliance',
    voxelRealmsImplementation: [
      'Documents sub-processors: Google Cloud SQL PostgreSQL (ai-studio-416287a7), Firebase Auth & Cloud Firestore (dev-ivy-6v0ns), and client-only Gmail REST v1.',
      'Enforces strict PII isolation between /users/{userId}/public/profile and /users/{userId}/private/account via firestore.rules.',
    ],
  },
  {
    id: 'legal_msa',
    name: 'Master Services Agreement (MSA) & SOW Framework',
    shortCode: 'MSA',
    group: 'enterprise_service',
    groupTitle: 'Enterprise & Service Commitments',
    canonicalFile: 'LEGAL.md (§8)',
    primaryFocus:
      'Overarching B2B commercial contract enabling modular Statements of Work (SOW) for custom deployments',
    typicalContext:
      'Enterprise realm hosting, sponsored esports tournaments & institutional partnerships',
    voxelRealmsImplementation: [
      'Establishes baseline commercial terms for dedicated clan clusters (>250 peers via Redis/Agones), custom voxel maps, and tournament events.',
      'Administered by Sovereign Root Owner creatergame31@gmail.com.',
    ],
  },
] as const;

export const LEGAL_QUICK_COMPARISON_MATRIX: readonly LegalQuickComparisonRow[] = [
  {
    agreementType: 'EULA',
    primaryFocus: 'Software installation and usage rights',
    typicalContext: 'Desktop apps, mobile apps, video games',
    canonicalReference: 'EULA.md & src/game/eula.ts',
  },
  {
    agreementType: 'Terms of Service',
    primaryFocus: 'General rules for platform access and conduct',
    typicalContext: 'Websites, social networks, e-commerce',
    canonicalReference: 'TERMS.md',
  },
  {
    agreementType: 'SaaS Agreement',
    primaryFocus: 'Cloud software access and subscription terms',
    typicalContext: 'Web-based business tools, cloud apps & VIP passes',
    canonicalReference: 'LEGAL.md (§4)',
  },
  {
    agreementType: 'SLA',
    primaryFocus: 'Uptime guarantees and support benchmarks',
    typicalContext: 'Enterprise software, cloud hosting & live-ops servers',
    canonicalReference: 'LEGAL.md (§6) & SUPPORT.md',
  },
  {
    agreementType: 'Privacy Policy',
    primaryFocus: 'Personal data collection and handling (GDPR / CCPA / DPDP)',
    typicalContext: 'Any app or website collecting user data',
    canonicalReference: 'PRIVACY.md',
  },
  {
    agreementType: 'Cookie Policy',
    primaryFocus: 'Active session cookies, localStorage & opt-out controls',
    typicalContext: 'Web platforms & authenticated SPAs',
    canonicalReference: 'LEGAL.md (§3) & PRIVACY.md (§6)',
  },
  {
    agreementType: 'OSS License (Apache-2.0)',
    primaryFocus: 'Public source code inspection, modification & redistribution',
    typicalContext: 'Open-source repositories & C++20/TS engines',
    canonicalReference: 'LICENSE.md, LICENSE & NOTICE',
  },
  {
    agreementType: 'AUP',
    primaryFocus: 'Prohibited network abuse, cheating & packet exploits',
    typicalContext: 'Cloud platforms & authoritative multiplayer servers',
    canonicalReference: 'LEGAL.md (§5) & src/game/antiCheat.ts',
  },
  {
    agreementType: 'DPA',
    primaryFocus: 'Data controller / processor security & sub-processors',
    typicalContext: 'Cloud SQL, Firebase Firestore & enterprise compliance',
    canonicalReference: 'LEGAL.md (§7) & security_spec.md',
  },
  {
    agreementType: 'MSA & SOW',
    primaryFocus: 'Overarching B2B commercial contract & Statements of Work',
    typicalContext: 'Dedicated tournament realms & enterprise partnerships',
    canonicalReference: 'LEGAL.md (§8)',
  },
] as const;
