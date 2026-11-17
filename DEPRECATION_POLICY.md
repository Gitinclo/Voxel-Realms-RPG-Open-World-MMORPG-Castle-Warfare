# ⏳ API, Schema & Feature Deprecation Policy (`DEPRECATION_POLICY.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `17/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

1. **Notice Window**: Breaking REST (`/api/*`), WebSocket (`/ws/siege`), or save-schema changes require at least **one minor release (`>= 30 days`)** of deprecation warnings before removal.
2. **Protocol Versioning**: `SiegeNetEnvelope.v` versions binary/JSON frames safely; legacy clients receive clear `S2C_RECONCILIATION_FAULT` upgrade prompts rather than silent crashes.
3. **NPM Packages**: Deprecated dependencies are caught via CI `npm audit` and replaced during 3–4 feature refactor passes.
