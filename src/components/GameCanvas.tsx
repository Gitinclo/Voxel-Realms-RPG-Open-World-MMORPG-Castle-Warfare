/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { CharacterAppearance, MonsterTarget, NPC, ResourceNode } from '../types/game';
import {
  GraphicsQualityPreset,
  applyCrossPlatformPipeline,
  createMonsterMesh,
  createNPCMesh,
  createPlayerMesh,
  createResourceNodeMesh,
  createVoxelCastle,
  createVoxelTerrain,
  updateWorldShaderUniforms,
} from '../game/proceduralWorld';
import {
  TargetPlatform,
  computeAtmosphericSkyParams,
  computeLightingStrategy,
  computeLodChainPolicy,
  computeMasterTextureImportOverride,
  computeMeshAndTextureBudget,
  computeSurfaceWetnessParams,
  computeUberShaderKeywords,
  getPostProcessProfile,
} from '../game/graphicsEngine';
import { WeatherType, WEATHER_CONFIGS } from '../game/weather';
import { sound } from '../game/audio';
import {
  OpenWorldChunkStreamingManager,
  buildSceneBVHTrees,
  disposeSceneBVHTrees,
  enableOpenWorldMeshBVH,
  evaluateChunkBoundaryProximity,
  resolvePlayerCitadelCollisionCannon,
} from '../game/openWorld3DEngine';
import {
  GOD_FLIGHT_SPEC,
  GodFlightPermissionStatus,
  GodTeleportPermissionStatus,
  computeNextGodFlightKinematics,
  evaluateGodFlightPermission,
} from '../game/godModeCharacter';

/**
 * Custom Post-Processing ShaderPass combining:
 * - Genshin Impact Teyvat Vibrance & S-Curve Contrast
 * - GTA V Warm/Cool Split-Toning & Sun Glare
 * - Unsharp-Mask Micro-Detail Edge Sharpening & Subtle Vignette
 */
const NextGenColorGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1440, 900) },
    uSaturation: { value: 1.22 },
    uContrast: { value: 1.12 },
    uVibrance: { value: 0.24 },
    uSharpen: { value: 0.35 },
    uVignette: { value: 0.28 },
    uGodRayIntensity: { value: 0.65 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uSaturation;
    uniform float uContrast;
    uniform float uVibrance;
    uniform float uSharpen;
    uniform float uVignette;
    uniform float uGodRayIntensity;
    varying vec2 vUv;

    void main() {
      vec2 texel = 1.0 / max(uResolution, vec2(1.0));
      vec4 baseSample = texture2D(tDiffuse, vUv);
      vec3 col = baseSample.rgb;

      // 1. Micro-Detail Edge Sharpening (3-tap cross kernel)
      if (uSharpen > 0.01) {
        vec3 n = texture2D(tDiffuse, vUv + vec2(0.0, texel.y)).rgb;
        vec3 s = texture2D(tDiffuse, vUv - vec2(0.0, texel.y)).rgb;
        vec3 e = texture2D(tDiffuse, vUv + vec2(texel.x, 0.0)).rgb;
        vec3 w = texture2D(tDiffuse, vUv - vec2(texel.x, 0.0)).rgb;
        vec3 edge = col * 4.0 - (n + s + e + w);
        col += edge * (uSharpen * 0.28);
      }

      // 2. Genshin Impact Vibrance & Saturation Boost
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      float maxChannel = max(col.r, max(col.g, col.b));
      float minChannel = min(col.r, min(col.g, col.b));
      float sat = maxChannel - minChannel;
      col = mix(vec3(luma), col, uSaturation + uVibrance * (1.0 - sat));

      // 3. GTA V Warm Golden Highlights & Cool Azure Shadow Split-Toning
      vec3 shadowTint = vec3(0.94, 0.97, 1.05);
      vec3 highlightTint = vec3(1.04, 1.01, 0.94);
      col *= mix(shadowTint, highlightTint, smoothstep(0.15, 0.85, luma));

      // 4. Filmic S-Curve Contrast
      col = clamp((col - 0.5) * uContrast + 0.5, 0.0, 1.0);

      // 5. Atmospheric Upper-Horizon Sun Shaft Warmth
      float topGlow = pow(max(0.0, vUv.y), 2.5) * uGodRayIntensity * 0.08;
      col += vec3(1.0, 0.88, 0.65) * topGlow;

      // 6. Subtle Optical Lens Vignette
      vec2 centered = vUv - 0.5;
      float vig = 1.0 - dot(centered, centered) * uVignette;
      col *= clamp(vig, 0.65, 1.0);

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), baseSample.a);
    }
  `,
};

interface GameCanvasProps {
  castleLevel: number;
  playerAppearance: CharacterAppearance;
  cultivationRealmIndex?: number;
  masteredGreatDaos?: number;
  isRedName?: boolean;
  monsters: MonsterTarget[];
  resourceNodes: ResourceNode[];
  npcs: NPC[];
  timeOfDayHours: number; // 0 to 24 hours
  weather?: WeatherType;
  graphicsQuality?: GraphicsQualityPreset;
  targetPlatform?: TargetPlatform;
  hdPackMounted?: boolean;
  onSelectMonster: (monster: MonsterTarget) => void;
  onSelectResourceNode: (node: ResourceNode) => void;
  onSelectCastle: () => void;
  onSelectNPC: (npc: NPC) => void;
  onPlayerPositionChange?: (x: number, z: number) => void;
  touchInput?: { x: number; y: number }; // -1 to 1 joystick values
  flightPermission?: GodFlightPermissionStatus;
  isFlying?: boolean;
  flightTargetAltitude?: number;
  onFlightAltitudeChange?: (altitude: number) => void;
  onToggleFlight?: () => void;
  teleportPermission?: GodTeleportPermissionStatus;
  teleportCommand?: { seq: number; x: number; y: number; z: number } | null;
  onForwardBlink?: (facingAngleRad: number) => void;
  onShiftClickTeleport?: (x: number, y: number, z: number) => void;
  fetchedBoundaryKeys?: readonly string[];
  onCameraYawChange?: (yawRad: number) => void;
  isPaused?: boolean;
  canSprint?: boolean;
  onSprintChange?: (isSprinting: boolean) => void;
  onCombatHotkey?: (action: 'strike' | 'power' | 'heal' | 'dash' | 'domain') => void;
  onTogglePause?: () => void;
  combatVfxCommand?: {
    seq: number;
    kind: 'strike' | 'power' | 'heal' | 'dash' | 'domain';
    colorHex: number;
    shakeIntensity: number;
  } | null;
  domainVisual?: { active: boolean; radiusMeters: number };
  zoneFogTintHex?: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  castleLevel,
  playerAppearance,
  cultivationRealmIndex = 3,
  masteredGreatDaos = 3,
  isRedName = false,
  monsters,
  resourceNodes,
  npcs,
  timeOfDayHours,
  weather = 'clear',
  graphicsQuality = 'ultra',
  targetPlatform = 'pc_console',
  hdPackMounted = false,
  onSelectMonster,
  onSelectResourceNode,
  onSelectCastle,
  onSelectNPC,
  onPlayerPositionChange,
  touchInput,
  flightPermission,
  isFlying = false,
  flightTargetAltitude = GOD_FLIGHT_SPEC.defaultCruiseAltitude,
  onFlightAltitudeChange,
  onToggleFlight,
  teleportPermission,
  teleportCommand = null,
  onForwardBlink,
  onShiftClickTeleport,
  fetchedBoundaryKeys = [],
  onCameraYawChange,
  isPaused = false,
  canSprint = true,
  onSprintChange,
  onCombatHotkey,
  onTogglePause,
  combatVfxCommand = null,
  domainVisual = { active: false, radiusMeters: 12 },
  zoneFogTintHex,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Store mutable refs so animation loop never re-instantiates or tears down
  const propsRef = useRef({
    castleLevel,
    playerAppearance,
    cultivationRealmIndex,
    masteredGreatDaos,
    isRedName,
    monsters,
    resourceNodes,
    npcs,
    timeOfDayHours,
    weather,
    graphicsQuality,
    targetPlatform,
    hdPackMounted,
    onSelectMonster,
    onSelectResourceNode,
    onSelectCastle,
    onSelectNPC,
    onPlayerPositionChange,
    touchInput,
    flightPermission,
    isFlying,
    flightTargetAltitude,
    onFlightAltitudeChange,
    onToggleFlight,
    teleportPermission,
    teleportCommand,
    onForwardBlink,
    onShiftClickTeleport,
    fetchedBoundaryKeys,
    onCameraYawChange,
    isPaused,
    canSprint,
    onSprintChange,
    onCombatHotkey,
    onTogglePause,
    combatVfxCommand,
    domainVisual,
    zoneFogTintHex,
  });

  useEffect(() => {
    propsRef.current = {
      castleLevel,
      playerAppearance,
      cultivationRealmIndex,
      masteredGreatDaos,
      isRedName,
      monsters,
      resourceNodes,
      npcs,
      timeOfDayHours,
      weather,
      graphicsQuality,
      targetPlatform,
      hdPackMounted,
      onSelectMonster,
      onSelectResourceNode,
      onSelectCastle,
      onSelectNPC,
      onPlayerPositionChange,
      touchInput,
      flightPermission,
      isFlying,
      flightTargetAltitude,
      onFlightAltitudeChange,
      onToggleFlight,
      teleportPermission,
      teleportCommand,
      onForwardBlink,
      onShiftClickTeleport,
      fetchedBoundaryKeys,
      onCameraYawChange,
      isPaused,
      canSprint,
      onSprintChange,
      onCombatHotkey,
      onTogglePause,
      combatVfxCommand,
      domainVisual,
      zoneFogTintHex,
    };
  }, [
    castleLevel,
    playerAppearance,
    cultivationRealmIndex,
    masteredGreatDaos,
    isRedName,
    monsters,
    resourceNodes,
    npcs,
    timeOfDayHours,
    weather,
    graphicsQuality,
    targetPlatform,
    hdPackMounted,
    onSelectMonster,
    onSelectResourceNode,
    onSelectCastle,
    onSelectNPC,
    onPlayerPositionChange,
    touchInput,
    flightPermission,
    isFlying,
    flightTargetAltitude,
    onFlightAltitudeChange,
    onToggleFlight,
    teleportPermission,
    teleportCommand,
    onForwardBlink,
    onShiftClickTeleport,
    fetchedBoundaryKeys,
    onCameraYawChange,
    isPaused,
    canSprint,
    onSprintChange,
    onCombatHotkey,
    onTogglePause,
    combatVfxCommand,
    domainVisual,
    zoneFogTintHex,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL from GPU renderer string
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    const bgColor = new THREE.Color(0x38bdf8);
    scene.background = bgColor;
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.5, 3600);
    camera.position.set(0, 14, 22);

    // Preetham Physical Atmospheric Sky Dome (GTA V / Genshin Impact Atmosphere)
    const sky = new Sky();
    sky.scale.setScalar(3200);
    scene.add(sky);
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 2.4;
    skyUniforms['rayleigh'].value = 1.65;
    skyUniforms['mieCoefficient'].value = 0.0045;
    skyUniforms['mieDirectionalG'].value = 0.86;
    const skySunVec = new THREE.Vector3();

    // Studio PBR WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    // Hardware Post-Processing Pipeline (RenderPass -> UnrealBloomPass -> NextGenColorGradePass -> OutputPass)
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    let colorGradePass: ShaderPass | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(Math.floor(width / 2), Math.floor(height / 2)),
        0.18,
        0.28,
        0.92
      );
      composer.addPass(bloomPass);

      colorGradePass = new ShaderPass(NextGenColorGradeShader);
      colorGradePass.uniforms['uResolution'].value.set(width, height);
      composer.addPass(colorGradePass);

      const outputPass = new OutputPass();
      composer.addPass(outputPass);
    }

    // Procedural RoomEnvironment for realistic PBR reflections & clearcoat highlights
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 3-Point Studio & Atmospheric Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 1.05);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff8e7, 3.1);
    sunLight.position.set(25, 45, 25);
    sunLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 145;
      sunLight.shadow.camera.left = -46;
      sunLight.shadow.camera.right = 46;
      sunLight.shadow.camera.top = 46;
      sunLight.shadow.camera.bottom = -46;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    scene.add(sunLight);

    // Cool/Golden Atmospheric Rim Light (Separates 3D silhouettes like Genshin Impact)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    rimLight.position.set(-28, 18, -24);
    scene.add(rimLight);

    // Warm Citadel Courtyard Point Light (subdued during daytime so castle walls do not wash out)
    const citadelHeartLight = new THREE.PointLight(0xffb300, 0.55, 28);
    citadelHeartLight.position.set(0, 8, 6);
    scene.add(citadelHeartLight);

    // Sun Visual Sphere + Subtle Corona Halos
    const sunGroup = new THREE.Group();
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfffbeb })
    );
    const sunCorona = new THREE.Mesh(
      new THREE.SphereGeometry(5.6, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      })
    );
    const sunOuterGlare = new THREE.Mesh(
      new THREE.SphereGeometry(8.8, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
      })
    );
    sunGroup.add(sunMesh, sunCorona, sunOuterGlare);
    scene.add(sunGroup);

    // Moon Visual Sphere + Halo
    const moonGroup = new THREE.Group();
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xe0e7ff })
    );
    const moonHalo = new THREE.Mesh(
      new THREE.SphereGeometry(4.6, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0x818cf8,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      })
    );
    moonGroup.add(moonMesh, moonHalo);
    scene.add(moonGroup);

    // Drifting High-Altitude Voxel Cloud Layer
    const cloudGroup = new THREE.Group();
    cloudGroup.name = 'VolumetricVoxelClouds';
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.0,
      transparent: true,
      opacity: 0.82,
    });
    for (let c = 0; c < 14; c++) {
      const cluster = new THREE.Group();
      const puffs = 3 + (c % 3);
      for (let p = 0; p < puffs; p++) {
        const puff = new THREE.Mesh(
          new THREE.BoxGeometry(5 + (p % 2) * 3, 1.8 + (p % 2) * 0.6, 4.2 + p * 1.2),
          cloudMat
        );
        puff.position.set((p - 1) * 2.6, (p % 2) * 0.5, ((p * 3) % 2) * 1.2);
        cluster.add(puff);
      }
      const angle = (c / 14) * Math.PI * 2;
      const dist = 34 + (c % 4) * 16;
      cluster.position.set(Math.cos(angle) * dist, 32 + (c % 3) * 4, Math.sin(angle) * dist);
      cloudGroup.add(cluster);
    }
    scene.add(cloudGroup);

    // Starfield for night sky
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 450;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 230;
      starPositions[i + 1] = Math.random() * 85 + 28;
      starPositions[i + 2] = (Math.random() - 0.5) * 230;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.35,
      transparent: true,
      opacity: 0,
    });
    const starsField = new THREE.Points(starsGeo, starsMat);
    scene.add(starsField);

    // Ambient Spirit Qi Motes / Golden Fireflies floating over the valley
    const fireflyCount = 120;
    const fireflyGeo = new THREE.BufferGeometry();
    const fireflyPositions = new Float32Array(fireflyCount * 3);
    for (let i = 0; i < fireflyCount * 3; i += 3) {
      fireflyPositions[i] = (Math.random() - 0.5) * 70;
      fireflyPositions[i + 1] = 1.0 + Math.random() * 7.5;
      fireflyPositions[i + 2] = (Math.random() - 0.5) * 70;
    }
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
    const fireflyMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.45,
      transparent: true,
      opacity: 0.7,
    });
    const fireflyParticles = new THREE.Points(fireflyGeo, fireflyMat);
    scene.add(fireflyParticles);

    // Weather Particle Systems (Rain & Snow)
    const rainCount = 1200;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 80;
      rainPositions[i + 1] = Math.random() * 45;
      rainPositions[i + 2] = (Math.random() - 0.5) * 80;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.8,
      transparent: true,
      opacity: 0.75,
    });
    const rainParticles = new THREE.Points(rainGeo, rainMat);
    rainParticles.visible = false;
    scene.add(rainParticles);

    const snowCount = 1000;
    const snowGeo = new THREE.BufferGeometry();
    const snowPositions = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount * 3; i += 3) {
      snowPositions[i] = (Math.random() - 0.5) * 80;
      snowPositions[i + 1] = Math.random() * 45;
      snowPositions[i + 2] = (Math.random() - 0.5) * 80;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      transparent: true,
      opacity: 0.85,
    });
    const snowParticles = new THREE.Points(snowGeo, snowMat);
    snowParticles.visible = false;
    scene.add(snowParticles);

    // Lightning Flash Light for Storms
    const lightningLight = new THREE.PointLight(0xa5f3fc, 0, 150);
    lightningLight.position.set(0, 35, 0);
    scene.add(lightningLight);

    // Atmospheric Fog
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.011);

    // Add Voxel Terrain + Dynamic Open-World Chunk Streaming Manager (seamless traversal beyond spawn)
    const terrain = createVoxelTerrain();
    scene.add(terrain);

    const chunkStreamer = new OpenWorldChunkStreamingManager({
      chunkSizeMeters: 256,
      activeRadiusChunks: 1,
      disposeRadiusChunks: 2,
      poiStamps: [
        {
          id: 'poi_solara_citadel',
          name: 'Solara Sovereign Citadel Keep & Valley Basin',
          centerX: 0,
          centerZ: 0,
          flattenRadiusMeters: 64,
          targetElevationMeters: -0.15,
          suppressFoliage: true,
        },
      ],
    });
    chunkStreamer.rootGroup.position.y = -0.15;
    chunkStreamer.updateStreamingAroundPlayer(0, 18);
    scene.add(chunkStreamer.rootGroup);
    let lastStreamedChunkKey = OpenWorldChunkStreamingManager.makeChunkKey(
      Math.floor(0 / 256),
      Math.floor(18 / 256)
    );

    // Add Castle
    let lastBuiltCastleLevel = propsRef.current.castleLevel;
    let castleMesh = createVoxelCastle(lastBuiltCastleLevel);
    castleMesh.position.set(0, 0, 0);
    scene.add(castleMesh);

    // Add Resource Nodes
    const resourceGroup = new THREE.Group();
    propsRef.current.resourceNodes.forEach((node) => {
      const nodeMesh = createResourceNodeMesh(node);
      resourceGroup.add(nodeMesh);
    });
    scene.add(resourceGroup);

    // Add Monsters
    const monsterGroup = new THREE.Group();
    propsRef.current.monsters.forEach((mon) => {
      const monMesh = createMonsterMesh(mon);
      monsterGroup.add(monMesh);
    });
    scene.add(monsterGroup);

    // Add Detailed Multi-Part Autonomous NPCs (Elder, Guard, Blacksmith, Merchant, Marshal, Mystic)
    const npcGroup = new THREE.Group();
    propsRef.current.npcs.forEach((npc) => {
      npcGroup.add(createNPCMesh(npc));
    });
    scene.add(npcGroup);

    // Add Player Avatar with Cultivation Aura Visual Cues
    let lastBuiltRealm = propsRef.current.cultivationRealmIndex;
    let lastBuiltDaos = propsRef.current.masteredGreatDaos;
    let lastBuiltRedName = propsRef.current.isRedName;
    let lastBuiltAppearanceSig = JSON.stringify(propsRef.current.playerAppearance);
    let playerMesh = createPlayerMesh(
      propsRef.current.playerAppearance,
      lastBuiltRealm,
      lastBuiltDaos,
      lastBuiltRedName
    );
    const initialY =
      propsRef.current.isFlying && propsRef.current.flightPermission?.allowed
        ? propsRef.current.flightTargetAltitude || GOD_FLIGHT_SPEC.defaultCruiseAltitude
        : 0;
    playerMesh.position.set(0, initialY, 18);
    scene.add(playerMesh);

    // Zero-GC 600-Cap Pooled Combat Particle Ring Buffer (sparks, frost, embers, dash, domain)
    const MAX_COMBAT_PARTICLES = 600;
    const combatPartPos = new Float32Array(MAX_COMBAT_PARTICLES * 3);
    const combatPartCol = new Float32Array(MAX_COMBAT_PARTICLES * 3);
    const combatPartVel = new Float32Array(MAX_COMBAT_PARTICLES * 3);
    const combatPartLife = new Float32Array(MAX_COMBAT_PARTICLES);
    const combatPartMaxLife = new Float32Array(MAX_COMBAT_PARTICLES);
    for (let i = 0; i < MAX_COMBAT_PARTICLES; i++) {
      combatPartPos[i * 3 + 1] = -999;
    }
    const combatPartGeo = new THREE.BufferGeometry();
    combatPartGeo.setAttribute('position', new THREE.BufferAttribute(combatPartPos, 3));
    combatPartGeo.setAttribute('color', new THREE.BufferAttribute(combatPartCol, 3));
    const combatPartMat = new THREE.PointsMaterial({
      size: 0.42,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const combatParticles = new THREE.Points(combatPartGeo, combatPartMat);
    combatParticles.frustumCulled = false;
    scene.add(combatParticles);
    let combatParticleCursor = 0;
    const scratchBurstColor = new THREE.Color();
    const zoneFogColor = new THREE.Color();

    const spawnCombatBurst = (
      ox: number,
      oy: number,
      oz: number,
      count: number,
      colorHex: number,
      speed: number,
      spreadY: number
    ) => {
      scratchBurstColor.setHex(colorHex);
      for (let n = 0; n < count; n++) {
        const idx = combatParticleCursor;
        combatParticleCursor = (combatParticleCursor + 1) % MAX_COMBAT_PARTICLES;
        const i3 = idx * 3;
        const angle = (n / Math.max(1, count)) * Math.PI * 2 + Math.random() * 0.5;
        const rad = 0.4 + Math.random() * 1.1;
        combatPartPos[i3] = ox + Math.cos(angle) * rad;
        combatPartPos[i3 + 1] = oy + 0.6 + Math.random() * spreadY;
        combatPartPos[i3 + 2] = oz + Math.sin(angle) * rad;

        const spd = speed * (0.45 + Math.random() * 0.8);
        combatPartVel[i3] = Math.cos(angle) * spd;
        combatPartVel[i3 + 1] = 2.2 + Math.random() * (speed * 0.65);
        combatPartVel[i3 + 2] = Math.sin(angle) * spd;

        combatPartCol[i3] = scratchBurstColor.r;
        combatPartCol[i3 + 1] = scratchBurstColor.g;
        combatPartCol[i3 + 2] = scratchBurstColor.b;

        const life = 0.42 + Math.random() * 0.45;
        combatPartLife[idx] = life;
        combatPartMaxLife[idx] = life;
      }
      combatPartGeo.attributes.position.needsUpdate = true;
      combatPartGeo.attributes.color.needsUpdate = true;
    };

    // 3D Ascendant Domain Expanding Aura Ring & Arcane Torus
    const domainAuraGroup = new THREE.Group();
    domainAuraGroup.name = 'AscendantDomainAura';
    const domainDiscGeo = new THREE.RingGeometry(0.78, 1.0, 48);
    const domainDiscMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.48,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const domainDiscMesh = new THREE.Mesh(domainDiscGeo, domainDiscMat);
    domainDiscMesh.rotation.x = -Math.PI / 2;
    domainAuraGroup.add(domainDiscMesh);

    const domainTorusGeo = new THREE.TorusGeometry(0.95, 0.035, 10, 48);
    const domainTorusMat = new THREE.MeshBasicMaterial({
      color: 0xe879f9,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const domainTorusMesh = new THREE.Mesh(domainTorusGeo, domainTorusMat);
    domainTorusMesh.rotation.x = Math.PI / 2;
    domainTorusMesh.position.y = 0.25;
    domainAuraGroup.add(domainTorusMesh);
    domainAuraGroup.visible = false;
    scene.add(domainAuraGroup);

    // Player position and movement physics
    const playerPos = new THREE.Vector3(0, initialY, 18);
    const keysPressed: Record<string, boolean> = {};
    const clearAllKeys = () => {
      for (const k of Object.keys(keysPressed)) {
        keysPressed[k] = false;
      }
      isDragging = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      if (isInputFocused) return;

      const lower = e.key.toLowerCase();
      if (lower === 'escape' && !e.repeat) {
        clearAllKeys();
        propsRef.current.onTogglePause?.();
        return;
      }
      if (propsRef.current.isPaused) return;

      if (lower === 'f' && !e.repeat) {
        propsRef.current.onToggleFlight?.();
      }
      if (lower === 't' && !e.repeat) {
        propsRef.current.onForwardBlink?.(playerMesh.rotation.y);
      }
      if (!e.repeat) {
        if (lower === 'z') propsRef.current.onCombatHotkey?.('strike');
        else if (lower === 'x') propsRef.current.onCombatHotkey?.('power');
        else if (lower === 'c') propsRef.current.onCombatHotkey?.('heal');
        else if (lower === 'control') propsRef.current.onCombatHotkey?.('dash');
        else if (lower === 'g') propsRef.current.onCombatHotkey?.('domain');
      }
      keysPressed[lower] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.key.toLowerCase()] = false;
    };
    const onWindowBlur = () => {
      clearAllKeys();
    };
    const onVisibilityChange = () => {
      if (document.hidden) clearAllKeys();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Mouse drag for camera yaw + pitch orbit & scroll-wheel zoom
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let cameraOrbitAngle = 0;
    let cameraPitchAngle = 0.37; // radians (~21 deg horizon elevation)
    let targetZoomDist = 17.5;
    let currentZoomDist = 17.5;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || propsRef.current.isPaused) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      cameraOrbitAngle -= dx * 0.006;
      cameraPitchAngle = Math.max(0.18, Math.min(0.92, cameraPitchAngle + dy * 0.0045));
      propsRef.current.onCameraYawChange?.(cameraOrbitAngle);
    };
    const onMouseUp = () => {
      isDragging = false;
    };
    const onWheel = (e: WheelEvent) => {
      if (propsRef.current.isPaused) return;
      e.preventDefault();
      targetZoomDist = Math.max(9.0, Math.min(34.0, targetZoomDist + e.deltaY * 0.012));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Raycasting for interactive clicks accelerated via three-mesh-bvh O(log N) BVH trees
    const raycaster = new THREE.Raycaster();
    enableOpenWorldMeshBVH(raycaster);
    buildSceneBVHTrees(scene);
    const mouseCoord = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        // Shift + Click in 3D World executes Instant Sovereign Teleportation for creatergame31@gmail.com
        if (e.shiftKey && propsRef.current.teleportPermission?.allowed) {
          const hitPt = intersects[0].point;
          propsRef.current.onShiftClickTeleport?.(hitPt.x, Math.max(0, hitPt.y), hitPt.z);
          return;
        }
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && hitObj !== scene) {
          if (hitObj.name === 'PlayerCastle') {
            propsRef.current.onSelectCastle();
            return;
          }
          if (hitObj.name.startsWith('ResourceNode_')) {
            const parts = hitObj.name.split('_');
            const type = parts[1];
            const found = propsRef.current.resourceNodes.find((n) => n.type === type);
            if (found) {
              propsRef.current.onSelectResourceNode(found);
              return;
            }
          }
          if (hitObj.name.startsWith('Monster_')) {
            const mId = hitObj.name.replace('Monster_', '');
            const found = propsRef.current.monsters.find((m) => m.id === mId);
            if (found) {
              propsRef.current.onSelectMonster(found);
              return;
            }
          }
          if (hitObj.name.startsWith('NPC_')) {
            const npcId = hitObj.name.replace('NPC_', '');
            const found = propsRef.current.npcs.find((n) => n.id === npcId);
            if (found) {
              propsRef.current.onSelectNPC(found);
              return;
            }
          }
          hitObj = hitObj.parent;
        }
      }
    };
    dom.addEventListener('pointerdown', onPointerDown);

    // Resize Handler + ResizeObserver for iframe container layout shifts
    const onResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth || window.innerWidth || 1280, 320);
      const h = Math.max(container.clientHeight || window.innerHeight || 720, 240);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (composer) {
        composer.setSize(w, h);
      }
      if (bloomPass) {
        bloomPass.resolution.set(Math.floor(w / 2), Math.floor(h / 2));
      }
      if (colorGradePass) {
        colorGradePass.uniforms['uResolution'].value.set(w, h);
      }
    };
    window.addEventListener('resize', onResize);
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => onResize()) : null;
    resizeObserver?.observe(container);

    // Lossless Render Loop with Software WebGL Guard
    let animId = 0;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          animId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          animId = window.setTimeout(cb, 80);
        }
      };
      animId = window.setTimeout(poll, 5);
    }

    let lastPipelineSignature = '';
    let lastHandledTeleportSeq = 0;
    let lastHandledCombatVfxSeq = 0;
    let teleportFlashTimer = 0;
    let cameraTrauma = 0;
    let hitstopTimer = 0;
    let lastSprintReported = false;
    let domainVisualScale = 1;

    const tick = () => {
      const now = performance.now();
      const rawDt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Pause freezes simulation smoothly while keeping rendered frame live
      if (propsRef.current.isPaused) {
        if (
          !isSoftwareGl &&
          composer &&
          getPostProcessProfile(propsRef.current.graphicsQuality || 'ultra').enableComposer
        ) {
          composer.render();
        } else {
          renderer.render(scene, camera);
        }
        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          animId = requestAnimationFrame(tick);
        }
        return;
      }

      if (hitstopTimer > 0) {
        hitstopTimer = Math.max(0, hitstopTimer - rawDt);
      }
      const dt = hitstopTimer > 0 ? rawDt * 0.15 : rawDt;

      const quality = propsRef.current.graphicsQuality || 'ultra';
      const platform = propsRef.current.targetPlatform || 'pc_console';
      const hdPack = Boolean(propsRef.current.hdPackMounted);
      const activeWeather = propsRef.current.weather || 'clear';
      const postProfile = getPostProcessProfile(quality);
      const wetness = computeSurfaceWetnessParams(activeWeather);
      const lightingStrategy = computeLightingStrategy(platform, quality);

      // Sync Cross-Platform Pipeline (Procedural CanvasTexture Resizing, LOD Bias, InstancedMesh Count, Small-Prop Shadow Culling, Uber Shader Uniforms & Material Channels)
      const pipelineSig = `${platform}_${quality}_${hdPack}`;
      if (pipelineSig !== lastPipelineSignature) {
        lastPipelineSignature = pipelineSig;
        const texOverride = computeMasterTextureImportOverride(platform, quality, hdPack);
        const meshBudget = computeMeshAndTextureBudget(quality);
        const lodPolicy = computeLodChainPolicy(platform, quality, hdPack);
        const uberKeywords = computeUberShaderKeywords(platform, quality, hdPack);

        applyCrossPlatformPipeline(scene, {
          anisotropySamples: texOverride.anisotropySamples,
          compressionFormat: texOverride.compressionFormat,
          runtimeCanvasResolutionPx: texOverride.runtimeCanvasResolutionPx,
          grassTuftInstanceCount:
            platform === 'mobile' && !hdPack
              ? Math.min(320, meshBudget.grassTuftInstanceCount)
              : meshBudget.grassTuftInstanceCount,
          normalMapIntensity: meshBudget.normalMapIntensity,
          lodBias: lodPolicy.lodBias,
          skipLod0InMemory: lodPolicy.skipLod0InMemory,
          smallPropCastShadows: lightingStrategy.smallPropCastShadows,
          bakedLightmapIntensity: lightingStrategy.bakedLightmapIntensity,
          useRimLight: uberKeywords.USE_RIM_LIGHT,
          useDetailNormals: uberKeywords.USE_DETAIL_NORMALS,
          useParallax: uberKeywords.USE_PARALLAX_OCCLUSION,
          useSubsurface: uberKeywords.USE_SUBSURFACE_SCATTERING,
        });

        sunLight.castShadow = !isSoftwareGl && lightingStrategy.enableDynamicSoftShadows;
        if (
          !isSoftwareGl &&
          sunLight.castShadow &&
          sunLight.shadow.mapSize.width !== postProfile.shadowMapSize
        ) {
          sunLight.shadow.mapSize.set(postProfile.shadowMapSize, postProfile.shadowMapSize);
          sunLight.shadow.map?.dispose();
          sunLight.shadow.map = null;
        }
        renderer.setPixelRatio(
          isSoftwareGl
            ? 1
            : platform === 'mobile' && !hdPack
              ? 1
              : Math.min(window.devicePixelRatio, quality === 'ultra' ? 2 : 1.5)
        );
        rimLight.visible = lightingStrategy.enableRealtimeGI;
      }

      // Update GLSL foliage wind, Gerstner water waves & GTA V wet-surface PBR reflections
      updateWorldShaderUniforms(
        now * 0.001,
        wetness.roadRoughness,
        wetness.roadClearcoat,
        wetness.stoneRoughness,
        wetness.stoneClearcoat,
        wetness.waterWaveHeight,
        wetness.windSwayStrength,
        postProfile.rimLightShaderStrength
      );

      // Rebuild Castle if castleLevel changed
      if (propsRef.current.castleLevel !== lastBuiltCastleLevel) {
        disposeSceneBVHTrees(castleMesh);
        scene.remove(castleMesh);
        lastBuiltCastleLevel = propsRef.current.castleLevel;
        castleMesh = createVoxelCastle(lastBuiltCastleLevel);
        castleMesh.position.set(0, 0, 0);
        buildSceneBVHTrees(castleMesh);
        scene.add(castleMesh);
      }

      // 1. Calculate Physical Atmospheric Sky Scattering & Lighting (GTA V / Genshin Impact)
      const hour = propsRef.current.timeOfDayHours % 24;
      const skyParams = computeAtmosphericSkyParams(hour, activeWeather, quality);
      const sunAngle = ((hour - 6) / 24) * Math.PI * 2;
      const sunRadius = 60;

      const sunX = Math.cos(sunAngle) * sunRadius;
      const sunY = Math.sin(sunAngle) * sunRadius;
      const sunZ = Math.sin(sunAngle * 0.5) * 20;

      sunLight.position.set(sunX, Math.max(sunY, -10), sunZ);
      sunGroup.position.set(sunX, sunY, sunZ);
      moonGroup.position.set(-sunX, -sunY, -sunZ);

      // Sync Preetham Physical Sky Dome Uniforms
      skyUniforms['turbidity'].value = skyParams.turbidity;
      skyUniforms['rayleigh'].value = skyParams.rayleigh;
      skyUniforms['mieCoefficient'].value = skyParams.mieCoefficient;
      skyUniforms['mieDirectionalG'].value = skyParams.mieDirectionalG;
      skySunVec.set(sunX, sunY, sunZ).normalize();
      skyUniforms['sunPosition'].value.copy(skySunVec);
      sky.visible = sunY >= -6;

      renderer.toneMappingExposure = skyParams.exposure;
      sunLight.intensity = skyParams.sunLightIntensity;
      sunLight.color.setHex(skyParams.sunLightHex);
      hemiLight.color.setHex(skyParams.hemiSkyHex);
      hemiLight.groundColor.setHex(skyParams.hemiGroundHex);
      hemiLight.intensity = lightingStrategy.enableRealtimeGI
        ? skyParams.hemiIntensity
        : skyParams.hemiIntensity * 1.18;
      rimLight.color.setHex(skyParams.rimLightHex);
      rimLight.intensity = skyParams.rimLightIntensity;
      citadelHeartLight.intensity = sunY < 0 ? 1.15 : 0.35;
      starsMat.opacity = skyParams.starfieldOpacity;
      fireflyMat.opacity = sunY < 0 ? 0.88 : 0.45;

      const weatherCfg = WEATHER_CONFIGS[activeWeather] || WEATHER_CONFIGS.clear;
      bgColor.setHex(sunY < 0 ? 0x090d16 : weatherCfg.skyColorHex);
      if (scene.fog) {
        scene.fog.color.setHex(skyParams.fogHex);
        if (typeof propsRef.current.zoneFogTintHex === 'number') {
          zoneFogColor.setHex(propsRef.current.zoneFogTintHex);
          scene.fog.color.lerp(zoneFogColor, 0.24);
        }
        (scene.fog as THREE.FogExp2).density = lightingStrategy.enableVolumetricFog
          ? skyParams.fogDensity
          : skyParams.fogDensity * 0.45;
      }

      // Sync Post-Processing Bloom & Next-Gen Color Grading Uniforms
      if (bloomPass) {
        bloomPass.strength = postProfile.bloomStrength;
        bloomPass.radius = postProfile.bloomRadius;
        bloomPass.threshold = postProfile.bloomThreshold;
      }
      if (colorGradePass) {
        colorGradePass.uniforms['uSaturation'].value = postProfile.saturationBoost;
        colorGradePass.uniforms['uContrast'].value = postProfile.contrastBoost;
        colorGradePass.uniforms['uVibrance'].value = postProfile.vibranceBoost;
        colorGradePass.uniforms['uSharpen'].value = postProfile.sharpenStrength;
        colorGradePass.uniforms['uVignette'].value = postProfile.vignetteDarkness;
        colorGradePass.uniforms['uGodRayIntensity'].value = skyParams.godRayIntensity;
      }

      // Animate Drifting Volumetric Clouds & Ambient Spirit Fireflies
      cloudGroup.rotation.y += dt * 0.012;
      const ffArr = fireflyGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < fireflyCount * 3; i += 3) {
        ffArr[i + 1] += Math.sin(now * 0.002 + i) * 0.008;
        ffArr[i] += Math.cos(now * 0.0015 + i) * 0.006;
      }
      fireflyGeo.attributes.position.needsUpdate = true;

      // Animate Crystal Water Ripples & Teleport Waypoint Crystals
      const waterPlane = terrain.getObjectByName('VoxelWaterPlane') as THREE.Mesh | undefined;
      if (waterPlane) {
        waterPlane.position.y = -2.05 + Math.sin(now * 0.002) * 0.06;
      }
      for (let wIdx = 0; wIdx < 4; wIdx++) {
        const wpCrystal = terrain.getObjectByName(`WaypointCrystal_${wIdx}`);
        if (wpCrystal) {
          wpCrystal.rotation.y += dt * 1.6;
          wpCrystal.position.y = 3.15 + Math.sin(now * 0.003 + wIdx) * 0.16;
        }
      }
      for (let sIdx = 0; sIdx < 3; sIdx++) {
        const skyIsland = terrain.getObjectByName(`CelestiaSkyIsland_${sIdx}`);
        if (skyIsland) {
          skyIsland.position.y = 25 + sIdx * 3 + Math.sin(now * 0.0012 + sIdx * 2) * 0.45;
        }
      }

      // Weather Particle Systems & Atmospheric Effects
      if (activeWeather === 'rain') {
        rainParticles.visible = true;
        snowParticles.visible = false;
        lightningLight.intensity = 0;

        const rainPosArr = rainGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < rainCount * 3; i += 3) {
          rainPosArr[i + 1] -= dt * 45;
          if (rainPosArr[i + 1] < 0) {
            rainPosArr[i] = playerPos.x + (Math.random() - 0.5) * 80;
            rainPosArr[i + 1] = 40 + Math.random() * 5;
            rainPosArr[i + 2] = playerPos.z + (Math.random() - 0.5) * 80;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;
      } else if (activeWeather === 'snow') {
        rainParticles.visible = false;
        snowParticles.visible = true;
        lightningLight.intensity = 0;

        const snowPosArr = snowGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < snowCount * 3; i += 3) {
          snowPosArr[i + 1] -= dt * 10;
          snowPosArr[i] += Math.sin(now * 0.002 + i) * 0.04;
          if (snowPosArr[i + 1] < 0) {
            snowPosArr[i] = playerPos.x + (Math.random() - 0.5) * 80;
            snowPosArr[i + 1] = 35 + Math.random() * 5;
            snowPosArr[i + 2] = playerPos.z + (Math.random() - 0.5) * 80;
          }
        }
        snowGeo.attributes.position.needsUpdate = true;
      } else if (activeWeather === 'storm') {
        rainParticles.visible = true;
        snowParticles.visible = false;

        const rainPosArr = rainGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < rainCount * 3; i += 3) {
          rainPosArr[i + 1] -= dt * 75;
          rainPosArr[i] += dt * 18;
          if (rainPosArr[i + 1] < 0) {
            rainPosArr[i] = playerPos.x + (Math.random() - 0.5) * 80 - 15;
            rainPosArr[i + 1] = 40 + Math.random() * 5;
            rainPosArr[i + 2] = playerPos.z + (Math.random() - 0.5) * 80;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;

        if (Math.random() < 0.012) {
          lightningLight.intensity = 4.2;
          lightningLight.position.set(
            playerPos.x + (Math.random() - 0.5) * 40,
            28,
            playerPos.z + (Math.random() - 0.5) * 40
          );
          sound.playThunder();
        } else if (lightningLight.intensity > 0) {
          lightningLight.intensity = Math.max(0, lightningLight.intensity - dt * 10);
        }
      } else {
        rainParticles.visible = false;
        snowParticles.visible = false;
        lightningLight.intensity = 0;
      }

      // 2. Handle Sovereign Divine Teleportation Jumps, Player Movement & Flight
      const tpCmd = propsRef.current.teleportCommand;
      if (tpCmd && tpCmd.seq !== lastHandledTeleportSeq) {
        lastHandledTeleportSeq = tpCmd.seq;
        playerPos.set(tpCmd.x, tpCmd.y, tpCmd.z);
        playerMesh.position.copy(playerPos);
        teleportFlashTimer = 0.65;
        propsRef.current.onPlayerPositionChange?.(playerPos.x, playerPos.z);
      }

      let moveX = 0;
      let moveZ = 0;

      if (keysPressed['w'] || keysPressed['arrowup']) moveZ -= 1;
      if (keysPressed['s'] || keysPressed['arrowdown']) moveZ += 1;
      if (keysPressed['a'] || keysPressed['arrowleft']) moveX -= 1;
      if (keysPressed['d'] || keysPressed['arrowright']) moveX += 1;

      const touch = propsRef.current.touchInput;
      if (touch && (touch.x !== 0 || touch.y !== 0)) {
        moveX += touch.x;
        moveZ += touch.y;
      }

      let verticalInput = 0;
      if (keysPressed['e'] || keysPressed[' '] || keysPressed['pageup']) verticalInput += 1;
      if (keysPressed['q'] || keysPressed['shift'] || keysPressed['pagedown']) verticalInput -= 1;

      const activeFlightPerm =
        propsRef.current.flightPermission ?? evaluateGodFlightPermission(null, false);
      const kinematics = computeNextGodFlightKinematics({
        currentX: playerPos.x,
        currentY: playerPos.y,
        currentZ: playerPos.z,
        moveInputX: moveX,
        moveInputZ: moveZ,
        verticalInput,
        cameraOrbitAngle,
        dt,
        isFlying: Boolean(propsRef.current.isFlying),
        targetAltitude:
          propsRef.current.flightTargetAltitude ?? GOD_FLIGHT_SPEC.defaultCruiseAltitude,
        permission: activeFlightPerm,
      });

      playerPos.x = kinematics.nextX;
      playerPos.y = kinematics.nextY;
      playerPos.z = kinematics.nextZ;

      if (
        verticalInput !== 0 &&
        propsRef.current.isFlying &&
        activeFlightPerm.allowed &&
        Math.abs(
          kinematics.nextTargetAltitude -
            (propsRef.current.flightTargetAltitude ?? GOD_FLIGHT_SPEC.defaultCruiseAltitude)
        ) > 0.05
      ) {
        propsRef.current.onFlightAltitudeChange?.(Number(kinematics.nextTargetAltitude.toFixed(1)));
      }

      // Process queued Action Combat VFX bursts, dash lunge, camera trauma & hitstop
      const vfxCmd = propsRef.current.combatVfxCommand;
      if (vfxCmd && vfxCmd.seq !== lastHandledCombatVfxSeq) {
        lastHandledCombatVfxSeq = vfxCmd.seq;
        cameraTrauma = Math.min(1.0, cameraTrauma + vfxCmd.shakeIntensity);
        if (vfxCmd.kind === 'strike') {
          spawnCombatBurst(
            playerPos.x,
            playerPos.y + 1.0,
            playerPos.z,
            26,
            vfxCmd.colorHex,
            8.5,
            1.0
          );
          hitstopTimer = 0.032;
        } else if (vfxCmd.kind === 'power') {
          spawnCombatBurst(
            playerPos.x,
            playerPos.y + 1.1,
            playerPos.z,
            64,
            vfxCmd.colorHex,
            13.5,
            1.4
          );
          hitstopTimer = 0.045;
        } else if (vfxCmd.kind === 'heal') {
          spawnCombatBurst(
            playerPos.x,
            playerPos.y + 0.5,
            playerPos.z,
            36,
            vfxCmd.colorHex,
            4.2,
            2.2
          );
        } else if (vfxCmd.kind === 'dash') {
          spawnCombatBurst(
            playerPos.x,
            playerPos.y + 0.7,
            playerPos.z,
            34,
            vfxCmd.colorHex,
            7.5,
            0.8
          );
          const dashStep = 4.2;
          playerPos.x += Math.sin(playerMesh.rotation.y) * dashStep;
          playerPos.z += Math.cos(playerMesh.rotation.y) * dashStep;
          propsRef.current.onPlayerPositionChange?.(playerPos.x, playerPos.z);
        } else if (vfxCmd.kind === 'domain') {
          spawnCombatBurst(
            playerPos.x,
            playerPos.y + 1.2,
            playerPos.z,
            110,
            vfxCmd.colorHex,
            18.0,
            2.0
          );
          hitstopTimer = 0.055;
        }
      }

      // Ground sprint (Shift while grounded & moving with stamina available)
      const isAirborneFlight = Boolean(propsRef.current.isFlying && activeFlightPerm.allowed);
      const isTryingGroundSprint =
        !isAirborneFlight &&
        Boolean(keysPressed['shift']) &&
        (moveX !== 0 || moveZ !== 0) &&
        Boolean(propsRef.current.canSprint);
      if (isTryingGroundSprint !== lastSprintReported) {
        lastSprintReported = isTryingGroundSprint;
        propsRef.current.onSprintChange?.(isTryingGroundSprint);
      }
      if (isTryingGroundSprint) {
        const sprintBoost = 0.45;
        playerPos.x += kinematics.worldMoveX * sprintBoost;
        playerPos.z += kinematics.worldMoveZ * sprintBoost;
      }

      // Only enforce ground Citadel keep wall collision when below Citadel Wall Bypass Altitude
      if (!kinematics.bypassesCitadelWalls) {
        const resolvedKeepCollision = resolvePlayerCitadelCollisionCannon({
          desiredX: playerPos.x,
          desiredZ: playerPos.z,
          citadelHalfExtent: 5.2,
          playerRadius: 0.8,
        });
        playerPos.x = resolvedKeepCollision.resolvedX;
        playerPos.z = resolvedKeepCollision.resolvedZ;
      }

      if (kinematics.isMovingHorizontally) {
        const targetRot = Math.atan2(kinematics.worldMoveX, kinematics.worldMoveZ);
        playerMesh.rotation.y = targetRot;

        if (propsRef.current.onPlayerPositionChange) {
          propsRef.current.onPlayerPositionChange(playerPos.x, playerPos.z);
        }
      }

      // Update pooled combat particles (zero allocations)
      let hasAliveCombatPart = false;
      for (let i = 0; i < MAX_COMBAT_PARTICLES; i++) {
        if (combatPartLife[i] > 0) {
          hasAliveCombatPart = true;
          combatPartLife[i] -= dt;
          const i3 = i * 3;
          if (combatPartLife[i] <= 0) {
            combatPartPos[i3 + 1] = -999;
          } else {
            combatPartPos[i3] += combatPartVel[i3] * dt;
            combatPartPos[i3 + 1] += combatPartVel[i3 + 1] * dt;
            combatPartPos[i3 + 2] += combatPartVel[i3 + 2] * dt;
            combatPartVel[i3 + 1] -= 9.5 * dt;
          }
        }
      }
      if (hasAliveCombatPart) {
        combatPartGeo.attributes.position.needsUpdate = true;
      }

      // Update 3D Ascendant Domain Expanding Aura Ring
      const domVis = propsRef.current.domainVisual;
      if (domVis?.active) {
        domainAuraGroup.visible = true;
        const targetRadius = Math.max(4, Math.min(28, domVis.radiusMeters * 0.65));
        domainVisualScale += (targetRadius - domainVisualScale) * Math.min(1, dt * 6);
        domainAuraGroup.position.set(playerPos.x, playerPos.y + 0.16, playerPos.z);
        domainAuraGroup.scale.set(domainVisualScale, 1, domainVisualScale);
        domainAuraGroup.rotation.y += dt * 1.35;
      } else {
        domainAuraGroup.visible = false;
        domainVisualScale = 1;
      }

      const hoverBob = kinematics.isAirborne
        ? Math.sin(now * 0.0045) * 0.24
        : kinematics.isMovingHorizontally
          ? Math.sin(now * 0.015) * 0.15
          : 0;

      playerMesh.position.x = playerPos.x;
      playerMesh.position.y = playerPos.y + hoverBob;
      playerMesh.position.z = playerPos.z;
      sky.position.set(playerPos.x, 0, playerPos.z);

      // Stream surrounding 256m × 256m open-world terrain chunks when crossing chunk boundaries
      const currentChunkKey = OpenWorldChunkStreamingManager.makeChunkKey(
        Math.floor(playerPos.x / chunkStreamer.chunkSizeMeters),
        Math.floor(playerPos.z / chunkStreamer.chunkSizeMeters)
      );
      if (currentChunkKey !== lastStreamedChunkKey) {
        lastStreamedChunkKey = currentChunkKey;
        chunkStreamer.updateStreamingAroundPlayer(playerPos.x, playerPos.z);
      }

      // Sync Player Aura & Species Mesh if Realm, Great Dao Halo Count, Red-Name Karma, or Appearance changed
      const currentAppearanceSig = JSON.stringify(propsRef.current.playerAppearance);
      if (
        propsRef.current.cultivationRealmIndex !== lastBuiltRealm ||
        propsRef.current.masteredGreatDaos !== lastBuiltDaos ||
        propsRef.current.isRedName !== lastBuiltRedName ||
        currentAppearanceSig !== lastBuiltAppearanceSig
      ) {
        const prevRotY = playerMesh.rotation.y;
        scene.remove(playerMesh);
        lastBuiltRealm = propsRef.current.cultivationRealmIndex;
        lastBuiltDaos = propsRef.current.masteredGreatDaos;
        lastBuiltRedName = propsRef.current.isRedName;
        lastBuiltAppearanceSig = currentAppearanceSig;
        playerMesh = createPlayerMesh(
          propsRef.current.playerAppearance,
          lastBuiltRealm,
          lastBuiltDaos,
          lastBuiltRedName
        );
        playerMesh.position.copy(playerPos);
        playerMesh.rotation.y = prevRotY;
        scene.add(playerMesh);
      }

      // Toggle & Animate Sovereign Nine-Heavens Imperial Flying Sword & Astral Cloud Halo
      const godFlightMount = playerMesh.getObjectByName('GodFlightMountGroup');
      if (godFlightMount) {
        godFlightMount.visible = kinematics.isAirborne;
        if (kinematics.isAirborne) {
          const outerHalo = godFlightMount.getObjectByName('GodFlightHaloOuter');
          if (outerHalo) outerHalo.rotation.z += dt * 2.4;
          const innerHalo = godFlightMount.getObjectByName('GodFlightHaloInner');
          if (innerHalo) innerHalo.rotation.z -= dt * 3.6;
        }
      }

      // Animate Sovereign Spatial Teleport Warp Portal Rings when teleporting
      const godTeleportWarp = playerMesh.getObjectByName('GodTeleportWarpGroup');
      if (godTeleportWarp) {
        if (teleportFlashTimer > 0) {
          teleportFlashTimer = Math.max(0, teleportFlashTimer - dt);
          godTeleportWarp.visible = true;
          const pulseScale = 1.0 + (0.65 - teleportFlashTimer) * 0.9;
          godTeleportWarp.scale.set(pulseScale, pulseScale, pulseScale);
          const ringH = godTeleportWarp.getObjectByName('GodTeleportRingHorizontal');
          if (ringH) ringH.rotation.z += dt * 9.5;
          const ringV = godTeleportWarp.getObjectByName('GodTeleportRingVertical');
          if (ringV) ringV.rotation.y += dt * 11.0;
        } else {
          godTeleportWarp.visible = false;
        }
      }

      // Animate Cultivator Aura Visual Cues
      const goldenCore = playerMesh.getObjectByName('CultivationGoldenCore');
      if (goldenCore) {
        goldenCore.rotation.y += dt * 3.2;
        goldenCore.rotation.z += dt * 1.8;
      }
      const chestCore = playerMesh.getObjectByName('CultivationChestCore');
      if (chestCore) {
        chestCore.rotation.y -= dt * 4.0;
      }
      const nascentBaby = playerMesh.getObjectByName('CultivationNascentBaby');
      if (nascentBaby) {
        nascentBaby.position.y = 3.15 + Math.sin(now * 0.004) * 0.14;
        nascentBaby.rotation.y = Math.sin(now * 0.002) * 0.35;
      }
      const divineHalos = playerMesh.getObjectByName('CultivationDivineHalos');
      if (divineHalos) {
        divineHalos.rotation.z += dt * 1.4;
      }

      // 3. Smooth Damped Third-Person Camera with Scroll Zoom, Pitch Orbit & Trauma Shake
      const baseZoom = kinematics.isAirborne ? Math.max(targetZoomDist, 19.5) : targetZoomDist;
      currentZoomDist += (baseZoom - currentZoomDist) * (1 - Math.exp(-8 * dt));
      const horizDist = currentZoomDist * Math.cos(cameraPitchAngle);
      const camHeight = Math.max(3.2, currentZoomDist * Math.sin(cameraPitchAngle) + 1.2);
      const targetCamX = playerPos.x + Math.sin(cameraOrbitAngle) * horizDist;
      const targetCamZ = playerPos.z + Math.cos(cameraOrbitAngle) * horizDist;
      const targetCamY = playerPos.y + camHeight;

      const boundaryShake = evaluateChunkBoundaryProximity({
        playerWorldX: playerPos.x,
        playerWorldZ: playerPos.z,
        fetchedBoundaryKeys: propsRef.current.fetchedBoundaryKeys,
        timeSeconds: now * 0.001,
      });

      cameraTrauma = Math.max(0, cameraTrauma - dt * 2.4);
      const shakePower = cameraTrauma * cameraTrauma * 0.65;
      const traumaX = shakePower > 0.001 ? Math.sin(now * 0.065) * shakePower : 0;
      const traumaY = shakePower > 0.001 ? Math.cos(now * 0.083) * shakePower : 0;

      camera.position.x +=
        (targetCamX - camera.position.x) * (1 - Math.exp(-6 * dt)) +
        boundaryShake.shakeOffsetX +
        traumaX;
      camera.position.y +=
        (targetCamY - camera.position.y) * (1 - Math.exp(-6 * dt)) +
        boundaryShake.shakeOffsetY +
        traumaY;
      camera.position.z += (targetCamZ - camera.position.z) * (1 - Math.exp(-6 * dt));

      const lookAheadX = playerPos.x - Math.sin(cameraOrbitAngle) * 8;
      const lookAheadZ = playerPos.z - Math.cos(cameraOrbitAngle) * 8;
      camera.lookAt(lookAheadX, playerPos.y + 4.4, lookAheadZ);

      // 4. Animate World Elements (Castle spire & rings, Resource nodes, Monsters & NPCs)
      const spire = castleMesh.getObjectByName('CastleSpire');
      if (spire) {
        spire.rotation.y += dt * 1.2;
        const outerRing = spire.getObjectByName('CastleSpireRingOuter');
        if (outerRing) outerRing.rotation.z += dt * 1.8;
        const innerRing = spire.getObjectByName('CastleSpireRingInner');
        if (innerRing) innerRing.rotation.x -= dt * 2.4;
      }

      // Animate Resource Node Windmills & Oil Pumpjacks
      resourceGroup.children.forEach((rNode, idx) => {
        const blades = rNode.getObjectByName('GrainWindmillBlades');
        if (blades) {
          blades.rotation.z += dt * 1.8;
        }
        const pump = rNode.getObjectByName('OilPumpHead');
        if (pump) {
          pump.rotation.z = Math.sin(now * 0.004 + idx) * 0.28;
        }
      });

      // Sync newly spawned monsters if count increased
      if (propsRef.current.monsters.length > monsterGroup.children.length) {
        for (let i = monsterGroup.children.length; i < propsRef.current.monsters.length; i++) {
          const newMon = propsRef.current.monsters[i];
          monsterGroup.add(createMonsterMesh(newMon));
        }
      }

      // Smoothly move & animate Monsters according to their AI state & waypoints
      monsterGroup.children.forEach((mGroup, idx) => {
        const monData = propsRef.current.monsters[idx];
        if (monData) {
          const dx = monData.x - mGroup.position.x;
          const dz = monData.z - mGroup.position.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 0.05) {
            mGroup.position.x += dx * Math.min(1, dt * 3.5);
            mGroup.position.z += dz * Math.min(1, dt * 3.5);
            mGroup.rotation.y = Math.atan2(dx, dz);
            mGroup.position.y = Math.abs(Math.sin(now * 0.008 + idx)) * 0.18;
          } else {
            mGroup.rotation.y += Math.sin(now * 0.001 + idx) * 0.005;
            mGroup.position.y = 0;
          }

          const ring = mGroup.getObjectByName('MonsterTelegraphRing') as THREE.Mesh | undefined;
          if (ring) {
            const isTelegraphing =
              monData.aiState === 'attack_windup' ||
              monData.aiState === 'enraged_berserk' ||
              monData.aiState === 'clashing_guard';
            const pulse = isTelegraphing
              ? 1.0 + Math.sin(now * 0.008 + idx) * 0.25
              : 0.85 + Math.sin(now * 0.003 + idx) * 0.06;
            ring.scale.set(pulse, pulse, 1);
          }
        }

        const crystal = mGroup.getObjectByName('OrbitalCrystal_0');
        if (crystal) {
          crystal.parent?.children.forEach((child) => {
            if (child.name.startsWith('OrbitalCrystal_')) {
              child.rotation.y += 0.04;
            }
          });
        }
      });

      // Smoothly move & animate Autonomous NPCs along their AI patrol/gathering/trade routes
      npcGroup.children.forEach((nGroup, idx) => {
        const npcData = propsRef.current.npcs[idx];
        if (npcData) {
          const dx = npcData.x - nGroup.position.x;
          const dz = npcData.z - nGroup.position.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 0.05) {
            nGroup.position.x += dx * Math.min(1, dt * 4.0);
            nGroup.position.z += dz * Math.min(1, dt * 4.0);
            nGroup.rotation.y = Math.atan2(dx, dz);
            nGroup.position.y = Math.abs(Math.sin(now * 0.01 + idx)) * 0.14;
          } else {
            nGroup.position.y = 0;
          }
        }
      });

      // Render Scene (Use EffectComposer HDR Bloom + NextGenColorGradePass on hardware GPUs)
      if (!isSoftwareGl && composer && postProfile.enableComposer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        animId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      if (isSoftwareGl) {
        clearTimeout(animId);
      } else {
        cancelAnimationFrame(animId);
      }
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      dom.removeEventListener('mousedown', onMouseDown);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onResize);
      resizeObserver?.disconnect();
      combatPartGeo.dispose();
      combatPartMat.dispose();
      domainDiscGeo.dispose();
      domainDiscMat.dispose();
      domainTorusGeo.dispose();
      domainTorusMat.dispose();
      if (composer) {
        composer.dispose();
      }
      chunkStreamer.disposeAll();
      disposeSceneBVHTrees(scene);
      renderer.dispose();
      container.replaceChildren();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      data-testid="voxel-3d-viewport"
    />
  );
};
