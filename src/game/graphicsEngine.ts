/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherType } from './weather';

export type GraphicsQualityPreset = 'ultra' | 'high' | 'balanced';

export interface AtmosphericSkyParams {
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
  sunElevationDeg: number;
  sunAzimuthDeg: number;
  exposure: number;
  sunLightHex: number;
  sunLightIntensity: number;
  hemiSkyHex: number;
  hemiGroundHex: number;
  hemiIntensity: number;
  rimLightHex: number;
  rimLightIntensity: number;
  fogHex: number;
  fogDensity: number;
  starfieldOpacity: number;
  godRayIntensity: number;
}

export interface PostProcessProfile {
  enableComposer: boolean;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  saturationBoost: number;
  contrastBoost: number;
  vibranceBoost: number;
  sharpenStrength: number;
  vignetteDarkness: number;
  chromaticAberration: number;
  rimLightShaderStrength: number;
  shadowMapSize: number;
}

export interface SurfaceWetnessParams {
  roadRoughness: number;
  roadClearcoat: number;
  stoneRoughness: number;
  stoneClearcoat: number;
  waterWaveHeight: number;
  windSwayStrength: number;
}

export interface MeshAndTextureBudget {
  textureResolutionPx: number;
  anisotropySamples: number;
  waterGridSegments: number;
  foliageSubdivisionDetail: number;
  radialCylinderSegments: number;
  bevelSegments: number;
  grassTuftInstanceCount: number;
  normalMapIntensity: number;
  estimatedSceneTriangles: number;
}

/**
 * Computes physical Rayleigh/Mie sky scattering, color-temperature lighting,
 * and fog parameters inspired by GTA V (Preetham physical atmosphere) and
 * Genshin Impact (vibrant cel-sky gradients & golden-hour warmth).
 */
export function computeAtmosphericSkyParams(
  timeOfDayHours: number,
  weather: WeatherType,
  quality: GraphicsQualityPreset
): AtmosphericSkyParams {
  const hour = ((timeOfDayHours % 24) + 24) % 24;
  const sunAngleRad = ((hour - 6) / 24) * Math.PI * 2;
  const sinElev = Math.sin(sunAngleRad);
  const sunElevationDeg = Math.asin(Math.max(-1, Math.min(1, sinElev))) * (180 / Math.PI);
  const sunAzimuthDeg = ((hour / 24) * 360 + 110) % 360;

  const isNight = sinElev < -0.05;
  const isGoldenHour = sinElev >= -0.05 && sinElev < 0.34;

  // Weather multipliers
  const isStorm = weather === 'storm';
  const isRain = weather === 'rain';
  const isSnow = weather === 'snow';

  const weatherSunlightMult = isStorm ? 0.42 : isRain ? 0.62 : isSnow ? 0.85 : 1.0;

  let turbidity = 2.4;
  let rayleigh = 1.65;
  let mieCoefficient = 0.0035;
  let mieDirectionalG = 0.84;
  let exposure = 0.96;

  let sunLightHex = 0xfff8e7;
  let sunLightIntensity = 2.1 * weatherSunlightMult;
  let hemiSkyHex = 0x7dd3fc;
  let hemiGroundHex = 0x1e293b;
  let hemiIntensity = 0.82 * weatherSunlightMult;
  let rimLightHex = 0x38bdf8;
  let rimLightIntensity = 0.65;
  let fogHex = 0x93c5fd;
  let fogDensity = 0.0065;
  let starfieldOpacity = 0;
  let godRayIntensity = 0.22 * weatherSunlightMult;

  if (isNight) {
    turbidity = 1.2;
    rayleigh = 0.35;
    mieCoefficient = 0.002;
    mieDirectionalG = 0.75;
    exposure = 0.9;
    sunLightHex = 0x818cf8;
    sunLightIntensity = 0.45 * weatherSunlightMult;
    hemiSkyHex = 0x312e81;
    hemiGroundHex = 0x0f172a;
    hemiIntensity = 0.54 * weatherSunlightMult;
    rimLightHex = 0x60a5fa;
    rimLightIntensity = 0.95;
    fogHex = 0x0b1120;
    fogDensity = 0.0085;
    starfieldOpacity = Math.min(1.0, Math.abs(sinElev) * 2.2);
    godRayIntensity = 0.08;
  } else if (isGoldenHour) {
    // GTA V / Genshin Liyue sunset & sunrise golden-hour scattering
    turbidity = 6.2;
    rayleigh = 2.75;
    mieCoefficient = 0.0085;
    mieDirectionalG = 0.88;
    exposure = 0.98;
    sunLightHex = 0xff9e44;
    sunLightIntensity = 1.85 * weatherSunlightMult;
    hemiSkyHex = 0xfdba74;
    hemiGroundHex = 0x311b2c;
    hemiIntensity = 0.76 * weatherSunlightMult;
    rimLightHex = 0xfbbf24;
    rimLightIntensity = 0.85;
    fogHex = 0xfb923c;
    fogDensity = 0.0078;
    starfieldOpacity = Math.max(0, (0.12 - sinElev) * 2.5);
    godRayIntensity = 0.34 * weatherSunlightMult;
  } else {
    // High-altitude Teyvat / Los Santos clear daylight (calibrated to prevent washout)
    turbidity = isStorm || isRain ? 9.5 : 2.1;
    rayleigh = isStorm || isRain ? 0.85 : 1.65;
    mieCoefficient = isStorm ? 0.012 : 0.0032;
    mieDirectionalG = 0.84;
    exposure = 0.96;
    sunLightHex = isSnow ? 0xe0f2fe : 0xfffbeb;
    sunLightIntensity = 2.15 * weatherSunlightMult;
    hemiSkyHex = isStorm ? 0x475569 : isSnow ? 0xbae6fd : 0x60a5fa;
    hemiGroundHex = isSnow ? 0x334155 : 0x1e293b;
    hemiIntensity = 0.84 * weatherSunlightMult;
    rimLightHex = 0x38bdf8;
    rimLightIntensity = 0.62;
    fogHex = isStorm ? 0x1e293b : isRain ? 0x334155 : isSnow ? 0xcbd5e1 : 0x93c5fd;
    fogDensity = isStorm ? 0.014 : isRain ? 0.011 : isSnow ? 0.0095 : 0.0058;
    starfieldOpacity = 0;
    godRayIntensity = 0.22 * weatherSunlightMult;
  }

  if (quality === 'balanced') {
    fogDensity *= 1.15;
    godRayIntensity *= 0.5;
  }

  return {
    turbidity,
    rayleigh,
    mieCoefficient,
    mieDirectionalG,
    sunElevationDeg,
    sunAzimuthDeg,
    exposure,
    sunLightHex,
    sunLightIntensity,
    hemiSkyHex,
    hemiGroundHex,
    hemiIntensity,
    rimLightHex,
    rimLightIntensity,
    fogHex,
    fogDensity,
    starfieldOpacity,
    godRayIntensity,
  };
}

/**
 * Returns post-processing & shader configuration for each GraphicsQualityPreset.
 * - 'ultra': Full GTA V + Genshin Impact Next-Gen HDR (ACES Filmic + Controlled Bloom + Color Grading + Sharpen + Rim Light)
 * - 'high': Stylized High PBR + Subtle Bloom + Rim Light
 * - 'balanced': Fast 60 FPS Direct Render
 */
export function getPostProcessProfile(quality: GraphicsQualityPreset): PostProcessProfile {
  switch (quality) {
    case 'ultra':
      return {
        enableComposer: true,
        bloomStrength: 0.18,
        bloomRadius: 0.28,
        bloomThreshold: 0.92,
        saturationBoost: 1.16,
        contrastBoost: 1.09,
        vibranceBoost: 0.18,
        sharpenStrength: 0.35,
        vignetteDarkness: 0.26,
        chromaticAberration: 0.001,
        rimLightShaderStrength: 0.42,
        shadowMapSize: 2048,
      };
    case 'high':
      return {
        enableComposer: true,
        bloomStrength: 0.11,
        bloomRadius: 0.22,
        bloomThreshold: 0.94,
        saturationBoost: 1.12,
        contrastBoost: 1.06,
        vibranceBoost: 0.12,
        sharpenStrength: 0.18,
        vignetteDarkness: 0.2,
        chromaticAberration: 0.0,
        rimLightShaderStrength: 0.32,
        shadowMapSize: 2048,
      };
    case 'balanced':
    default:
      return {
        enableComposer: false,
        bloomStrength: 0,
        bloomRadius: 0,
        bloomThreshold: 1.0,
        saturationBoost: 1.05,
        contrastBoost: 1.02,
        vibranceBoost: 0.05,
        sharpenStrength: 0,
        vignetteDarkness: 0,
        chromaticAberration: 0,
        rimLightShaderStrength: 0.2,
        shadowMapSize: 1024,
      };
  }
}

/**
 * Computes dynamic PBR wet-surface reflections (GTA V rain puddle speculars)
 * and Genshin wind/wave animation intensities based on active weather.
 */
export function computeSurfaceWetnessParams(weather: WeatherType): SurfaceWetnessParams {
  if (weather === 'storm') {
    return {
      roadRoughness: 0.12,
      roadClearcoat: 0.95,
      stoneRoughness: 0.22,
      stoneClearcoat: 0.85,
      waterWaveHeight: 0.22,
      windSwayStrength: 1.85,
    };
  }
  if (weather === 'rain') {
    return {
      roadRoughness: 0.16,
      roadClearcoat: 0.88,
      stoneRoughness: 0.28,
      stoneClearcoat: 0.72,
      waterWaveHeight: 0.14,
      windSwayStrength: 1.35,
    };
  }
  if (weather === 'snow') {
    return {
      roadRoughness: 0.72,
      roadClearcoat: 0.35,
      stoneRoughness: 0.68,
      stoneClearcoat: 0.3,
      waterWaveHeight: 0.05,
      windSwayStrength: 0.9,
    };
  }
  return {
    roadRoughness: 0.48,
    roadClearcoat: 0.28,
    stoneRoughness: 0.56,
    stoneClearcoat: 0.22,
    waterWaveHeight: 0.09,
    windSwayStrength: 0.75,
  };
}

/**
 * Computes deterministic high-polygon mesh tessellation and multi-channel PBR texture budgets
 * for each graphics preset.
 */
export function computeMeshAndTextureBudget(quality: GraphicsQualityPreset): MeshAndTextureBudget {
  switch (quality) {
    case 'ultra':
      return {
        textureResolutionPx: 1024,
        anisotropySamples: 16,
        waterGridSegments: 96,
        foliageSubdivisionDetail: 2,
        radialCylinderSegments: 24,
        bevelSegments: 4,
        grassTuftInstanceCount: 800,
        normalMapIntensity: 1.15,
        estimatedSceneTriangles: 245_000,
      };
    case 'high':
      return {
        textureResolutionPx: 512,
        anisotropySamples: 8,
        waterGridSegments: 64,
        foliageSubdivisionDetail: 1,
        radialCylinderSegments: 16,
        bevelSegments: 2,
        grassTuftInstanceCount: 520,
        normalMapIntensity: 0.85,
        estimatedSceneTriangles: 142_000,
      };
    case 'balanced':
    default:
      return {
        textureResolutionPx: 256,
        anisotropySamples: 4,
        waterGridSegments: 32,
        foliageSubdivisionDetail: 1,
        radialCylinderSegments: 12,
        bevelSegments: 1,
        grassTuftInstanceCount: 320,
        normalMapIntensity: 0.5,
        estimatedSceneTriangles: 78_000,
      };
  }
}

export type TargetPlatform = 'pc_console' | 'mobile';
export type TextureCompressionFormat = 'BC7' | 'ASTC';

export interface MasterTextureOverrideSpec {
  masterSourceResolutionPx: 4096;
  targetPlatform: TargetPlatform;
  maxPlatformResolutionPx: 4096 | 2048 | 1024 | 512;
  runtimeCanvasResolutionPx: 1024 | 512 | 256;
  compressionFormat: TextureCompressionFormat;
  compressionLabel: string;
  anisotropySamples: number;
  singleMasterSourceMaintained: true;
}

export interface LodTierSpec {
  lodIndex: 0 | 1 | 2 | 3;
  name: string;
  targetPolygonBudget: number;
  minDistanceMeters: number;
  radialSegments: number;
  subdivisionDetail: number;
  bevelSegments: number;
}

export interface LodChainPolicy {
  platform: TargetPlatform;
  lodBias: number;
  skipLod0InMemory: boolean;
  highestLoadedLodIndex: 0 | 1 | 2;
  activeChain: LodTierSpec[];
  memorySavedMb: number;
}

export interface LightingStrategySpec {
  mode: 'realtime_gi_hybrid' | 'baked_lightmap_mobile';
  enableRealtimeGI: boolean;
  enableDynamicSoftShadows: boolean;
  enableVolumetricFog: boolean;
  useBakedLightmaps: boolean;
  smallPropCastShadows: boolean;
  bakedLightmapIntensity: number;
}

export interface UberShaderKeywordConfig {
  shaderName: string;
  USE_RIM_LIGHT: boolean;
  USE_DETAIL_NORMALS: boolean;
  USE_PARALLAX_OCCLUSION: boolean;
  USE_SUBSURFACE_SCATTERING: boolean;
  activeMacroDefines: string[];
  mathComplexity: 'full_pbr_console' | 'simplified_mobile_alu';
}

export interface DeploymentBundleManifest {
  platform: TargetPlatform;
  baseBuildSizeMb: number;
  exceedsMobile2GbThreshold: boolean;
  hdAddressablePack: {
    packId: string;
    sizeMb: number;
    includes4kTextures: boolean;
    includesLod0HeroMeshes: boolean;
    isOptionalDownloadOnMobile: boolean;
    isMounted: boolean;
  };
  effectiveTotalInstallMb: number;
}

/**
 * 1. The "Master Asset" Workflow (Textures)
 * Maintains a single 4K (4096px) Master Source definition and applies Platform Overrides:
 * - PC/PS5/Xbox ('pc_console'): Max resolution 4096 or 2048, Format: BC7 (High Quality compressed).
 * - Mobile ('mobile' - Android/iOS): Max resolution 1024 or 512, Format: ASTC (High Compression).
 */
export function computeMasterTextureImportOverride(
  platform: TargetPlatform,
  quality: GraphicsQualityPreset,
  hdPackMounted: boolean = false
): MasterTextureOverrideSpec {
  if (platform === 'pc_console') {
    const isUltra = quality === 'ultra';
    return {
      masterSourceResolutionPx: 4096,
      targetPlatform: 'pc_console',
      maxPlatformResolutionPx: isUltra ? 4096 : 2048,
      runtimeCanvasResolutionPx: isUltra ? 1024 : 512,
      compressionFormat: 'BC7',
      compressionLabel: 'BC7 (High Quality Block Compression · 8bpp)',
      anisotropySamples: isUltra ? 16 : 8,
      singleMasterSourceMaintained: true,
    };
  }

  // Mobile (Android / iOS) Platform Override
  const useHighMobileRes = hdPackMounted || quality === 'ultra';
  return {
    masterSourceResolutionPx: 4096,
    targetPlatform: 'mobile',
    maxPlatformResolutionPx: useHighMobileRes ? 1024 : 512,
    runtimeCanvasResolutionPx: hdPackMounted ? 1024 : useHighMobileRes ? 512 : 256,
    compressionFormat: 'ASTC',
    compressionLabel: 'ASTC 6x6 (Adaptive Scalable High Compression)',
    anisotropySamples: hdPackMounted ? 8 : 4,
    singleMasterSourceMaintained: true,
  };
}

/**
 * 2. Geometry & LOD Scaling (Meshes)
 * Defines the 4-tier Aggressive LOD Chain (LOD 0: 75k Hero, LOD 1: 25k, LOD 2: 10k Mobile Standard, LOD 3: 2k Distant)
 * and applies Platform LOD Bias:
 * - PC/Console: LOD Bias = 0 (favors LOD 0/1).
 * - Mobile: LOD Bias = +1 or +2 (skips LOD 0 entirely unless HD Pack is mounted, saving RAM/VRAM).
 */
export function computeLodChainPolicy(
  platform: TargetPlatform,
  quality: GraphicsQualityPreset,
  hdPackMounted: boolean = false
): LodChainPolicy {
  const fullChain: LodTierSpec[] = [
    {
      lodIndex: 0,
      name: 'LOD 0 (The Hero · Close-Up PC/PS5/Xbox)',
      targetPolygonBudget: 75_000,
      minDistanceMeters: 0,
      radialSegments: 24,
      subdivisionDetail: 2,
      bevelSegments: 4,
    },
    {
      lodIndex: 1,
      name: 'LOD 1 (PC/Console Mid-Range & High-End Tablet)',
      targetPolygonBudget: 25_000,
      minDistanceMeters: 18,
      radialSegments: 16,
      subdivisionDetail: 1,
      bevelSegments: 2,
    },
    {
      lodIndex: 2,
      name: 'LOD 2 (Standard Mobile Mesh)',
      targetPolygonBudget: 10_000,
      minDistanceMeters: 38,
      radialSegments: 10,
      subdivisionDetail: 0,
      bevelSegments: 1,
    },
    {
      lodIndex: 3,
      name: 'LOD 3 (Distant Mobile / Horizon Proxy)',
      targetPolygonBudget: 2_000,
      minDistanceMeters: 68,
      radialSegments: 6,
      subdivisionDetail: 0,
      bevelSegments: 0,
    },
  ];

  if (platform === 'pc_console') {
    return {
      platform: 'pc_console',
      lodBias: 0,
      skipLod0InMemory: false,
      highestLoadedLodIndex: 0,
      activeChain: fullChain,
      memorySavedMb: 0,
    };
  }

  // Mobile Platform: Skip LOD 0 in base mobile build so the phone never loads the 75k-100k mesh into memory
  const lodBias = quality === 'balanced' && !hdPackMounted ? 2 : 1;
  const skipLod0 = !hdPackMounted;
  const filtered = skipLod0
    ? fullChain
        .filter((tier) => tier.lodIndex >= lodBias)
        .map((tier, idx) => ({
          ...tier,
          minDistanceMeters: idx === 0 ? 0 : idx === 1 ? 26 : 52,
        }))
    : fullChain;

  return {
    platform: 'mobile',
    lodBias: skipLod0 ? lodBias : 0,
    skipLod0InMemory: skipLod0,
    highestLoadedLodIndex: skipLod0 ? (lodBias as 1 | 2) : 0,
    activeChain: filtered,
    memorySavedMb: skipLod0 ? (lodBias === 2 ? 92.4 : 68.0) : 0,
  };
}

/**
 * 3. Lighting Strategies (The Visual Gap)
 * - High-End (PC/PS5/Xbox): Hybrid Approach — Base Baked Lightmap + Real-time GI + Dynamic Soft Shadows + Volumetric Fog + Small-Prop Shadows enabled.
 * - Mobile/Switch: Real-time GI disabled, Baked Lightmaps painted onto surfaces, and "Cast Shadows" disabled on all small debris/props.
 */
export function computeLightingStrategy(
  platform: TargetPlatform,
  quality: GraphicsQualityPreset
): LightingStrategySpec {
  if (platform === 'pc_console' && quality !== 'balanced') {
    return {
      mode: 'realtime_gi_hybrid',
      enableRealtimeGI: true,
      enableDynamicSoftShadows: true,
      enableVolumetricFog: true,
      useBakedLightmaps: true, // Hybrid base baked lighting + real-time shadows layered on top
      smallPropCastShadows: true,
      bakedLightmapIntensity: 0.75,
    };
  }

  return {
    mode: 'baked_lightmap_mobile',
    enableRealtimeGI: false,
    enableDynamicSoftShadows: false,
    enableVolumetricFog: false,
    useBakedLightmaps: true,
    smallPropCastShadows: false, // Disable "Cast Shadows" on all small debris/props for Mobile
    bakedLightmapIntensity: 1.15,
  };
}

/**
 * 4. Shader & Material Management ("Uber Shader" Keywords/Variants)
 * One unified Uber Shader that switches expensive features via keywords:
 * - Mobile: Turns off Rim Lighting, Detail Normals, Parallax Occlusion, and Sub-surface Scattering.
 * - Console/PC: Enables all expensive visual effects.
 */
export function computeUberShaderKeywords(
  platform: TargetPlatform,
  quality: GraphicsQualityPreset,
  hdPackMounted: boolean = false
): UberShaderKeywordConfig {
  const enableHighEndFeatures =
    (platform === 'pc_console' && quality !== 'balanced') ||
    (platform === 'mobile' && hdPackMounted && quality === 'ultra');

  const activeMacroDefines: string[] = [];
  if (enableHighEndFeatures) {
    activeMacroDefines.push(
      'USE_RIM_LIGHT',
      'USE_DETAIL_NORMALS',
      'USE_PARALLAX_OCCLUSION',
      'USE_SUBSURFACE_SCATTERING'
    );
  }

  return {
    shaderName: 'VoxelRealms_UnifiedUberShader_v2',
    USE_RIM_LIGHT: enableHighEndFeatures,
    USE_DETAIL_NORMALS: enableHighEndFeatures,
    USE_PARALLAX_OCCLUSION: enableHighEndFeatures,
    USE_SUBSURFACE_SCATTERING: enableHighEndFeatures,
    activeMacroDefines,
    mathComplexity: enableHighEndFeatures ? 'full_pbr_console' : 'simplified_mobile_alu',
  };
}

/**
 * 5. Deployment & Build Size (Asset Bundles / Addressables)
 * - Console/PC: Includes all 4K textures and LOD 0 high-poly meshes (~68.4 GB install).
 * - Mobile: Base build stays well under 2GB (640 MB) by marking 4K textures and LOD 0 meshes
 *   as an optional "HighDefinition" Addressable Content Pack inside the app.
 */
export function computeDeploymentBundleManifest(
  platform: TargetPlatform,
  hdPackMounted: boolean = false
): DeploymentBundleManifest {
  const hdPackSizeMb = 3_850; // 3.85 GB HighDefinition Addressable Content Pack
  if (platform === 'pc_console') {
    const basePcMb = 64_550;
    return {
      platform: 'pc_console',
      baseBuildSizeMb: basePcMb,
      exceedsMobile2GbThreshold: false,
      hdAddressablePack: {
        packId: 'HighDefinition_4K_LOD0_Pack',
        sizeMb: hdPackSizeMb,
        includes4kTextures: true,
        includesLod0HeroMeshes: true,
        isOptionalDownloadOnMobile: false,
        isMounted: true,
      },
      effectiveTotalInstallMb: basePcMb + hdPackSizeMb, // 68.4 GB
    };
  }

  // Mobile base build is 640 MB (< 2048 MB threshold)
  const mobileBaseMb = 640;
  return {
    platform: 'mobile',
    baseBuildSizeMb: mobileBaseMb,
    exceedsMobile2GbThreshold: mobileBaseMb > 2048,
    hdAddressablePack: {
      packId: 'HighDefinition_4K_LOD0_Pack',
      sizeMb: hdPackSizeMb,
      includes4kTextures: true,
      includesLod0HeroMeshes: true,
      isOptionalDownloadOnMobile: true,
      isMounted: hdPackMounted,
    },
    effectiveTotalInstallMb: mobileBaseMb + (hdPackMounted ? hdPackSizeMb : 0),
  };
}

/**
 * Human-readable label for HUD badge and toast notifications
 */
export function getGraphicsPresetMetadata(
  quality: GraphicsQualityPreset,
  platform: TargetPlatform = 'pc_console',
  hdPackMounted: boolean = false
): {
  shortBadge: string;
  title: string;
  toastDescription: string;
} {
  const texOverride = computeMasterTextureImportOverride(platform, quality, hdPackMounted);
  const lodPolicy = computeLodChainPolicy(platform, quality, hdPackMounted);

  if (platform === 'mobile') {
    return {
      shortBadge: `MOBILE (${texOverride.compressionFormat} ${texOverride.maxPlatformResolutionPx}PX · LOD ${lodPolicy.highestLoadedLodIndex}${hdPackMounted ? ' · HD PACK' : ''})`,
      title: `Mobile Pipeline: ${texOverride.compressionFormat} ${texOverride.maxPlatformResolutionPx}px Override + LOD Bias +${lodPolicy.lodBias} + Baked Lightmaps`,
      toastDescription: `📱 Platform: MOBILE (${texOverride.compressionFormat} ${texOverride.maxPlatformResolutionPx}px · Skips LOD 0 [-${lodPolicy.memorySavedMb}MB RAM] · Baked Lightmap · Base Build 640MB)`,
    };
  }

  switch (quality) {
    case 'ultra':
      return {
        shortBadge: 'NEXT-GEN ULTRA (BC7 4K · LOD 0 · 245K POLY)',
        title:
          'Next-Gen Ultra (PC/PS5/Xbox): 1024px WebGL2 Procedural PBR (4K BC7 Target Model) + LOD 0 Hero Meshes + HDR Bloom & Uber Shader',
        toastDescription:
          '✨ Graphics: NEXT-GEN ULTRA (1024px Procedural PBR [4K BC7 Target] + LOD 0 Hero Meshes + Dynamic Soft Shadows + Full Uber Shader)',
      };
    case 'high':
      return {
        shortBadge: 'HIGH (BC7 2K · LOD 0/1 · 142K POLY)',
        title:
          'High Quality (PC/Console): 512px WebGL2 Procedural PBR (2K BC7 Target Model) + LOD 0/1 Chain + Soft Shadows',
        toastDescription:
          '🎨 Graphics: HIGH (512px Procedural PBR [2K BC7 Target] + LOD 0/1 Chain + Teyvat Stylized PBR + Soft Shadows)',
      };
    case 'balanced':
    default:
      return {
        shortBadge: 'BALANCED (60 FPS · 78K POLY)',
        title: 'Balanced Mode: 256px WebGL2 Procedural PBR + 60 FPS Direct Render Pipeline',
        toastDescription: '⚡ Graphics: BALANCED (256px Procedural PBR · 60 FPS Direct Render)',
      };
  }
}

// ============================================================================
// ENGINEERING TRANSPARENCY MATRIX: IMPLEMENTED vs. SIMULATED vs. PLANNED
// ============================================================================

export type FeatureImplementationStatus = 'implemented' | 'simulated' | 'planned';

export type TransparencyDomainCategory =
  | 'textures_materials'
  | 'geometry_lod'
  | 'lighting_shadows'
  | 'shaders_postfx'
  | 'packaging_platform'
  | 'cpu_ecs_architecture'
  | 'gameplay_simulation'
  | 'persistence_networking';

export interface EngineeringTransparencyEntry {
  id: string;
  category: TransparencyDomainCategory;
  featureName: string;
  status: FeatureImplementationStatus;
  statusBadgeLabel: string;
  whatRunsInBrowserNow: string;
  whatIsSimulatedOrModeled: string;
  plannedNativeTarget: string;
  sourceFiles: string[];
}

export const ENGINEERING_TRANSPARENCY_MATRIX: EngineeringTransparencyEntry[] = [
  {
    id: 'webgl2_procedural_pbr_textures',
    category: 'textures_materials',
    featureName: 'Multi-Channel Procedural PBR CanvasTextures (256px / 512px / 1024px)',
    status: 'implemented',
    statusBadgeLabel: 'IMPLEMENTED · LIVE WEBGL2',
    whatRunsInBrowserNow:
      'Dynamically generates & resizes HTML5 CanvasTextures (256x256, 512x512, or 1024x1024) for grass albedo/normal, stone masonry/normal/bump, wood bark/normal, Damascus armor normal, water ripples, and baked AO lightmaps; mutates anisotropy (4x/8x/16x), mipmap filters, normalScale, bumpScale, and clearcoat directly on Three.js MeshPhysicalMaterials.',
    whatIsSimulatedOrModeled:
      'Hardware-specific GPU block compression formats (BC7 8bpp vs ASTC 6x6) and 4096px offline Master Source asset import overrides are modeled as cross-platform build metadata because browser CanvasTexture uploads uncompressed RGBA8 buffers to WebGL2.',
    plannedNativeTarget:
      'Serve pre-transcoded Basis Universal (.ktx2) supercompressed textures that transcode at runtime to native BC7 (Desktop) or ASTC (Mobile) GPU memory.',
    sourceFiles: ['src/game/proceduralWorld.ts', 'src/game/graphicsEngine.ts'],
  },
  {
    id: 'three_lod_and_instanced_foliage',
    category: 'geometry_lod',
    featureName: '4-Tier THREE.LOD Distance Chains & InstancedMesh Foliage Scaling',
    status: 'implemented',
    statusBadgeLabel: 'IMPLEMENTED · LIVE WEBGL2',
    whatRunsInBrowserNow:
      'Builds real 4-level THREE.LOD hierarchies (Icosahedron detail 2 -> 1 -> 0 -> Octahedron proxy), chamfered ExtrudeGeometry terrain blocks, LatheGeometry torsos, and dynamically mutates LOD distance thresholds, visibility, and InstancedMesh.count (800 -> 520 -> 320 grass tufts) when switching presets or Mobile LOD Bias.',
    whatIsSimulatedOrModeled:
      'The 75k–245k scene polygon budget figures and MB of RAM saved on Mobile (-68MB / -92.4MB) are deterministic analytical estimates computed from the active preset and LOD bias.',
    plannedNativeTarget:
      'GPU-driven meshlet / cluster culling via WebGPU compute shaders and glTF meshopt decompression.',
    sourceFiles: ['src/game/proceduralWorld.ts', 'src/components/GameCanvas.tsx'],
  },
  {
    id: 'atmospheric_sky_and_shadow_pipeline',
    category: 'lighting_shadows',
    featureName: 'Preetham Physical Sky, Dynamic Shadow Maps & Baked AO Lightmaps',
    status: 'implemented',
    statusBadgeLabel: 'IMPLEMENTED · LIVE WEBGL2',
    whatRunsInBrowserNow:
      'Runs Three.js Preetham Sky shader (Rayleigh/Mie scattering across 24h cycle & 4 weather states), DirectionalLight PCFSoftShadowMap (dynamically resized between 2048x2048 and 1024x1024 or disabled on Mobile), HemisphereLight, FogExp2, canvas AO lightmap intensity, and per-mesh small-prop shadow culling.',
    whatIsSimulatedOrModeled:
      'The "realtime_gi_hybrid" mode uses a Three.js PMREM RoomEnvironment probe + HemisphereLight + directional rim light + canvas AO map rather than hardware ray-traced global illumination (RTGI).',
    plannedNativeTarget:
      'Voxel cone tracing / screen-space global illumination (SSGI) and cascaded shadow maps (CSM) in WebGPU.',
    sourceFiles: ['src/components/GameCanvas.tsx', 'src/game/graphicsEngine.ts'],
  },
  {
    id: 'custom_glsl_uber_shaders_and_postfx',
    category: 'shaders_postfx',
    featureName: 'Custom GLSL onBeforeCompile Shaders & EffectComposer HDR Bloom',
    status: 'implemented',
    statusBadgeLabel: 'IMPLEMENTED · LIVE WEBGL2',
    whatRunsInBrowserNow:
      'Injects custom GLSL vertex/fragment code via Material.onBeforeCompile for foliage wind sway, Fresnel rim lighting, wrap subsurface approximation, and Gerstner water waves; runs EffectComposer (RenderPass -> UnrealBloomPass -> custom NextGenColorGradeShader with 3-tap sharpen, vibrance, split-toning & vignette) and toggles shader uniforms (uUseRimLight, uUseDetailNormals, uUseParallax, uUseSubsurface) live.',
    whatIsSimulatedOrModeled:
      'Platform shader macro defines (USE_RIM_LIGHT, USE_PARALLAX_OCCLUSION, etc.) are toggled at runtime via uniform branches (uUseRimLight > 0.5) inside the compiled WebGL2 shader rather than offline HLSL/SPIR-V preprocessor variant stripping.',
    plannedNativeTarget:
      'WGSL pipeline-overridable constants (`override`) in WebGPU for zero-branch hardware shader specialization.',
    sourceFiles: ['src/game/proceduralWorld.ts', 'src/components/GameCanvas.tsx'],
  },
  {
    id: 'cross_platform_bundle_manifest',
    category: 'packaging_platform',
    featureName: 'BC7/ASTC Platform Import Overrides & Addressable Install Size Manifest',
    status: 'simulated',
    statusBadgeLabel: 'SIMULATED · BUILD METADATA MODEL',
    whatRunsInBrowserNow:
      'Interactive cross-platform configuration calculator in the Architect Studio & HUD that couples platform selection (PC/Console vs Mobile + Optional HD Pack) to the live WebGL2 LOD bias, shadow culling, canvas texture resolution, and shader uniform switches.',
    whatIsSimulatedOrModeled:
      'The 68.4 GB PC/Console install size, 640 MB Mobile base build size, and 3.85 GB HighDefinition Addressable Content Pack download state are simulated deployment manifests for architectural planning; no multi-gigabyte binary pack is downloaded over the network.',
    plannedNativeTarget:
      'Cloud CDN chunked asset streaming with Service Worker cache quotas and native iOS/Android On-Demand Resources (ODR).',
    sourceFiles: ['src/game/graphicsEngine.ts', 'src/components/CppArchitectureModal.tsx'],
  },
  {
    id: 'cpp20_simd_soa_and_job_dag',
    category: 'cpu_ecs_architecture',
    featureName: 'C++20 SIMD ISA Profiles, SoA Memory Layout & Lock-Free Job DAG',
    status: 'simulated',
    statusBadgeLabel: 'SIMULATED · ANALYTICAL MODEL + C++20 HEADER',
    whatRunsInBrowserNow:
      'Executes deterministic TypeScript performance and hardware compatibility models (x86_64 AVX-512, ARMv9 SVE2, Apple Silicon 128B UMA, RISC-V RVV 1.0, SoA 4.75x speedup vs AoS, Chase-Lev work-stealing frame budgets) and ships a real, standalone C++20 header & test suite in cpp/VoxelRealmsGuardrails.hpp.',
    whatIsSimulatedOrModeled:
      'The browser runtime executes the game loop in TypeScript/JavaScript on the main thread; the C++20 files in cpp/ are reference native guardrails and are not compiled into a live WebAssembly module in the Vite dev server.',
    plannedNativeTarget:
      'Compile cpp/VoxelRealmsGuardrails.hpp via Emscripten (-msimd128 -pthread) into a WebAssembly SIMD128 worker pool backed by SharedArrayBuffer.',
    sourceFiles: [
      'src/game/architectOptimization.ts',
      'src/game/cppEngine.ts',
      'cpp/VoxelRealmsGuardrails.hpp',
    ],
  },
  {
    id: 'trillion_scale_warfare_and_cosmology',
    category: 'gameplay_simulation',
    featureName:
      '1,000-Trillion Castle Garrison, 23 Cultivation Realms, 6-Layer Cosmology & 10^100 Akashic Lore',
    status: 'implemented',
    statusBadgeLabel: 'IMPLEMENTED · BIGINT ENGINE + 3D PROJECTION',
    whatRunsInBrowserNow:
      'All castle capacities (up to 1,000T), T1–T20 Tri-Branch battles, 23 cultivation realms (100x suppression), A* keep pathfinding, 10 playable species 3D meshes, 7 Lore Epochs, 12 Dynastic Annals, Auto-Populating Open-World Lore Codex (8 Biomes + Monsters), 10^100-Word Lazy Akashic Stream, and 6-Layer Cosmology / D3 Tree / 100 Overvoids under creatergame31@gmail.com are implemented in TypeScript with BigInt math.',
    whatIsSimulatedOrModeled:
      'Trillion-unit troop clashes, 100-Omniverse tributes, and the 10^97-volume Akashic Lore Archive are resolved analytically via deterministic BigInt & seeded lazy pagination while rendering representative 3D hero/envoy/monster meshes in the viewport to maintain 60 FPS.',
    plannedNativeTarget:
      'GPU instanced crowd impostor rendering for visualizing 100,000+ simultaneous march units during siege replays.',
    sourceFiles: [
      'src/game/math.ts',
      'src/game/cultivationMath.ts',
      'src/game/omniverse.ts',
      'src/game/cosmologicalTreeD3.ts',
      'src/game/loreHistory.ts',
    ],
  },
  {
    id: 'multiplayer_persistence_and_cloud_sync',
    category: 'persistence_networking',
    featureName: 'Authoritative 20Hz 50v50 WebSocket Siege Server & Multi-Region Persistence',
    status: 'implemented',
    statusBadgeLabel: 'IMPLEMENTED · LIVE 20Hz WEBSOCKET + MULTI-REGION SERVER',
    whatRunsInBrowserNow:
      'Runs a real full-stack Express + RFC 6455 WebSocket server (/ws/siege on port 3000) and /api/online/* REST endpoints with 20Hz (50ms) bitmasked delta-compression (CohortDirtyBit), FNV-1a 32-bit state hashing, 128-frame Client-Side Prediction (CSP) ring buffer reconciliation, 1T War Rally assembly, durable server-side disk persistence (data/online_realm_state.json), and browser localStorage caching.',
    whatIsSimulatedOrModeled:
      'The 3 regional cluster nodes (us-east-solara-1, eu-central-valhalla-1, ap-southeast-celestia-1) replicate state and quorum checksums within the unified Node.js server process and local JSON store rather than across separate physical data centers.',
    plannedNativeTarget:
      'Geo-distributed Kubernetes Agones dedicated game server fleet backed by globally replicated Cloud Spanner / CockroachDB raft shards.',
    sourceFiles: [
      'src/game/siegeNetProtocol.ts',
      'server.ts',
      'src/components/ClanTerritoryMap.tsx',
      'src/game/adminModeration.ts',
      'src/game/clanMath.ts',
    ],
  },
];

export interface ImplementationTransparencySummary {
  totalEntries: number;
  implementedCount: number;
  simulatedCount: number;
  plannedCount: number;
  entries: EngineeringTransparencyEntry[];
}

export function getImplementationTransparencySummary(): ImplementationTransparencySummary {
  const implementedCount = ENGINEERING_TRANSPARENCY_MATRIX.filter(
    (e) => e.status === 'implemented'
  ).length;
  const simulatedCount = ENGINEERING_TRANSPARENCY_MATRIX.filter(
    (e) => e.status === 'simulated'
  ).length;
  const plannedCount = ENGINEERING_TRANSPARENCY_MATRIX.filter((e) => e.status === 'planned').length;

  return {
    totalEntries: ENGINEERING_TRANSPARENCY_MATRIX.length,
    implementedCount,
    simulatedCount,
    plannedCount,
    entries: ENGINEERING_TRANSPARENCY_MATRIX,
  };
}
