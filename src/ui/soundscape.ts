import type Phaser from 'phaser';
import type { AmbienceLayer, AmbienceSound, Surface } from '../data/areas/types';
import { CROWD_VOICES, type Syllable, VOICES } from '../systems/voices';
import { audioOut, noiseBuffer } from './audioMix';
import { playSyllable } from './voice';

// The sound of the tree (docs/audio-plan.md), all synthesised with Web Audio, no files:
// - the area's bed: layers that fade in and out with the time of day and the story,
// - emitters: things that make a sound where they are (the tube, a fire, a beetle), louder as you get
//   near and panned left or right,
// - one-off sounds: footsteps, a board cracking, a knock at the door, the offerings rushing up the tube.
// One Soundscape per AreaScene; it stops when the scene shuts down.

/** One-off sounds, for code and for ink (`#sound:<id>`). */
export const SOUND_IDS = [
  'plink', 'splash', 'crackle', 'creak', 'thump', 'crack', 'rumble', 'skitter', 'bloop', 'tick', 'tap', 'chime',
  'jump', 'land', 'knock', 'door', 'rush', 'boom', 'shimmer', 'shuffle', 'whoosh', 'rise', 'step',
] as const;
export type SoundId = (typeof SOUND_IDS)[number];

/** Things that make sound where they are. */
export type EmitterSound = 'tube' | 'fire' | 'creak' | 'skitter' | 'footsteps' | 'mob' | 'bubbles' | 'rope';

interface Out {
  ctx: AudioContext;
  out: AudioNode;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** A gain envelope starting at `t`: quick rise to `peak`, then a fall over `decay` seconds. */
function envelope(ctx: AudioContext, t: number, peak: number, decay: number, attack = 0.005): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}

function tone(a: Out, dest: AudioNode, t: number, type: OscillatorType, from: number, to: number, decay: number, peak: number, attack = 0.005): void {
  const osc = a.ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
  osc.connect(envelope(a.ctx, t, peak, decay, attack)).connect(dest);
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
}

function noise(a: Out, dest: AudioNode, t: number, filter: BiquadFilterType, freq: number, q: number, decay: number, peak: number, attack = 0.003, sweepTo?: number): void {
  const src = a.ctx.createBufferSource();
  src.buffer = noiseBuffer(a.ctx);
  const f = a.ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + attack + decay);
  f.Q.value = q;
  src.connect(f).connect(envelope(a.ctx, t, peak, decay, attack)).connect(dest);
  src.start(t, Math.random() * 1.5);
  src.stop(t + attack + decay + 0.05);
}

/** Footsteps, by what you're walking on. */
function step(a: Out, dest: AudioNode, t: number, surface: Surface, v: number): void {
  switch (surface) {
    case 'plank':
      noise(a, dest, t, 'bandpass', rand(900, 1300), 1.5, 0.05, 0.22 * v);
      tone(a, dest, t, 'sine', rand(190, 230), 120, 0.06, 0.12 * v);
      break;
    case 'metal':
      noise(a, dest, t, 'bandpass', rand(2600, 3400), 6, 0.1, 0.16 * v);
      tone(a, dest, t, 'triangle', rand(1500, 1900), 1400, 0.12, 0.03 * v);
      break;
    case 'fungus':
      noise(a, dest, t, 'lowpass', 450, 1, 0.08, 0.2 * v, 0.01);
      break;
    case 'wet':
      noise(a, dest, t, 'bandpass', 650, 2, 0.07, 0.2 * v, 0.01);
      tone(a, dest, t + 0.02, 'sine', rand(280, 340), 140, 0.05, 0.06 * v);
      break;
    default:
      noise(a, dest, t, 'bandpass', rand(700, 1000), 1.2, 0.045, 0.2 * v);
      tone(a, dest, t, 'sine', rand(130, 160), 80, 0.04, 0.1 * v);
  }
}

/** Plays a one-off sound into `dest` at time `t`. `v` scales the loudness. */
function oneShot(a: Out, dest: AudioNode, t: number, id: SoundId, v: number, surface: Surface = 'wood'): void {
  switch (id) {
    case 'plink': {
      const p = rand(0.85, 1.2);
      tone(a, dest, t, 'sine', 1500 * p, 700 * p, 0.09, 0.2 * v);
      tone(a, dest, t + 0.13, 'sine', 1400 * p, 650 * p, 0.08, 0.05 * v); // the echo
      break;
    }
    case 'splash':
      noise(a, dest, t, 'bandpass', 1800, 1, 0.12, 0.18 * v);
      tone(a, dest, t, 'sine', 600, 250, 0.08, 0.08 * v);
      break;
    case 'crackle':
      noise(a, dest, t, 'bandpass', rand(2000, 4500), 2, rand(0.008, 0.03), rand(0.08, 0.3) * v);
      if (Math.random() < 0.25) noise(a, dest, t, 'lowpass', 300, 1, 0.06, 0.15 * v);
      break;
    case 'creak': {
      const f = rand(80, 140);
      const osc = a.ctx.createOscillator();
      osc.type = 'sawtooth';
      const len = rand(0.35, 0.9);
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.linearRampToValueAtTime(f * rand(0.75, 1.3), t + len);
      const band = a.ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = rand(500, 900);
      band.Q.value = 4;
      const g = a.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.06 * v, t + len * 0.4);
      g.gain.linearRampToValueAtTime(0.0001, t + len);
      osc.connect(band).connect(g).connect(dest);
      osc.start(t);
      osc.stop(t + len + 0.05);
      break;
    }
    case 'thump':
      tone(a, dest, t, 'sine', 110, 40, 0.25, 0.5 * v);
      noise(a, dest, t, 'lowpass', 400, 1, 0.15, 0.3 * v);
      break;
    case 'crack':
      noise(a, dest, t, 'highpass', 1500, 1, 0.05, 0.4 * v);
      tone(a, dest, t, 'square', 300, 90, 0.04, 0.08 * v);
      for (let i = 1; i <= 4; i++) noise(a, dest, t + 0.08 * i + rand(0, 0.04), 'bandpass', rand(600, 1500), 2, 0.03, 0.12 * v);
      break;
    case 'rumble':
      noise(a, dest, t, 'lowpass', 140, 1, 1.6, 0.7 * v, 0.3);
      for (let i = 0; i < 6; i++) noise(a, dest, t + rand(0.1, 1.4), 'bandpass', rand(300, 900), 2, 0.05, 0.15 * v);
      break;
    case 'skitter':
      for (let i = 0; i < 6; i++) noise(a, dest, t + i * 0.028, 'bandpass', rand(3500, 5000), 4, 0.012, 0.15 * v);
      break;
    case 'bloop':
      tone(a, dest, t, 'sine', rand(120, 170), rand(260, 360), 0.08, 0.15 * v, 0.01);
      break;
    case 'tick':
      noise(a, dest, t, 'highpass', rand(2800, 3600), 1, 0.008, 0.15 * v);
      break;
    case 'tap':
      noise(a, dest, t, 'bandpass', rand(1300, 2000), 3, 0.02, 0.25 * v);
      tone(a, dest, t, 'sine', rand(250, 350), 200, 0.03, 0.1 * v);
      break;
    case 'chime': {
      const note = [1568, 1760, 2093, 2349, 2637][Math.floor(Math.random() * 5)]!;
      tone(a, dest, t, 'sine', note, note, 1.4, 0.05 * v, 0.01);
      tone(a, dest, t, 'sine', note * 2.01, note * 2.01, 0.6, 0.015 * v, 0.01);
      break;
    }
    case 'step':
      step(a, dest, t, surface, v);
      break;
    case 'jump':
      noise(a, dest, t, 'bandpass', 900, 1, 0.08, 0.1 * v, 0.02);
      break;
    case 'land':
      step(a, dest, t, surface, v * 1.3);
      noise(a, dest, t, 'lowpass', 300, 1, 0.08, 0.2 * v);
      break;
    case 'knock':
      for (let i = 0; i < 3; i++) {
        tone(a, dest, t + i * 0.2, 'sine', 140, 70, 0.1, 0.5 * v);
        noise(a, dest, t + i * 0.2, 'bandpass', 500, 2, 0.06, 0.4 * v);
      }
      break;
    case 'door':
      oneShot(a, dest, t, 'creak', v * 1.5);
      tone(a, dest, t + 0.5, 'sine', 120, 50, 0.2, 0.3 * v);
      break;
    case 'rush': // the offerings going up the tube, the blessings coming down
      noise(a, dest, t, 'bandpass', 300, 1.5, 1.4, 0.35 * v, 0.4, 3500);
      tone(a, dest, t, 'sine', 500, 1800, 1.4, 0.06 * v, 0.4);
      break;
    case 'boom':
      tone(a, dest, t, 'sine', 70, 28, 1.3, 0.6 * v);
      noise(a, dest, t, 'lowpass', 200, 1, 0.9, 0.3 * v);
      break;
    case 'shimmer':
      for (const f of [1500, 1900, 2400, 3000]) tone(a, dest, t + rand(0, 0.1), 'sine', f * rand(0.98, 1.02), f, 1.6, 0.03 * v, 0.05);
      break;
    case 'shuffle':
      for (let i = 0; i < 14; i++) noise(a, dest, t + rand(0, 0.9), 'lowpass', rand(700, 1400), 1, rand(0.05, 0.12), rand(0.06, 0.15) * v, 0.01);
      break;
    case 'whoosh':
      noise(a, dest, t, 'bandpass', 400, 2, 0.25, 0.3 * v, 0.05, 1600);
      break;
    case 'rise':
      tone(a, dest, t, 'sine', 180, 1600, 3.2, 0.12 * v, 0.8);
      tone(a, dest, t, 'triangle', 270, 2400, 3.2, 0.04 * v, 0.8);
      noise(a, dest, t, 'bandpass', 300, 1, 3.2, 0.25 * v, 1, 4000);
      break;
  }
}

/** A bed layer or a continuous emitter: an output gain we can fade, and its sources to stop. */
interface Loop {
  gain: GainNode;
  stop: () => void;
  /** Called every frame to keep a sound moving (the wind's gusts). */
  tick?: (dt: number) => void;
}

function loopNoise(a: Out, dest: AudioNode, filter: BiquadFilterType, freq: number, q: number): { src: AudioBufferSourceNode; filter: BiquadFilterNode } {
  const src = a.ctx.createBufferSource();
  src.buffer = noiseBuffer(a.ctx);
  src.loop = true;
  const f = a.ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  f.Q.value = q;
  src.connect(f).connect(dest);
  src.start(0, Math.random() * 1.5);
  return { src, filter: f };
}

/** The continuous sounds. */
function makeLoop(a: Out, dest: AudioNode, sound: 'room' | 'hum' | 'wind' | 'fizz' | 'leaves' | 'fire'): Loop {
  const gain = a.ctx.createGain();
  gain.gain.value = 0;
  gain.connect(dest);
  const stops: (() => void)[] = [];
  let tick: Loop['tick'];
  switch (sound) {
    case 'room': {
      const n = loopNoise(a, gain, 'lowpass', 160, 0.7);
      const g = a.ctx.createGain();
      g.gain.value = 0.5;
      n.filter.disconnect();
      n.filter.connect(g).connect(gain);
      stops.push(() => n.src.stop());
      break;
    }
    case 'hum': {
      // The tube: a low chord that breathes, and a faint bright shimmer over it.
      const mix = a.ctx.createGain();
      mix.gain.value = 0.18;
      mix.connect(gain);
      for (const [f, level] of [[55, 1], [110.4, 0.6], [164.8, 0.35], [220.9, 0.2]] as const) {
        const osc = a.ctx.createOscillator();
        osc.frequency.value = f;
        const g = a.ctx.createGain();
        g.gain.value = level;
        osc.connect(g).connect(mix);
        osc.start();
        stops.push(() => osc.stop());
      }
      const lfo = a.ctx.createOscillator();
      lfo.frequency.value = 0.15;
      const depth = a.ctx.createGain();
      depth.gain.value = 0.06;
      lfo.connect(depth).connect(mix.gain);
      lfo.start();
      stops.push(() => lfo.stop());
      const shimmer = a.ctx.createGain();
      shimmer.gain.value = 0.04;
      shimmer.connect(gain);
      const n = loopNoise(a, shimmer, 'bandpass', 2400, 6);
      stops.push(() => n.src.stop());
      break;
    }
    case 'wind': {
      const g = a.ctx.createGain();
      g.gain.value = 0.4;
      g.connect(gain);
      const n = loopNoise(a, g, 'lowpass', 500, 1);
      stops.push(() => n.src.stop());
      let target = 500;
      let level = 0.4;
      tick = (dt) => {
        // Gusts: drift towards a new pitch and strength now and then.
        if (Math.random() < dt * 0.4) {
          target = rand(250, 1100);
          level = rand(0.2, 0.6);
        }
        n.filter.frequency.setTargetAtTime(target, a.ctx.currentTime, 1.2);
        g.gain.setTargetAtTime(level, a.ctx.currentTime, 1.5);
      };
      break;
    }
    case 'fizz': {
      const g = a.ctx.createGain();
      g.gain.value = 0.05;
      g.connect(gain);
      const n = loopNoise(a, g, 'highpass', 6000, 0.7);
      const lfo = a.ctx.createOscillator();
      lfo.frequency.value = 3;
      const depth = a.ctx.createGain();
      depth.gain.value = 0.03;
      lfo.connect(depth).connect(g.gain);
      lfo.start();
      stops.push(() => n.src.stop(), () => lfo.stop());
      break;
    }
    case 'leaves': {
      const g = a.ctx.createGain();
      g.gain.value = 0.12;
      g.connect(gain);
      const n = loopNoise(a, g, 'bandpass', 2600, 0.6);
      stops.push(() => n.src.stop());
      tick = () => g.gain.setTargetAtTime(rand(0.04, 0.18), a.ctx.currentTime, 0.8);
      break;
    }
    case 'fire': {
      const n = loopNoise(a, gain, 'lowpass', 220, 0.8);
      stops.push(() => n.src.stop());
      break;
    }
  }
  return { gain, tick, stop: () => stops.forEach((s) => { try { s(); } catch { /* already stopped */ } }) };
}

const LOOPED: Partial<Record<AmbienceSound, 'room' | 'hum' | 'wind' | 'fizz' | 'leaves'>> = { room: 'room', hum: 'hum', wind: 'wind', fizz: 'fizz', leaves: 'leaves' };

/** How often (per second) each kind of moment happens in a bed, at full volume. */
const RATES: Partial<Record<AmbienceSound, number>> = { chatter: 5, crowd: 12, creaks: 0.15, drips: 0.6, bubbles: 1.5, clock: 1, workshop: 0.8, engine: 0.4, chime: 0.25, hearth: 6 };

interface Bed {
  layer: AmbienceLayer;
  loop: Loop | null;
  on: boolean;
  wait: number;
  ticks: number;
}

interface Emitter {
  sound: EmitterSound;
  at: () => { x: number; y: number } | null;
  /** Distance (px) at which it's at half volume. */
  range: number;
  volume: number;
  loop: Loop | null;
  panner: StereoPannerNode | null;
  wait: number;
  last: { x: number; y: number } | null;
}

const VOICE_LIST = CROWD_VOICES.map((v) => VOICES[v]);
const VOWELS: Syllable['vowel'][] = ['a', 'e', 'i', 'o', 'u'];
const murmur = (emphatic = false): Syllable => ({ vowel: VOWELS[Math.floor(Math.random() * 5)]!, step: Math.floor(rand(-2, 3)), rise: Math.random() < 0.1, emphatic });

export class Soundscape {
  private beds: Bed[] = [];
  private emitters: Emitter[] = [];
  private listener = { x: 0, y: 0 };
  private stopped = false;
  private bedOut: GainNode | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    layers: AmbienceLayer[],
    /** Whether a layer is on now (time of day, story). */
    private readonly isOn: (layer: AmbienceLayer) => boolean,
  ) {
    this.beds = layers.map((layer) => ({ layer, loop: null, on: false, wait: Math.random(), ticks: 0 }));
  }

  private out(): Out | null {
    return this.stopped ? null : audioOut(this.scene, 'sounds');
  }

  /** Adds a bed layer while the scene runs (the daylight's wind). */
  addLayer(layer: AmbienceLayer): void {
    this.beds.push({ layer, loop: null, on: false, wait: 0, ticks: 0 });
  }

  addEmitter(sound: EmitterSound, at: Emitter['at'], range = 80, volume = 1): void {
    this.emitters.push({ sound, at, range, volume, loop: null, panner: null, wait: Math.random(), last: null });
  }

  /** Volume and pan for something at (x, y), heard from the listener. */
  private place(x: number, y: number, range: number): { gain: number; pan: number } {
    const d = Math.hypot(x - this.listener.x, (y - this.listener.y) * 1.3);
    return { gain: 1 / (1 + (d / range) ** 2), pan: Math.max(-0.9, Math.min(0.9, (x - this.listener.x) / 240)) };
  }

  /** Plays a one-off sound, at a place (louder nearer, panned) or everywhere. */
  play(id: SoundId, at?: { x: number; y: number }, volume = 1, range = 120, surface?: Surface): void {
    const a = this.out();
    if (!a) return;
    let dest: AudioNode = a.out;
    let v = volume;
    if (at) {
      const { gain, pan } = this.place(at.x, at.y, range);
      if (gain < 0.02) return;
      v *= gain;
      const panner = a.ctx.createStereoPanner();
      panner.pan.value = pan;
      panner.connect(a.out);
      dest = panner;
    }
    oneShot(a, dest, a.ctx.currentTime, id, v, surface);
  }

  update(delta: number, listener: { x: number; y: number }): void {
    const a = this.out();
    if (!a) return;
    this.listener = listener;
    const dt = delta / 1000;
    this.bedOut ??= (() => {
      const g = a.ctx.createGain();
      g.connect(a.out);
      return g;
    })();
    for (const bed of this.beds) this.updateBed(a, bed, dt);
    for (const e of this.emitters) this.updateEmitter(a, e, dt);
  }

  private updateBed(a: Out, bed: Bed, dt: number): void {
    const volume = bed.layer.volume ?? 0.5;
    if ((bed.ticks -= dt) <= 0) {
      bed.on = this.isOn(bed.layer);
      bed.ticks = 0.5;
    }
    const looped = LOOPED[bed.layer.sound];
    if (looped) {
      bed.loop ??= makeLoop(a, this.bedOut!, looped);
      bed.loop.gain.gain.setTargetAtTime(bed.on ? volume : 0, a.ctx.currentTime, 0.8);
      bed.loop.tick?.(dt);
      return;
    }
    if (!bed.on) return;
    if ((bed.wait -= dt) > 0) return;
    const rate = RATES[bed.layer.sound] ?? 1;
    bed.wait = bed.layer.sound === 'clock' ? 1 : rand(0.3, 1.7) / rate;
    const t = a.ctx.currentTime;
    switch (bed.layer.sound) {
      case 'chatter':
      case 'crowd': {
        const voice = VOICE_LIST[Math.floor(Math.random() * VOICE_LIST.length)]!;
        playSyllable(this.scene, voice, murmur(), { bus: 'sounds', muffled: true, gain: volume * 0.5, pan: rand(-0.7, 0.7) });
        break;
      }
      case 'creaks':
        oneShot(a, this.bedOut!, t, 'creak', volume);
        break;
      case 'drips':
        oneShot(a, this.bedOut!, t, 'plink', volume * rand(0.3, 1));
        break;
      case 'bubbles':
        oneShot(a, this.bedOut!, t, 'bloop', volume * rand(0.4, 1));
        break;
      case 'clock':
        oneShot(a, this.bedOut!, t, 'tick', volume);
        break;
      case 'workshop':
        for (let i = 0; i < Math.floor(rand(1, 4)); i++) oneShot(a, this.bedOut!, t + i * rand(0.15, 0.3), 'tap', volume * rand(0.4, 1));
        break;
      case 'engine':
        for (let i = 0; i < Math.floor(rand(3, 7)); i++) oneShot(a, this.bedOut!, t + i * 0.045, 'tick', volume * 0.8);
        break;
      case 'chime':
        oneShot(a, this.bedOut!, t, 'chime', volume);
        break;
      case 'hearth':
        oneShot(a, this.bedOut!, t, 'crackle', volume);
        break;
    }
  }

  private updateEmitter(a: Out, e: Emitter, dt: number): void {
    const at = e.at();
    const moved = at && e.last ? Math.abs(at.x - e.last.x) + Math.abs(at.y - e.last.y) > 0.01 : false;
    e.last = at ? { ...at } : null;
    const placed = at ? this.place(at.x, at.y, e.range) : { gain: 0, pan: 0 };
    // The continuous ones: a loop whose volume and pan follow you.
    if (e.sound === 'tube' || e.sound === 'fire') {
      if (!e.loop) {
        e.panner = a.ctx.createStereoPanner();
        e.panner.connect(a.out);
        e.loop = makeLoop(a, e.panner, e.sound === 'tube' ? 'hum' : 'fire');
      }
      e.loop.gain.gain.setTargetAtTime(placed.gain * e.volume * (e.sound === 'fire' ? 0.5 : 1), a.ctx.currentTime, 0.2);
      e.panner!.pan.setTargetAtTime(placed.pan, a.ctx.currentTime, 0.2);
      if (e.sound === 'tube') return;
    }
    if (!at || placed.gain < 0.03) return;
    if ((e.wait -= dt) > 0) return;
    const play = (id: SoundId, v = 1, surface?: Surface) => {
      const panner = a.ctx.createStereoPanner();
      panner.pan.value = placed.pan;
      panner.connect(a.out);
      oneShot(a, panner, a.ctx.currentTime, id, v * placed.gain * e.volume, surface);
    };
    switch (e.sound) {
      case 'fire':
        e.wait = rand(0.05, 0.35);
        play('crackle');
        break;
      case 'creak':
        e.wait = rand(2.5, 5);
        play('creak', 0.7);
        break;
      case 'rope':
        e.wait = rand(0.6, 1.4);
        if (moved) play('creak', 0.5);
        break;
      case 'skitter':
        e.wait = 0.25;
        if (moved) play('skitter');
        break;
      case 'footsteps':
        e.wait = 0.42;
        if (moved) play('step', 0.8);
        break;
      case 'bubbles':
        e.wait = rand(0.2, 0.9);
        play('bloop');
        break;
      case 'mob':
        e.wait = rand(0.04, 0.12);
        playSyllable(this.scene, VOICE_LIST[Math.floor(Math.random() * VOICE_LIST.length)]!, murmur(Math.random() < 0.5), {
          bus: 'sounds', gain: placed.gain * e.volume * 0.9, pan: placed.pan + rand(-0.2, 0.2),
        });
        break;
    }
  }

  stop(): void {
    this.stopped = true;
    const a = audioOut(this.scene, 'sounds');
    const fadeOut = (loop: Loop | null) => {
      if (!loop) return;
      if (a) loop.gain.gain.setTargetAtTime(0, a.ctx.currentTime, 0.1);
      setTimeout(() => loop.stop(), 600);
    };
    this.beds.forEach((b) => fadeOut(b.loop));
    this.emitters.forEach((e) => fadeOut(e.loop));
  }
}
