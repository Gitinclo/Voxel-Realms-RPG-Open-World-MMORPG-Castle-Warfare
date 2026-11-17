# 📡 20Hz 50v50 Siege Wire Protocol Specification (`PROTOCOL_SPEC.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

Implemented in [`src/game/siegeNetProtocol.ts`](./src/game/siegeNetProtocol.ts):

- **Tick Rate**: `20Hz` (`50ms` authoritative step).
- **Opcodes**: `0x01 C2S_TROOP_POSITION_CMD`, `0x02 C2S_RALLY_ACTION_CMD`, `0x10 S2C_FULL_SIEGE_SNAPSHOT`, `0x11 S2C_DELTA_SIEGE_UPDATE`, `0x12 S2C_RALLY_STATUS_SYNC`, `0x13 S2C_RECONCILIATION_FAULT`.
- **Spatial Compression**: Coordinates quantized to `int16` at `0.01m` resolution (`[-327.68m, +327.67m]`).
- **Delta Bitmask**: `CohortDirtyBit` transmits only mutated cohort properties to minimize per-tick wire bytes.
