import type Phaser from 'phaser';
import { loadRecordings } from './recordings';

// The mix: three volumes (music, sounds, voices) under Phaser's master volume and mute, ready for a
// settings screen. Synthesised sounds connect to a bus here instead of straight to the speakers. Every
// function quietly does nothing until Web Audio is available and unlocked (the first key or click).

export type Bus = 'music' | 'sounds' | 'voices';

/** Starting volumes (0–1). */
export const VOLUMES: Record<Bus, number> = { music: 0.6, sounds: 0.8, voices: 0.7 };

/**
 * The space you're in: how much echo, how long it lasts, how dark it is, and the colour of the room's
 * own hush. Each area has one (`AreaDefinition.acoustics`), so places sound different (designer).
 */
export type Acoustics = 'small' | 'hall' | 'tunnel' | 'street' | 'high' | 'open';
export const ACOUSTICS: Record<Acoustics, { echo: number; length: number; dark: number; hush: number }> = {
  small: { echo: 0.1, length: 0.45, dark: 0.15, hush: 200 }, // a home: close, dead, a little boxy
  hall: { echo: 0.32, length: 2, dark: 0.3, hush: 140 }, // the offering floor, the shrine: big and solemn
  tunnel: { echo: 0.38, length: 1.2, dark: 0.12, hush: 110 }, // the back routes, the rot: dark and close, ringing
  street: { echo: 0.13, length: 0.8, dark: 0.35, hush: 260 }, // the market, the roots: busy, open, short echo
  high: { echo: 0.1, length: 2.8, dark: 0.6, hush: 400 }, // up the trunk, the gate, the grove: airy, faint and far
  open: { echo: 0.04, length: 0.5, dark: 0.5, hush: 500 }, // the borderland's waste: nothing to bounce off
};

interface Mix {
  buses: Record<Bus, GainNode>;
  room: ConvolverNode;
  wet: GainNode;
  acoustics: Acoustics | null;
}
const mixes = new WeakMap<AudioContext, Mix>();
const impulses = new WeakMap<AudioContext, Map<Acoustics, AudioBuffer>>();

export interface AudioOut {
  ctx: AudioContext;
  out: AudioNode;
}

/** The Web Audio context and the bus to connect to, or null if sound isn't available yet. */
export function audioOut(scene: Phaser.Scene, bus: Bus): AudioOut | null {
  const sound = scene.sound as Partial<Phaser.Sound.WebAudioSoundManager>;
  if (!sound.context || !sound.destination || sound.locked) return null;
  const ctx = sound.context;
  let mix = mixes.get(ctx);
  if (!mix) {
    // Earthy (designer): sounds and voices go through a gentle low-pass, and a little of each into the
    // echo of the space you're in, so nothing sounds dry and electronic.
    const room = ctx.createConvolver();
    room.buffer = roomImpulse(ctx, 'small');
    const wet = ctx.createGain();
    wet.gain.value = ACOUSTICS.small.echo;
    room.connect(wet).connect(sound.destination!);
    const make = (b: Bus) => {
      const gain = ctx.createGain();
      gain.gain.value = VOLUMES[b];
      if (b === 'music') {
        gain.connect(sound.destination!);
        return gain;
      }
      const warm = ctx.createBiquadFilter();
      warm.type = 'lowpass';
      warm.frequency.value = b === 'voices' ? 2800 : 4200;
      warm.Q.value = 0.5;
      gain.connect(warm).connect(sound.destination!);
      const send = ctx.createGain();
      send.gain.value = b === 'voices' ? 0.6 : 1;
      warm.connect(send).connect(room);
      return gain;
    };
    mix = { buses: { music: make('music'), sounds: make('sounds'), voices: make('voices') }, room, wet, acoustics: null };
    mixes.set(ctx, mix);
    loadRecordings(ctx); // any recorded sound effects, in the background
  }
  return { ctx, out: mix.buses[bus] };
}

/** Sets the space you're in (each area, on arrival). */
export function setAcoustics(scene: Phaser.Scene, acoustics: Acoustics): void {
  const a = audioOut(scene, 'sounds');
  const mix = a && mixes.get(a.ctx);
  if (!a || !mix || mix.acoustics === acoustics) return;
  mix.acoustics = acoustics;
  mix.room.buffer = roomImpulse(a.ctx, acoustics);
  mix.wet.gain.setTargetAtTime(ACOUSTICS[acoustics].echo, a.ctx.currentTime, 0.3);
  // Voices carry less in the open, over the wind (designer: speech in the borderland seemed silent): lift them there.
  mix.buses.voices.gain.setTargetAtTime(VOLUMES.voices * (VOICE_LIFT[acoustics] ?? 1), a.ctx.currentTime, 0.3);
}

/** How much louder voices are in some spaces. */
const VOICE_LIFT: Partial<Record<Acoustics, number>> = { open: 1.8, street: 1.3 };

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

/** The echo of a space: dark, decaying noise, a little different in each ear (made once per space). */
function roomImpulse(ctx: AudioContext, acoustics: Acoustics): AudioBuffer {
  let cache = impulses.get(ctx);
  if (!cache) impulses.set(ctx, (cache = new Map()));
  const made = cache.get(acoustics);
  if (made) return made;
  const { length: seconds, dark } = ACOUSTICS[acoustics];
  const length = Math.round(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    let smooth = 0;
    for (let i = 0; i < length; i++) {
      smooth += dark * (Math.random() * 2 - 1 - smooth); // lower is darker: wood, not tile
      data[i] = smooth * (1 - i / length) ** 3;
    }
  }
  cache.set(acoustics, buffer);
  return buffer;
}
