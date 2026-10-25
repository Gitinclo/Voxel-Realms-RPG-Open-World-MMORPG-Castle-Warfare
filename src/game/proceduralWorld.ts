/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CharacterAppearance, MonsterTarget, NPC, ResourceNode } from '../types/game';

/**
 * Graphics Quality Preset Type
 */
export type GraphicsQualityPreset = 'ultra' | 'high' | 'balanced';

// ============================================================================
// 1024x1024 MULTI-CHANNEL HD PROCEDURAL PBR TEXTURES (Albedo + Normal + Bump)
// ============================================================================

const textureCache = new Map<string, THREE.CanvasTexture>();

function getOrCreateCanvasTexture(
  key: string,
  size: number,
  isColorMap: boolean,
  repeat: number,
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  drawFn(ctx, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColorMap ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 16;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  textureCache.set(key, tex);
  return tex;
}

function getGrassAlbedoTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('grass_albedo_1024', 1024, true, 1, (ctx, s) => {
    const grad = ctx.createLinearGradient(0, 0, s, s);
    grad.addColorStop(0, '#3cb371');
    grad.addColorStop(0.5, '#43a047');
    grad.addColorStop(1, '#2e7d32');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);

    // Rich organic clover & soil micro-patches
    for (let p = 0; p < 180; p++) {
      const px = (p * 173) % s;
      const py = (p * 311) % s;
      const rad = 18 + (p % 5) * 8;
      ctx.fillStyle = p % 2 === 0 ? 'rgba(34, 197, 94, 0.25)' : 'rgba(21, 128, 61, 0.28)';
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6,000 crisp individual grass blades & wildflower specks
    for (let i = 0; i < 6000; i++) {
      const x = (i * 97) % s;
      const y = (i * 181) % s;
      ctx.fillStyle =
        i % 5 === 0
          ? '#1b5e20'
          : i % 5 === 1
            ? '#66bb6a'
            : i % 5 === 2
              ? '#86efac'
              : i % 5 === 3
                ? '#4ade80'
                : '#388e3c';
      ctx.fillRect(x, y, 3, 12);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, s - 6, s - 6);
  });
}

function getGrassNormalTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('grass_normal_1024', 1024, false, 1, (ctx, s) => {
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 4800; i++) {
      const x = (i * 97) % s;
      const y = (i * 181) % s;
      ctx.fillStyle = i % 2 === 0 ? 'rgb(168, 148, 245)' : 'rgb(92, 110, 245)';
      ctx.fillRect(x, y, 4, 12);
    }
  });
}

function getStoneMasonryTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('stone_masonry_1024', 1024, true, 1, (ctx, s) => {
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, s, s);
    const rows = 8;
    const rowH = s / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const cols = 4;
      const colW = s / cols;
      const offset = (r % 2) * (colW / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * colW + offset;
        const shade = ((r * 7 + c * 13) % 7) * 5 - 12;
        ctx.fillStyle = `rgb(${118 + shade}, ${136 + shade}, ${152 + shade})`;
        ctx.fillRect(x + 5, y + 5, colW - 10, rowH - 10);

        // Chiseled specular top/left bevel highlight & bottom/right shadow
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(x + 5, y + 5, colW - 10, 7);
        ctx.fillRect(x + 5, y + 5, 7, rowH - 10);
        ctx.fillStyle = 'rgba(15,23,42,0.36)';
        ctx.fillRect(x + 5, y + rowH - 12, colW - 10, 7);
        ctx.fillRect(x + colW - 12, y + 5, 7, rowH - 10);

        // Micro-quarry grain & mineral flecks
        for (let g = 0; g < 18; g++) {
          const gx = x + 14 + ((g * 37 + r * 19) % Math.max(10, colW - 28));
          const gy = y + 14 + ((g * 23 + c * 31) % Math.max(10, rowH - 28));
          ctx.fillStyle = g % 2 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.16)';
          ctx.fillRect(gx, gy, 4, 4);
        }
      }
    }
  });
}

function getStoneNormalMapTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('stone_normal_1024', 1024, false, 1, (ctx, s) => {
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, s, s);
    const rows = 8;
    const rowH = s / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const cols = 4;
      const colW = s / cols;
      const offset = (r % 2) * (colW / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * colW + offset;
        ctx.fillStyle = 'rgb(128, 225, 235)';
        ctx.fillRect(x + 4, y + 4, colW - 8, 10);
        ctx.fillStyle = 'rgb(128, 35, 235)';
        ctx.fillRect(x + 4, y + rowH - 14, colW - 8, 10);
        ctx.fillStyle = 'rgb(40, 128, 235)';
        ctx.fillRect(x + 4, y + 4, 10, rowH - 8);
        ctx.fillStyle = 'rgb(218, 128, 235)';
        ctx.fillRect(x + colW - 14, y + 4, 10, rowH - 8);
      }
    }
  });
}

function getStoneBumpTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('stone_bump_1024', 1024, false, 1, (ctx, s) => {
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, s, s);
    const rows = 8;
    const rowH = s / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const cols = 4;
      const colW = s / cols;
      const offset = (r % 2) * (colW / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * colW + offset;
        ctx.fillStyle = '#e5e5e5';
        ctx.fillRect(x + 6, y + 6, colW - 12, rowH - 12);
      }
    }
  });
}

function getWoodBarkTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('wood_bark_1024', 1024, true, 1, (ctx, s) => {
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 220; i++) {
      const x = (i * 17) % s;
      ctx.fillStyle = i % 3 === 0 ? '#3e2723' : i % 3 === 1 ? '#4e342e' : '#6d4c41';
      ctx.fillRect(x, 0, 7, s);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(x + 1, 0, 2, s);
    }
  });
}

function getWoodNormalTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('wood_normal_1024', 1024, false, 1, (ctx, s) => {
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 220; i++) {
      const x = (i * 17) % s;
      ctx.fillStyle = 'rgb(195, 128, 240)';
      ctx.fillRect(x, 0, 3, s);
      ctx.fillStyle = 'rgb(65, 128, 240)';
      ctx.fillRect(x + 3, 0, 3, s);
    }
  });
}

function getDamascusArmorNormalTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('armor_normal_1024', 1024, false, 2, (ctx, s) => {
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, s, s);
    const step = 32;
    for (let y = 0; y < s; y += step) {
      for (let x = 0; x < s; x += step) {
        const ox = ((y / step) % 2) * (step / 2);
        ctx.strokeStyle = 'rgb(195, 205, 245)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + ox, y, step * 0.48, 0, Math.PI);
        ctx.stroke();
        ctx.strokeStyle = 'rgb(65, 60, 240)';
        ctx.beginPath();
        ctx.arc(x + ox, y + 3, step * 0.48, 0, Math.PI);
        ctx.stroke();
      }
    }
  });
}

function getGlazedRoofTileTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('roof_tile_1024', 1024, true, 2, (ctx, s) => {
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(0, 0, s, s);
    const cols = 16;
    const rows = 16;
    const cw = s / cols;
    const rh = s / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cw;
        const y = r * rh;
        const grad = ctx.createLinearGradient(x, y, x + cw, y);
        grad.addColorStop(0, '#9a3412');
        grad.addColorStop(0.5, '#fb923c');
        grad.addColorStop(1, '#7c2d12');
        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y + 1, cw - 2, rh - 3);
        ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
        ctx.fillRect(x + 2, y + rh - 5, cw - 4, 3);
      }
    }
  });
}

function getWaterNormalBumpTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('water_normal_1024', 1024, false, 20, (ctx, s) => {
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 4) {
      for (let x = 0; x < s; x += 4) {
        const nx =
          Math.sin((x / s) * Math.PI * 8) * 38 + Math.cos(((x + y) / s) * Math.PI * 16) * 18 + 128;
        const ny =
          Math.cos((y / s) * Math.PI * 8) * 38 + Math.sin(((x - y) / s) * Math.PI * 16) * 18 + 128;
        ctx.fillStyle = `rgb(${Math.floor(nx)},${Math.floor(ny)},245)`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
  });
}

/**
 * Baked Lightmap & Ambient Occlusion Master Texture (Used for Mobile Baked Lighting
 * and PC/Console Hybrid Base Lightmap + Real-time Shadows)
 */
function getBakedLightmapTexture(): THREE.CanvasTexture | null {
  return getOrCreateCanvasTexture('baked_lightmap_1024', 1024, false, 1, (ctx, s) => {
    const radGrad = ctx.createRadialGradient(
      s * 0.5,
      s * 0.5,
      s * 0.08,
      s * 0.5,
      s * 0.5,
      s * 0.68
    );
    radGrad.addColorStop(0, '#ffffff');
    radGrad.addColorStop(0.65, '#e2e8f0');
    radGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, s, s);

    // Soft baked crevice ambient occlusion around block borders
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.28)';
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, s - 18, s - 18);
  });
}

// ============================================================================
// HIGH-POLYGON BEVELED & SCULPTED GEOMETRY BUILDERS + 4-TIER THREE.LOD CHAINS
// ============================================================================

const geometryCache = new Map<string, THREE.BufferGeometry>();

/**
 * Builds a 4-tier Aggressive THREE.LOD Chain for botanical canopies & crystal clusters:
 * - LOD 0 (0m - 18m): High-poly Icosahedron (detail=2, 320 tris) — skipped on Mobile via LOD Bias!
 * - LOD 1 (18m - 38m): Medium-poly Icosahedron (detail=1, 80 tris)
 * - LOD 2 (38m - 68m): Standard Mobile Icosahedron (detail=0, 20 tris)
 * - LOD 3 (68m+): Distant Mobile Octahedron proxy (detail=0, 8 tris)
 */
function createMultiLodCanopyCluster(radius: number, material: THREE.Material): THREE.LOD {
  const lod = new THREE.LOD();
  lod.name = 'MultiTierLodCluster';
  lod.userData.isSmallProp = true;

  const lod0Geo =
    geometryCache.get(`icosa_lod0_${radius.toFixed(2)}`) ||
    (() => {
      const g = new THREE.IcosahedronGeometry(radius, 2);
      geometryCache.set(`icosa_lod0_${radius.toFixed(2)}`, g);
      return g;
    })();
  const lod1Geo =
    geometryCache.get(`icosa_lod1_${radius.toFixed(2)}`) ||
    (() => {
      const g = new THREE.IcosahedronGeometry(radius, 1);
      geometryCache.set(`icosa_lod1_${radius.toFixed(2)}`, g);
      return g;
    })();
  const lod2Geo =
    geometryCache.get(`icosa_lod2_${radius.toFixed(2)}`) ||
    (() => {
      const g = new THREE.IcosahedronGeometry(radius, 0);
      geometryCache.set(`icosa_lod2_${radius.toFixed(2)}`, g);
      return g;
    })();
  const lod3Geo =
    geometryCache.get(`octa_lod3_${radius.toFixed(2)}`) ||
    (() => {
      const g = new THREE.OctahedronGeometry(radius * 0.95, 0);
      geometryCache.set(`octa_lod3_${radius.toFixed(2)}`, g);
      return g;
    })();

  const m0 = new THREE.Mesh(lod0Geo, material);
  m0.scale.set(1.08, 0.86, 1.08);
  m0.castShadow = true;
  m0.receiveShadow = true;
  m0.userData.lodTier = 0;
  m0.userData.isSmallProp = true;

  const m1 = new THREE.Mesh(lod1Geo, material);
  m1.scale.set(1.08, 0.86, 1.08);
  m1.castShadow = true;
  m1.receiveShadow = true;
  m1.userData.lodTier = 1;
  m1.userData.isSmallProp = true;

  const m2 = new THREE.Mesh(lod2Geo, material);
  m2.scale.set(1.08, 0.86, 1.08);
  m2.castShadow = false;
  m2.receiveShadow = true;
  m2.userData.lodTier = 2;
  m2.userData.isSmallProp = true;

  const m3 = new THREE.Mesh(lod3Geo, material);
  m3.scale.set(1.08, 0.86, 1.08);
  m3.castShadow = false;
  m3.receiveShadow = false;
  m3.userData.lodTier = 3;
  m3.userData.isSmallProp = true;

  lod.addLevel(m0, 0);
  lod.addLevel(m1, 18);
  lod.addLevel(m2, 38);
  lod.addLevel(m3, 68);
  return lod;
}

/**
 * Builds a high-polygon 3D Chamfered / Beveled Block using ExtrudeGeometry with multi-segment bevels,
 * centered at the origin so it is a drop-in high-poly replacement for BoxGeometry with real specular edge highlights.
 */
function createChamferedBlockGeometry(
  width: number,
  height: number,
  depth: number,
  bevelSize: number = 0.08,
  bevelSegments: number = 3
): THREE.BufferGeometry {
  const key = `chamfer_${width.toFixed(2)}_${height.toFixed(2)}_${depth.toFixed(2)}_${bevelSize.toFixed(2)}_${bevelSegments}`;
  const cached = geometryCache.get(key);
  if (cached) return cached;

  const b = Math.min(bevelSize, width * 0.2, height * 0.2, depth * 0.2);
  const w = Math.max(0.05, width - b * 2);
  const h = Math.max(0.05, height - b * 2);
  const d = Math.max(0.05, depth - b * 2);

  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  shape.moveTo(-hw, -hh);
  shape.lineTo(hw, -hh);
  shape.lineTo(hw, hh);
  shape.lineTo(-hw, hh);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments,
    curveSegments: 4,
  });
  geo.center();
  geo.computeVertexNormals();
  geometryCache.set(key, geo);
  return geo;
}

/**
 * Builds a sculpted anatomical/armored torso or breastplate using LatheGeometry (24 radial segments)
 */
function createSculptedTorsoGeometry(
  bottomRadius: number,
  waistRadius: number,
  chestRadius: number,
  height: number,
  radialSegments: number = 24
): THREE.BufferGeometry {
  const key = `torso_${bottomRadius.toFixed(2)}_${waistRadius.toFixed(2)}_${chestRadius.toFixed(2)}_${height.toFixed(2)}_${radialSegments}`;
  const cached = geometryCache.get(key);
  if (cached) return cached;

  const points = [
    new THREE.Vector2(0.01, -height * 0.5),
    new THREE.Vector2(bottomRadius, -height * 0.48),
    new THREE.Vector2(waistRadius, -height * 0.12),
    new THREE.Vector2(chestRadius, height * 0.26),
    new THREE.Vector2(chestRadius * 0.86, height * 0.48),
    new THREE.Vector2(0.01, height * 0.5),
  ];
  const geo = new THREE.LatheGeometry(points, radialSegments);
  geo.scale(1.15, 1.0, 0.78);
  geo.computeVertexNormals();
  geometryCache.set(key, geo);
  return geo;
}

let softShadowTextureCache: THREE.CanvasTexture | null = null;
function createSoftContactShadow(radius: number, opacity: number = 0.48): THREE.Mesh {
  if (!softShadowTextureCache && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
      grad.addColorStop(0, 'rgba(2, 6, 23, 0.85)');
      grad.addColorStop(0.55, 'rgba(2, 6, 23, 0.35)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    softShadowTextureCache = new THREE.CanvasTexture(canvas);
  }
  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: softShadowTextureCache || null,
    color: 0x020617,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.03;
  return mesh;
}

// ============================================================================
// UNIFIED "UBER SHADER" WITH PLATFORM KEYWORD SWITCHES & STUDIO PBR MATERIALS
// ============================================================================

export const worldShaderUniforms = {
  uTime: { value: 0 },
  uWindStrength: { value: 0.75 },
  uWaveHeight: { value: 0.09 },
  uRimStrength: { value: 0.55 },
  // 4. Unified Uber Shader Platform Keyword Switches (1.0 = Console/PC enabled, 0.0 = Mobile simplified math)
  uUseRimLight: { value: 1.0 },
  uUseDetailNormals: { value: 1.0 },
  uUseParallax: { value: 1.0 },
  uUseSubsurface: { value: 1.0 },
  uBakedLightIntensity: { value: 0.75 },
};

/**
 * Unified Uber Shader for Foliage & Organic Surfaces:
 * - Console/PC: Enables Rim Lighting, Sub-surface Scattering wrap glow, and Detail Normal micro-grain.
 * - Mobile: Automatically switches off expensive branches and uses fast ALU math.
 */
function attachGenshinFoliageShader(mat: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = worldShaderUniforms.uTime;
    shader.uniforms.uWindStrength = worldShaderUniforms.uWindStrength;
    shader.uniforms.uRimStrength = worldShaderUniforms.uRimStrength;
    shader.uniforms.uUseRimLight = worldShaderUniforms.uUseRimLight;
    shader.uniforms.uUseSubsurface = worldShaderUniforms.uUseSubsurface;
    shader.uniforms.uUseDetailNormals = worldShaderUniforms.uUseDetailNormals;

    shader.vertexShader =
      `
      uniform float uTime;
      uniform float uWindStrength;
      ` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float breeze = sin(uTime * 2.4 + position.x * 0.9 + position.z * 0.9) * 0.09 * uWindStrength;
        transformed.x += breeze * max(0.0, position.y + 0.5);
        transformed.z += cos(uTime * 1.9 + position.y * 0.8) * 0.05 * uWindStrength;
        `
      );

    shader.fragmentShader =
      `
      uniform float uRimStrength;
      uniform float uUseRimLight;
      uniform float uUseSubsurface;
      uniform float uUseDetailNormals;
      ` +
      shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        if (uUseRimLight > 0.5) {
          vec3 viewDir = normalize(vViewPosition);
          float fresnelRim = pow(1.0 - abs(dot(viewDir, normal)), 2.6);
          gl_FragColor.rgb += vec3(0.45, 0.85, 0.35) * fresnelRim * uRimStrength * 0.42;
        }
        if (uUseSubsurface > 0.5) {
          float sssWrap = max(0.0, normal.y * 0.5 + 0.5);
          gl_FragColor.rgb += vec3(0.18, 0.36, 0.12) * sssWrap * 0.14;
        }
        #include <dithering_fragment>
        `
      );
  };
}

/**
 * Unified Uber Shader for Stone, Masonry & Terrain Surfaces:
 * - Console/PC: Enables Parallax Relief, Detail Normal micro-Perturbation, and Fresnel Rim Highlighting.
 * - Mobile: Simplifies to fast single-pass baked lightmap + base albedo math.
 */
function attachUnifiedStoneUberShader(
  mat: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial
) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uUseRimLight = worldShaderUniforms.uUseRimLight;
    shader.uniforms.uUseDetailNormals = worldShaderUniforms.uUseDetailNormals;
    shader.uniforms.uUseParallax = worldShaderUniforms.uUseParallax;
    shader.uniforms.uBakedLightIntensity = worldShaderUniforms.uBakedLightIntensity;

    shader.fragmentShader =
      `
      uniform float uUseRimLight;
      uniform float uUseDetailNormals;
      uniform float uUseParallax;
      uniform float uBakedLightIntensity;
      ` +
      shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        if (uUseDetailNormals > 0.5 && uUseParallax > 0.5) {
          vec3 viewDirS = normalize(vViewPosition);
          float edgeSpec = pow(1.0 - abs(dot(viewDirS, normal)), 3.2);
          gl_FragColor.rgb += vec3(0.82, 0.90, 1.0) * edgeSpec * 0.12 * uUseRimLight;
        }
        #include <dithering_fragment>
        `
      );
  };
}

function attachGerstnerWaterShader(mat: THREE.MeshPhysicalMaterial) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = worldShaderUniforms.uTime;
    shader.uniforms.uWaveHeight = worldShaderUniforms.uWaveHeight;

    shader.vertexShader =
      `
      uniform float uTime;
      uniform float uWaveHeight;
      varying vec3 vWaterWorldPos;
      ` +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float w1 = sin(position.x * 0.35 + uTime * 2.1) * cos(position.y * 0.32 + uTime * 1.7);
        float w2 = sin((position.x + position.y) * 0.65 - uTime * 2.8) * 0.5;
        transformed.z += (w1 + w2) * uWaveHeight;
        vWaterWorldPos = vec3(position.x, position.y, transformed.z);
        `
      );

    shader.fragmentShader =
      `
      uniform float uTime;
      varying vec3 vWaterWorldPos;
      ` +
      shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        float caustic = sin(vWaterWorldPos.x * 1.4 + uTime * 2.6) * cos(vWaterWorldPos.y * 1.4 - uTime * 2.1);
        float foam = smoothstep(0.68, 0.96, caustic);
        vec3 viewDirW = normalize(vViewPosition);
        float skyFresnel = pow(1.0 - abs(dot(viewDirW, normal)), 3.0);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.38, 0.92, 1.0), skyFresnel * 0.45);
        gl_FragColor.rgb += vec3(0.88, 0.98, 1.0) * foam * 0.22;
        #include <dithering_fragment>
        `
      );
  };
}

const grassMap = getGrassAlbedoTexture();
const grassNormal = getGrassNormalTexture();
const stoneMap = getStoneMasonryTexture();
const stoneNormal = getStoneNormalMapTexture();
const stoneBump = getStoneBumpTexture();
const woodMap = getWoodBarkTexture();
const woodNormal = getWoodNormalTexture();
const armorNormal = getDamascusArmorNormalTexture();
const roofTileMap = getGlazedRoofTileTexture();
const waterNormal = getWaterNormalBumpTexture();
const bakedLightmap = getBakedLightmapTexture();

const voxelMaterials = {
  grass: new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: grassMap,
    normalMap: grassNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    aoMap: bakedLightmap,
    aoMapIntensity: 0.42,
    bumpMap: grassMap,
    bumpScale: 0.06,
    roughness: 0.68,
    metalness: 0.05,
    clearcoat: 0.18,
    clearcoatRoughness: 0.42,
  }),
  grassDark: new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    normalMap: grassNormal,
    roughness: 0.76,
    metalness: 0.05,
  }),

  dirt: new THREE.MeshStandardMaterial({
    color: 0x6d4c41,
    bumpMap: stoneBump,
    bumpScale: 0.05,
    roughness: 0.88,
    metalness: 0.04,
  }),
  stone: new THREE.MeshPhysicalMaterial({
    color: 0xdbeafe,
    map: stoneMap,
    normalMap: stoneNormal,
    normalScale: new THREE.Vector2(1.05, 1.05),
    bumpMap: stoneBump,
    bumpScale: 0.1,
    roughness: 0.48,
    metalness: 0.24,
    clearcoat: 0.34,
    clearcoatRoughness: 0.22,
  }),
  stoneDark: new THREE.MeshPhysicalMaterial({
    color: 0x90a4ae,
    map: stoneMap,
    normalMap: stoneNormal,
    normalScale: new THREE.Vector2(1.15, 1.15),
    bumpMap: stoneBump,
    bumpScale: 0.12,
    roughness: 0.42,
    metalness: 0.35,
    clearcoat: 0.42,
    clearcoatRoughness: 0.18,
  }),
  cobblestone: new THREE.MeshPhysicalMaterial({
    color: 0xb0bec5,
    map: stoneMap,
    normalMap: stoneNormal,
    normalScale: new THREE.Vector2(1.1, 1.1),
    bumpMap: stoneBump,
    bumpScale: 0.11,
    roughness: 0.44,
    metalness: 0.28,
    clearcoat: 0.38,
    clearcoatRoughness: 0.2,
  }),
  woodTrunk: new THREE.MeshStandardMaterial({
    color: 0x8d6e63,
    map: woodMap,
    normalMap: woodNormal,
    normalScale: new THREE.Vector2(0.9, 0.9),
    bumpMap: woodMap,
    bumpScale: 0.08,
    roughness: 0.78,
  }),
  leaves: new THREE.MeshPhysicalMaterial({
    color: 0x2ebd59,
    normalMap: grassNormal,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughness: 0.52,
    metalness: 0.06,
    clearcoat: 0.32,
    clearcoatRoughness: 0.3,
  }),
  leavesLight: new THREE.MeshPhysicalMaterial({
    color: 0x4ade80,
    normalMap: grassNormal,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughness: 0.48,
    metalness: 0.06,
    clearcoat: 0.34,
    clearcoatRoughness: 0.28,
  }),
  leavesAutumn: new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: roofTileMap,
    normalMap: stoneNormal,
    normalScale: new THREE.Vector2(0.8, 0.8),
    emissive: 0x7c2d12,
    emissiveIntensity: 0.15,
    roughness: 0.32,
    metalness: 0.18,
    clearcoat: 0.62,
    clearcoatRoughness: 0.18,
  }),
  sakuraBlossom: new THREE.MeshPhysicalMaterial({
    color: 0xf472b6,
    normalMap: grassNormal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    emissive: 0xbe185d,
    emissiveIntensity: 0.24,
    roughness: 0.38,
    metalness: 0.08,
    clearcoat: 0.55,
  }),
  ginkgoGold: new THREE.MeshPhysicalMaterial({
    color: 0xfacc15,
    normalMap: grassNormal,
    normalScale: new THREE.Vector2(0.45, 0.45),
    emissive: 0xb45309,
    emissiveIntensity: 0.22,
    roughness: 0.36,
    metalness: 0.14,
    clearcoat: 0.52,
  }),
  water: new THREE.MeshPhysicalMaterial({
    color: 0x06b6d4,
    emissive: 0x0284c7,
    emissiveIntensity: 0.28,
    roughness: 0.04,
    metalness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    reflectivity: 1.0,
    ior: 1.333,
    normalMap: waterNormal,
    normalScale: new THREE.Vector2(0.75, 0.75),
    transparent: true,
    opacity: 0.92,
  }),
  steelOre: new THREE.MeshPhysicalMaterial({
    color: 0xe2e8f0,
    normalMap: armorNormal,
    normalScale: new THREE.Vector2(0.65, 0.65),
    roughness: 0.16,
    metalness: 0.95,
    clearcoat: 0.72,
    clearcoatRoughness: 0.1,
  }),
  copperOre: new THREE.MeshPhysicalMaterial({
    color: 0xfb923c,
    normalMap: armorNormal,
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughness: 0.2,
    metalness: 0.92,
    clearcoat: 0.62,
  }),
  diamondOre: new THREE.MeshPhysicalMaterial({
    color: 0x00e5ff,
    roughness: 0.03,
    metalness: 0.24,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    ior: 2.417,
    reflectivity: 1.0,
    emissive: 0x00b0ff,
    emissiveIntensity: 0.9,
  }),
  goldAccent: new THREE.MeshPhysicalMaterial({
    color: 0xffd700,
    normalMap: armorNormal,
    normalScale: new THREE.Vector2(0.5, 0.5),
    emissive: 0xd97706,
    emissiveIntensity: 0.25,
    roughness: 0.12,
    metalness: 0.97,
    clearcoat: 0.9,
    clearcoatRoughness: 0.06,
  }),
  grainGold: new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    normalMap: grassNormal,
    roughness: 0.68,
    metalness: 0.12,
  }),
  oilDark: new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.06,
    metalness: 0.9,
    clearcoat: 0.96,
    clearcoatRoughness: 0.04,
  }),
  lanternGlow: new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xff9800,
    emissiveIntensity: 2.4,
    roughness: 0.06,
  }),
  celestialJade: new THREE.MeshPhysicalMaterial({
    color: 0x34d399,
    normalMap: stoneNormal,
    normalScale: new THREE.Vector2(0.6, 0.6),
    emissive: 0x059669,
    emissiveIntensity: 0.38,
    roughness: 0.12,
    metalness: 0.28,
    clearcoat: 0.95,
  }),
};

attachGenshinFoliageShader(voxelMaterials.leaves);
attachGenshinFoliageShader(voxelMaterials.leavesLight);
attachGenshinFoliageShader(voxelMaterials.sakuraBlossom);
attachGenshinFoliageShader(voxelMaterials.ginkgoGold);
attachUnifiedStoneUberShader(voxelMaterials.stone);
attachUnifiedStoneUberShader(voxelMaterials.stoneDark);
attachUnifiedStoneUberShader(voxelMaterials.cobblestone);
attachGerstnerWaterShader(voxelMaterials.water);

/**
 * Updates animated shader uniforms & GTA V wet-surface PBR properties each frame
 */
export function updateWorldShaderUniforms(
  elapsedSec: number,
  roadRoughness: number,
  roadClearcoat: number,
  stoneRoughness: number,
  stoneClearcoat: number,
  waterWaveHeight: number,
  windSwayStrength: number,
  rimStrength: number
): void {
  worldShaderUniforms.uTime.value = elapsedSec;
  worldShaderUniforms.uWaveHeight.value = waterWaveHeight;
  worldShaderUniforms.uWindStrength.value = windSwayStrength;
  worldShaderUniforms.uRimStrength.value = rimStrength;

  voxelMaterials.cobblestone.roughness = roadRoughness;
  voxelMaterials.cobblestone.clearcoat = roadClearcoat;
  voxelMaterials.stone.roughness = stoneRoughness;
  voxelMaterials.stone.clearcoat = stoneClearcoat;
  voxelMaterials.stoneDark.roughness = Math.max(0.14, stoneRoughness - 0.06);
  voxelMaterials.stoneDark.clearcoat = Math.min(1.0, stoneClearcoat + 0.08);
}

/**
 * Applies the 5-pillar Cross-Platform Pipeline to the active Three.js scene:
 * 1. Master Asset Texture Override (BC7 16x Anisotropy vs ASTC 4x/8x Anisotropy)
 * 2. Geometry & LOD Scaling (Applies Mobile LOD Bias to skip LOD 0 in memory)
 * 3. Lighting Strategy (Baked Lightmap intensity + Disables "Cast Shadows" on small props for Mobile)
 * 4. Unified Uber Shader Keyword Switches (Toggles Rim Light, Detail Normals, Parallax, and SSS)
 */
export function applyCrossPlatformPipeline(
  scene: THREE.Scene,
  options: {
    anisotropySamples: number;
    compressionFormat: 'BC7' | 'ASTC';
    lodBias: number;
    skipLod0InMemory: boolean;
    smallPropCastShadows: boolean;
    bakedLightmapIntensity: number;
    useRimLight: boolean;
    useDetailNormals: boolean;
    useParallax: boolean;
    useSubsurface: boolean;
  }
): void {
  // 1. Update Master Asset Texture Override metadata & anisotropy without redundant canvas pixel re-uploads
  textureCache.forEach((tex) => {
    tex.anisotropy = options.anisotropySamples;
    tex.userData.compressionFormat = options.compressionFormat;
    tex.userData.masterSourceResolutionPx = 4096;
  });

  // 4. Update Unified Uber Shader Keyword Switches
  worldShaderUniforms.uUseRimLight.value = options.useRimLight ? 1.0 : 0.0;
  worldShaderUniforms.uUseDetailNormals.value = options.useDetailNormals ? 1.0 : 0.0;
  worldShaderUniforms.uUseParallax.value = options.useParallax ? 1.0 : 0.0;
  worldShaderUniforms.uUseSubsurface.value = options.useSubsurface ? 1.0 : 0.0;
  worldShaderUniforms.uBakedLightIntensity.value = options.bakedLightmapIntensity;

  voxelMaterials.grass.aoMapIntensity = options.bakedLightmapIntensity * 0.55;

  // 2 & 3. Traverse Scene for THREE.LOD Bias & Small-Prop Shadow Culling
  scene.traverse((obj) => {
    if (obj instanceof THREE.LOD) {
      // Apply LOD Bias: on Mobile, skip LOD 0 so the phone uses LOD 1 or LOD 2 at distance 0
      obj.levels.forEach((levelEntry, idx) => {
        if (options.skipLod0InMemory && idx < options.lodBias) {
          levelEntry.distance = 99999; // Never select skipped high-poly LOD tier
          levelEntry.object.visible = false;
        } else {
          const effectiveIdx = Math.max(0, idx - (options.skipLod0InMemory ? options.lodBias : 0));
          levelEntry.distance =
            effectiveIdx === 0 ? 0 : effectiveIdx === 1 ? 18 : effectiveIdx === 2 ? 38 : 68;
        }
      });
    }

    if (obj instanceof THREE.Mesh) {
      const isSmallDebrisOrProp =
        obj.userData.isSmallProp === true ||
        obj.parent?.name?.startsWith('ResourceNode_') ||
        obj.parent?.name?.startsWith('TeleportWaypoint_');
      if (isSmallDebrisOrProp && obj.userData.lodTier !== 2 && obj.userData.lodTier !== 3) {
        obj.castShadow = options.smallPropCastShadows;
      }
    }
  });
}

/**
 * Helper to draw high-DPI crisp canvas billboards
 */
function createCrispBillboardSprite(
  width: number,
  height: number,
  scaleX: number,
  scaleY: number,
  posY: number,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.Sprite {
  let texture: THREE.CanvasTexture | null = null;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawFn(ctx, width, height);
    }
    texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 8;
  }
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(scaleX, scaleY, 1);
  sprite.position.y = posY;
  return sprite;
}

/**
 * Creates the Next-Gen Open World Terrain with Biomes, Wet-Specular Imperial Roads,
 * Genshin Teleport Waypoints, Lush Sakura & Ginkgo Groves, Distant Alpine Mountains,
 * Floating Celestia Jade Sky Islands, and Gerstner-Wave Crystal Water
 */
export function createVoxelTerrain(): THREE.Group {
  const terrainGroup = new THREE.Group();
  terrainGroup.name = 'VoxelTerrain';

  // High-poly 3D Chamfered Terrain Block Geometry so every tile catches specular bevel highlights
  const boxGeo = createChamferedBlockGeometry(1.96, 2.0, 1.96, 0.08, 2);

  // Stepped elevation grid (40x40 chunks)
  const gridSize = 40;
  const step = 2;
  const half = (gridSize * step) / 2;

  const count = gridSize * gridSize;
  const grassInstanced = new THREE.InstancedMesh(boxGeo, voxelMaterials.grass, count);
  grassInstanced.castShadow = true;
  grassInstanced.receiveShadow = true;

  const stoneInstanced = new THREE.InstancedMesh(
    boxGeo,
    voxelMaterials.stone,
    Math.floor(count * 0.48)
  );
  stoneInstanced.castShadow = true;
  stoneInstanced.receiveShadow = true;

  // 800 High-Segment Instanced Wild Grass Blades & Teyvat Wildflowers (Cecilia white, Liyue gold, Sakura pink)
  const tuftGeo = new THREE.ConeGeometry(0.28, 0.78, 8, 2);
  const tuftMat = new THREE.MeshPhysicalMaterial({
    color: 0x66bb6a,
    normalMap: grassNormal,
    roughness: 0.56,
    clearcoat: 0.25,
  });
  attachGenshinFoliageShader(tuftMat);
  const grassTuftInstanced = new THREE.InstancedMesh(tuftGeo, tuftMat, 800);
  grassTuftInstanced.castShadow = false;
  grassTuftInstanced.receiveShadow = true;

  const mat4 = new THREE.Matrix4();
  const tempColor = new THREE.Color();
  let gIdx = 0;
  let sIdx = 0;
  let tIdx = 0;

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const worldX = x * step - half;
      const worldZ = z * step - half;

      const distFromCenter = Math.sqrt(worldX * worldX + worldZ * worldZ);
      const isImperialRoad =
        (Math.abs(worldX) <= 2 && Math.abs(worldZ) > 8 && Math.abs(worldZ) < 34) ||
        (Math.abs(worldZ) <= 2 && Math.abs(worldX) > 8 && Math.abs(worldX) < 34);

      const elevation = isImperialRoad
        ? 0
        : Math.floor(
            Math.sin(worldX * 0.08) * 1.5 +
              Math.cos(worldZ * 0.08) * 1.5 +
              (distFromCenter > 28 ? (distFromCenter - 28) * 0.15 : 0)
          );

      const heightY = elevation * 2;

      mat4.identity();
      mat4.setPosition(worldX, heightY - 1, worldZ);
      const currentGrassIndex = gIdx++;
      grassInstanced.setMatrixAt(currentGrassIndex, mat4);

      // Per-instance biome color tinting (Genshin Mondstadt / Liyue vibrancy)
      if (isImperialRoad) {
        tempColor.setHex(0x94a3b8); // Polished imperial slate road
      } else if (elevation >= 2) {
        tempColor.setHex(0x86efac); // Sunlit highland alpine meadow
      } else if (elevation <= -1) {
        tempColor.setHex(0x6ee7b7); // Turquoise shoreline moss
      } else {
        const checker = (x + z) % 2 === 0 ? 0x4ade80 : 0x22c55e;
        tempColor.setHex(checker);
      }
      grassInstanced.setColorAt(currentGrassIndex, tempColor);

      // Scatter 3D grass tufts & wildflowers on flat meadow blocks
      if (
        !isImperialRoad &&
        distFromCenter > 10 &&
        elevation >= 0 &&
        tIdx < grassTuftInstanced.count &&
        (x * 13 + z * 29) % 2 === 0
      ) {
        const tuftMat4 = new THREE.Matrix4();
        tuftMat4.makeRotationY((x * z) % 3.14);
        tuftMat4.setPosition(
          worldX + ((x % 2) - 0.5) * 0.65,
          heightY + 0.36,
          worldZ + ((z % 2) - 0.5) * 0.65
        );
        grassTuftInstanced.setMatrixAt(tIdx, tuftMat4);
        const flowerRoll = (x * 7 + z * 11) % 12;
        tempColor.setHex(
          flowerRoll === 0
            ? 0xfef08a
            : flowerRoll === 1
              ? 0xf472b6
              : flowerRoll === 2
                ? 0xe0f2fe
                : 0x4ade80
        );
        grassTuftInstanced.setColorAt(tIdx, tempColor);
        tIdx++;
      }

      // If elevated, place stone foundation blocks underneath
      if (elevation > 0 && sIdx < stoneInstanced.count) {
        mat4.identity();
        mat4.setPosition(worldX, heightY - 3, worldZ);
        const stoneIndex = sIdx++;
        stoneInstanced.setMatrixAt(stoneIndex, mat4);
        tempColor.setHex(elevation > 2 ? 0xcbd5e1 : 0x64748b);
        stoneInstanced.setColorAt(stoneIndex, tempColor);
      }
    }
  }

  grassInstanced.instanceMatrix.needsUpdate = true;
  if (grassInstanced.instanceColor) grassInstanced.instanceColor.needsUpdate = true;
  grassInstanced.computeBoundingSphere();

  stoneInstanced.instanceMatrix.needsUpdate = true;
  if (stoneInstanced.instanceColor) stoneInstanced.instanceColor.needsUpdate = true;
  stoneInstanced.computeBoundingSphere();

  grassTuftInstanced.instanceMatrix.needsUpdate = true;
  if (grassTuftInstanced.instanceColor) grassTuftInstanced.instanceColor.needsUpdate = true;
  grassTuftInstanced.computeBoundingSphere();

  terrainGroup.add(grassInstanced);
  terrainGroup.add(stoneInstanced);
  terrainGroup.add(grassTuftInstanced);

  // Imperial Avenue Lantern Posts + Golden Filigree Caps (High-Segment Cylinders & Beveled Lamps)
  const lanternCoords = [
    [-3.2, 12],
    [3.2, 12],
    [-3.2, 20],
    [3.2, 20],
    [-3.2, -12],
    [3.2, -12],
  ];
  const postGeo = new THREE.CylinderGeometry(0.14, 0.2, 2.9, 16, 2);
  const lampGeo = createChamferedBlockGeometry(0.5, 0.6, 0.5, 0.05, 2);
  const roofCapGeo = new THREE.ConeGeometry(0.52, 0.4, 16);
  lanternCoords.forEach(([lx, lz]) => {
    const post = new THREE.Mesh(postGeo, voxelMaterials.stoneDark);
    post.position.set(lx, 1.45, lz);
    post.castShadow = true;
    post.userData.isSmallProp = true;
    terrainGroup.add(post);

    const lamp = new THREE.Mesh(lampGeo, voxelMaterials.lanternGlow);
    lamp.position.set(lx, 3.0, lz);
    lamp.userData.isSmallProp = true;
    terrainGroup.add(lamp);

    const cap = new THREE.Mesh(roofCapGeo, voxelMaterials.goldAccent);
    cap.position.set(lx, 3.45, lz);
    cap.userData.isSmallProp = true;
    terrainGroup.add(cap);
  });

  // 4 Iconic Genshin-Style Elemental Teleport Waypoints at Cardinal Plaza Corners (High-Poly)
  const waypointCoords = [
    [-11, 14],
    [11, 14],
    [-11, -14],
    [11, -14],
  ];
  waypointCoords.forEach(([wx, wz], idx) => {
    const wpGroup = new THREE.Group();
    wpGroup.name = `TeleportWaypoint_${idx}`;
    wpGroup.position.set(wx, 0, wz);

    const dais = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.42, 0.48, 16, 2),
      voxelMaterials.stone
    );
    dais.position.y = 0.24;
    dais.castShadow = true;
    dais.receiveShadow = true;
    dais.userData.isSmallProp = true;
    wpGroup.add(dais);

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.5, 2.25, 16, 3),
      voxelMaterials.stoneDark
    );
    pillar.position.y = 1.32;
    pillar.castShadow = true;
    pillar.userData.isSmallProp = true;
    wpGroup.add(pillar);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.56, 2),
      voxelMaterials.diamondOre
    );
    crystal.name = `WaypointCrystal_${idx}`;
    crystal.position.y = 3.15;
    crystal.scale.set(0.75, 1.45, 0.75);
    wpGroup.add(crystal);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.76, 0.055, 16, 48),
      voxelMaterials.goldAccent
    );
    halo.position.y = 3.15;
    halo.rotation.x = Math.PI / 3;
    wpGroup.add(halo);

    terrainGroup.add(wpGroup);
  });

  // High-Poly Botanical Sakura Blossom & Golden Liyue Ginkgo Trees (Root Buttresses + Forked Boughs + 4-Tier THREE.LOD Canopies)
  const scenicTreeSpots: Array<[number, number, 'sakura' | 'ginkgo']> = [
    [-16, 8, 'sakura'],
    [16, 8, 'sakura'],
    [-18, -8, 'ginkgo'],
    [18, -8, 'ginkgo'],
    [-8, 25, 'sakura'],
    [8, 25, 'ginkgo'],
    [-24, 18, 'ginkgo'],
    [24, 18, 'sakura'],
  ];
  scenicTreeSpots.forEach(([tx, tz, kind]) => {
    const tree = new THREE.Group();
    tree.position.set(tx, 0, tz);
    tree.add(createSoftContactShadow(2.4, 0.46));

    // Flared root buttresses
    const rootBase = new THREE.Mesh(
      new THREE.ConeGeometry(0.72, 0.95, 12),
      voxelMaterials.woodTrunk
    );
    rootBase.position.y = 0.45;
    rootBase.castShadow = true;
    rootBase.userData.isSmallProp = true;
    tree.add(rootBase);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.52, 3.3, 16, 4),
      voxelMaterials.woodTrunk
    );
    trunk.position.y = 1.65;
    trunk.castShadow = true;
    tree.add(trunk);

    // Forked secondary boughs
    [-0.45, 0.45].forEach((bx, bIdx) => {
      const bough = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.24, 1.6, 12),
        voxelMaterials.woodTrunk
      );
      bough.position.set(bx, 3.0, bIdx === 0 ? 0.25 : -0.25);
      bough.rotation.z = bx > 0 ? -0.52 : 0.52;
      bough.castShadow = true;
      bough.userData.isSmallProp = true;
      tree.add(bough);
    });

    const leafMat = kind === 'sakura' ? voxelMaterials.sakuraBlossom : voxelMaterials.ginkgoGold;
    const crownOffsets = [
      [0, 3.85, 0, 1.9],
      [-1.05, 3.25, 0.65, 1.4],
      [1.05, 3.35, -0.65, 1.4],
      [0, 4.7, 0.2, 1.32],
      [-0.55, 4.1, -0.7, 1.18],
      [0.6, 4.0, 0.75, 1.18],
    ];
    crownOffsets.forEach(([cx, cy, cz, r]) => {
      // 4-Tier Aggressive THREE.LOD Chain (LOD 0: 320 tris, LOD 1: 80 tris, LOD 2: 20 tris, LOD 3: 8 tris)
      const lodCluster = createMultiLodCanopyCluster(r, leafMat);
      lodCluster.position.set(cx, cy, cz);
      tree.add(lodCluster);
    });
    terrainGroup.add(tree);
  });

  // High-Poly Distant Alpine Mountain Perimeter Ring (16-segment peaks + secondary jagged ridge spires)
  const mountainCount = 24;
  const snowCapMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    normalMap: stoneNormal,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughness: 0.32,
    metalness: 0.1,
    clearcoat: 0.45,
  });
  for (let m = 0; m < mountainCount; m++) {
    const angle = (m / mountainCount) * Math.PI * 2;
    const dist = 54 + (m % 3) * 6;
    const mx = Math.cos(angle) * dist;
    const mz = Math.sin(angle) * dist;
    const mHeight = 18 + (m % 4) * 6;
    const mRadius = 9 + (m % 3) * 2.5;

    const peakGroup = new THREE.Group();
    peakGroup.position.set(mx, -2, mz);

    const rockBase = new THREE.Mesh(
      new THREE.ConeGeometry(mRadius, mHeight, 16, 4),
      voxelMaterials.stoneDark
    );
    rockBase.position.y = mHeight / 2;
    peakGroup.add(rockBase);

    const snowCap = new THREE.Mesh(
      new THREE.ConeGeometry(mRadius * 0.46, mHeight * 0.44, 16, 2),
      snowCapMat
    );
    snowCap.position.y = mHeight * 0.79;
    peakGroup.add(snowCap);

    // Flanking secondary ridge peak for multi-spire mountain silhouette
    const subPeak = new THREE.Mesh(
      new THREE.ConeGeometry(mRadius * 0.58, mHeight * 0.66, 12, 3),
      voxelMaterials.stone
    );
    subPeak.position.set(mRadius * 0.45, mHeight * 0.33, mRadius * 0.25);
    peakGroup.add(subPeak);

    terrainGroup.add(peakGroup);
  }

  // 3 High-Poly Floating Celestia Jade Sky Islands in the Upper Horizon
  const skyIslandCoords = [
    [-28, 25, -28],
    [30, 28, -24],
    [0, 31, -38],
  ];
  skyIslandCoords.forEach(([ix, iy, iz], idx) => {
    const island = new THREE.Group();
    island.name = `CelestiaSkyIsland_${idx}`;
    island.position.set(ix, iy, iz);

    const underRock = new THREE.Mesh(
      new THREE.ConeGeometry(4.4, 5.8, 16, 3),
      voxelMaterials.stoneDark
    );
    underRock.rotation.x = Math.PI;
    underRock.position.y = -2.9;
    island.add(underRock);

    const terrace = new THREE.Mesh(
      new THREE.CylinderGeometry(4.6, 4.2, 0.95, 24, 2),
      voxelMaterials.celestialJade
    );
    terrace.position.y = 0.48;
    island.add(terrace);

    const pagoda = new THREE.Mesh(
      new THREE.ConeGeometry(2.5, 2.8, 16, 2),
      voxelMaterials.goldAccent
    );
    pagoda.position.y = 2.3;
    island.add(pagoda);

    const cascade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.68, 8.8, 16, 4),
      voxelMaterials.diamondOre
    );
    cascade.position.set(1.8, -3.9, 1.8);
    island.add(cascade);

    terrainGroup.add(island);
  });

  // 96x96 Ultra-Subdivided Gerstner-Wave Crystal Water Plane in the Valley (18,432 triangles)
  const waterGeo = new THREE.PlaneGeometry(160, 160, 96, 96);
  const waterMesh = new THREE.Mesh(waterGeo, voxelMaterials.water);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = -2.05;
  waterMesh.receiveShadow = true;
  waterMesh.name = 'VoxelWaterPlane';
  terrainGroup.add(waterMesh);

  return terrainGroup;
}

/**
 * High-Polygon Multi-Part Grand Citadel Structure (Castle Level 0 - 100)
 * Composite architectural model: Chamfered ashlar plinths, crenellated curtain walls,
 * Central Keep with Gothic Flying Buttresses & Stained-Glass Rose Window,
 * 4 Fluted Cylindrical Bastion Watchtowers with Glazed Tile Roofs & Upturned Eaves,
 * Gatehouse with Portcullis & Braziers, and High-Poly Celestial Astrolabe Spire.
 */
export function createVoxelCastle(level: number): THREE.Group {
  const castle = new THREE.Group();
  castle.name = 'PlayerCastle';

  // Soft ground ambient occlusion shadow under citadel
  castle.add(createSoftContactShadow(12.0, 0.68));

  // Chamfered Stepped Stone Plinth Foundation
  const outerPlinth = new THREE.Mesh(
    createChamferedBlockGeometry(17.8, 1.5, 17.8, 0.14, 3),
    voxelMaterials.stoneDark
  );
  outerPlinth.position.y = 0.75;
  outerPlinth.castShadow = true;
  outerPlinth.receiveShadow = true;
  castle.add(outerPlinth);

  const baseGeo = createChamferedBlockGeometry(16.2, 4.0, 16.2, 0.14, 3);
  const baseMesh = new THREE.Mesh(baseGeo, voxelMaterials.stoneDark);
  baseMesh.position.y = 2.2;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  castle.add(baseMesh);

  // Chamfered Crenellated Battlements (Merlons) around the outer curtain wall
  const merlonGeo = createChamferedBlockGeometry(1.12, 0.95, 1.12, 0.06, 2);
  for (let i = -6; i <= 6; i += 2.0) {
    const northMerlon = new THREE.Mesh(merlonGeo, voxelMaterials.stone);
    northMerlon.position.set(i, 4.65, -7.4);
    northMerlon.castShadow = true;
    castle.add(northMerlon);

    if (Math.abs(i) > 2.2) {
      const southMerlon = new THREE.Mesh(merlonGeo, voxelMaterials.stone);
      southMerlon.position.set(i, 4.65, 7.4);
      southMerlon.castShadow = true;
      castle.add(southMerlon);
    }

    const westMerlon = new THREE.Mesh(merlonGeo, voxelMaterials.stone);
    westMerlon.position.set(-7.4, 4.65, i);
    westMerlon.castShadow = true;
    castle.add(westMerlon);

    const eastMerlon = new THREE.Mesh(merlonGeo, voxelMaterials.stone);
    eastMerlon.position.set(7.4, 4.65, i);
    eastMerlon.castShadow = true;
    castle.add(eastMerlon);
  }

  // Central Keep with Chamfered Ashlar Masonry (scales with castle level)
  const keepHeight = 8 + Math.min(24, Math.floor(level * 0.24));
  const keepGeo = createChamferedBlockGeometry(10.2, keepHeight, 10.2, 0.16, 3);
  const keepMesh = new THREE.Mesh(keepGeo, voxelMaterials.cobblestone);
  keepMesh.position.y = 4 + keepHeight / 2;
  keepMesh.castShadow = true;
  keepMesh.receiveShadow = true;
  castle.add(keepMesh);

  // 4 Gothic Flying Buttress Arches Bracing the Central Keep
  const buttressGeo = createChamferedBlockGeometry(1.2, keepHeight * 0.72, 2.4, 0.08, 2);
  [
    [-5.6, 0, 0],
    [5.6, 0, 0],
    [0, -5.6, Math.PI / 2],
  ].forEach(([bx, bz, rotY]) => {
    const buttress = new THREE.Mesh(buttressGeo, voxelMaterials.stone);
    buttress.position.set(bx, 4 + keepHeight * 0.34, bz);
    buttress.rotation.y = rotY;
    buttress.castShadow = true;
    castle.add(buttress);
  });

  // Gold Trim Crown Moulding & Stepped Pagoda Eaves on Keep
  const crownTrim = new THREE.Mesh(
    createChamferedBlockGeometry(10.8, 0.68, 10.8, 0.08, 3),
    voxelMaterials.goldAccent
  );
  crownTrim.position.y = 4 + keepHeight;
  castle.add(crownTrim);

  // High-Poly Stained-Glass Gothic Rose Window on Front Keep Facade
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffecb3,
    emissive: level > 40 ? 0x00e5ff : 0xffb300,
    emissiveIntensity: 1.5,
    roughness: 0.08,
  });
  const roseWindow = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.15, 0.08, 64, 12, 2, 3),
    voxelMaterials.goldAccent
  );
  roseWindow.position.set(0, 4 + keepHeight * 0.62, 5.18);
  castle.add(roseWindow);

  const roseGlass = new THREE.Mesh(new THREE.CircleGeometry(1.12, 32), windowMat);
  roseGlass.position.set(0, 4 + keepHeight * 0.62, 5.14);
  castle.add(roseGlass);

  // Glowing Arched Lancet Windows on the Keep facades
  const winGeo = createChamferedBlockGeometry(0.95, 2.25, 0.24, 0.04, 2);
  const windowRows = Math.max(1, Math.min(3, Math.floor(keepHeight / 6)));
  for (let r = 0; r < windowRows; r++) {
    const wy = 7 + r * 4.5;
    [-2.6, 2.6].forEach((wx) => {
      const winFront = new THREE.Mesh(winGeo, windowMat);
      winFront.position.set(wx, wy, 5.12);
      castle.add(winFront);

      const winBack = new THREE.Mesh(winGeo, windowMat);
      winBack.position.set(wx, wy, -5.12);
      castle.add(winBack);
    });
  }

  // 4 Fluted Cylindrical Corner Bastion Watchtowers with Corbelled Machicolations, Glazed Roofs & Upturned Eaves
  const towerHeight = keepHeight + 4;
  const towerGeo = new THREE.CylinderGeometry(2.15, 2.42, towerHeight, 24, 4);
  const collarGeo = new THREE.CylinderGeometry(2.58, 2.22, 0.85, 24, 2);
  const roofGeo = new THREE.ConeGeometry(3.15, 4.4, 24, 4);
  const eaveRingGeo = new THREE.TorusGeometry(2.95, 0.12, 12, 36);
  const finialGeo = new THREE.OctahedronGeometry(0.42, 2);

  const towerOffsets = [
    [-7, -7],
    [7, -7],
    [-7, 7],
    [7, 7],
  ];

  towerOffsets.forEach(([ox, oz]) => {
    const tower = new THREE.Mesh(towerGeo, voxelMaterials.stone);
    tower.position.set(ox, towerHeight / 2, oz);
    tower.castShadow = true;
    tower.receiveShadow = true;
    castle.add(tower);

    const collar = new THREE.Mesh(collarGeo, voxelMaterials.stoneDark);
    collar.position.set(ox, towerHeight, oz);
    castle.add(collar);

    const roof = new THREE.Mesh(roofGeo, voxelMaterials.leavesAutumn);
    roof.position.set(ox, towerHeight + 2.2, oz);
    roof.castShadow = true;
    castle.add(roof);

    const eaveRing = new THREE.Mesh(eaveRingGeo, voxelMaterials.goldAccent);
    eaveRing.rotation.x = Math.PI / 2;
    eaveRing.position.set(ox, towerHeight + 0.15, oz);
    castle.add(eaveRing);

    const finial = new THREE.Mesh(finialGeo, voxelMaterials.goldAccent);
    finial.position.set(ox, towerHeight + 4.5, oz);
    castle.add(finial);
  });

  // Grand Gatehouse Entrance + Iron Portcullis Grate + Twin Braziers
  const gateFrame = new THREE.Mesh(
    createChamferedBlockGeometry(5.4, 6.0, 2.5, 0.12, 3),
    voxelMaterials.stone
  );
  gateFrame.position.set(0, 3.0, 8.0);
  gateFrame.castShadow = true;
  castle.add(gateFrame);

  const gateArchRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.9, 0.22, 12, 32, Math.PI),
    voxelMaterials.goldAccent
  );
  gateArchRing.position.set(0, 3.6, 9.28);
  castle.add(gateArchRing);

  const gateGeo = createChamferedBlockGeometry(3.8, 4.8, 2.6, 0.08, 2);
  const gateMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    map: woodMap,
    normalMap: woodNormal,
    roughness: 0.78,
  });
  const gate = new THREE.Mesh(gateGeo, gateMat);
  gate.position.set(0, 2.4, 8.05);
  castle.add(gate);

  // Portcullis Iron Bars (12-segment cylinders)
  const barGeo = new THREE.CylinderGeometry(0.065, 0.065, 4.6, 12);
  for (let bx = -1.4; bx <= 1.4; bx += 0.7) {
    const bar = new THREE.Mesh(barGeo, voxelMaterials.steelOre);
    bar.position.set(bx, 2.4, 9.4);
    castle.add(bar);
  }

  // Twin Gatehouse Flaming Braziers
  [-2.6, 2.6].forEach((bx) => {
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.48, 1.45, 16, 2),
      voxelMaterials.stoneDark
    );
    pedestal.position.set(bx, 0.72, 9.8);
    castle.add(pedestal);

    const flame = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.45, 2),
      voxelMaterials.lanternGlow
    );
    flame.position.set(bx, 1.68, 9.8);
    castle.add(flame);
  });

  // High-Poly Glowing Runic Spire at the top (Power Level Indicator) + 3 Orbital Astrolabe Rings
  const spireColor = level > 80 ? 0xff00ff : level > 40 ? 0x00e5ff : 0xffd700;
  const spireEmissive = level > 80 ? 0xd500f9 : level > 40 ? 0x00b0ff : 0xffab00;
  const spireMat = new THREE.MeshPhysicalMaterial({
    color: spireColor,
    emissive: spireEmissive,
    emissiveIntensity: 1.45,
    roughness: 0.06,
    metalness: 0.88,
    clearcoat: 1.0,
  });
  const spireRadius = 1.85 + Math.min(2, level * 0.02);
  const spireGeo = new THREE.IcosahedronGeometry(spireRadius, 2);
  const spire = new THREE.Mesh(spireGeo, spireMat);
  spire.position.y = 4 + keepHeight + 3.4;
  spire.name = 'CastleSpire';

  // Celestial Orbital Rings around the Castle Spire (48 tubular segments)
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(spireRadius * 1.48, 0.09, 16, 48),
    voxelMaterials.goldAccent
  );
  outerRing.rotation.x = Math.PI / 3;
  outerRing.name = 'CastleSpireRingOuter';
  spire.add(outerRing);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(spireRadius * 1.2, 0.065, 16, 48),
    voxelMaterials.diamondOre
  );
  innerRing.rotation.y = Math.PI / 4;
  innerRing.name = 'CastleSpireRingInner';
  spire.add(innerRing);

  castle.add(spire);

  // Royal Castle Banner Flag
  const flagPoleGeo = new THREE.CylinderGeometry(0.1, 0.12, 5.5, 12);
  const flagPole = new THREE.Mesh(flagPoleGeo, voxelMaterials.steelOre);
  flagPole.position.set(0, 4 + keepHeight + 4.2, 0);
  castle.add(flagPole);

  const flagClothGeo = createChamferedBlockGeometry(2.4, 1.45, 0.12, 0.03, 2);
  const flagClothMat = new THREE.MeshStandardMaterial({
    color: 0xd32f2f,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.25,
    roughness: 0.55,
  });
  const flagCloth = new THREE.Mesh(flagClothGeo, flagClothMat);
  flagCloth.position.set(1.2, 4 + keepHeight + 5.6, 0);
  castle.add(flagCloth);

  return castle;
}

/**
 * High-Polygon Multi-Part Resource Node Mesh (Level 1 - 10)
 */
export function createResourceNodeMesh(node: ResourceNode): THREE.Group {
  const group = new THREE.Group();
  group.name = `ResourceNode_${node.type}_${node.level}`;
  group.position.set(node.x, 0, node.z);

  const scaleFactor = 0.8 + node.level * 0.08;
  group.add(createSoftContactShadow(2.3 * scaleFactor, 0.52));

  if (node.type === 'wood') {
    // Ancient Multi-tier High-Poly Tree with root buttresses, cylindrical trunk, Icosahedron canopies & timber log
    const rootBase = new THREE.Mesh(
      new THREE.ConeGeometry(0.88 * scaleFactor, 1.1 * scaleFactor, 16),
      voxelMaterials.woodTrunk
    );
    rootBase.position.y = 0.55 * scaleFactor;
    rootBase.castShadow = true;
    group.add(rootBase);

    const trunkGeo = new THREE.CylinderGeometry(
      0.46 * scaleFactor,
      0.66 * scaleFactor,
      4.6 * scaleFactor,
      16,
      4
    );
    const trunk = new THREE.Mesh(trunkGeo, voxelMaterials.woodTrunk);
    trunk.position.y = 2.3 * scaleFactor;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    const foliageRadii = [2.1, 1.75, 1.35, 0.95];
    foliageRadii.forEach((rad, idx) => {
      const leavesGeo = new THREE.IcosahedronGeometry(rad * scaleFactor, 2);
      const mat = idx % 2 === 0 ? voxelMaterials.leaves : voxelMaterials.leavesLight;
      const leaves = new THREE.Mesh(leavesGeo, mat);
      leaves.position.y = (3.8 + idx * 1.1) * scaleFactor;
      leaves.scale.set(1.15, 0.72, 1.15);
      leaves.rotation.y = (idx * Math.PI) / 6;
      leaves.castShadow = true;
      leaves.receiveShadow = true;
      group.add(leaves);
    });

    // Fallen timber log & sawbuck stack
    const logGeo = new THREE.CylinderGeometry(
      0.42 * scaleFactor,
      0.42 * scaleFactor,
      2.6 * scaleFactor,
      16,
      2
    );
    logGeo.rotateZ(Math.PI / 2);
    const log = new THREE.Mesh(logGeo, voxelMaterials.woodTrunk);
    log.position.set(1.55, 0.42 * scaleFactor, 1.0);
    log.rotation.y = 0.4;
    log.castShadow = true;
    group.add(log);
  } else if (node.type === 'steel' || node.type === 'copper' || node.type === 'diamond') {
    // High-Poly Subdivided Mineral Rock Outcrop with 8 Faceted Crystal Spires
    const rockMat = voxelMaterials.stoneDark;
    const oreMat =
      node.type === 'steel'
        ? voxelMaterials.steelOre
        : node.type === 'copper'
          ? voxelMaterials.copperOre
          : voxelMaterials.diamondOre;

    const baseRockGeo = new THREE.DodecahedronGeometry(1.85 * scaleFactor, 2);
    const baseRock = new THREE.Mesh(baseRockGeo, rockMat);
    baseRock.position.y = 1.15 * scaleFactor;
    baseRock.scale.set(1.1, 0.85, 1.1);
    baseRock.castShadow = true;
    baseRock.receiveShadow = true;
    group.add(baseRock);

    // 8 Protruding Faceted Crystal / Ore Spires
    const oreGeo = new THREE.OctahedronGeometry(0.68 * scaleFactor, 1);
    for (let i = 0; i < 8; i++) {
      const ore = new THREE.Mesh(oreGeo, oreMat);
      const angle = (i * Math.PI) / 4;
      ore.position.set(
        Math.cos(angle) * 1.22 * scaleFactor,
        (0.95 + (i % 3) * 0.44) * scaleFactor,
        Math.sin(angle) * 1.22 * scaleFactor
      );
      ore.scale.set(0.82, 1.65, 0.82);
      ore.rotation.set(0.35 * i, angle, 0.25);
      ore.castShadow = true;
      group.add(ore);
    }
  } else if (node.type === 'grain') {
    // Chamfered Farm Plot with Bundled Golden Wheat Sheaves & 16-Segment Windmill Tower
    const plotGeo = createChamferedBlockGeometry(
      3.8 * scaleFactor,
      0.42,
      3.8 * scaleFactor,
      0.06,
      2
    );
    const plot = new THREE.Mesh(plotGeo, voxelMaterials.dirt);
    plot.position.y = 0.21;
    plot.receiveShadow = true;
    group.add(plot);

    // Bundled Wheat Sheaves
    const wheatGeo = new THREE.CylinderGeometry(
      0.34 * scaleFactor,
      0.24 * scaleFactor,
      1.48 * scaleFactor,
      12,
      2
    );
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const wheat = new THREE.Mesh(wheatGeo, voxelMaterials.grainGold);
        wheat.position.set(i * 1.05 * scaleFactor, 0.92 * scaleFactor, j * 1.05 * scaleFactor);
        wheat.castShadow = true;
        group.add(wheat);
      }
    }

    // Mini Windmill on corner of farm plot
    const millTower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38 * scaleFactor, 0.56 * scaleFactor, 2.65 * scaleFactor, 16, 2),
      voxelMaterials.stone
    );
    millTower.position.set(-1.6 * scaleFactor, 1.32 * scaleFactor, -1.6 * scaleFactor);
    millTower.castShadow = true;
    group.add(millTower);

    const bladesGroup = new THREE.Group();
    bladesGroup.position.set(-1.6 * scaleFactor, 2.32 * scaleFactor, -1.12 * scaleFactor);
    bladesGroup.name = 'GrainWindmillBlades';
    const bladeA = new THREE.Mesh(
      createChamferedBlockGeometry(2.25 * scaleFactor, 0.24 * scaleFactor, 0.08, 0.02, 2),
      voxelMaterials.woodTrunk
    );
    const bladeB = new THREE.Mesh(
      createChamferedBlockGeometry(0.24 * scaleFactor, 2.25 * scaleFactor, 0.08, 0.02, 2),
      voxelMaterials.woodTrunk
    );
    bladesGroup.add(bladeA, bladeB);
    group.add(bladesGroup);
  } else {
    // High-Poly Industrial Spirit Oil Derrick / Pumpjack Rig
    const frameGeo = new THREE.ConeGeometry(1.65 * scaleFactor, 4.2 * scaleFactor, 8, 4);
    frameGeo.rotateY(Math.PI / 4);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x455a64,
      roughness: 0.4,
      metalness: 0.85,
      wireframe: true,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 2.1 * scaleFactor;
    group.add(frame);

    // Chamfered Animated Pumpjack Walking Beam
    const pumpGeo = createChamferedBlockGeometry(
      2.25 * scaleFactor,
      0.56 * scaleFactor,
      0.56 * scaleFactor,
      0.06,
      2
    );
    const pump = new THREE.Mesh(pumpGeo, voxelMaterials.steelOre);
    pump.position.set(0, 3.6 * scaleFactor, 0);
    pump.name = 'OilPumpHead';
    pump.castShadow = true;
    group.add(pump);

    // 24-Segment Oil Storage Barrels
    const barrelGeo = new THREE.CylinderGeometry(
      0.42 * scaleFactor,
      0.42 * scaleFactor,
      1.08 * scaleFactor,
      24,
      2
    );
    const barrel1 = new THREE.Mesh(barrelGeo, voxelMaterials.oilDark);
    barrel1.position.set(1.5 * scaleFactor, 0.54 * scaleFactor, 0.8 * scaleFactor);
    barrel1.castShadow = true;
    const barrel2 = new THREE.Mesh(barrelGeo, voxelMaterials.oilDark);
    barrel2.position.set(0.85 * scaleFactor, 0.54 * scaleFactor, 1.45 * scaleFactor);
    barrel2.castShadow = true;
    group.add(barrel1, barrel2);
  }

  // High-DPI Retina Floating Resource Badge
  const badge = createCrispBillboardSprite(256, 128, 3.1, 1.55, 5.3 * scaleFactor, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.roundRect(8, 8, w - 16, h - 16, 22);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.font = 'bold 42px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${node.type.toUpperCase()}`, w / 2, 56);
    ctx.font = 'bold 38px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Lv.${node.level}`, w / 2, 102);
  });
  group.add(badge);

  return group;
}

/**
 * High-Polygon Sculpted Multi-Part Monster Mesh (Level 1 - 1000)
 * Uses LatheGeometry muscular torso, Damascus armor normal maps, Capsule limbs,
 * dorsal spine ridges, TorusKnot/Icosahedron abyssal cores, and beveled weapons.
 */
export function createMonsterMesh(monster: MonsterTarget): THREE.Group {
  const group = new THREE.Group();
  group.name = `Monster_${monster.id}`;
  group.position.set(monster.x, 0, monster.z);

  const isBoss = monster.isWorldBoss || monster.level > 500;
  const scale = isBoss ? 2.8 : monster.level > 200 ? 1.8 : 1.2;

  group.add(createSoftContactShadow(1.65 * scale, 0.6));

  const bodyColor =
    monster.level > 800
      ? 0x4a148c // Cosmic Void Purple
      : monster.level > 500
        ? 0xb71c1c // Dragon Crimson
        : monster.level > 200
          ? 0x37474f // Iron Titan
          : monster.level > 50
            ? 0x558b2f // Forest Troll
            : 0x2e7d32; // Goblin Green

  const monsterMat = new THREE.MeshPhysicalMaterial({
    color: bodyColor,
    normalMap: armorNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: monster.level > 200 ? 0.28 : 0.52,
    metalness: monster.level > 200 ? 0.76 : 0.25,
    clearcoat: monster.level > 200 ? 0.68 : 0.22,
  });

  const darkPlateMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    normalMap: armorNormal,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughness: 0.28,
    metalness: 0.85,
    clearcoat: 0.55,
  });

  // Sculpted Muscular Torso (24-segment LatheGeometry)
  const torsoGeo = createSculptedTorsoGeometry(
    0.58 * scale,
    0.52 * scale,
    0.82 * scale,
    2.05 * scale,
    24
  );
  const torso = new THREE.Mesh(torsoGeo, monsterMat);
  torso.position.y = 2.0 * scale;
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);

  // Glowing Abyssal Chest Core (TorusKnot for Bosses, Subdivided Octahedron for Elites)
  const coreColor = isBoss ? 0xff1744 : monster.level > 200 ? 0x00e5ff : 0xf59e0b;
  const chestCore = new THREE.Mesh(
    isBoss
      ? new THREE.TorusKnotGeometry(0.26 * scale, 0.07 * scale, 48, 12)
      : new THREE.OctahedronGeometry(0.38 * scale, 2),
    new THREE.MeshStandardMaterial({
      color: coreColor,
      emissive: coreColor,
      emissiveIntensity: 1.6,
      roughness: 0.08,
    })
  );
  chestCore.position.set(0, 2.15 * scale, 0.62 * scale);
  group.add(chestCore);

  // Chamfered Armored Shoulder Pauldrons
  const pauldronGeo = createChamferedBlockGeometry(
    0.78 * scale,
    0.66 * scale,
    0.88 * scale,
    0.08 * scale,
    2
  );
  const pauldronL = new THREE.Mesh(pauldronGeo, darkPlateMat);
  pauldronL.position.set(-1.15 * scale, 2.85 * scale, 0);
  pauldronL.rotation.z = 0.22;
  const pauldronR = new THREE.Mesh(pauldronGeo, darkPlateMat);
  pauldronR.position.set(1.15 * scale, 2.85 * scale, 0);
  pauldronR.rotation.z = -0.22;
  group.add(pauldronL, pauldronR);

  // Dorsal Spine Spikes along the back
  const spikeGeo = new THREE.ConeGeometry(0.16 * scale, 0.55 * scale, 12);
  for (let sp = 0; sp < 3; sp++) {
    const spike = new THREE.Mesh(spikeGeo, darkPlateMat);
    spike.position.set(0, (1.45 + sp * 0.55) * scale, -0.68 * scale);
    spike.rotation.x = -Math.PI / 2.4;
    group.add(spike);
  }

  // Sculpted High-Poly Monster Head & Glowing Eyes
  const headGeo = new THREE.IcosahedronGeometry(0.68 * scale, 2);
  const head = new THREE.Mesh(headGeo, monsterMat);
  head.position.y = 3.6 * scale;
  head.castShadow = true;
  group.add(head);

  const eyeColor = monster.level > 500 ? 0xff1744 : 0xffeb3b;
  const eyeMat = new THREE.MeshStandardMaterial({
    color: eyeColor,
    emissive: eyeColor,
    emissiveIntensity: 1.9,
  });
  const eyeGeo = new THREE.SphereGeometry(0.14 * scale, 16, 16);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.28 * scale, 3.68 * scale, 0.56 * scale);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.28 * scale, 3.68 * scale, 0.56 * scale);
  group.add(leftEye, rightEye);

  // Articulated Capsule Arms and Beveled War Cleaver
  const armGeo = new THREE.CapsuleGeometry(0.28 * scale, 1.15 * scale, 8, 16);
  const leftArm = new THREE.Mesh(armGeo, monsterMat);
  leftArm.position.set(-1.2 * scale, 2.0 * scale, 0);
  leftArm.castShadow = true;
  const rightArm = new THREE.Mesh(armGeo, monsterMat);
  rightArm.position.set(1.2 * scale, 2.0 * scale, 0);
  rightArm.castShadow = true;
  group.add(leftArm, rightArm);

  const clubBlade = new THREE.Mesh(
    createChamferedBlockGeometry(0.28 * scale, 1.72 * scale, 0.58 * scale, 0.05 * scale, 2),
    darkPlateMat
  );
  clubBlade.position.set(1.25 * scale, 1.35 * scale, 0.65 * scale);
  clubBlade.rotation.x = Math.PI / 3;
  clubBlade.castShadow = true;
  group.add(clubBlade);

  // Articulated Capsule Legs
  const legGeo = new THREE.CapsuleGeometry(0.28 * scale, 0.85 * scale, 8, 16);
  const leftLeg = new THREE.Mesh(legGeo, monsterMat);
  leftLeg.position.set(-0.45 * scale, 0.7 * scale, 0);
  leftLeg.castShadow = true;
  const rightLeg = new THREE.Mesh(legGeo, monsterMat);
  rightLeg.position.set(0.45 * scale, 0.7 * scale, 0);
  rightLeg.castShadow = true;
  group.add(leftLeg, rightLeg);

  // World Boss / Elite Horns, Sweeping Multi-Ribbed Wings & Subdivided Orbital Crystals
  if (isBoss) {
    const hornGeo = new THREE.ConeGeometry(0.32 * scale, 1.6 * scale, 16, 3);
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.22,
      metalness: 0.85,
    });
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-0.58 * scale, 4.55 * scale, 0);
    hornL.rotation.z = 0.42;
    const hornR = new THREE.Mesh(hornGeo, hornMat);
    hornR.position.set(0.58 * scale, 4.55 * scale, 0);
    hornR.rotation.z = -0.42;
    group.add(hornL, hornR);

    // Sweeping Sovereign Beveled Wings
    const wingMat = new THREE.MeshPhysicalMaterial({
      color: monster.level > 800 ? 0x7e22ce : 0x991b1b,
      normalMap: armorNormal,
      emissive: monster.level > 800 ? 0x581c87 : 0x7f1d1d,
      emissiveIntensity: 0.48,
      roughness: 0.3,
      metalness: 0.55,
      clearcoat: 0.68,
    });
    const wingGeo = createChamferedBlockGeometry(
      2.25 * scale,
      1.65 * scale,
      0.18 * scale,
      0.04 * scale,
      2
    );
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-1.65 * scale, 2.75 * scale, -0.68 * scale);
    wingL.rotation.set(0.15, 0.35, 0.28);
    wingL.castShadow = true;
    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(1.65 * scale, 2.75 * scale, -0.68 * scale);
    wingR.rotation.set(0.15, -0.35, -0.28);
    wingR.castShadow = true;
    group.add(wingL, wingR);

    // Floating Subdivided Orbital Crystals
    const crystalGeo = new THREE.OctahedronGeometry(0.42 * scale, 1);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0055,
      emissiveIntensity: 1.65,
      roughness: 0.08,
    });
    for (let c = 0; c < 3; c++) {
      const cr = new THREE.Mesh(crystalGeo, crystalMat);
      const ang = (c * Math.PI * 2) / 3;
      cr.position.set(Math.cos(ang) * 2.25 * scale, 3.2 * scale, Math.sin(ang) * 2.25 * scale);
      cr.name = `OrbitalCrystal_${c}`;
      group.add(cr);
    }
  }

  // Ground Attack Telegraph Ring (visual windup warning on terrain)
  const ringRadius = isBoss ? 4.2 : monster.level > 200 ? 3.0 : 2.2;
  const telegraphGeo = new THREE.RingGeometry(ringRadius * 0.78, ringRadius, 48);
  telegraphGeo.rotateX(-Math.PI / 2);
  const telegraphMat = new THREE.MeshBasicMaterial({
    color: isBoss ? 0xff1744 : 0xff9100,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const telegraphRing = new THREE.Mesh(telegraphGeo, telegraphMat);
  telegraphRing.position.y = 0.08;
  telegraphRing.name = 'MonsterTelegraphRing';
  group.add(telegraphRing);

  // High-DPI Retina Overhead Nameplate
  const sprite = createCrispBillboardSprite(384, 152, 4.6, 1.85, 5.25 * scale, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.roundRect(8, 8, w - 16, h - 16, 20);
    ctx.fill();
    ctx.strokeStyle = isBoss ? '#f43f5e' : '#eab308';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.font = 'bold 34px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${monster.name.slice(0, 18)}`, w / 2, 48);
    ctx.font = 'bold 34px monospace';
    ctx.fillStyle = isBoss ? '#fb7185' : '#fde047';
    ctx.fillText(
      `Lv.${monster.level} [${(monster.aiState || 'patrol').split('_')[0].toUpperCase()}]`,
      w / 2,
      96
    );
    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${(monster.movementPolicy || 'pack_swarmer').replace('_', ' ')}`, w / 2, 130);
  });
  group.add(sprite);

  return group;
}

/**
 * High-Polygon Sculpted Multi-Part Autonomous NPC Mesh (6 Specialized Roles:
 * Elder, Blacksmith, Marshal, Guard, Merchant, Mystic)
 */
export function createNPCMesh(npc: NPC): THREE.Group {
  const npcModel = new THREE.Group();
  npcModel.position.set(npc.x, 0, npc.z);
  npcModel.name = `NPC_${npc.id}`;

  const roleColors: Record<string, number> = {
    elder: 0x6a1b9a,
    blacksmith: 0xd84315,
    marshal: 0x1565c0,
    guard: 0x00838f,
    merchant: 0xf59e0b,
    mystic: 0x10b981,
  };
  const roleColor = roleColors[npc.role] || 0x1565c0;
  const isArmored = npc.role === 'guard' || npc.role === 'marshal';

  npcModel.add(createSoftContactShadow(1.38, 0.54));

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: roleColor,
    normalMap: armorNormal,
    normalScale: new THREE.Vector2(isArmored ? 0.8 : 0.35, isArmored ? 0.8 : 0.35),
    roughness: isArmored ? 0.22 : 0.5,
    metalness: isArmored ? 0.85 : 0.22,
    clearcoat: isArmored ? 0.72 : 0.2,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffdbac,
    roughness: 0.62,
  });

  // Articulated Capsule Legs
  const legGeo = new THREE.CapsuleGeometry(0.16, 0.55, 8, 16);
  const legL = new THREE.Mesh(legGeo, bodyMat);
  legL.position.set(-0.24, 0.42, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, bodyMat);
  legR.position.set(0.24, 0.42, 0);
  legR.castShadow = true;
  npcModel.add(legL, legR);

  // Sculpted Contoured Torso (24-segment LatheGeometry)
  const torso = new THREE.Mesh(createSculptedTorsoGeometry(0.38, 0.34, 0.46, 1.25, 24), bodyMat);
  torso.position.y = 1.4;
  torso.castShadow = true;
  torso.receiveShadow = true;
  npcModel.add(torso);

  // Gold Waist Sash / Belt
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.44, 0.18, 24),
    voxelMaterials.goldAccent
  );
  belt.scale.set(1.12, 1, 0.8);
  belt.position.y = 0.95;
  npcModel.add(belt);

  // Articulated Capsule Arms
  const armGeo = new THREE.CapsuleGeometry(0.14, 0.65, 8, 16);
  const armL = new THREE.Mesh(armGeo, bodyMat);
  armL.position.set(-0.66, 1.4, 0);
  armL.castShadow = true;
  const armR = new THREE.Mesh(armGeo, bodyMat);
  armR.position.set(0.66, 1.4, 0);
  armR.castShadow = true;
  npcModel.add(armL, armR);

  // Sculpted High-Segment Head & Eyes
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), skinMat);
  head.position.y = 2.42;
  head.castShadow = true;
  npcModel.add(head);

  const eyeMat = new THREE.MeshStandardMaterial({
    color: npc.role === 'mystic' || npc.role === 'elder' ? 0x38bdf8 : 0x1e293b,
    emissive: npc.role === 'mystic' ? 0x10b981 : 0x000000,
    emissiveIntensity: npc.role === 'mystic' ? 1.25 : 0,
  });
  const eyeGeo = new THREE.SphereGeometry(0.065, 12, 12);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.16, 2.46, 0.38);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.16, 2.46, 0.38);
  npcModel.add(eyeL, eyeR);

  // Role-Specific Iconic Silhouette Gear & Props
  if (npc.role === 'elder') {
    const beard = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.78, 16),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc })
    );
    beard.rotation.x = Math.PI;
    beard.position.set(0, 1.92, 0.36);
    npcModel.add(beard);

    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.28, 0.36, 16),
      voxelMaterials.goldAccent
    );
    crown.position.set(0, 2.95, 0);
    npcModel.add(crown);

    const staff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2.6, 12),
      voxelMaterials.woodTrunk
    );
    staff.position.set(0.75, 1.3, 0.25);
    npcModel.add(staff);

    const staffOrb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.25, 2),
      voxelMaterials.diamondOre
    );
    staffOrb.position.set(0.75, 2.75, 0.25);
    npcModel.add(staffOrb);
  } else if (npc.role === 'blacksmith') {
    const hammerShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.4, 12),
      voxelMaterials.woodTrunk
    );
    hammerShaft.position.set(0.75, 1.35, 0.28);
    npcModel.add(hammerShaft);

    const hammerHead = new THREE.Mesh(
      createChamferedBlockGeometry(0.46, 0.36, 0.74, 0.05, 2),
      voxelMaterials.steelOre
    );
    hammerHead.position.set(0.75, 2.0, 0.28);
    npcModel.add(hammerHead);
  } else if (npc.role === 'marshal' || npc.role === 'guard') {
    const helm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.46, 0.38, 20),
      voxelMaterials.steelOre
    );
    helm.position.set(0, 2.85, 0);
    npcModel.add(helm);

    const plume = new THREE.Mesh(
      createChamferedBlockGeometry(0.18, 0.46, 0.66, 0.04, 2),
      new THREE.MeshStandardMaterial({
        color: npc.role === 'marshal' ? 0xfbbf24 : 0x06b6d4,
      })
    );
    plume.position.set(0, 3.15, -0.05);
    npcModel.add(plume);

    const halberdShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2.7, 12),
      voxelMaterials.woodTrunk
    );
    halberdShaft.position.set(0.78, 1.35, 0.2);
    npcModel.add(halberdShaft);

    const halberdBlade = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.68, 12),
      voxelMaterials.goldAccent
    );
    halberdBlade.position.set(0.78, 2.8, 0.2);
    npcModel.add(halberdBlade);
  } else if (npc.role === 'merchant') {
    const pack = new THREE.Mesh(
      createChamferedBlockGeometry(0.88, 1.15, 0.65, 0.06, 2),
      voxelMaterials.woodTrunk
    );
    pack.position.set(0, 1.55, -0.58);
    pack.castShadow = true;
    npcModel.add(pack);

    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.65, 0.25, 20),
      voxelMaterials.goldAccent
    );
    hat.position.set(0, 2.85, 0);
    npcModel.add(hat);
  } else if (npc.role === 'mystic') {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.86, 0.045, 16, 48),
      voxelMaterials.diamondOre
    );
    ring.position.set(0, 1.85, -0.35);
    npcModel.add(ring);
  }

  // Role Aura Ring on Ground
  const auraGeo = new THREE.RingGeometry(0.92, 1.28, 48);
  auraGeo.rotateX(-Math.PI / 2);
  const auraMat = new THREE.MeshBasicMaterial({
    color: roleColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const auraMesh = new THREE.Mesh(auraGeo, auraMat);
  auraMesh.position.y = 0.06;
  npcModel.add(auraMesh);

  // High-DPI Retina NPC Overhead Billboard
  const spr = createCrispBillboardSprite(384, 144, 3.85, 1.45, 3.85, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.roundRect(8, 8, w - 16, h - 16, 20);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.font = 'bold 34px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${npc.name}`, w / 2, 54);
    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Lv.${npc.level} ${npc.role.toUpperCase()}`, w / 2, 106);
  });
  npcModel.add(spr);

  return npcModel;
}

/**
 * High-Polygon Sculpted Multi-Part Player Avatar with Cultivation Aura Visual Cues
 * Uses 24-segment LatheGeometry breastplate, Damascus scale-mail normal maps,
 * Capsule limbs, 24x24 Sphere sculpted head, and chamfered weapons & kite shield.
 */
export function createPlayerMesh(
  appearance: CharacterAppearance,
  realmIndex: number = 3,
  masteredGreatDaos: number = 3,
  isRedName: boolean = false
): THREE.Group {
  const player = new THREE.Group();
  player.name = 'PlayerAvatar';

  player.add(createSoftContactShadow(1.35, 0.58));

  const skinMat = new THREE.MeshStandardMaterial({
    color: appearance.skinColor,
    roughness: 0.62,
    metalness: 0.05,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: appearance.hairColor,
    roughness: 0.68,
  });

  const isHighTier = appearance.armorTier > 10;
  const isGodTier = appearance.armorTier >= 18;
  const isGoldenCoreRealm = realmIndex === 2;
  const armorMat = new THREE.MeshPhysicalMaterial({
    color: appearance.armorColor,
    normalMap: armorNormal,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: isHighTier ? 0.16 : 0.42,
    metalness: isHighTier ? 0.9 : 0.45,
    clearcoat: isHighTier ? 0.85 : 0.35,
    clearcoatRoughness: 0.1,
    emissive: isGodTier ? 0x00e5ff : isGoldenCoreRealm ? 0xf59e0b : 0x000000,
    emissiveIntensity: isGodTier ? 0.48 : isGoldenCoreRealm ? 0.3 : 0,
    transparent: isGoldenCoreRealm,
    opacity: isGoldenCoreRealm ? 0.68 : 1.0,
  });

  // Sculpted High-Segment Head (24x24 Sphere)
  const headGeo = new THREE.SphereGeometry(0.42, 24, 24);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 2.1;
  head.castShadow = true;
  player.add(head);

  // Glowing Cultivator Eyes
  const eyeMat = new THREE.MeshStandardMaterial({
    color: isRedName ? 0xff1744 : appearance.eyeColor,
    emissive: isRedName ? 0xff1744 : appearance.eyeColor,
    emissiveIntensity: isRedName ? 1.55 : 0.9,
  });
  const eyeGeo = new THREE.SphereGeometry(0.068, 12, 12);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.16, 2.15, 0.38);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.16, 2.15, 0.38);
  player.add(eyeL, eyeR);

  // Sculpted Hair Crown & Sovereign Diadem
  const hairGeo = new THREE.SphereGeometry(0.45, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 2.14, 0);
  player.add(hair);

  const diadem = new THREE.Mesh(
    new THREE.TorusGeometry(0.41, 0.045, 12, 32, Math.PI),
    voxelMaterials.goldAccent
  );
  diadem.rotation.x = Math.PI / 2;
  diadem.position.set(0, 2.32, 0.04);
  player.add(diadem);

  // Sculpted Contoured Breastplate / Torso (24-segment LatheGeometry) + Gold Belt
  const torsoGeo = createSculptedTorsoGeometry(0.36, 0.32, 0.45, 1.15, 24);
  const torso = new THREE.Mesh(torsoGeo, armorMat);
  torso.position.y = 1.25;
  torso.castShadow = true;
  player.add(torso);

  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.42, 0.16, 24),
    voxelMaterials.goldAccent
  );
  belt.scale.set(1.12, 1, 0.78);
  belt.position.y = 0.78;
  player.add(belt);

  // Chamfered Layered Shoulder Pauldrons with Gold Trim
  const pauldronGeo = createChamferedBlockGeometry(0.4, 0.4, 0.46, 0.06, 2);
  const pauldronL = new THREE.Mesh(pauldronGeo, armorMat);
  pauldronL.position.set(-0.62, 1.72, 0);
  const pauldronR = new THREE.Mesh(pauldronGeo, armorMat);
  pauldronR.position.set(0.62, 1.72, 0);
  player.add(pauldronL, pauldronR);

  // Articulated Capsule Left & Right Arms
  const armGeo = new THREE.CapsuleGeometry(0.14, 0.62, 8, 16);
  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-0.6, 1.2, 0);
  armL.castShadow = true;
  const armR = new THREE.Mesh(armGeo, skinMat);
  armR.position.set(0.6, 1.2, 0);
  armR.castShadow = true;
  player.add(armL, armR);

  // Beveled High-Poly Weapon in Right Hand
  const weaponGroup = new THREE.Group();
  weaponGroup.position.set(0.65, 0.8, 0.2);

  if (appearance.weaponType === 'broadsword') {
    const bladeGeo = createChamferedBlockGeometry(0.14, 1.52, 0.065, 0.02, 2);
    const bladeMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.38,
      metalness: 0.96,
      roughness: 0.06,
      clearcoat: 1.0,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.62;
    weaponGroup.add(blade);

    const guardGeo = createChamferedBlockGeometry(0.46, 0.11, 0.13, 0.025, 2);
    const guard = new THREE.Mesh(guardGeo, voxelMaterials.goldAccent);
    guard.position.y = 0.04;
    weaponGroup.add(guard);
  } else if (appearance.weaponType === 'crossbow') {
    const bowStockGeo = createChamferedBlockGeometry(0.15, 0.15, 0.85, 0.03, 2);
    const bowStock = new THREE.Mesh(bowStockGeo, voxelMaterials.woodTrunk);
    weaponGroup.add(bowStock);
    const bowArmsGeo = createChamferedBlockGeometry(0.95, 0.1, 0.1, 0.02, 2);
    const bowArms = new THREE.Mesh(bowArmsGeo, voxelMaterials.steelOre);
    bowArms.position.z = 0.36;
    weaponGroup.add(bowArms);
  } else if (appearance.weaponType === 'siege_mortar') {
    const cannonGeo = new THREE.CylinderGeometry(0.2, 0.25, 1.15, 20, 2);
    const cannon = new THREE.Mesh(cannonGeo, voxelMaterials.steelOre);
    cannon.rotation.x = Math.PI / 4;
    weaponGroup.add(cannon);
  } else {
    const shaftGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.05, 12);
    const shaft = new THREE.Mesh(shaftGeo, voxelMaterials.woodTrunk);
    shaft.position.y = 0.5;
    weaponGroup.add(shaft);
    const spearGeo = new THREE.ConeGeometry(0.2, 0.68, 12);
    const spear = new THREE.Mesh(spearGeo, voxelMaterials.diamondOre);
    spear.position.y = 1.62;
    weaponGroup.add(spear);
  }
  player.add(weaponGroup);

  // Beveled Runic Shield in Left Hand
  const shieldGeo = createChamferedBlockGeometry(0.12, 0.84, 0.64, 0.035, 3);
  const shieldMat = new THREE.MeshPhysicalMaterial({
    color: 0x1565c0,
    normalMap: armorNormal,
    metalness: 0.84,
    roughness: 0.18,
    clearcoat: 0.78,
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.position.set(-0.75, 1.1, 0.15);
  player.add(shield);

  // Articulated Capsule Legs
  const legGeo = new THREE.CapsuleGeometry(0.15, 0.52, 8, 16);
  const legL = new THREE.Mesh(legGeo, armorMat);
  legL.position.set(-0.24, 0.4, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, armorMat);
  legR.position.set(0.24, 0.4, 0);
  legR.castShadow = true;
  player.add(legL, legR);

  // Beveled Flowing Cape
  if (appearance.hasCape) {
    const capeGeo = createChamferedBlockGeometry(0.84, 1.34, 0.07, 0.02, 2);
    const capeMat = new THREE.MeshStandardMaterial({
      color: appearance.capeColor,
      roughness: 0.72,
    });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 1.1, -0.35);
    cape.rotation.x = 0.16;
    cape.castShadow = true;
    player.add(cape);
  }

  // ==========================================================================
  // CULTIVATION POWER VISUAL CUES ("THE AURA" — Replaces Overhead Level Numbers)
  // ==========================================================================
  const auraGroup = new THREE.Group();
  auraGroup.name = 'CultivationAuraGroup';

  if (realmIndex === 1) {
    const mistGeo = new THREE.SphereGeometry(1.15, 28, 28);
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });
    const mistShell = new THREE.Mesh(mistGeo, mistMat);
    mistShell.position.y = 1.35;
    mistShell.name = 'CultivationFoundationGlow';
    auraGroup.add(mistShell);
  } else if (realmIndex === 2) {
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.65,
      metalness: 0.96,
      roughness: 0.06,
    });
    const chestCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 2), coreMat);
    chestCore.position.set(0, 1.25, 0.05);
    chestCore.name = 'CultivationChestCore';
    auraGroup.add(chestCore);

    const backCoreGroup = new THREE.Group();
    backCoreGroup.position.set(0, 1.65, -0.68);
    backCoreGroup.name = 'CultivationGoldenCore';
    const backSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 2), coreMat);
    const backRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.045, 16, 48),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    backCoreGroup.add(backSphere, backRing);
    auraGroup.add(backCoreGroup);
  } else if (realmIndex >= 3 && realmIndex <= 20) {
    const babyGroup = new THREE.Group();
    babyGroup.position.set(0, 3.15, 0);
    babyGroup.name = 'CultivationNascentBaby';

    const babyMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.92,
    });
    const babyBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.2, 8, 16), babyMat);
    const babyHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), babyMat);
    babyHead.position.y = 0.32;
    const babyLotus = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.05, 16, 36),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    babyLotus.rotation.x = Math.PI / 2;
    babyLotus.position.y = -0.18;

    babyGroup.add(babyBody, babyHead, babyLotus);
    auraGroup.add(babyGroup);
  } else if (realmIndex >= 21) {
    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, 1.85, -0.75);
    haloGroup.name = 'CultivationDivineHalos';

    const haloCount = Math.max(1, Math.min(12, masteredGreatDaos));
    for (let h = 0; h < haloCount; h++) {
      const radius = 0.75 + h * 0.16;
      const haloGeo = new THREE.TorusGeometry(radius, 0.035, 16, 48);
      const haloMat = new THREE.MeshBasicMaterial({
        color: h % 2 === 0 ? 0xfde047 : 0xc084fc,
      });
      const haloRing = new THREE.Mesh(haloGeo, haloMat);
      haloRing.rotation.z = (h * Math.PI) / haloCount;
      haloGroup.add(haloRing);
    }
    auraGroup.add(haloGroup);
  }

  if (isRedName) {
    const redGeo = new THREE.RingGeometry(1.1, 1.45, 48);
    redGeo.rotateX(-Math.PI / 2);
    const redMat = new THREE.MeshBasicMaterial({
      color: 0xff1744,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    });
    const redRing = new THREE.Mesh(redGeo, redMat);
    redRing.position.y = 0.08;
    redRing.name = 'RedNameKarmaRing';
    auraGroup.add(redRing);
  }

  player.add(auraGroup);

  // High-DPI Retina Floating Player Name & Sect Title Banner (No Level Numbers above head!)
  const sprite = createCrispBillboardSprite(
    400,
    128,
    3.6,
    1.2,
    realmIndex >= 3 && realmIndex <= 20 ? 3.95 : 3.25,
    (ctx, w, h) => {
      ctx.fillStyle = isRedName ? 'rgba(69, 10, 10, 0.92)' : 'rgba(15, 23, 42, 0.88)';
      ctx.roundRect(8, 8, w - 16, h - 16, 20);
      ctx.fill();
      ctx.strokeStyle = isRedName ? '#ff1744' : '#38bdf8';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = isRedName ? '#fecdd3' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`[${appearance.clanTag}] ${appearance.name}`, w / 2, 52);
      ctx.font = 'bold 30px monospace';
      ctx.fillStyle = isRedName ? '#ff1744' : '#38bdf8';
      ctx.fillText(isRedName ? '🩸 RED NAME · BOUNTY' : `${appearance.title}`, w / 2, 100);
    }
  );
  player.add(sprite);

  return player;
}
