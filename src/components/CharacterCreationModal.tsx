/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  X,
  User,
  Check,
  RefreshCw,
  ShieldAlert,
  Lock,
  Unlock,
  Sparkles,
  Gavel,
} from 'lucide-react';
import { CharacterAppearance, CharacterSpeciesId } from '../types/game';
import { createPlayerMesh } from '../game/proceduralWorld';
import {
  CHARACTER_SPECIES_CATALOG,
  evaluateSpeciesSwitchPermission,
  getSpeciesSpec,
} from '../game/species';
import { PRIMARY_ADMIN_EMAIL, verifyAccountPrivileges } from '../game/adminModeration';
import { sound } from '../game/audio';

interface CharacterCreationModalProps {
  currentAppearance: CharacterAppearance;
  activeAccountEmail?: string;
  onSaveAppearance: (updated: CharacterAppearance) => void;
  onRequestSpeciesPermissionTicket?: (requestedSpecies: CharacterSpeciesId) => void;
  onOpenAdminConsole?: () => void;
  onClose: () => void;
}

export const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({
  currentAppearance,
  activeAccountEmail = PRIMARY_ADMIN_EMAIL,
  onSaveAppearance,
  onRequestSpeciesPermissionTicket,
  onOpenAdminConsole,
  onClose,
}) => {
  const [appearance, setAppearance] = useState<CharacterAppearance>({
    ...currentAppearance,
    species: currentAppearance.species || 'human',
  });
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  const previewMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number>(0);

  const activeSpec = getSpeciesSpec(appearance.species);
  const accountPrivs = verifyAccountPrivileges(activeAccountEmail);
  const isAdminSession =
    accountPrivs.permissions.canManageRoles || accountPrivs.permissions.canUseGodmodeAndCheats;

  // Check if switching away from currentAppearance.species is permitted
  const switchEval = evaluateSpeciesSwitchPermission({
    currentAppearance,
    targetSpeciesId: appearance.species || 'human',
    activeAccountEmail,
  });

  const canSwitchToAnySpecies =
    !currentAppearance.speciesLocked ||
    Boolean(currentAppearance.adminSpeciesSwitchApproved) ||
    Boolean(appearance.adminSpeciesSwitchApproved) ||
    isAdminSession;

  // 3D Canvas setup for character preview
  useEffect(() => {
    const container = previewMountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.8, 5.2);
    camera.lookAt(0, 1.4, 0);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      rendererRef.current = renderer;
      container.replaceChildren(renderer.domElement);
    } catch {
      return;
    }

    // Studio lighting rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 1.2);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff3e0, 2.0);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    // Circular pedestal
    const pedestalGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.3, 24);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.15;
    scene.add(pedestal);

    // Initial character model
    const charMesh = createPlayerMesh(appearance);
    charMesh.position.y = 0;
    scene.add(charMesh);
    characterGroupRef.current = charMesh;

    // Animation Loop (slow idle turntable spin & breathing bounce)
    let time = 0;
    const tick = () => {
      time += 0.015;
      if (characterGroupRef.current) {
        characterGroupRef.current.rotation.y = Math.sin(time * 0.4) * 0.4 + 0.1;
        characterGroupRef.current.position.y = Math.sin(time * 2.5) * 0.03;
      }
      renderer?.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      renderer?.dispose();
      container.replaceChildren();
    };
  }, []);

  // Update 3D model whenever appearance changes
  useEffect(() => {
    if (!sceneRef.current) return;
    if (characterGroupRef.current) {
      sceneRef.current.remove(characterGroupRef.current);
    }
    const newMesh = createPlayerMesh(appearance);
    newMesh.position.y = 0;
    sceneRef.current.add(newMesh);
    characterGroupRef.current = newMesh;
  }, [appearance]);

  const handleSelectSpecies = (speciesId: CharacterSpeciesId) => {
    const currentLockedSpecies = currentAppearance.species || 'human';
    if (
      currentAppearance.speciesLocked &&
      speciesId !== currentLockedSpecies &&
      !canSwitchToAnySpecies
    ) {
      sound.playSwing();
      setPermissionNotice(
        `Species is locked to ${getSpeciesSpec(currentLockedSpecies).name}. Switching to ${getSpeciesSpec(speciesId).name} requires permission from Admin (${PRIMARY_ADMIN_EMAIL}).`
      );
      return;
    }

    const spec = getSpeciesSpec(speciesId);
    sound.playButton();
    setPermissionNotice(null);
    setAppearance((prev) => ({
      ...prev,
      species: speciesId,
      skinColor: spec.meshTraits.recommendedSkinColor,
      eyeColor: spec.meshTraits.recommendedEyeColor,
      hairColor: spec.meshTraits.recommendedHairColor,
    }));
  };

  const handleGrantAdminPermissionInModal = () => {
    sound.playUpgradeFanfare();
    setAppearance((prev) => ({
      ...prev,
      adminSpeciesSwitchApproved: true,
    }));
    setPermissionNotice(
      `Admin Permission (${PRIMARY_ADMIN_EMAIL}) granted! You may now freely switch to any of the 10 Species / Races.`
    );
  };

  const handleSave = () => {
    if (!switchEval.allowed && !appearance.adminSpeciesSwitchApproved) {
      setPermissionNotice(switchEval.reason);
      return;
    }
    sound.playUpgradeFanfare();
    onSaveAppearance({
      ...appearance,
      species: appearance.species || 'human',
      speciesLocked: true,
      adminSpeciesSwitchApproved: isAdminSession
        ? Boolean(appearance.adminSpeciesSwitchApproved)
        : false,
    });
    onClose();
  };

  const handleRandomize = () => {
    const titles = [
      'Grand Warlord',
      'Celestial Aegis',
      'Storm Archer',
      'Sovereign of Iron',
      'Titan Slayer',
      'Void Demolisher',
    ];
    const skins = ['#f1c27d', '#ffdbac', '#e0ac69', '#8d5524', '#c68642'];
    const hairs = ['#1a1a1a', '#e65100', '#ffd700', '#b71c1c', '#00e5ff', '#9e9e9e'];
    const armors = ['#1e88e5', '#d32f2f', '#2e7d32', '#f59e0b', '#7c3aed', '#0f172a'];
    const weapons: CharacterAppearance['weaponType'][] = [
      'broadsword',
      'crossbow',
      'siege_mortar',
      'arcane_halberd',
    ];
    const randomSpecies = canSwitchToAnySpecies
      ? CHARACTER_SPECIES_CATALOG[Math.floor(Math.random() * CHARACTER_SPECIES_CATALOG.length)].id
      : appearance.species || 'human';

    setAppearance((prev) => ({
      ...prev,
      species: randomSpecies,
      title: titles[Math.floor(Math.random() * titles.length)],
      skinColor: skins[Math.floor(Math.random() * skins.length)],
      hairColor: hairs[Math.floor(Math.random() * hairs.length)],
      armorColor: armors[Math.floor(Math.random() * armors.length)],
      weaponType: weapons[Math.floor(Math.random() * weapons.length)],
      armorTier: Math.floor(Math.random() * 20) + 1,
    }));
    sound.playSwing();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        data-testid="character-creation-modal"
        className="relative w-full max-w-5xl bg-slate-900 border-2 border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Header */}
        <div className="relative px-4 sm:px-6 py-4 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-cyan-950/80 border-b border-cyan-500/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 shrink-0">
              <User className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold font-cinzel text-cyan-100 flex items-center gap-2 flex-wrap">
                <span>Character Creation Centre</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono">
                  10 Species / Races · 3D Voxel Customizer
                </span>
              </h2>
              <p className="text-xs text-cyan-200/70 truncate">
                Choose from 10 Fantasy, Xianxia &amp; Cosmic Species with 3D Meshes, Innate Passives
                &amp; Admin Rebirth Governance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRandomize}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="Randomize appearance"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Randomize
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Body: Left 3D Viewport + Active Species Lore/Buffs, Right Controls */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 text-slate-200">
          {/* 3D Preview & Active Species Telemetry Column */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="flex flex-col items-center justify-center p-4 bg-slate-950/85 rounded-2xl border border-slate-800">
              <div
                className="relative w-full h-[270px] sm:h-[300px] rounded-xl overflow-hidden"
                ref={previewMountRef}
              />
              <div className="text-center mt-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold mb-1">
                  <span>{activeSpec.icon}</span>
                  <span>{activeSpec.name}</span>
                  <span className="text-amber-400/80">({activeSpec.chineseName})</span>
                </div>
                <div className="text-base font-bold font-cinzel text-white">
                  [{appearance.clanTag}] {appearance.name}
                </div>
                <div className="text-xs font-semibold text-cyan-400 font-mono mt-0.5">
                  {appearance.title} · Rank T{appearance.armorTier}
                </div>
              </div>
            </div>

            {/* Active Species 3D Traits & Innate Racial Passives Card */}
            <div
              data-testid="active-species-passives-card"
              className="p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  {activeSpec.lineageLabel}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-300">
                  Scale {activeSpec.meshTraits.bodyScale[0]}× / {activeSpec.meshTraits.bodyScale[1]}
                  ×
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{activeSpec.loreSummary}</p>
              <div className="text-[11px] font-mono text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
                3D Mesh: <span className="text-white">{activeSpec.visualTraitsDescription}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono">
                <div className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                  Shield Def: +{activeSpec.passives.shieldbearerDefensePct}% · Shooter: +
                  {activeSpec.passives.shooterAttackPct}%
                </div>
                <div className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                  Bomber: +{activeSpec.passives.bomberSiegeAttackPct}% · Rally: +
                  {activeSpec.passives.rallyCapacityPct}%
                </div>
                <div className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-amber-300">
                  Qi/Body: +{activeSpec.passives.qiCultivationSpeedPct}% / +
                  {activeSpec.passives.bodyCultivationSpeedPct}%
                </div>
                <div className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-purple-300">
                  Soul/Mind: +{activeSpec.passives.soulCultivationSpeedPct}% / +
                  {activeSpec.passives.mindCultivationSpeedPct}%
                </div>
              </div>
            </div>
          </div>

          {/* Customization Controls Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* 10-Species / Race Selection Matrix & Admin Permission Gate */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    Choose Species / Race (10 Lineages)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Initial creation is free. Switching species after locking requires Admin
                    Permission ({PRIMARY_ADMIN_EMAIL}).
                  </p>
                </div>

                {/* Lock / Admin Authorization Status Pill */}
                {!currentAppearance.speciesLocked ? (
                  <span
                    data-testid="species-lock-status"
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1"
                  >
                    <Unlock className="w-3 h-3" /> Initial Creation Unlocked
                  </span>
                ) : canSwitchToAnySpecies ? (
                  <span
                    data-testid="species-lock-status"
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-200 text-[10px] font-mono font-bold flex items-center gap-1"
                  >
                    <Gavel className="w-3 h-3 text-amber-400" /> Admin Authorized (
                    {PRIMARY_ADMIN_EMAIL})
                  </span>
                ) : (
                  <span
                    data-testid="species-lock-status"
                    className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 text-[10px] font-mono font-bold flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3 text-rose-400" /> Locked (Requires Admin Permission)
                  </span>
                )}
              </div>

              {/* Admin Permission Action Bar when species is locked */}
              {currentAppearance.speciesLocked && !canSwitchToAnySpecies && (
                <div
                  data-testid="species-admin-permission-banner"
                  className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 text-rose-200">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      Species is locked to{' '}
                      <strong>{getSpeciesSpec(currentAppearance.species).name}</strong>. Request or
                      grant Admin approval from <strong>{PRIMARY_ADMIN_EMAIL}</strong> to switch.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {onRequestSpeciesPermissionTicket && (
                      <button
                        type="button"
                        data-testid="request-admin-species-ticket-btn"
                        onClick={() => {
                          sound.playButton();
                          onRequestSpeciesPermissionTicket(appearance.species || 'azure_dragonkin');
                          setPermissionNotice(
                            `Official Species Rebirth Request dispatched to Admin (${PRIMARY_ADMIN_EMAIL}).`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/25 hover:bg-amber-500/35 border border-amber-400 text-amber-200 text-[11px] font-mono font-bold cursor-pointer"
                      >
                        Request Admin Permission
                      </button>
                    )}
                    <button
                      type="button"
                      data-testid="grant-admin-species-override-btn"
                      onClick={handleGrantAdminPermissionInModal}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/45 border border-emerald-400 text-emerald-200 text-[11px] font-mono font-bold cursor-pointer"
                    >
                      Approve as Admin ({PRIMARY_ADMIN_EMAIL})
                    </button>
                    {onOpenAdminConsole && (
                      <button
                        type="button"
                        onClick={onOpenAdminConsole}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-[11px] font-mono cursor-pointer"
                      >
                        Open GM Console
                      </button>
                    )}
                  </div>
                </div>
              )}

              {permissionNotice && (
                <div
                  data-testid="species-permission-notice"
                  className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-[11px] font-mono text-amber-200"
                >
                  {permissionNotice}
                </div>
              )}

              {/* 10 Species Cards Grid */}
              <div
                data-testid="species-selection-grid"
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[230px] overflow-y-auto pr-1"
              >
                {CHARACTER_SPECIES_CATALOG.map((spec) => {
                  const isSelected = (appearance.species || 'human') === spec.id;
                  const isLockedOption =
                    Boolean(currentAppearance.speciesLocked) &&
                    !canSwitchToAnySpecies &&
                    spec.id !== (currentAppearance.species || 'human');

                  return (
                    <button
                      key={spec.id}
                      type="button"
                      data-testid={`species-option-${spec.id}`}
                      onClick={() => handleSelectSpecies(spec.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/85 border-cyan-400 text-cyan-100 shadow-md shadow-cyan-500/10'
                          : isLockedOption
                            ? 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-rose-500/40'
                            : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{spec.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold truncate">{spec.name}</span>
                          {isLockedOption ? (
                            <Lock className="w-3 h-3 text-rose-400 shrink-0" />
                          ) : (
                            <span className="text-[10px] font-mono text-amber-400 shrink-0">
                              {spec.chineseName}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-emerald-300 font-mono truncate mt-0.5">
                          {spec.primaryBuffSummary}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {spec.visualTraitsDescription}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name & Title */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Lord Name</label>
                <input
                  type="text"
                  value={appearance.name}
                  onChange={(e) => setAppearance({ ...appearance, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm font-semibold focus:outline-hidden focus:border-cyan-400"
                  maxLength={18}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Title / Epithet
                </label>
                <input
                  type="text"
                  value={appearance.title}
                  onChange={(e) => setAppearance({ ...appearance, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm font-semibold focus:outline-hidden focus:border-cyan-400"
                  maxLength={22}
                />
              </div>
            </div>

            {/* Weapon Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Weapon Specialty
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'broadsword', label: 'Broadsword', desc: 'Vanguard DPS' },
                  { id: 'crossbow', label: 'Crossbow', desc: 'Sniper Piercing' },
                  { id: 'siege_mortar', label: 'Siege Mortar', desc: 'Explosive AOE' },
                  { id: 'arcane_halberd', label: 'Arcane Halberd', desc: 'Divine Reach' },
                ].map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() =>
                      setAppearance({
                        ...appearance,
                        weaponType: w.id as CharacterAppearance['weaponType'],
                      })
                    }
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      appearance.weaponType === w.id
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold">{w.label}</div>
                    <div className="text-[10px] text-slate-400">{w.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Armor Tier (T1 - T20) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-400">
                  Armor Tier:{' '}
                  <span className="text-amber-400 font-mono">Rank T{appearance.armorTier}</span>
                </label>
                <span className="text-[11px] text-slate-500">Tier 18-20 emits celestial runes</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={appearance.armorTier}
                onChange={(e) =>
                  setAppearance({ ...appearance, armorTier: parseInt(e.target.value) })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Color Swatches Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Hair Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Hair Color
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {['#e65100', '#ffd700', '#1a1a1a', '#00e5ff', '#b71c1c', '#e2e8f0'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAppearance({ ...appearance, hairColor: color })}
                        style={{ backgroundColor: color }}
                        className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                          appearance.hairColor === color
                            ? 'border-white scale-110'
                            : 'border-transparent'
                        }`}
                        aria-label={`Hair color ${color}`}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Skin Tone */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Skin / Construct Tone
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    '#f1c27d',
                    '#ffdbac',
                    '#e0ac69',
                    '#8d5524',
                    '#65a30d',
                    '#818cf8',
                    '#38bdf8',
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAppearance({ ...appearance, skinColor: color })}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                        appearance.skinColor === color
                          ? 'border-white scale-110'
                          : 'border-transparent'
                      }`}
                      aria-label={`Skin tone ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Armor Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Armor Finish
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {['#1e88e5', '#d32f2f', '#2e7d32', '#f59e0b', '#7c3aed', '#111827'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setAppearance({ ...appearance, armorColor: color })}
                        style={{ backgroundColor: color }}
                        className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                          appearance.armorColor === color
                            ? 'border-white scale-110'
                            : 'border-transparent'
                        }`}
                        aria-label={`Armor color ${color}`}
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Cape & Clan Tag */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <input
                  type="checkbox"
                  id="hasCapeCheck"
                  checked={appearance.hasCape}
                  onChange={(e) => setAppearance({ ...appearance, hasCape: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
                <label
                  htmlFor="hasCapeCheck"
                  className="text-xs font-bold text-slate-300 cursor-pointer"
                >
                  Equip Royal Cape
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Clan Tag</label>
                <input
                  type="text"
                  value={appearance.clanTag}
                  onChange={(e) =>
                    setAppearance({ ...appearance, clanTag: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm font-mono font-bold uppercase focus:outline-hidden focus:border-cyan-400"
                  maxLength={6}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Active Lineage:{' '}
            <span className="text-amber-300 font-semibold">
              {activeSpec.icon} {activeSpec.name}
            </span>{' '}
            · Locks species after initial confirmation unless authorized by Admin (
            {PRIMARY_ADMIN_EMAIL}).
          </div>
          <button
            type="button"
            data-testid="confirm-save-avatar-btn"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5" />
            Confirm &amp; Lock Species Avatar
          </button>
        </div>
      </div>
    </div>
  );
};
