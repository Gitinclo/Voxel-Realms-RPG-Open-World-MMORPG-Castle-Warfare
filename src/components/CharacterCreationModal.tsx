/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { X, User, Sparkles, Check, RefreshCw } from 'lucide-react';
import { CharacterAppearance } from '../types/game';
import { createPlayerMesh } from '../game/proceduralWorld';
import { sound } from '../game/audio';

interface CharacterCreationModalProps {
  currentAppearance: CharacterAppearance;
  onSaveAppearance: (updated: CharacterAppearance) => void;
  onClose: () => void;
}

export const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({
  currentAppearance,
  onSaveAppearance,
  onClose,
}) => {
  const [appearance, setAppearance] = useState<CharacterAppearance>({ ...currentAppearance });
  const previewMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number>(0);

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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

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
      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
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

  const handleSave = () => {
    sound.playUpgradeFanfare();
    onSaveAppearance(appearance);
    onClose();
  };

  const handleRandomize = () => {
    const titles = ['Grand Warlord', 'Celestial Aegis', 'Storm Archer', 'Sovereign of Iron', 'Titan Slayer', 'Void Demolisher'];
    const skins = ['#f1c27d', '#ffdbac', '#e0ac69', '#8d5524', '#c68642'];
    const hairs = ['#1a1a1a', '#e65100', '#ffd700', '#b71c1c', '#00e5ff', '#9e9e9e'];
    const armors = ['#1e88e5', '#d32f2f', '#2e7d32', '#f59e0b', '#7c3aed', '#0f172a'];
    const weapons: CharacterAppearance['weaponType'][] = ['broadsword', 'crossbow', 'siege_mortar', 'arcane_halberd'];

    setAppearance((prev) => ({
      ...prev,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-cyan-950/80 border-b border-cyan-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400">
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cinzel text-cyan-100 flex items-center gap-2">
                Character Creation Centre
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono">
                  3D Voxel Customizer
                </span>
              </h2>
              <p className="text-xs text-cyan-200/70">
                Customize your Lord's Appearance, Weapon Mastery, Armor Tier, and Title
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomize}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-semibold flex items-center gap-1.5 border border-slate-700"
              title="Randomize appearance"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Randomize
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Body: Left 3D Viewport, Right Controls */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 text-slate-200">
          {/* 3D Preview Column */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="relative w-full h-[320px] rounded-xl overflow-hidden" ref={previewMountRef} />
            <div className="text-center mt-3">
              <div className="text-base font-bold font-cinzel text-white">
                [{appearance.clanTag}] {appearance.name}
              </div>
              <div className="text-xs font-semibold text-cyan-400 font-mono mt-0.5">
                {appearance.title} · Rank T{appearance.armorTier}
              </div>
            </div>
          </div>

          {/* Customization Controls Column */}
          <div className="md:col-span-7 space-y-4">
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
                <label className="block text-xs font-semibold text-slate-400 mb-1">Title / Epithet</label>
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
                    onClick={() => setAppearance({ ...appearance, weaponType: w.id as CharacterAppearance['weaponType'] })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
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
                  Armor Tier: <span className="text-amber-400 font-mono">Rank T{appearance.armorTier}</span>
                </label>
                <span className="text-[11px] text-slate-500">Tier 18-20 emits celestial runes</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={appearance.armorTier}
                onChange={(e) => setAppearance({ ...appearance, armorTier: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Color Swatches Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Hair Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Hair Color</label>
                <div className="flex gap-1.5 flex-wrap">
                  {['#e65100', '#ffd700', '#1a1a1a', '#00e5ff', '#b71c1c', '#e2e8f0'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setAppearance({ ...appearance, hairColor: color })}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        appearance.hairColor === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      aria-label={`Hair color ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Skin Tone */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Skin Tone</label>
                <div className="flex gap-1.5 flex-wrap">
                  {['#f1c27d', '#ffdbac', '#e0ac69', '#8d5524', '#c68642'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setAppearance({ ...appearance, skinColor: color })}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        appearance.skinColor === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      aria-label={`Skin tone ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Armor Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Armor Finish</label>
                <div className="flex gap-1.5 flex-wrap">
                  {['#1e88e5', '#d32f2f', '#2e7d32', '#f59e0b', '#7c3aed', '#111827'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setAppearance({ ...appearance, armorColor: color })}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        appearance.armorColor === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      aria-label={`Armor color ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Cape & Clan Tag */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <input
                  type="checkbox"
                  id="hasCapeCheck"
                  checked={appearance.hasCape}
                  onChange={(e) => setAppearance({ ...appearance, hasCape: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
                <label htmlFor="hasCapeCheck" className="text-xs font-bold text-slate-300 cursor-pointer">
                  Equip Royal Cape
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Clan Tag</label>
                <input
                  type="text"
                  value={appearance.clanTag}
                  onChange={(e) => setAppearance({ ...appearance, clanTag: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm font-mono font-bold uppercase focus:outline-hidden focus:border-cyan-400"
                  maxLength={6}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Changes apply in real time to your in-world 3D hero.
          </div>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
          >
            <Check className="w-5 h-5" />
            Confirm & Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
};
