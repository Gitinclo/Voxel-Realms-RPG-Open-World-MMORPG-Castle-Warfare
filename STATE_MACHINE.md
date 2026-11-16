# 🔀 Core State Machines (`STATE_MACHINE.md`)

> **Project:** Voxel Realms RPG: Open World MMORPG & Castle Warfare (`v1.5.0` · `15/11/2026`)  
> **Sovereign Root Owner:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com) · **License:** Apache-2.0 (Source) / EULA v1.5.0 (Service)

1. **Siege Cohort Combat Posture**: `MARCHING` → `ENGAGING_MELEE` / `VOLLEY_FIRING` / `BOMBARDING_WALL` → `ROUTED_RETREAT`.
2. **NPC / Monster AI (`worldAI.ts`)**: `patrol` / `forage` → `aggro_pursue` → `flank_orbit` / `cast_telegraph` → `leashing_return`.
3. **Support Ticket Lifecycle (`firestore.rules` & `src/db/schema.ts`)**: `open` → `investigating` → `resolved` (user edits blocked once resolved).
4. **Anti-Cheat Violation State**: `clean (0..29)` → `flagged (30..99)` → `quarantined (>=100, GM pardon required)`.
