/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  CharacterAppearance,
  MonsterTarget,
  NPC,
  ResourceNode,
} from '../types/game';
import {
  GraphicsQualityPreset,
  createMonsterMesh,
  createNPCMesh,
  createPlayerMesh,
  createResourceNodeMesh,
  createVoxelCastle,
  createVoxelTerrain,
} from '../game/proceduralWorld';
import { WeatherType, WEATHER_CONFIGS } from '../game/weather';
import { sound } from '../game/audio';

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
  onSelectMonster: (monster: MonsterTarget) => void;
  onSelectResourceNode: (node: ResourceNode) => void;
  onSelectCastle: () => void;
  onSelectNPC: (npc: NPC) => void;
  onPlayerPositionChange?: (x: number, z: number) => void;
  touchInput?: { x: number; y: number }; // -1 to 1 joystick values
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
  onSelectMonster,
  onSelectResourceNode,
  onSelectCastle,
  onSelectNPC,
  onPlayerPositionChange,
  touchInput,
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
    onSelectMonster,
    onSelectResourceNode,
    onSelectCastle,
    onSelectNPC,
    onPlayerPositionChange,
    touchInput,
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
      onSelectMonster,
      onSelectResourceNode,
      onSelectCastle,
      onSelectNPC,
      onPlayerPositionChange,
      touchInput,
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
    onSelectMonster,
    onSelectResourceNode,
    onSelectCastle,
    onSelectNPC,
    onPlayerPositionChange,
    touchInput,
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
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.5, 320);
    camera.position.set(0, 14, 22);

    // Studio PBR WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    // Hardware Post-Processing Pipeline (RenderPass -> UnrealBloomPass -> OutputPass)
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isSoftwareGl) {
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(Math.floor(width / 2), Math.floor(height / 2)),
        0.38, // subtle HDR bloom strength
        0.45, // radius
        0.82 // threshold so only emissive runes, cores, sun & lanterns bloom
      );
      composer.addPass(bloomPass);

      const outputPass = new OutputPass();
      composer.addPass(outputPass);
    }

    // Procedural RoomEnvironment for realistic PBR reflections & clearcoat highlights
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 3-Point Studio & Atmospheric Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.35);
    sunLight.position.set(25, 45, 25);
    sunLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 135;
      sunLight.shadow.camera.left = -44;
      sunLight.shadow.camera.right = 44;
      sunLight.shadow.camera.top = 44;
      sunLight.shadow.camera.bottom = -44;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    scene.add(sunLight);

    // Cool Atmospheric Rim Light (Separates 3D silhouettes from background)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
    rimLight.position.set(-28, 18, -24);
    scene.add(rimLight);

    // Warm Citadel Courtyard Point Light
    const citadelHeartLight = new THREE.PointLight(0xffb300, 1.8, 32);
    citadelHeartLight.position.set(0, 8, 6);
    scene.add(citadelHeartLight);

    // Sun Visual Sphere + Corona Glow Halo
    const sunGroup = new THREE.Group();
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(3.5, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff59d })
    );
    const sunCorona = new THREE.Mesh(
      new THREE.SphereGeometry(5.6, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      })
    );
    sunGroup.add(sunMesh, sunCorona);
    scene.add(sunGroup);

    // Moon Visual Sphere + Halo
    const moonGroup = new THREE.Group();
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xe0e7ff })
    );
    const moonHalo = new THREE.Mesh(
      new THREE.SphereGeometry(4.4, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0x818cf8,
        transparent: true,
        opacity: 0.24,
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
      cluster.position.set(
        Math.cos(angle) * dist,
        32 + (c % 3) * 4,
        Math.sin(angle) * dist
      );
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

    // Add Voxel Terrain
    const terrain = createVoxelTerrain();
    scene.add(terrain);

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
    let playerMesh = createPlayerMesh(
      propsRef.current.playerAppearance,
      lastBuiltRealm,
      lastBuiltDaos,
      lastBuiltRedName
    );
    playerMesh.position.set(0, 0, 18);
    scene.add(playerMesh);

    // Player position and movement physics
    const playerPos = new THREE.Vector3(0, 0, 18);
    const keysPressed: Record<string, boolean> = {};

    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Mouse drag for camera orbit
    let isDragging = false;
    let prevMouseX = 0;
    let cameraOrbitAngle = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      cameraOrbitAngle -= dx * 0.006;
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Raycasting for interactive clicks
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
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

    // Resize Handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (composer) {
        composer.setSize(w, h);
      }
      if (bloomPass) {
        bloomPass.resolution.set(Math.floor(w / 2), Math.floor(h / 2));
      }
    };
    window.addEventListener('resize', onResize);

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

    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const quality = propsRef.current.graphicsQuality || 'ultra';

      // Rebuild Castle if castleLevel changed
      if (propsRef.current.castleLevel !== lastBuiltCastleLevel) {
        scene.remove(castleMesh);
        lastBuiltCastleLevel = propsRef.current.castleLevel;
        castleMesh = createVoxelCastle(lastBuiltCastleLevel);
        castleMesh.position.set(0, 0, 0);
        scene.add(castleMesh);
      }

      // 1. Calculate Day / Night Cycle Lighting & Colors
      const hour = propsRef.current.timeOfDayHours % 24;
      const sunAngle = ((hour - 6) / 24) * Math.PI * 2;
      const sunRadius = 60;

      const sunX = Math.cos(sunAngle) * sunRadius;
      const sunY = Math.sin(sunAngle) * sunRadius;
      const sunZ = Math.sin(sunAngle * 0.5) * 20;

      sunLight.position.set(sunX, Math.max(sunY, -10), sunZ);
      sunGroup.position.set(sunX, sunY, sunZ);
      moonGroup.position.set(-sunX, -sunY, -sunZ);

      const isNight = sunY < 0;
      const isDawnOrDusk = Math.abs(sunY) < 15;

      // Dynamic Weather Environmental State & Status Visuals
      const activeWeather = propsRef.current.weather || 'clear';
      const weatherCfg = WEATHER_CONFIGS[activeWeather] || WEATHER_CONFIGS.clear;

      let skyColor = weatherCfg.skyColorHex;
      if (isNight) {
        skyColor = 0x090d16; // Deep starry midnight
        sunLight.intensity = 0.25 * weatherCfg.sunlightMult;
        sunLight.color.setHex(0x818cf8);
        hemiLight.intensity = 0.4 * weatherCfg.sunlightMult;
        rimLight.intensity = 0.9;
        starsMat.opacity = Math.min(1.0, -sunY / 15);
        fireflyMat.opacity = 0.85;
      } else if (isDawnOrDusk) {
        skyColor = 0xf97316; // Sunset/dawn golden amber
        sunLight.intensity = 1.9 * weatherCfg.sunlightMult;
        sunLight.color.setHex(0xffb74d);
        hemiLight.intensity = 0.72 * weatherCfg.sunlightMult;
        rimLight.intensity = 0.65;
        starsMat.opacity = 0;
        fireflyMat.opacity = 0.65;
      } else {
        skyColor = weatherCfg.skyColorHex;
        sunLight.intensity = 2.45 * weatherCfg.sunlightMult;
        sunLight.color.setHex(0xfff8e7);
        hemiLight.intensity = 0.92 * weatherCfg.sunlightMult;
        rimLight.intensity = 0.5;
        starsMat.opacity = 0;
        fireflyMat.opacity = 0.35;
      }

      bgColor.setHex(skyColor);
      if (scene.fog) {
        scene.fog.color.setHex(isNight ? 0x090d16 : weatherCfg.fogColorHex);
        (scene.fog as THREE.FogExp2).density =
          quality === 'balanced' ? weatherCfg.fogDensity * 1.2 : weatherCfg.fogDensity * 0.92;
      }

      // Animate Drifting Volumetric Clouds & Ambient Spirit Fireflies
      cloudGroup.rotation.y += dt * 0.012;
      const ffArr = fireflyGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < fireflyCount * 3; i += 3) {
        ffArr[i + 1] += Math.sin(now * 0.002 + i) * 0.008;
        ffArr[i] += Math.cos(now * 0.0015 + i) * 0.006;
      }
      fireflyGeo.attributes.position.needsUpdate = true;

      // Animate Crystal Water Ripples
      const waterPlane = terrain.getObjectByName('VoxelWaterPlane') as THREE.Mesh | undefined;
      if (waterPlane) {
        waterPlane.position.y = -2.05 + Math.sin(now * 0.002) * 0.08;
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

      // 2. Handle Player Movement (Keyboard WASD / Arrows + Touch Joystick)
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

      const moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
      if (moveLen > 0.05) {
        const normX = moveX / moveLen;
        const normZ = moveZ / moveLen;

        const cosCam = Math.cos(cameraOrbitAngle);
        const sinCam = Math.sin(cameraOrbitAngle);

        const worldMoveX = normX * cosCam - normZ * sinCam;
        const worldMoveZ = normX * sinCam + normZ * cosCam;

        const speed = 14 * dt;
        playerPos.x += worldMoveX * speed;
        playerPos.z += worldMoveZ * speed;

        playerPos.x = Math.max(-36, Math.min(36, playerPos.x));
        playerPos.z = Math.max(-36, Math.min(36, playerPos.z));

        const targetRot = Math.atan2(worldMoveX, worldMoveZ);
        playerMesh.rotation.y = targetRot;

        playerMesh.position.y = Math.sin(now * 0.015) * 0.15;

        if (propsRef.current.onPlayerPositionChange) {
          propsRef.current.onPlayerPositionChange(playerPos.x, playerPos.z);
        }
      } else {
        playerMesh.position.y = 0;
      }

      playerMesh.position.x = playerPos.x;
      playerMesh.position.z = playerPos.z;

      // Sync Player Aura Mesh if Realm, Great Dao Halo Count, or Red-Name Karma changed
      if (
        propsRef.current.cultivationRealmIndex !== lastBuiltRealm ||
        propsRef.current.masteredGreatDaos !== lastBuiltDaos ||
        propsRef.current.isRedName !== lastBuiltRedName
      ) {
        const prevRotY = playerMesh.rotation.y;
        scene.remove(playerMesh);
        lastBuiltRealm = propsRef.current.cultivationRealmIndex;
        lastBuiltDaos = propsRef.current.masteredGreatDaos;
        lastBuiltRedName = propsRef.current.isRedName;
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

      // 3. Smooth Damped Third-Person Camera Follow
      const camDist = 18;
      const camHeight = 11;
      const targetCamX = playerPos.x + Math.sin(cameraOrbitAngle) * camDist;
      const targetCamZ = playerPos.z + Math.cos(cameraOrbitAngle) * camDist;
      const targetCamY = playerPos.y + camHeight;

      camera.position.x += (targetCamX - camera.position.x) * (1 - Math.exp(-6 * dt));
      camera.position.y += (targetCamY - camera.position.y) * (1 - Math.exp(-6 * dt));
      camera.position.z += (targetCamZ - camera.position.z) * (1 - Math.exp(-6 * dt));

      camera.lookAt(playerPos.x, playerPos.y + 1.8, playerPos.z);

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

      // Render Scene (Use EffectComposer HDR Bloom on hardware GPUs when quality is 'ultra')
      if (!isSoftwareGl && composer && quality === 'ultra') {
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
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onResize);
      if (composer) {
        composer.dispose();
      }
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
