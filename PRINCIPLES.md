# ⚖️ Core Engineering Principles (`PRINCIPLES.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

| Principle                 | Concrete Practice in Voxel Realms RPG                                 | Enforcement Mechanism                   |
| :------------------------ | :-------------------------------------------------------------------- | :-------------------------------------- |
| **Strict Type Safety**    | `strict: true`, `noUnusedLocals`, `noUnusedParameters`                | `npm run lint` (`tsc --noEmit`)         |
| **Zero-Trust Security**   | Default-deny `firestore.rules`, HMAC cookies, CSRF, `__proto__` guard | `npm run lint:rules`, `verify:ops`      |
| **Atomic Persistence**    | Write temp → `fsyncSync` → `.bak` promote → POSIX rename + SHA-256    | `serverPersistence.test.ts`             |
| **Memory Discipline**     | Dispose Three.js geometries/materials; enforce C++20 smart pointers   | `clang-tidy`, `proceduralWorld.test.ts` |
| **Continuous Invariants** | **100 cross-system invariants** audited across 9 engine pillars       | `systemValidation.test.ts`              |
