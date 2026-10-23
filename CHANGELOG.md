# Changelog

All notable changes to the **Voxel Realms RPG** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Multiplayer WebSocket synchronization for guild-scale 50v50 castle sieges.
- Procedural dungeon delves with ancient Dao relics and heavenly tribulations.
- WebGPU compute shader upgrade for 10,000+ simultaneous flocking entities.

---

## [1.4.0] - 2026-03-20

### Added
- **Cultivation Realm & Suppression System**:
  - Implemented 4 cultivation paths: *Sword Immortal*, *Demonic Fiend*, *Heavenly Dao Priest*, and *Void Walker*.
  - Added 5 distinct cultivation realms: *Qi Refinement*, *Foundation Establishment*, *Golden Core*, *Nascent Soul*, and *Dao Creator*.
  - Realm suppression mathematical engine: higher realm cultivators deal up to 100x damage against lower realm cultivators (e.g. Golden Core vs Qi Refinement).
  - Distinctive visual aura indicators for each realm: faint white glow (Foundation), revolving golden core (Golden Core), miniature floating nascent soul avatar (Nascent Soul), and divine Great Dao halos (Dao Creator).
- **The Karma System (Justice vs Evil)**:
  - Dynamic Karma tracking with White/Green (Innocent), Yellow (Neutral), and Red (Sinful) states.
  - Slaying innocent green-name players turns karma negative, marking the offender with a Red Name.
  - *Tribulation Lightning*: Game engine randomly summons instant-death heavenly lightning upon static Red Name players who stay in place too long.
  - *Bounty Hunter Broadcasting*: Red Name coordinates are broadcast across realms to high-level Justice players.
  - *Loot Drop Penalty*: Red Name players suffer an 85% equipment drop risk upon defeat.
- **Social Structure: Master & Disciple**:
  - Replaced generic parties with hierarchical Master-Disciple bonds.
  - Proximity cultivation speed boost (+25% EXP gain) when disciples cultivate near their Master.
  - Configurable spirit stone taxation (5%–20%) funneled automatically from disciples to Masters.
  - Skill Transmission mechanic: Masters transcribe mastered rare skills (e.g. *Heaven Earth Sleeve*, *Nine Heavens Thunder*) into tradable Skill Scrolls.
- **Daily Login Reward System**:
  - 7-day cyclical login rewards calendar with guaranteed spirit stones, refinement diamonds, breakthrough pills, and celestial forge vouchers.
  - Special **Veteran Scroll** milestone reward on Day 7 granting permanent +15% cultivation speed.
  - Streak protection and local timestamp persistence.
- **C++20 High-Performance AI Architecture Reference**:
  - Authored clean C++20 engine reference implementation (`cpp20_realm_ai_system.hpp`) featuring `std::span`, concepts, memory pools, AVX2 SIMD pathfinding, and HDR10+ luminance metadata output.

### Changed
- Refactored HUD overlays into modular React 19 components with smooth Framer Motion transitions.
- Upgraded test suite to 50 comprehensive unit tests covering karma, cultivation suppression, master-disciple economy, and siege math.

---

## [1.3.0] - 2026-03-18

### Added
- **1000T Castle Warfare Engine**:
  - Heavy siege weapons: Battering Rams (1000T crushing force against gates), Trebuchets (long-range AOE wall bombardment), Ballistas (armor-piercing ballistics), and Siege Towers (infantry wall scaling).
  - Fortification physics: Castle Gates with 50,000 HP, Stone Wall segments with 35,000 HP, and Archer Towers with garrison defensive buffs.
  - Destructible debris physics simulated with WebGL particle bursts upon structure collapse.
  - Tactical troop formation commands: Shield Wall, Phalanx Advance, Wedge Charge, and Loose Skirmish.

### Changed
- Enhanced sound synthesis engine with positional acoustic feedback for siege impacts, boulder crashes, and horn signals.

---

## [1.2.0] - 2026-03-15

### Added
- **Infinite Lv 1–1000 Monster Ecosystem**:
  - Procedural stat scaling algorithm balancing HP, physical/magical attack, defense, and elemental affinities across 1000 levels.
  - Hierarchical monster classes: Minions, Elites, Champions, World Bosses, and Calamity Titans.
  - Dynamic AI Behavior Trees with states: `IDLE_GRAZE`, `PATROL`, `ALERT_STALK`, `TACTICAL_ENGAGE`, `FLEE_CALL_PACK`, and `ENRAGED_ULTIMATE`.
  - Environmental interaction: Monsters use cover, ambush from brush, and gain elemental buffs when submerged in water or near lava.

### Fixed
- Fixed bug where high-level elite mobs would tether incorrectly across chunk boundaries.

---

## [1.1.0] - 2026-03-12

### Added
- **Dual-Engine Interactive Architecture**:
  - Real-time Three.js 3D WebGL isometric battlefield rendered alongside high-density 2D tactical HUD overlays.
  - Procedural voxel terrain generation with biomes: Verdant Plains, Scorched Crags, Frozen Tundra, and Void Chasm.
  - Dynamic day/night illumination cycle with HDR tone mapping and bloom post-processing.
- **Web Audio API Sound Engine**:
  - Pure synthesizer-based sound effects with zero external MP3 dependencies (sword slashes, spell casting, level-up fanfares, siege impacts).

---

## [1.0.0] - 2026-03-10

### Added
- Initial public release of **Voxel Realms RPG**.
- Core player stat progression system (Vitality, Strength, Spirit, Agility, Luck).
- Grid inventory system with equipment slots, rarity tiers, and drag-and-drop tooltips.
- Real-time battle calculations and floating combat text.
- Full responsive interface built with React 19 and Tailwind CSS.
