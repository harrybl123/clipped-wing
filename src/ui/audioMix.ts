import type Phaser from 'phaser';

// The mix: three volumes (music, sounds, voices) under Phaser's master volume and mute, ready for a
// settings screen. Synthesised sounds connect to a bus here instead of straight to the speakers. Every
// function quietly does nothing until Web Audio is available and unlocked (the first key or click).

export type Bus = 'music' | 'sounds' | 'voices';

/** Starting volumes (0–1). */
export const VOLUMES: Record<Bus, number> = { music: 0.6, sounds: 0.8, voices: 0.7 };

const buses = new WeakMap<AudioContext, Record<Bus, GainNode>>();

export interface AudioOut {
  ctx: AudioContext;
  out: AudioNode;
}

/** The Web Audio context and the bus to connect to, or null if sound isn't available yet. */
export function audioOut(scene: Phaser.Scene, bus: Bus): AudioOut | null {
  const sound = scene.sound as Partial<Phaser.Sound.WebAudioSoundManager>;
  if (!sound.context || !sound.destination || sound.locked) return null;
  const ctx = sound.context;
  let set = buses.get(ctx);
  if (!set) {
    const make = (b: Bus) => {
      const gain = ctx.createGain();
      gain.gain.value = VOLUMES[b];
      gain.connect(sound.destination!);
      return gain;
    };
    set = { music: make('music'), sounds: make('sounds'), voices: make('voices') };
    buses.set(ctx, set);
  }
  return { ctx, out: set[bus] };
}

/** Changes a bus's volume (for a settings screen, or the dev mute). */
export function setVolume(scene: Phaser.Scene, bus: Bus, volume: number): void {
  VOLUMES[bus] = volume;
  const a = audioOut(scene, bus);
  if (a) (a.out as GainNode).gain.setTargetAtTime(volume, a.ctx.currentTime, 0.05);
}

/** A buffer of white noise, made once per context and shared. */
const noises = new WeakMap<AudioContext, AudioBuffer>();
export function noiseBuffer(ctx: AudioContext): AudioBuffer {
  let buffer = noises.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noises.set(ctx, buffer);
  }
  return buffer;
}
