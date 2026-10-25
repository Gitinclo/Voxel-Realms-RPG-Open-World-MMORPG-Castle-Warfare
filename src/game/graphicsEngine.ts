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
  let mieCoefficient = 0.0045;
  let mieDirectionalG = 0.86;
  let exposure = 1.24;

  let sunLightHex = 0xfff8e7;
  let sunLightIntensity = 3.1 * weatherSunlightMult;
  let hemiSkyHex = 0x7dd3fc;
  let hemiGroundHex = 0x1e293b;
  let hemiIntensity = 1.05 * weatherSunlightMult;
  let rimLightHex = 0x38bdf8;
  let rimLightIntensity = 0.85;
  let fogHex = 0x93c5fd;
  let fogDensity = 0.0065;
  let starfieldOpacity = 0;
  let godRayIntensity = 0.65 * weatherSunlightMult;

  if (isNight) {
    turbidity = 1.2;
    rayleigh = 0.35;
    mieCoefficient = 0.002;
    mieDirectionalG = 0.75;
    exposure = 1.05;
    sunLightHex = 0x818cf8;
    sunLightIntensity = 0.48 * weatherSunlightMult;
    hemiSkyHex = 0x312e81;
    hemiGroundHex = 0x0f172a;
    hemiIntensity = 0.58 * weatherSunlightMult;
    rimLightHex = 0x60a5fa;
    rimLightIntensity = 1.25;
    fogHex = 0x0b1120;
    fogDensity = 0.0085;
    starfieldOpacity = Math.min(1.0, Math.abs(sinElev) * 2.2);
    godRayIntensity = 0.15;
  } else if (isGoldenHour) {
    // GTA V / Genshin Liyue sunset & sunrise golden-hour scattering
    turbidity = 7.5;
    rayleigh = 3.1;
    mieCoefficient = 0.012;
    mieDirectionalG = 0.92;
    exposure = 1.28;
    sunLightHex = 0xff9e44;
    sunLightIntensity = 2.65 * weatherSunlightMult;
    hemiSkyHex = 0xfdba74;
    hemiGroundHex = 0x311b2c;
    hemiIntensity = 0.92 * weatherSunlightMult;
    rimLightHex = 0xfbbf24;
    rimLightIntensity = 1.15;
    fogHex = 0xfb923c;
    fogDensity = 0.0078;
    starfieldOpacity = Math.max(0, (0.12 - sinElev) * 2.5);
    godRayIntensity = 0.95 * weatherSunlightMult;
  } else {
    // High-altitude Teyvat / Los Santos clear daylight
    turbidity = isStorm || isRain ? 11.0 : 2.2;
    rayleigh = isStorm || isRain ? 0.85 : 1.75;
    mieCoefficient = isStorm ? 0.018 : 0.0042;
    mieDirectionalG = 0.88;
    exposure = 1.25;
    sunLightHex = isSnow ? 0xe0f2fe : 0xfffbeb;
    sunLightIntensity = 3.25 * weatherSunlightMult;
    hemiSkyHex = isStorm ? 0x475569 : isSnow ? 0xbae6fd : 0x60a5fa;
    hemiGroundHex = isSnow ? 0x475569 : 0x1e293b;
    hemiIntensity = 1.12 * weatherSunlightMult;
    rimLightHex = 0x38bdf8;
    rimLightIntensity = 0.82;
    fogHex = isStorm ? 0x1e293b : isRain ? 0x475569 : isSnow ? 0xe2e8f0 : 0xbae6fd;
    fogDensity = isStorm ? 0.014 : isRain ? 0.011 : isSnow ? 0.0095 : 0.0058;
    starfieldOpacity = 0;
    godRayIntensity = 0.72 * weatherSunlightMult;
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
 * - 'ultra': Full GTA V + Genshin Impact Next-Gen HDR (ACES Filmic + Bloom + Color Grading + Sharpen + Rim Light)
 * - 'high': Stylized High PBR + Bloom + Rim Light
 * - 'balanced': Fast 60 FPS Direct Render
 */
export function getPostProcessProfile(quality: GraphicsQualityPreset): PostProcessProfile {
  switch (quality) {
    case 'ultra':
      return {
        enableComposer: true,
        bloomStrength: 0.48,
        bloomRadius: 0.52,
        bloomThreshold: 0.76,
        saturationBoost: 1.22,
        contrastBoost: 1.12,
        vibranceBoost: 0.24,
        sharpenStrength: 0.35,
        vignetteDarkness: 0.28,
        chromaticAberration: 0.0012,
        rimLightShaderStrength: 0.65,
        shadowMapSize: 2048,
      };
    case 'high':
      return {
        enableComposer: true,
        bloomStrength: 0.32,
        bloomRadius: 0.4,
        bloomThreshold: 0.82,
        saturationBoost: 1.15,
        contrastBoost: 1.08,
        vibranceBoost: 0.16,
        sharpenStrength: 0.18,
        vignetteDarkness: 0.2,
        chromaticAberration: 0.0,
        rimLightShaderStrength: 0.48,
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
        rimLightShaderStrength: 0.25,
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
 * Human-readable label for HUD badge and toast notifications
 */
export function getGraphicsPresetMetadata(quality: GraphicsQualityPreset): {
  shortBadge: string;
  title: string;
  toastDescription: string;
} {
  switch (quality) {
    case 'ultra':
      return {
        shortBadge: 'NEXT-GEN ULTRA (GTA V + GENSHIN)',
        title: 'Next-Gen Ultra: GTA V Atmospheric PBR + Genshin Cel/Rim Shaders',
        toastDescription:
          '✨ Graphics: NEXT-GEN ULTRA (Preetham Physical Sky + Genshin Rim/Cel Shaders + GTA V Wet-Surface Reflections + ACES Color Grading & HDR Bloom)',
      };
    case 'high':
      return {
        shortBadge: 'HIGH (TEYVAT ANIME PBR)',
        title: 'High Quality: Stylized Teyvat Anime PBR + HDR Bloom + 2048px Shadows',
        toastDescription:
          '🎨 Graphics: HIGH (Teyvat Stylized PBR + Physical Sky + Soft Shadows + Rim Lighting)',
      };
    case 'balanced':
    default:
      return {
        shortBadge: 'BALANCED (60 FPS)',
        title: 'Balanced Mode: 60 FPS Direct Render Pipeline',
        toastDescription: '⚡ Graphics: BALANCED (60 FPS Direct Hardware Pipeline)',
      };
  }
}
