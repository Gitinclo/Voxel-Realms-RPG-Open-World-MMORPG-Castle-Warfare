# 🔍 Request & Packet Tracing Guide (`tracing.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

- WebSocket frames correlate via `tick`, `seq`, `ack`, `sector`, and 32-bit FNV-1a `stateHash`.
- Security audit events carry `aud_<uuid>` identifiers with ISO timestamps and actor roles.
