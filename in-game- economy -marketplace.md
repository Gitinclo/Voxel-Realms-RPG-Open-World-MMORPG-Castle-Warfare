# In-Game Economy & Marketplace Architecture (`in-game- economy -marketplace.md`)

**Document Status:** Production Architecture & Balance Specification (`v1.5.0 · 17/11/2026`)  
**Supreme Economic Authority:** `creatergame31@gmail.com` (`Clearance Lv. 999` · `Root Creator God Sovereignty`)  
**Related Specifications:** [`AUCTION_HOUSE_MECHANICS.md`](./AUCTION_HOUSE_MECHANICS.md) · [`QI_ECONOMY.md`](./QI_ECONOMY.md) · [`BALANCE_PHILOSOPHY.md`](./BALANCE_PHILOSOPHY.md) · [`SECURITY.md`](./SECURITY.md)

---

## 1. Overview & Precision Guarantees

The **Voxel Realms RPG** economy spans **castle construction (Lv. 0–100)**, **trillion-scale troop mobilization (`T1–T20`, up to `1,000T` garrison)**, **Four-Path Immortal Cultivation**, **Imperial VIP Subscriptions**, **Master–Disciple Spirit Stone taxation**, **Clan Alliance Vaults**, and the **Cross-Realm Auction House & Marketplace**.

### Zero-Float Precision Ledger (`BigInt`)

- Every balance, troop count, rally capacity, tribulation damage pool, diamond reserve, and auction bid uses native **64-bit+ arbitrary-precision `BigInt`** (`src/game/math.ts`, `src/game/siegeNetProtocol.ts`).
- Wire packets serialize values as unsigned decimal strings (`BigIntWireString`, e.g. `"1000000000000000"` for `1,000T`) to eliminate IEEE-754 mantissa truncation past `2^53 - 1`.

---

## 2. Multi-Currency & Commodity Taxonomy (8 Core Assets + Honor)

| Currency / Commodity    | Code Key             | Primary Sources (Faucets)                                                                        | Primary Sinks (Drains)                                                                           | Tradeable on Marketplace?               |
| :---------------------- | :------------------- | :----------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------- | :-------------------------------------- |
| **Wood**                | `wood`               | Timber resource nodes, NPC Caravan Traders, Daily Stipend                                        | Castle Era upgrades, Shieldbearer/Shooter training, Pill herbs                                   | Yes (Bulk Commodity Lot)                |
| **Steel**               | `steel`              | Iron/Steel outcrops, Blacksmith stashes, Siege spoils                                            | Castle fortifications, Heavy Siege Bombers (`T1–T20`), Artillery                                 | Yes (Bulk Commodity Lot)                |
| **Copper**              | `copper`             | Copper veins, Quest completions, Sector tribute                                                  | Armory plating, Formation arrays, Garrison upkeep                                                | Yes (Bulk Commodity Lot)                |
| **Grain**               | `grain`              | Farmland nodes, Rain weather harvest boost (`+45%`)                                              | Army provisioning, Alchemy base herbs, Rally marches                                             | Yes (Bulk Commodity Lot)                |
| **Oil**                 | `oil`                | Storm/Volcanic oil wells, World Boss chests                                                      | Bomber munitions (`T10–T20`), Soulfire Cannons                                                   | Yes (Bulk Commodity Lot)                |
| **Kingdom Diamonds**    | `diamond`            | World Bosses, Open-World Lore Codex (`Biomes`/`Monsters`), Omniverse Tribute, VIP Stipends       | VIP Activation, Secret Realm Manual Rolls (`200 💎`), Skill Scroll Transcription, Instant Finish | Restricted (Auction Reserve Anchor)     |
| **Spirit Stones**       | `spiritStones`       | Disciple Proximity Cultivation Tax (`5%–20%`), Justice Bounties on Red-Name Fiends, VIP Stipends | Auction House currency, Pills & Formations, Sect Treasury                                        | Primary Marketplace Settlement Currency |
| **Scripture Fragments** | `scriptureFragments` | Secluded Deductions, Duplicate Manual comprehension, Daily Decree                                | Upgrading 12 Ancient Cultivation Manuals (`Lv. 1 → 10`), Direct Manual Unlocks (`40` frags)      | Bound (Non-Tradeable Progression)       |
| **Clan Honor Coins**    | `clanCoins`          | Alliance Vault donations, Co-op Void Leviathan milestone chests                                  | Clan Store boosts & Territory War Blessings (`handleActivateClanBuff`)                           | Bound to Alliance Ledger                |

---

## 3. Marketplace & Auction House Mechanics

The open-world marketplace (`AUCTION_HOUSE_MECHANICS.md`, `cultivationMath.ts`) anchors player-to-player liquidity while preventing hyperinflation through deterministic escrow and percentage sinks:

1. **Tradeable Marketplace Instruments**:
   - **Jade Skill Scrolls (`SkillScrollItem`)**: Created via `createTransmissionSkillScroll` from learned Mystical Powers (`skill_heaven_earth_sleeve`: `25,000` Spirit Stones base value; `skill_six_paths_seal`: `65,000`; `skill_sword_qi_meridian`: `180,000`; `skill_simulated_curse_book`: `500,000`).
   - **Cultivation Pills (`CULTIVATION_PILLS`)**: Qi Condensation, Foundation, Dragon Blood Temper, Core Condense, Nascent Soul, and Bodhi Heart breakthrough catalysts.
   - **Red-Name Loot Drop Spoils (`resolveRedNameDeathLootDrop`)**: Manuals, Spirit Pills, and Spirit Stone pouches recovered from defeated Red-Name fiends.
   - **Bulk Strategic Supply Crates**: Standardized bundles (`100K` / `1M` / `1B`) of `Wood`, `Steel`, `Copper`, `Grain`, and `Oil`.
2. **Escrow, Anti-Sniping & Sink Rules**:
   - **5% Marketplace Escrow Tax**: Automatically deducted from settled Spirit Stone proceeds upon lot completion (counteracting infinite passive disciple faucets).
   - **Atomic Escrow Reservation**: Buyer bids lock Spirit Stones into escrow immediately (`reserve >= currentHighestBid`); outbid balances refund atomically on replacement.
   - **Anti-Sniping Extension Window**: Bids placed within the final `60s` of a listing extend the auction timer by `+120s`.
   - **VIP Upgrade & Fee Synergy**: Active VIP tiers (`vipSubscription.ts`) grant up to **-35% Castle Upgrade Resource Discounts** (`celestial_sovereign`) and daily Diamond + Spirit Stone stipends.

---

## 4. Master–Disciple Economy & Karma Risk-Reward

- **Disciple Proximity Tax (`calculateMasterDiscipleEconomy`)**: Masters mentoring disciples within `50m` grant a `+40%` to `+200%` cultivation speed aura while collecting an adjustable `5%–50%` tax (default `20%`) on Spirit Stones and Qi generated per second.
- **Karma & Red-Name Market Bounty Loop**:
  - Unlawful PK against lower-realm Green-Name players marks the aggressor **Red Name**, reveals map coordinates, and places a **Spirit Stone Justice Bounty** (`realmGap × 50,000`).
  - Executing a Red-Name fiend awards Righteous Karma (`+150`) and pays out the Spirit Stone bounty to the enforcer, feeding liquid currency back into the marketplace.

---

## 5. Server Anti-Cheat & Economic Integrity Controls

To safeguard marketplace price stability in online multiplayer:

- **Progression Jump Clamping (`sanitizeCloudProfilePatch` in `src/game/antiCheat.ts`)**: `PUT /api/db/profile`, `PUT /api/db/save`, and `POST /api/online/sync` reject unauthorized jumps in `castleLevel`, `cultivationRealmIndex`, `vipTier`, or `garrisonTroopsWire` exceeding twice existing troop reserves (`flaggedViolations` logged to `securityAuditLog`).
- **Fail-Closed Firebase Auth (`requireAuth`)**: All Cloud SQL persistence routes validate signed Firebase ID tokens before touching `users`, `commander_profiles`, or `realm_saves`.
- **Single-Seat Operator Separation**: Standard players cannot self-grant `VIP 3`, spawn `T20` units, or bypass rally capacity (`250B` standard vs `1T` privileged).

---

## 6. Supreme Creator Economic & All-Things Immunity (`creatergame31@gmail.com`)

The verified Root Creator & Owner account **`creatergame31@gmail.com`** (`src/game/godModeCharacter.ts` · `src/game/adminModeration.ts`) holds **Maxed-Out God Sovereignty** with **Zero-Loss Immunity** across the entire economic and combat stack:

- **Maxed Treasury & Supply Ceiling**: `999,999,999,999,999` (`~1 Quadrillion`) across `Wood`, `Steel`, `Copper`, `Grain`, `Oil`, and `Diamonds`, plus `999,999,999,999,999` `Spirit Stones`, `999,999` `Scripture Fragments`, and `999` `Veteran Scrolls`.
- **Maxed Citadel & Army**: `Castle Level 100` (_Era X: Celestial Imperium_) and `1,000 Trillion` (`1,000,000,000,000,000`) `T20` Celestial Dreadnoughts.
- **Maxed Four-Path Cultivation & VIP**: Realm `22` (_Ultimate Origin Supreme Realm / 终元至高境界_) Layer `9` across `Qi`, `Body`, `Soul`, and `Mind`, all `12` Cultivation Manuals at `Lv. 10`, all `4` Mystical Power Skills, `12` Great Daos, and **VIP 3 (`Celestial Dao Sovereign` · Loyalty Lv. 15)**.
- **Zero-Loss Economic & Combat Immunity (`economy_costs_taxes_and_drain`)**: Immune to marketplace escrow fees, upkeep attrition, tribulation damage, Red-Name loot drops, curse debuffs, crowd control, realm suppression, and anti-cheat strike lockouts. This immunity is strictly gated via `isPrimaryAdminAccount(email)` and fails closed for all non-root accounts.
- **100 Supreme Omni-Attributes Codex (`GOD_OMNI_ATTRIBUTES` across 5 Divine Pillars)**: Unlocks all `100` Omni-Attributes (`20` per pillar across _Power, Authority & Creation_, _Knowledge, Wisdom & Vision_, _Presence, Space & Time_, _Goodness, Morality & Divine Nature_, and _Cosmic Unity & Volition_) exclusively for `creatergame31@gmail.com`.
