# 🧩 Domain Model Specification (`DOMAIN_MODEL.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

| Aggregate Root              | Primary Source                                           | Core Invariants                                                                                                   |
| :-------------------------- | :------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **Kingdom & Citadel**       | `src/game/math.ts`                                       | Castle Lv `0..100`; max garrison `1,000T` (`10n**15n`); rally cap `1T` (`10n**12n`).                              |
| **Cultivator (4 Paths)**    | `src/game/cultivationMath.ts`                            | 23 realms × 9 layers across Qi/Body/Soul/Mind; `100.0x` suppression; Karma Red-Name triggers.                     |
| **Creator God Character**   | `src/game/godModeCharacter.ts`                           | Fail-closed `12`-Domain Immunity, `100` Omni-Attributes (`5` Pillars) & Maxed Preset (`creatergame31@gmail.com`). |
| **Economy & Marketplace**   | `in-game- economy -marketplace.md`, `vipSubscription.ts` | 8 Kingdom/Cultivation currencies + Clan Honor Coins; `5%` auction levy; `BigInt` zero-overflow.                   |
| **Avatar / Clone / Shadow** | `src/game/avatarCloneShadow.ts`                          | `<=3` clones & `<=2` shadows per Avatar; 50-player raid entity budget `<=250` at `20Hz`.                          |
| **6-Tier Cosmology**        | `src/game/omniverse.ts`                                  | Singleton `WhitePageRoot` (Tier 6) → bounded `100` `Overvoid` (Tier 5) → `Infinity` Tiers 1–4.                    |
| **Authoritative Siege**     | `src/game/siegeNetProtocol.ts`                           | `int16` `0.01m` coordinates, `BigIntWireString`, 32-bit FNV-1a `stateHash`.                                       |
