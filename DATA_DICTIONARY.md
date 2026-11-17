# 📚 Data Dictionary (`DATA_DICTIONARY.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

| Field / Column              | Type                | Location                                | Semantics & Bounds                                                                    |
| :-------------------------- | :------------------ | :-------------------------------------- | :------------------------------------------------------------------------------------ |
| `uid`                       | `text` / `varchar`  | `src/db/schema.ts`, Firestore           | Verified Firebase Auth UID (immutable owner key).                                     |
| `garrisonTroopsWire`        | `string` (`BigInt`) | `server.ts`, `siegeNetProtocol.ts`      | Decimal string representing `0` to `1,000,000,000,000,000` troops.                    |
| `castleLevel`               | `integer`           | `player_profiles`, `server.ts`          | Clamped strictly within `[0, 100]`.                                                   |
| `cultivationRealmIndex`     | `integer`           | `player_profiles`, `cultivationMath.ts` | Zero-based realm index `[0, 22]` (`Ultimate Origin Supreme Realm`).                   |
| `karma`                     | `integer`           | `player_profiles`, `cultivationMath.ts` | Signed morality meter; `< 0` activates Red Name bounty & lightning (`+100,000` God).  |
| `immuneToAllThings`         | `boolean`           | `src/game/godModeCharacter.ts`          | Fail-closed `true` only when `email === 'creatergame31@gmail.com' && godmodeEnabled`. |
| `activeOmniAttributesCount` | `integer`           | `src/game/godModeCharacter.ts`          | `100` across `5` Divine Pillars for `creatergame31@gmail.com` (`0` for all others).   |
| `stateHash`                 | `uint32`            | `SiegeNetEnvelope`                      | 32-bit FNV-1a checksum of authoritative sector cohorts.                               |
