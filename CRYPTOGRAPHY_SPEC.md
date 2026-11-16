# 🔐 Cryptography Specification (`CRYPTOGRAPHY_SPEC.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

- **HMAC-SHA256 + `crypto.timingSafeEqual`**: `HttpOnly` session cookies & passkey digest comparison (`serverAuth.ts`).
- **SHA-256**: Atomic save integrity envelopes (`serverPersistence.ts`).
- **32-bit FNV-1a**: High-speed state hashes & EULA acceptance receipts.
