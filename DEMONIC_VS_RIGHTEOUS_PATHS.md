# Demonic vs. Righteous Cultivation Paths (`DEMONIC_VS_RIGHTEOUS_PATHS.md`)

Moral alignment, Karma divergence (`src/game/cultivationMath.ts`), **Red-Name Tribulation Lightning**, and tactical trade-offs between Righteous Orthodox Sects and Demonic Bloodline Cultivators.

---

## 1. Karma Spectrum & Alignment States

| Alignment Tier                   | Karma Threshold | World State & Visual Cue                       | Mechanics & Risk Profile                                         |
| :------------------------------- | :-------------- | :--------------------------------------------- | :--------------------------------------------------------------- |
| **Heaven-Blessed Righteous**     | `Karma >= +500` | Golden lotus aura (`HeroModal` / 3D ring)      | Reduced Heavenly Tribulation intensity, NPC Guardian defense aid |
| **Balanced Secluded**            | `-1 .. +499`    | Neutral azure cultivator glow                  | Standard resource taxes, flexible Faction diplomacy              |
| **Notorious Red Name (Demonic)** | `Karma < 0`     | Pulsing crimson Red-Name ring visible globally | **Targeted by Justice Bounties**, full loot drop risk on death   |

---

## 2. Risk vs. Reward Asymmetry

- **Righteous Path**: Steady, predictable compounding gains via Master-Disciple lineage buffs, VIP Alliance stipends, and Caravan protection contracts.
- **Demonic Path**: Rapid short-term plunder of fallen cultivators' Spirit Stones and accelerated Body/Blood refinement, offset by relentless **Heavenly Tribulation Lightning** that strikes any stationary Red-Name player lingering within a 5-unit radius for `> 3.5 seconds` (`CONTRIBUTING.md`, `cultivationMath.ts`).

---

## 3. Redemption & Karma Cleansing

- Red-Name players can slowly rehabilitate negative Karma by completing **Slay Abyssal Monster** bounties, paying Kingdom reparations, or cultivating **Mind Path** penance scrolls away from populated zones.
