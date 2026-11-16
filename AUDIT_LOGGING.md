# 🧾 Security Audit Logging Specification (`AUDIT_LOGGING.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

Logs `id`, `timestampIso`, `eventType`, `actorEmail`, `actorRole`, `outcome`, and `detail` into the persistent `securityAuditLog` ring buffer (`<=500` entries, staff-only `GET /api/admin/state`).
