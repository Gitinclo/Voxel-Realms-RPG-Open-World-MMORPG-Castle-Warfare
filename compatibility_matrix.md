# 💻 Cross-Platform Compatibility Matrix (`compatibility_matrix.md`)

> **Project:** Voxel Realms RPG (`v1.5.0` · `15/11/2026`) · **Root Authority:** [`creatergame31@gmail.com`](mailto:creatergame31@gmail.com)

Tested across **Desktop Ultra (`BC7` `1024px`)**, **Apple Silicon UMA (`128B` / `Metal 3`)**, **Console (`PS5` / `Xbox Series X|S`)**, **Mobile Touch (`390×844` `ASTC` `256px`)**, **Spatial VR (`WebXR` / `OpenXR`)**, and **Headless SwiftShader WebGL2** (`isSoftwareRenderer` fallback).

## Dedicated Platform Engineering Specifications (`9` Platforms)

| Platform Target                          | Specification File                             | Primary Graphics & Compute Profile                                          | Input & Display Ergonomics                               |
| :--------------------------------------- | :--------------------------------------------- | :-------------------------------------------------------------------------- | :------------------------------------------------------- |
| **Windows 11 / 10**                      | [`Windows.md`](./Windows.md)                   | `DirectX 12 Ultimate` / `Vulkan 1.3` · `x86_64 AVX-512` · `BC7` `1024px`    | Keyboard + Mouse, Ultrawide, `120–240 Hz`                |
| **PC Desktop & Handhelds**               | [`PC.md`](./PC.md)                             | `SoA` `64B` Cache-Line (`4.75x` speedup) · Lock-Free Job DAG (`2–64` cores) | Keyboard + Mouse, Gamepad, `60–240 Hz`                   |
| **PlayStation 5 / PS5 Pro**              | [`playstation.md`](./playstation.md)           | `GNM` / `GNMX` · Unified `16 GB` GDDR6 · `BC7` `1024px`                     | DualSense Adaptive Triggers & HD Haptics                 |
| **Xbox Series X\|S**                     | [`xbox.md`](./xbox.md)                         | `Microsoft GDK` · `DirectX 12 Ultimate` · DirectStorage + Quick Resume      | Xbox Wireless Controller & Impulse Triggers              |
| **macOS (Apple Silicon `M1`–`M4`)**      | [`mac.md`](./mac.md)                           | `Metal 3` · `128B` Cache-Line Zero-Copy `UMA` · ProMotion `120 Hz`          | Keyboard, Trackpad Gestures & Magic Mouse                |
| **Linux Desktop, SteamOS & Server**      | [`linux.md`](./linux.md)                       | `Vulkan 1.3` / `Mesa RADV` · `POSIX fsync` Atomic Server Persistence        | Keyboard + Mouse, Steam Deck Controls                    |
| **iOS & iPadOS**                         | [`iOS.md`](./iOS.md)                           | `Metal 3` `TBDR` · `ASTC 6x6` (`256px`/`512px`) · `8W` Passive Thermal      | Multi-Touch Virtual D-Pad & ProMotion                    |
| **Android Mobile, Tablet & Handheld**    | [`android.md`](./android.md)                   | `ARMv9 NEON + SVE2` Core Pinning · `Vulkan 1.3` · `ASTC 6x6`                | Multi-Touch Virtual D-Pad & Bluetooth Gamepad            |
| **Virtual Reality (`WebXR` / `OpenXR`)** | [`Virtual Reality.md`](./Virtual%20Reality.md) | `90–144 Hz` Stereoscopic WebGL2 · Foveated Rendering · `three-mesh-bvh`     | 6DoF Motion Controllers, Hand Pinch & Tabletop/1:1 Modes |
