# Seclusion, Meditation & Han Jue Passive Progression (`SECLUSION_AND_MEDITATION.md`)

Mechanics governing Secluded Cave Cultivation, Mind-Path multipliers, Spirit Stone consumption, and **Shadow Clone** delegation while cultivating safely behind warded formations (`src/game/cultivationMath.ts`).

---

## 1. The Seclusion Philosophy (Secluded Providence Doctrine)

Following the doctrine codified in `Four-Path Cultivation.md` and `LORE.md` (_Epoch IV_), wise cultivators avoid reckless open-world brawls until they achieve overwhelming **Realm Suppression** (`100.0x` across two major realms).

- **Static Meditation Gain**: Active meditation inside a Sovereign Citadel or Cave Sanctum multiplies base Qi/hour income by `(1 + mindPathBonus + auraDensity + formationBonus)`.
- **Offline / Background Yield**: Elapsed timestamps are clamped and verified against server time on reconnect (`antiCheat.ts` guards against backward/future system clock spoofing).

---

## 2. Avatar vs. Clone vs. Shadow Roles During Seclusion

- **Primary Avatar**: Remains physically seated inside the guarded Sect Formation, accumulating breakthrough progress without risking **Justice Bounties** or durability loss.
- **Shadow Action Mimics & Time Echoes (`avatarCloneShadow.ts`)**: Scouts ruins or patrols perimeter wards using delayed input echoes.
- **Tactical Clones**: Deployed outside seclusion barriers to bluff rival clans into believing the cultivator is away campaigning.

---

## 3. Mind Demons & Prolonged Isolation Penalties

Skipping **Mind Path (炼心)** temperance while rushing Qi breakthroughs triggers **Heart-Demon Doppelgänger Bosses** (`shadow_doppelganger_boss`), forcing the player's avatar to defeat a dark mirror of their own stats inside a solo trial before ascending (`MIND_DEMONS.md`).
