# Forbidden Techniques & Cataclysmic Arts (`FORBIDDEN_TECHNIQUES.md`)

High-cost secret arts that exchange permanent lifespan, Karma stability, or **Mind Path** clarity for bursts of short-term combat supremacy in **Voxel Realms RPG (`v1.5.0`)**.

---

## 1. Classification of Forbidden Arts

1. **Blood-Burning Body Overdrive**: Sacrifices `35%` max HP and temporarily suppresses healing to double melee **Shieldbearer** / Body Path wall-breach damage for `12s`.
2. **Nine-Shadow Abyssal Split (`avatarCloneShadow.ts`)**: Overclocks Shadow Mimics past safe spiritual meridian load, briefly boosting echo mimic damage while triggering an immediate post-cast Qi exhaustion debuff.
3. **Soul-Severing Void Needle**: Pierces `100.0x` realm suppression defenses by `15%` against single targets, adding immediate negative Karma and spawning heightened **Mind Demon** intrusion odds.

---

## 2. Balance & Anti-Exploit Guardrails

- Forbidden techniques share strict **server-enforced cooldowns** inside `AuthoritativeAntiCheatEngine` (`src/game/antiCheat.ts`) so client packet flooding (`0x01`/`0x02`) cannot bypass meridian exhaustion penalties.
- Permanent cosmetic or account-breaking self-sabotage is prevented cleanly—debuffs recover cleanly after cooldown or temple cleansing without corrupting `BigInt` player stats.
