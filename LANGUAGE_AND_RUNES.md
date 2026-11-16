# Ancient Languages, Runic Scripts & Talisman Glyphs (`LANGUAGE_AND_RUNES.md`)

Lore typography, primordial Daoist rune classifications, and bilingual terminology bridges across **Voxel Realms RPG (`v1.5.0`)**.

---

## 1. Runic & Script Families in Solara

| Script Name                       | Origin Layer / Species                              | Primary In-Game Surface                                               |
| :-------------------------------- | :-------------------------------------------------- | :-------------------------------------------------------------------- |
| **White Page Authorial Script**   | Tier 6 `THE_WHITE_PAGE` (`creatergame31@gmail.com`) | Layer-6 Decrees & Golden Frame headers in `CosmologicalAdminModal`    |
| **Han Jue Four-Path Seal Glyphs** | Xianxia Lineage (`炼气 · 炼体 · 炼魂 · 炼心`)       | Cultivation Path insignias, Veteran Scrolls, and Tribulation circles  |
| **Ironforge Runic Geometry**      | `ironforge_dwarf` & `crystalline_golem`             | Runic dwarf beards, golem core reactors, and Citadel keep foundations |
| **Void-Script Tessellations**     | `void_walker` & Abyssal Bracket (Lv. 501–800)       | Spatial anchor glyphs around teleport gates and Sector `C3`           |

---

## 2. Unicode & Localization Handling (`localization_qa.md`)

- Client and server MIME pipelines (`src/lib/gmail.ts`) encode multilingual glyphs using UTF-8 Base64URL round-tripping with CRLF header sanitization.
- UI overlays render clean CJK cultivation path subtitle pairs alongside English labels without clipped HUD bounds across `1440x900` desktop and `390x844` mobile viewports.
