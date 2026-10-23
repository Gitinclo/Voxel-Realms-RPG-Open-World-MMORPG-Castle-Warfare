/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  CharacterAppearance,
  MonsterTarget,
  NPC,
  ResourceNode,
} from '../types/game';
import {
  createMonsterMesh,
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
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.5, 300);
    camera.position.set(0, 14, 22);

    // Modern Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    // Procedural RoomEnvironment for realistic PBR reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Lighting: Sun & Moon rig for Day/Night cycle
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.8);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    sunLight.position.set(25, 45, 25);
    sunLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 120;
      sunLight.shadow.camera.left = -40;
      sunLight.shadow.camera.right = 40;
      sunLight.shadow.camera.top = 40;
      sunLight.shadow.camera.bottom = -40;
      sunLight.shadow.bias = -0.0005;
    }
    scene.add(sunLight);

    // Sun Visual Sphere
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(3.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff176 })
    );
    scene.add(sunMesh);

    // Moon Visual Sphere
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xe0e7ff })
    );
    scene.add(moonMesh);

    // Starfield for night sky
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 220;
      starPositions[i + 1] = Math.random() * 80 + 30;
      starPositions[i + 2] = (Math.random() - 0.5) * 220;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0 });
    const starsField = new THREE.Points(starsGeo, starsMat);
    scene.add(starsField);

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
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);

    // Add Voxel Terrain
    const terrain = createVoxelTerrain();
    scene.add(terrain);

    // Add Castle
    const castleMesh = createVoxelCastle(propsRef.current.castleLevel);
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

    // Add NPCs (6 autonomous roles: Elder, Guard, Blacksmith, Merchant, Marshal, Mystic)
    const npcGroup = new THREE.Group();
    const roleColors: Record<string, number> = {
      elder: 0x6a1b9a,
      blacksmith: 0xd84315,
      marshal: 0x1565c0,
      guard: 0x00838f,
      merchant: 0xf59e0b,
      mystic: 0x10b981,
    };
    propsRef.current.npcs.forEach((npc) => {
      const npcModel = new THREE.Group();
      npcModel.position.set(npc.x, 0, npc.z);
      npcModel.name = `NPC_${npc.id}`;

      const bodyMat = new THREE.MeshStandardMaterial({
        color: roleColors[npc.role] || 0x1565c0,
        roughness: 0.55,
        metalness: npc.role === 'guard' || npc.role === 'marshal' ? 0.65 : 0.2,
      });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.7), bodyMat);
      torso.position.y = 1.3;
      torso.castShadow = true;
      npcModel.add(torso);

      const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.7 })
      );
      head.position.y = 2.4;
      head.castShadow = true;
      npcModel.add(head);

      // Role aura ring on ground
      const auraGeo = new THREE.RingGeometry(0.9, 1.25, 20);
      auraGeo.rotateX(-Math.PI / 2);
      const auraMat = new THREE.MeshBasicMaterial({
        color: roleColors[npc.role] || 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.position.y = 0.06;
      npcModel.add(auraMesh);

      // NPC Overhead Billboard with Level & Role
      const canvas = document.createElement('canvas');
      canvas.width = 192;
      canvas.height = 72;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.roundRect(4, 4, 184, 64, 10);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = 'bold 17px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`${npc.name}`, 96, 26);
        ctx.font = 'bold 15px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`Lv.${npc.level} ${npc.role.toUpperCase()}`, 96, 52);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
      spr.scale.set(3.8, 1.45, 1);
      spr.position.y = 3.7;
      npcModel.add(spr);

      npcGroup.add(npcModel);
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
    const playerVel = new THREE.Vector3();
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
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
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

      // 1. Calculate Day / Night Cycle Lighting & Colors
      const hour = propsRef.current.timeOfDayHours % 24;
      const sunAngle = ((hour - 6) / 24) * Math.PI * 2;
      const sunRadius = 60;

      const sunX = Math.cos(sunAngle) * sunRadius;
      const sunY = Math.sin(sunAngle) * sunRadius;
      const sunZ = Math.sin(sunAngle * 0.5) * 20;

      sunLight.position.set(sunX, Math.max(sunY, -10), sunZ);
      sunMesh.position.set(sunX, sunY, sunZ);
      moonMesh.position.set(-sunX, -sunY, -sunZ);

      const isNight = sunY < 0;
      const isDawnOrDusk = Math.abs(sunY) < 15;

      // Dynamic Weather Environmental State & Status Visuals
      const activeWeather = propsRef.current.weather || 'clear';
      const weatherCfg = WEATHER_CONFIGS[activeWeather] || WEATHER_CONFIGS.clear;

      // Smooth Sky Color Interpolation taking weather into account
      let skyColor = weatherCfg.skyColorHex;
      if (isNight) {
        skyColor = 0x090d16; // Deep starry midnight
        sunLight.intensity = 0.2 * weatherCfg.sunlightMult;
        sunLight.color.setHex(0x64748b);
        hemiLight.intensity = 0.35 * weatherCfg.sunlightMult;
        starsMat.opacity = Math.min(1.0, -sunY / 15);
      } else if (isDawnOrDusk) {
        skyColor = 0xf97316; // Sunset/dawn golden amber
        sunLight.intensity = 1.8 * weatherCfg.sunlightMult;
        sunLight.color.setHex(0xffaa55);
        hemiLight.intensity = 0.7 * weatherCfg.sunlightMult;
        starsMat.opacity = 0;
      } else {
        skyColor = weatherCfg.skyColorHex;
        sunLight.intensity = 2.4 * weatherCfg.sunlightMult;
        sunLight.color.setHex(0xfff8e7);
        hemiLight.intensity = 0.9 * weatherCfg.sunlightMult;
        starsMat.opacity = 0;
      }

      scene.background = new THREE.Color(skyColor);
      if (scene.fog) {
        scene.fog.color.setHex(weatherCfg.fogColorHex);
        (scene.fog as THREE.FogExp2).density = weatherCfg.fogDensity;
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

        // Torrential gale rain
        const rainPosArr = rainGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < rainCount * 3; i += 3) {
          rainPosArr[i + 1] -= dt * 75;
          rainPosArr[i] += dt * 18; // wind shear
          if (rainPosArr[i + 1] < 0) {
            rainPosArr[i] = playerPos.x + (Math.random() - 0.5) * 80 - 15;
            rainPosArr[i + 1] = 40 + Math.random() * 5;
            rainPosArr[i + 2] = playerPos.z + (Math.random() - 0.5) * 80;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;

        // Dynamic lightning storm flash
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
        // Clear Skies
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

      // Add Touch input if present
      const touch = propsRef.current.touchInput;
      if (touch && (touch.x !== 0 || touch.y !== 0)) {
        moveX += touch.x;
        moveZ += touch.y;
      }

      const moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
      if (moveLen > 0.05) {
        const normX = moveX / moveLen;
        const normZ = moveZ / moveLen;

        // Apply camera rotation to movement vector
        const cosCam = Math.cos(cameraOrbitAngle);
        const sinCam = Math.sin(cameraOrbitAngle);

        const worldMoveX = normX * cosCam - normZ * sinCam;
        const worldMoveZ = normX * sinCam + normZ * cosCam;

        const speed = 14 * dt;
        playerPos.x += worldMoveX * speed;
        playerPos.z += worldMoveZ * speed;

        // Bound within world perimeter
        playerPos.x = Math.max(-36, Math.min(36, playerPos.x));
        playerPos.z = Math.max(-36, Math.min(36, playerPos.z));

        // Rotate player mesh toward movement direction
        const targetRot = Math.atan2(worldMoveX, worldMoveZ);
        playerMesh.rotation.y = targetRot;

        // Walking bob animation
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

      // Animate Cultivator Aura Visual Cues (Spinning Golden Core, Floating Nascent Baby, Dao Halos)
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

      // 4. Animate World Elements (Castle spire, Autonomous Monsters & NPCs pathfinding, Telegraph Rings)
      const spire = castleMesh.getObjectByName('CastleSpire');
      if (spire) {
        spire.rotation.y += 0.02;
      }

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

          // Pulse Attack Telegraph Ring during windup/combat states
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

      // Render Scene
      renderer.render(scene, camera);

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
