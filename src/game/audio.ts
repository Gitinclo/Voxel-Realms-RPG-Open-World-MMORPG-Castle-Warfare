/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResourceType } from '../types/game';
import {
  RESOURCE_NODE_AUDIO_MAX_DISTANCE,
  SpatialAudioParams,
  WORLD_BOSS_AUDIO_MAX_DISTANCE,
} from './spatialAudioCues';

const RESOURCE_CHIME_FREQS: Record<ResourceType, readonly [number, number, number]> = {
  wood: [523.25, 659.25, 783.99], // Warm C5 major pastoral chord
  steel: [659.25, 987.77, 1318.51], // Bright E5 metallic fifth + octave
  copper: [587.33, 880.0, 1174.66], // Warm D5 resonant chime
  diamond: [880.0, 1318.51, 1760.0], // Crystalline A5 harmonic bell
  grain: [493.88, 739.99, 987.77], // Pastoral B4 wind-chime triad
  oil: [440.0, 659.25, 880.0], // Deep A4 leyline resonance
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Sound starts unmuted or from saved setting
    const saved =
      typeof window !== 'undefined' ? localStorage.getItem('voxel_rpg_sound_muted') : null;
    this.muted = saved === 'true';
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('voxel_rpg_sound_muted', String(this.muted));
    }
    return this.muted;
  }

  private syncAudioListener(spatial: SpatialAudioParams) {
    if (!this.ctx || !this.ctx.listener) return;
    const listener = this.ctx.listener;
    const now = this.ctx.currentTime;

    if (listener.positionX && listener.positionY && listener.positionZ) {
      listener.positionX.setValueAtTime(spatial.listenerX, now);
      listener.positionY.setValueAtTime(spatial.listenerY, now);
      listener.positionZ.setValueAtTime(spatial.listenerZ, now);
    } else if (typeof listener.setPosition === 'function') {
      listener.setPosition(spatial.listenerX, spatial.listenerY, spatial.listenerZ);
    }

    if (
      listener.forwardX &&
      listener.forwardY &&
      listener.forwardZ &&
      listener.upX &&
      listener.upY &&
      listener.upZ
    ) {
      listener.forwardX.setValueAtTime(spatial.forwardX, now);
      listener.forwardY.setValueAtTime(0, now);
      listener.forwardZ.setValueAtTime(spatial.forwardZ, now);
      listener.upX.setValueAtTime(0, now);
      listener.upY.setValueAtTime(1, now);
      listener.upZ.setValueAtTime(0, now);
    } else if (typeof listener.setOrientation === 'function') {
      listener.setOrientation(spatial.forwardX, 0, spatial.forwardZ, 0, 1, 0);
    }
  }

  /**
   * Routes a cue gain node through a 3D HRTF PannerNode (with StereoPanner fallback)
   * positioned at the world-space emitter and attenuated by spatial distance.
   */
  private createSpatialDestination(
    spatial: SpatialAudioParams,
    refDistance: number,
    maxDistance: number,
    rolloffFactor: number
  ): AudioNode {
    const ctx = this.ctx!;
    this.syncAudioListener(spatial);

    const distanceGain = ctx.createGain();
    distanceGain.gain.setValueAtTime(Math.max(0.02, spatial.attenuation), ctx.currentTime);

    if (typeof ctx.createPanner === 'function') {
      const panner = ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = refDistance;
      panner.maxDistance = maxDistance;
      panner.rolloffFactor = rolloffFactor;

      const now = ctx.currentTime;
      if (panner.positionX && panner.positionY && panner.positionZ) {
        panner.positionX.setValueAtTime(spatial.sourceX, now);
        panner.positionY.setValueAtTime(spatial.sourceY, now);
        panner.positionZ.setValueAtTime(spatial.sourceZ, now);
      } else if (typeof panner.setPosition === 'function') {
        panner.setPosition(spatial.sourceX, spatial.sourceY, spatial.sourceZ);
      }

      if (typeof ctx.createStereoPanner === 'function') {
        const stereoBlend = ctx.createStereoPanner();
        stereoBlend.pan.setValueAtTime(spatial.pan * 0.35, now);
        distanceGain.connect(panner);
        panner.connect(stereoBlend);
        stereoBlend.connect(ctx.destination);
      } else {
        distanceGain.connect(panner);
        panner.connect(ctx.destination);
      }
      return distanceGain;
    }

    if (typeof ctx.createStereoPanner === 'function') {
      const stereo = ctx.createStereoPanner();
      stereo.pan.setValueAtTime(spatial.pan, ctx.currentTime);
      distanceGain.connect(stereo);
      stereo.connect(ctx.destination);
      return distanceGain;
    }

    distanceGain.connect(ctx.destination);
    return distanceGain;
  }

  public playSwing() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playArrow() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playExplosion() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playGather() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = now + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + 0.21);
    });
  }

  public playUpgradeFanfare() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chord = [392, 523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const start = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(start);
      osc.stop(start + 0.65);
    });
  }

  public playLevelUp() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = now + i * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  public playThunder() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.7);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.76);
  }

  public playWeatherChange() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [329.63, 440, 523.25, 659.25];
    freqs.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = now + i * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.46);
    });
  }

  public playButton() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Unique spatialized Titan War-Horn & seismic lowpass swell when a World Boss spawns.
   */
  public playWorldBossSpawnSpatialCue(spatial: SpatialAudioParams) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const spatialOut = this.createSpatialDestination(
      spatial,
      10,
      WORLD_BOSS_AUDIO_MAX_DISTANCE,
      0.75
    );

    // 1. Sub-bass seismic rumble swept through a resonant lowpass filter
    const subOsc = ctx.createOscillator();
    const subFilter = ctx.createBiquadFilter();
    const subGain = ctx.createGain();

    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(55, now);
    subOsc.frequency.exponentialRampToValueAtTime(41.2, now + 1.35);

    subFilter.type = 'lowpass';
    subFilter.Q.setValueAtTime(3.2, now);
    subFilter.frequency.setValueAtTime(160, now);
    subFilter.frequency.exponentialRampToValueAtTime(840, now + 0.38);
    subFilter.frequency.exponentialRampToValueAtTime(210, now + 1.35);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.28, now + 0.12);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(spatialOut);

    subOsc.start(now);
    subOsc.stop(now + 1.42);

    // 2. Brass-like Titan War-Horn fifth + tritone call
    const hornNotes = [
      { freq: 110, offset: 0.04, duration: 1.15, peakGain: 0.16, type: 'triangle' as const },
      { freq: 164.81, offset: 0.16, duration: 1.0, peakGain: 0.14, type: 'sawtooth' as const },
      { freq: 233.08, offset: 0.3, duration: 0.9, peakGain: 0.11, type: 'triangle' as const },
    ];

    for (const note of hornNotes) {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      const start = now + note.offset;

      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, start);
      osc.frequency.linearRampToValueAtTime(note.freq * 0.985, start + note.duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(920, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(note.peakGain, start + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(spatialOut);

      osc.start(start);
      osc.stop(start + note.duration + 0.02);
    }
  }

  /**
   * Unique spatialized crystalline leyline bell chime when a nearby resource node reaches full capacity.
   */
  public playResourceNodeFullSpatialCue(spatial: SpatialAudioParams, resourceType: ResourceType) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const spatialOut = this.createSpatialDestination(
      spatial,
      4,
      RESOURCE_NODE_AUDIO_MAX_DISTANCE,
      1.25
    );

    const triad = RESOURCE_CHIME_FREQS[resourceType] ?? RESOURCE_CHIME_FREQS.diamond;
    triad.forEach((freq, idx) => {
      const fundamental = ctx.createOscillator();
      const shimmer = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.085;
      const duration = 0.55;

      fundamental.type = 'sine';
      fundamental.frequency.setValueAtTime(freq, start);

      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(freq * 2, start);

      const shimmerGain = ctx.createGain();
      shimmerGain.gain.setValueAtTime(0.25, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.13, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      fundamental.connect(gain);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(gain);
      gain.connect(spatialOut);

      fundamental.start(start);
      shimmer.start(start);
      fundamental.stop(start + duration + 0.02);
      shimmer.stop(start + duration + 0.02);
    });
  }
}

export const sound = new SoundEngine();
