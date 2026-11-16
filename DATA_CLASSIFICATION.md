# 🏷️ Data Classification Standard (`DATA_CLASSIFICATION.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

- **Restricted**: Secrets & OAuth tokens (never on client disk).
- **Confidential (PII)**: Emails, UIDs & tickets (isolated in Cloud SQL / Firestore private subcollections; redacted publicly).
- **Public**: Rankings, lore codex, species catalogs.
