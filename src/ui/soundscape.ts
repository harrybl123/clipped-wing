import type Phaser from 'phaser';
import type { AmbienceLayer, AmbienceSound, Surface } from '../data/areas/types';
import { CROWD_VOICES, type Syllable, VOICES } from '../systems/voices';
import { ACOUSTICS, type Acoustics, audioOut, noiseBuffer, setAcoustics } from './audioMix';
import { playRecording } from './recordings';
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
  'jump', 'land', 'knock', 'door', 'rush', 'boom', 'shimmer', 'shuffle', 'whoosh', 'rise', 'step', 'sting', 'resolve', 'heartbeat',
  // The story's sounds (docs/sound-effects-plan.md): crowds, things hitting and breaking, your hands.
  'murmur', 'gasp', 'roar', 'jeer', 'chant', 'whispers', 'scream', 'sob',
  'hit', 'spit', 'smash', 'staff', 'latch', 'bolt', 'pound', 'crash', 'hammer', 'splinter', 'grate', 'boots', 'punch',
  'chop', 'shave', 'skid', 'scratch', 'pop', 'rub', 'slip',
  // The dog (Chapter 2).
  'bark', 'growl', 'whimper',
] as const;
export type SoundId = (typeof SOUND_IDS)[number];

/**
 * Sounds that stay silent until a recording is dropped in (src/assets/audio/sfx/): the crowds
 * (designer: the synthesised ones didn't sound real; get recordings later). Their synthesised versions
 * are kept below in case they're wanted again.
 */
export const AWAITING_RECORDING: ReadonlySet<SoundId> = new Set(['murmur', 'gasp', 'roar', 'jeer', 'chant', 'whispers', 'scream', 'sob']);

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

/**
 * A creak: wood rubbing on wood. Noise chopped by a stick-slip judder, rung through two narrow,
 * gliding resonances (not a tone, which sounded synthetic).
 */
function creak(a: Out, dest: AudioNode, t: number, v: number): void {
  const len = rand(0.35, 1);
  const src = a.ctx.createBufferSource();
  src.buffer = noiseBuffer(a.ctx);
  const judder = a.ctx.createGain();
  judder.gain.value = 0;
  const slip = a.ctx.createOscillator();
  slip.type = 'sawtooth';
  slip.frequency.setValueAtTime(rand(18, 35), t);
  slip.frequency.linearRampToValueAtTime(rand(18, 45), t + len);
  slip.connect(judder.gain);
  const env = a.ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.5 * v, t + len * 0.4);
  env.gain.linearRampToValueAtTime(0, t + len);
  const base = rand(260, 520);
  src.connect(judder);
  for (const [mult, q, level] of [[1, 12, 1], [2.3, 9, 0.4]] as const) {
    const band = a.ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = q;
    band.frequency.setValueAtTime(base * mult, t);
    band.frequency.linearRampToValueAtTime(base * mult * rand(0.8, 1.25), t + len);
    const g = a.ctx.createGain();
    g.gain.value = level;
    judder.connect(band).connect(g).connect(env);
  }
  env.connect(dest);
  src.start(t, Math.random());
  slip.start(t);
  src.stop(t + len + 0.05);
  slip.stop(t + len + 0.05);
}

/**
 * Footsteps, by what you're walking on: a soft heel and a toe a moment later, every one a little
 * different in weight, pitch and timing (designer: too regular). Low and woody, not clicky.
 */
function step(a: Out, dest: AudioNode, t: number, surface: Surface, v: number): void {
  v *= rand(0.7, 1.1);
  const toe = t + rand(0.03, 0.06);
  const p = rand(0.85, 1.15);
  switch (surface) {
    case 'plank':
      noise(a, dest, t, 'lowpass', 900 * p, 1, 0.05, 0.3 * v, 0.004);
      noise(a, dest, t, 'bandpass', 220 * p, 3, 0.07, 0.25 * v, 0.004); // the board's hollow
      noise(a, dest, toe, 'lowpass', 1200 * p, 1, 0.03, 0.1 * v);
      if (Math.random() < 0.15) creak(a, dest, t, v * 0.25);
      break;
    case 'metal':
      noise(a, dest, t, 'bandpass', 1800 * p, 5, 0.09, 0.15 * v);
      noise(a, dest, toe, 'bandpass', 2200 * p, 6, 0.06, 0.06 * v);
      break;
    case 'fungus':
      noise(a, dest, t, 'lowpass', 380 * p, 0.7, 0.09, 0.3 * v, 0.012);
      noise(a, dest, toe, 'lowpass', 600 * p, 0.7, 0.05, 0.08 * v, 0.01);
      break;
    case 'dirt':
      // Grit underfoot: a soft thud with a dry crunch on top.
      noise(a, dest, t, 'lowpass', 420 * p, 0.8, 0.06, 0.28 * v, 0.004);
      noise(a, dest, t, 'bandpass', 2600 * p, 1.5, 0.05, 0.07 * v, 0.006);
      noise(a, dest, toe, 'bandpass', 3200 * p, 1.5, 0.04, 0.05 * v, 0.005);
      break;
    case 'wet':
      noise(a, dest, t, 'lowpass', 500 * p, 1, 0.08, 0.3 * v, 0.01);
      noise(a, dest, toe, 'bandpass', 900 * p, 2, 0.07, 0.12 * v, 0.015, 600); // the squelch
      break;
    default:
      noise(a, dest, t, 'lowpass', 650 * p, 0.8, 0.06, 0.32 * v, 0.004);
      noise(a, dest, t, 'bandpass', 140 * p, 2, 0.06, 0.25 * v, 0.004); // weight on the floor
      noise(a, dest, toe, 'lowpass', 1000 * p, 0.8, 0.03, 0.09 * v);
  }
}

/**
 * One voice in a crowd: a tone shaped into a vowel (`vowel`, the formant's Hz), with breath under it,
 * swelling and fading over `len` seconds, its pitch sliding by `glide` semitones.
 */
function voiceBlob(a: Out, dest: AudioNode, t: number, pitch: number, len: number, v: number, vowel: number, glide = 0, breath = 0.3): void {
  const { ctx } = a;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(v, t + Math.min(0.04, len * 0.3));
  env.gain.linearRampToValueAtTime(v * 0.7, t + len * 0.7);
  env.gain.linearRampToValueAtTime(0, t + len);
  const formant = ctx.createBiquadFilter();
  formant.type = 'bandpass';
  formant.frequency.value = vowel;
  formant.Q.value = 1.6;
  const warm = ctx.createBiquadFilter();
  warm.type = 'lowpass';
  warm.frequency.value = 1500;
  env.connect(formant).connect(warm).connect(dest);
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(pitch, t);
  osc.frequency.linearRampToValueAtTime(pitch * 2 ** (glide / 12), t + len);
  osc.connect(env);
  osc.start(t);
  osc.stop(t + len + 0.05);
  if (breath > 0) noise(a, dest, t, 'bandpass', vowel * 1.4, 1.2, len * 0.8, v * breath, Math.min(0.04, len * 0.3));
}

/** Many voices at once: `count` blobs scattered over `spread` seconds. */
function crowdOf(t: number, count: number, spread: number, make: (at: number) => void): void {
  for (let i = 0; i < count; i++) make(t + Math.random() * spread);
}

/** Plays a one-off sound into `dest` at time `t`. `v` scales the loudness. Built from noise where it can be: earthy, not synthy (designer). */
function oneShot(a: Out, dest: AudioNode, t: number, id: SoundId, v: number, surface: Surface = 'wood'): void {
  // A recording, if one's been dropped in, plays instead; the crowds are silent without one.
  if (playRecording(a.ctx, dest, t, id, v) || AWAITING_RECORDING.has(id)) return;
  switch (id) {
    case 'plink': {
      // A water drop: a tiny bubble that rises, low and soft (it was a high falling "pew").
      const p = rand(0.8, 1.25);
      tone(a, dest, t, 'sine', 380 * p, 720 * p, 0.035, 0.12 * v, 0.003);
      noise(a, dest, t, 'bandpass', 900 * p, 2, 0.03, 0.06 * v);
      break;
    }
    case 'splash':
      // A drop of rot landing: a low, thick plop (no hiss; in bursts it sounded like a shaker).
      tone(a, dest, t, 'sine', rand(140, 180), rand(80, 100), 0.07, 0.12 * v, 0.004);
      noise(a, dest, t, 'lowpass', 350, 1, 0.05, 0.08 * v);
      break;
    case 'crackle':
      noise(a, dest, t, 'bandpass', rand(1200, 3000), 1.5, rand(0.006, 0.025), rand(0.06, 0.25) * v);
      if (Math.random() < 0.3) noise(a, dest, t, 'lowpass', 250, 1, 0.08, 0.15 * v);
      break;
    case 'creak':
      creak(a, dest, t, v);
      break;
    case 'thump':
      tone(a, dest, t, 'sine', 90, 45, 0.2, 0.35 * v);
      noise(a, dest, t, 'lowpass', 300, 0.7, 0.18, 0.35 * v);
      break;
    case 'crack':
      noise(a, dest, t, 'bandpass', 1400, 1, 0.04, 0.4 * v);
      noise(a, dest, t, 'lowpass', 400, 1, 0.08, 0.3 * v);
      for (let i = 1; i <= 4; i++) noise(a, dest, t + 0.08 * i + rand(0, 0.05), 'bandpass', rand(400, 1000), 2, 0.035, 0.12 * v);
      break;
    case 'rumble':
      noise(a, dest, t, 'lowpass', 120, 1, 1.6, 0.7 * v, 0.3);
      for (let i = 0; i < 7; i++) noise(a, dest, t + rand(0.1, 1.4), 'lowpass', rand(300, 700), 1, 0.06, 0.18 * v);
      break;
    case 'skitter':
      // Legs on wood: a few low, dry scratches (it rattled like maracas).
      for (let i = 0; i < 3; i++) noise(a, dest, t + i * rand(0.05, 0.09), 'lowpass', rand(500, 900), 1, 0.04, 0.12 * v, 0.01);
      break;
    case 'bloop':
      tone(a, dest, t, 'sine', rand(90, 130), rand(170, 240), 0.09, 0.12 * v, 0.012);
      noise(a, dest, t, 'lowpass', 300, 1, 0.06, 0.06 * v);
      break;
    case 'tick':
      // A wooden tock, not an electronic click.
      noise(a, dest, t, 'bandpass', rand(1100, 1500), 5, 0.025, 0.2 * v);
      break;
    case 'tap':
      noise(a, dest, t, 'bandpass', rand(700, 1100), 4, 0.03, 0.28 * v);
      noise(a, dest, t, 'lowpass', 250, 1, 0.04, 0.12 * v);
      break;
    case 'chime': {
      // The seeds: a soft, low, hollow knock that rings a little, like a gourd.
      const note = [392, 440, 523, 587, 659][Math.floor(Math.random() * 5)]!;
      noise(a, dest, t, 'bandpass', note, 25, 0.9, 0.5 * v, 0.004);
      noise(a, dest, t, 'bandpass', note * 2.7, 20, 0.4, 0.12 * v, 0.004);
      break;
    }
    case 'step':
      step(a, dest, t, surface, v);
      break;
    case 'jump':
      noise(a, dest, t, 'lowpass', 700, 0.7, 0.09, 0.12 * v, 0.02); // a breath of cloth
      break;
    case 'land':
      step(a, dest, t, surface, v * 1.3);
      noise(a, dest, t, 'lowpass', 220, 1, 0.1, 0.25 * v);
      break;
    case 'knock':
      for (let i = 0; i < 3; i++) {
        const k = t + i * rand(0.17, 0.22);
        tone(a, dest, k, 'sine', 120, 70, 0.08, 0.35 * v);
        noise(a, dest, k, 'bandpass', 380, 2.5, 0.07, 0.45 * v);
      }
      break;
    case 'door':
      creak(a, dest, t, v * 1.2);
      tone(a, dest, t + 0.6, 'sine', 100, 50, 0.2, 0.3 * v);
      noise(a, dest, t + 0.6, 'lowpass', 300, 1, 0.15, 0.3 * v);
      break;
    case 'rush': // the offerings going up the tube, the blessings coming down: a rush of air
      noise(a, dest, t, 'bandpass', 250, 1.2, 1.5, 0.4 * v, 0.5, 2200);
      noise(a, dest, t, 'lowpass', 180, 1, 1.4, 0.25 * v, 0.5);
      break;
    case 'boom':
      tone(a, dest, t, 'sine', 60, 28, 1.3, 0.5 * v);
      noise(a, dest, t, 'lowpass', 160, 1, 1, 0.35 * v);
      break;
    case 'shimmer':
      // Light: a soft swell of air, not bells.
      noise(a, dest, t, 'bandpass', 1300, 1.5, 1.6, 0.15 * v, 0.5, 2000);
      break;
    case 'shuffle':
      for (let i = 0; i < 14; i++) noise(a, dest, t + rand(0, 0.9), 'lowpass', rand(500, 1000), 0.8, rand(0.05, 0.12), rand(0.06, 0.15) * v, 0.01);
      break;
    case 'whoosh':
      noise(a, dest, t, 'bandpass', 350, 1.5, 0.25, 0.3 * v, 0.05, 1200);
      break;
    case 'sting':
      // A big choice (the room dims; designer: severe). A hard hit you hear even on small speakers: a body
      // blow of low noise, a falling drum, a crack of wood; then the drone (held by Soundscape) swells in.
      noise(a, dest, t, 'lowpass', 1200, 0.8, 0.6, 1.2 * v, 0.002);
      noise(a, dest, t, 'bandpass', 160, 2.5, 0.9, 1.2 * v, 0.002);
      tone(a, dest, t, 'sine', 130, 40, 1.6, 1.1 * v, 0.003);
      tone(a, dest, t, 'triangle', 260, 90, 0.5, 0.35 * v, 0.002);
      noise(a, dest, t, 'bandpass', 900, 3, 0.12, 0.5 * v, 0.001);
      noise(a, dest, t + 0.05, 'lowpass', 300, 1, 2.5, 0.35 * v, 0.1);
      break;
    case 'resolve':
      // The choice made (the room comes back): one heavy thud, and a breath out.
      noise(a, dest, t, 'lowpass', 700, 0.8, 0.4, 0.9 * v, 0.002);
      tone(a, dest, t, 'sine', 110, 40, 0.8, 0.9 * v, 0.003);
      noise(a, dest, t + 0.15, 'lowpass', 500, 0.7, 1, 0.1 * v, 0.3);
      break;
    case 'heartbeat':
      // Lub-dub, with enough of a knock in it to hear on small speakers.
      tone(a, dest, t, 'sine', 95, 48, 0.16, 0.9 * v, 0.004);
      noise(a, dest, t, 'lowpass', 450, 1, 0.07, 0.6 * v, 0.002);
      tone(a, dest, t + 0.27, 'sine', 85, 45, 0.13, 0.6 * v, 0.004);
      noise(a, dest, t + 0.27, 'lowpass', 400, 1, 0.06, 0.4 * v, 0.002);
      break;
    // --- Crowds ---
    case 'murmur':
      // A low babble, rising and settling.
      noise(a, dest, t, 'lowpass', 600, 0.7, 1.6, 0.08 * v, 0.5);
      crowdOf(t, 26, 2, (at) => voiceBlob(a, dest, at, rand(100, 250), rand(0.12, 0.26), rand(0.03, 0.06) * v, rand(400, 800), rand(-2, 2)));
      break;
    case 'gasp':
      // Everyone drawing breath at once.
      noise(a, dest, t, 'bandpass', 1000, 1.2, 0.35, 0.45 * v, 0.12, 2000);
      crowdOf(t, 10, 0.12, (at) => voiceBlob(a, dest, at, rand(180, 340), rand(0.12, 0.2), 0.045 * v, rand(700, 1000), 4, 0.8));
      break;
    case 'roar':
      // A swell of shouting, held, then falling away.
      noise(a, dest, t, 'bandpass', 500, 0.7, 2.2, 0.55 * v, 0.6);
      noise(a, dest, t, 'lowpass', 250, 1, 2.2, 0.35 * v, 0.6);
      crowdOf(t, 40, 2, (at) => voiceBlob(a, dest, at, rand(110, 300), rand(0.25, 0.6), rand(0.05, 0.1) * v, rand(600, 900), rand(-3, 3), 0.5));
      break;
    case 'jeer':
      // Ugly laughter: several people, each a run of "ha"s falling in pitch.
      for (let p = 0; p < 6; p++) {
        const start = t + rand(0, 0.4);
        const pitch = rand(120, 260);
        const n = Math.floor(rand(4, 7));
        for (let i = 0; i < n; i++) voiceBlob(a, dest, start + i * rand(0.13, 0.17), pitch * (1 - i * 0.03), 0.09, 0.07 * v, 700, -1, 0.6);
      }
      break;
    case 'chant':
      // A two-beat word shouted together, three times: Cur-sed. Cur-sed. Cur-sed.
      for (let r = 0; r < 3; r++) {
        for (const [beat, vowel] of [[0, 550], [0.28, 750]] as const) {
          const at = t + r * 0.75 + beat;
          noise(a, dest, at, 'bandpass', 600, 1, 0.18, 0.18 * v, 0.02);
          crowdOf(at, 12, 0.04, (when) => voiceBlob(a, dest, when, rand(110, 220), 0.2, 0.06 * v, vowel, -1, 0.4));
        }
      }
      break;
    case 'whispers':
      // Hissing, half-heard words all round (kept low: no whine).
      for (let i = 0; i < 18; i++) noise(a, dest, t + rand(0, 2), 'bandpass', rand(1400, 2000), 1.5, rand(0.12, 0.25), rand(0.04, 0.08) * v, 0.03);
      break;
    case 'scream': {
      // One voice, a short cry: up, then breaking down.
      const { ctx } = a;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.16 * v, t + 0.06);
      env.gain.linearRampToValueAtTime(0.1 * v, t + 0.6);
      env.gain.linearRampToValueAtTime(0, t + 0.9);
      const formant = ctx.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.value = 1000;
      formant.Q.value = 1.2;
      env.connect(formant).connect(dest);
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(460, t);
      osc.frequency.linearRampToValueAtTime(680, t + 0.25);
      osc.frequency.linearRampToValueAtTime(500, t + 0.9);
      osc.connect(env);
      osc.start(t);
      osc.stop(t + 0.95);
      noise(a, dest, t, 'bandpass', 1300, 1, 0.8, 0.06 * v, 0.05);
      break;
    }
    case 'sob': {
      // A child crying, catching breath.
      let at = t;
      for (let i = 0; i < 4; i++) {
        voiceBlob(a, dest, at, rand(280, 330), 0.14, 0.06 * v, 650, -3, 1);
        noise(a, dest, at + 0.18, 'bandpass', 1100, 1, 0.12, 0.05 * v, 0.05, 1600); // the breath in
        at += rand(0.3, 0.45);
      }
      break;
    }
    // --- Things hitting, breaking, opening ---
    case 'hit':
      noise(a, dest, t, 'lowpass', 500, 1, 0.12, 0.5 * v, 0.002);
      tone(a, dest, t, 'sine', 140, 70, 0.1, 0.3 * v);
      noise(a, dest, t, 'bandpass', 1200, 2, 0.02, 0.15 * v);
      break;
    case 'spit':
      noise(a, dest, t, 'bandpass', 2000, 1.2, 0.06, 0.22 * v, 0.004);
      noise(a, dest, t + 0.03, 'bandpass', 900, 1.5, 0.04, 0.1 * v);
      break;
    case 'smash':
      // Clay jars breaking, the pieces skittering, one rolling away.
      noise(a, dest, t, 'bandpass', 1500, 0.8, 0.25, 0.4 * v, 0.002);
      noise(a, dest, t, 'lowpass', 400, 1, 0.2, 0.4 * v, 0.002);
      for (let i = 0; i < 8; i++) noise(a, dest, t + rand(0.02, 0.5), 'bandpass', rand(1500, 3000), 8, 0.05, 0.1 * v);
      for (let i = 0; i < 3; i++) noise(a, dest, t + 0.6 + i * rand(0.15, 0.25), 'bandpass', rand(700, 1000), 4, 0.03, 0.12 * v);
      break;
    case 'staff':
      // A staff cracked down on wood, ringing round the floor.
      noise(a, dest, t, 'bandpass', 1300, 2, 0.06, 0.6 * v, 0.001);
      tone(a, dest, t, 'sine', 180, 120, 0.45, 0.25 * v);
      noise(a, dest, t, 'lowpass', 300, 1, 0.15, 0.4 * v);
      break;
    case 'latch':
      noise(a, dest, t, 'bandpass', 2000, 6, 0.02, 0.25 * v);
      noise(a, dest, t + 0.07, 'bandpass', 1400, 6, 0.03, 0.3 * v);
      break;
    case 'bolt':
      // A bolt sliding, then home with a clunk.
      noise(a, dest, t, 'bandpass', 900, 3, 0.25, 0.2 * v, 0.05, 600);
      tone(a, dest, t + 0.3, 'sine', 110, 60, 0.12, 0.4 * v);
      noise(a, dest, t + 0.3, 'bandpass', 500, 2, 0.08, 0.35 * v);
      break;
    case 'pound': {
      // Fists on a door, many and heavy.
      let at = t;
      for (let i = 0; i < 6; i++) {
        tone(a, dest, at, 'sine', 80, 40, 0.15, 0.6 * v);
        noise(a, dest, at, 'lowpass', 400, 1, 0.12, 0.5 * v);
        noise(a, dest, at, 'bandpass', 250, 2, 0.1, 0.3 * v);
        at += rand(0.18, 0.32);
      }
      break;
    }
    case 'crash':
      // A door broken in: a boom, splintering, and pieces falling.
      tone(a, dest, t, 'sine', 70, 30, 0.9, 0.7 * v);
      noise(a, dest, t, 'lowpass', 300, 1, 0.8, 0.6 * v, 0.002);
      noise(a, dest, t, 'bandpass', 1400, 1, 0.05, 0.5 * v);
      for (let i = 0; i < 10; i++) noise(a, dest, t + rand(0, 0.6), 'bandpass', rand(600, 1600), 3, rand(0.03, 0.06), 0.15 * v);
      for (let i = 0; i < 6; i++) noise(a, dest, t + rand(0.3, 1.2), 'lowpass', 700, 1, 0.05, 0.12 * v);
      break;
    case 'hammer':
      // Boards nailed down, one blow after another.
      for (let i = 0; i < 7; i++) {
        const at = t + i * rand(0.4, 0.55);
        noise(a, dest, at, 'bandpass', 900, 3, 0.04, 0.4 * v);
        tone(a, dest, at, 'sine', 160, 90, 0.07, 0.3 * v);
      }
      break;
    case 'splinter':
      // Boards torn up: a groan, a rip, cracks.
      creak(a, dest, t, v);
      noise(a, dest, t + 0.3, 'bandpass', 400, 1.5, 0.3, 0.3 * v, 0.02, 1500);
      for (let i = 0; i < 5; i++) noise(a, dest, t + 0.3 + rand(0, 0.5), 'bandpass', rand(500, 1300), 2, 0.04, 0.2 * v);
      break;
    case 'grate':
      // A heavy grate scraping up, then set down.
      noise(a, dest, t, 'bandpass', 600, 4, 0.6, 0.3 * v, 0.1, 800);
      creak(a, dest, t, v * 0.6);
      tone(a, dest, t + 0.75, 'sine', 120, 60, 0.15, 0.35 * v);
      noise(a, dest, t + 0.75, 'bandpass', 450, 2, 0.1, 0.3 * v);
      break;
    case 'boots':
      // Two or three people's heavy steps, out of step with each other.
      for (let p = 0; p < 3; p++) {
        const off = rand(0, 0.15);
        for (let i = 0; i < 5; i++) {
          const at = t + off + i * rand(0.26, 0.32);
          noise(a, dest, at, 'lowpass', 500, 1, 0.08, 0.3 * v, 0.003);
          noise(a, dest, at, 'bandpass', 120, 2, 0.07, 0.3 * v, 0.003);
        }
      }
      break;
    case 'punch':
      tone(a, dest, t, 'sine', 110, 50, 0.12, 0.6 * v);
      noise(a, dest, t, 'lowpass', 600, 1, 0.08, 0.5 * v, 0.002);
      noise(a, dest, t, 'bandpass', 1500, 2, 0.02, 0.1 * v); // cloth
      break;
    // --- Your hands ---
    case 'chop':
      noise(a, dest, t, 'bandpass', rand(1100, 1500), 3, 0.03, 0.35 * v, 0.001);
      noise(a, dest, t, 'lowpass', 400, 1, 0.06, 0.25 * v);
      tone(a, dest, t, 'sine', 200, 120, 0.05, 0.1 * v);
      break;
    case 'shave':
      noise(a, dest, t, 'bandpass', 1400, 2, 0.22, 0.12 * v, 0.04, 900);
      break;
    case 'skid':
      noise(a, dest, t, 'bandpass', 1200, 2, 0.12, 0.2 * v, 0.01, 1700);
      noise(a, dest, t, 'bandpass', 800, 4, 0.03, 0.15 * v);
      break;
    case 'scratch':
      for (let i = 0; i < 3; i++) noise(a, dest, t + i * 0.05, 'bandpass', rand(1400, 1700), 4, 0.05, 0.08 * v, 0.01);
      break;
    case 'bark':
      // Two rough barks: a throaty tone that drops, through a burst of breath.
      for (const k of [0, rand(0.2, 0.26)]) {
        const p = rand(380, 460);
        tone(a, dest, t + k, 'triangle', p, p * 0.6, 0.11, 0.3 * v, 0.008);
        noise(a, dest, t + k, 'bandpass', p * 2.2, 1.5, 0.1, 0.35 * v, 0.006, p * 1.4);
      }
      break;
    case 'growl':
      // A low rumble that rises and falls, rough with breath.
      for (let i = 0; i < 10; i++) {
        const k = t + i * 0.07;
        tone(a, dest, k, 'triangle', rand(85, 105), rand(80, 100), 0.09, (0.12 + Math.sin((i / 9) * Math.PI) * 0.16) * v, 0.01);
        noise(a, dest, k, 'bandpass', rand(260, 340), 3, 0.08, 0.12 * v, 0.01);
      }
      break;
    case 'whimper':
      // A thin, high whine through the nose, rising and falling twice.
      tone(a, dest, t, 'sine', 780, 1040, 0.28, 0.14 * v, 0.06);
      tone(a, dest, t + 0.3, 'sine', 960, 700, 0.36, 0.11 * v, 0.05);
      break;
    case 'pop':
      tone(a, dest, t, 'sine', 300, 150, 0.05, 0.25 * v);
      noise(a, dest, t, 'bandpass', 900, 2, 0.03, 0.2 * v);
      break;
    case 'rub':
      noise(a, dest, t, 'bandpass', 700, 1, 0.12, 0.1 * v, 0.04);
      break;
    case 'slip':
      // The knife slipping into flesh: a snick, and a sharp breath in.
      noise(a, dest, t, 'bandpass', 1800, 3, 0.05, 0.3 * v, 0.001);
      noise(a, dest, t + 0.12, 'bandpass', 1000, 1.2, 0.25, 0.25 * v, 0.08, 2000);
      break;
    case 'rise':
      noise(a, dest, t, 'bandpass', 200, 1.5, 3.2, 0.35 * v, 1, 2500);
      noise(a, dest, t, 'lowpass', 150, 1, 3.2, 0.3 * v, 1.2);
      tone(a, dest, t, 'sine', 110, 220, 3.2, 0.05 * v, 1.2);
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
function makeLoop(a: Out, dest: AudioNode, sound: 'room' | 'hum' | 'buzz' | 'wind' | 'leaves' | 'fire' | 'drone', hush = 160): Loop {
  const gain = a.ctx.createGain();
  gain.gain.value = 0;
  gain.connect(dest);
  const stops: (() => void)[] = [];
  let tick: Loop['tick'];
  switch (sound) {
    case 'room': {
      const n = loopNoise(a, gain, 'lowpass', hush, 0.7);
      const g = a.ctx.createGain();
      g.gain.value = 0.5;
      n.filter.disconnect();
      n.filter.connect(g).connect(gain);
      stops.push(() => n.src.stop());
      break;
    }
    case 'hum': {
      // The tube: a deep, breathing resonance, air through a vast pipe (no pure tones, no thin whine on top).
      const mix = a.ctx.createGain();
      mix.gain.value = 1;
      mix.connect(gain);
      for (const [f, q, level] of [[55, 18, 1.4], [110, 14, 0.7], [165, 10, 0.25]] as const) {
        const n = loopNoise(a, mix, 'bandpass', f, q);
        n.filter.disconnect();
        const g = a.ctx.createGain();
        g.gain.value = level;
        n.filter.connect(g).connect(mix);
        stops.push(() => n.src.stop());
      }
      const body = a.ctx.createOscillator();
      body.frequency.value = 55;
      const bodyLevel = a.ctx.createGain();
      bodyLevel.gain.value = 0.03;
      body.connect(bodyLevel).connect(mix);
      body.start();
      const lfo = a.ctx.createOscillator();
      lfo.frequency.value = 0.12;
      const depth = a.ctx.createGain();
      depth.gain.value = 0.25;
      lfo.connect(depth).connect(mix.gain);
      lfo.start();
      stops.push(() => body.stop(), () => lfo.stop());
      break;
    }
    case 'buzz': {
      // The tube up close, at the gate: a loud, thick, living buzz, rich in the low end, wavering.
      const mix = a.ctx.createGain();
      mix.gain.value = 1;
      mix.connect(gain);
      const tone = a.ctx.createOscillator();
      tone.type = 'sawtooth';
      tone.frequency.value = 55;
      const drift = a.ctx.createOscillator();
      drift.frequency.value = 0.3;
      const driftDepth = a.ctx.createGain();
      driftDepth.gain.value = 0.6;
      drift.connect(driftDepth).connect(tone.frequency);
      const soften = a.ctx.createBiquadFilter();
      soften.type = 'lowpass';
      soften.frequency.value = 420;
      soften.Q.value = 2;
      const toneLevel = a.ctx.createGain();
      toneLevel.gain.value = 0.18;
      tone.connect(soften).connect(toneLevel).connect(mix);
      for (const [f, q, level] of [[55, 16, 1.6], [110, 12, 1], [220, 8, 0.4]] as const) {
        const n = loopNoise(a, mix, 'bandpass', f, q);
        n.filter.disconnect();
        const g = a.ctx.createGain();
        g.gain.value = level;
        n.filter.connect(g).connect(mix);
        stops.push(() => n.src.stop());
      }
      const flutter = a.ctx.createOscillator();
      flutter.frequency.value = 0.4;
      const flutterDepth = a.ctx.createGain();
      flutterDepth.gain.value = 0.2;
      flutter.connect(flutterDepth).connect(mix.gain);
      tone.start();
      drift.start();
      flutter.start();
      stops.push(() => tone.stop(), () => drift.stop(), () => flutter.stop());
      break;
    }
    case 'drone': {
      // Under a big choice: a dark, dissonant low chord (two tones a little apart, beating against each
      // other) and a breath of low noise, slowly wavering. Pitched where small speakers can carry it.
      const mix = a.ctx.createGain();
      mix.gain.value = 1;
      const dark = a.ctx.createBiquadFilter();
      dark.type = 'lowpass';
      dark.frequency.value = 700;
      mix.connect(dark).connect(gain);
      for (const [f, type, level] of [[110, 'triangle', 0.35], [116.5, 'triangle', 0.3], [55, 'sine', 0.5], [164.8, 'sine', 0.12]] as const) {
        const osc = a.ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = f;
        const g = a.ctx.createGain();
        g.gain.value = level;
        osc.connect(g).connect(mix);
        osc.start();
        stops.push(() => osc.stop());
      }
      const breath = a.ctx.createGain();
      breath.gain.value = 0.25;
      breath.connect(mix);
      const n = loopNoise(a, breath, 'bandpass', 220, 1.2);
      const lfo = a.ctx.createOscillator();
      lfo.frequency.value = 0.18;
      const depth = a.ctx.createGain();
      depth.gain.value = 0.25;
      lfo.connect(depth).connect(mix.gain);
      lfo.start();
      stops.push(() => n.src.stop(), () => lfo.stop());
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
    case 'leaves': {
      const g = a.ctx.createGain();
      g.gain.value = 0.12;
      g.connect(gain);
      const n = loopNoise(a, g, 'bandpass', 1700, 0.6);
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

const LOOPED: Partial<Record<AmbienceSound, 'room' | 'hum' | 'buzz' | 'wind' | 'leaves'>> = { room: 'room', hum: 'hum', buzz: 'buzz', wind: 'wind', leaves: 'leaves' };

/** How often (per second) each kind of moment happens in a bed, at full volume. */
const RATES: Partial<Record<AmbienceSound, number>> = { fizz: 1.2, footfall: 3, pages: 0.3, chatter: 5, crowd: 12, creaks: 0.15, drips: 0.6, bubbles: 1.5, clock: 1, workshop: 0.8, engine: 0.4, chime: 0.25, hearth: 6 };

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
  /** Everything the place makes (the bed, its things, footsteps): faded right down for a big choice. */
  private world: GainNode | null = null;
  private bedOut: GainNode | null = null;
  /** The drone held under a big choice. */
  private drone: Loop | null = null;
  /** A big choice: seconds since it began (your heartbeat), or null. */
  private tension: number | null = null;
  private nextBeat = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    layers: AmbienceLayer[],
    /** Whether a layer is on now (time of day, story). */
    private readonly isOn: (layer: AmbienceLayer) => boolean,
    private readonly acoustics: Acoustics = 'small',
    /** The floor, for other people's footsteps. */
    private readonly surface: Surface = 'wood',
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
    const tense = id === 'sting' || id === 'resolve' || id === 'heartbeat';
    let dest: AudioNode = tense ? a.out : this.worldOut(a);
    let v = volume;
    if (at) {
      const { gain, pan } = this.place(at.x, at.y, range);
      if (gain < 0.02) return;
      v *= gain;
      const panner = a.ctx.createStereoPanner();
      panner.pan.value = pan;
      panner.connect(dest);
      dest = panner;
    }
    oneShot(a, dest, a.ctx.currentTime, id, v, surface);
  }

  /**
   * A big choice (the room dims): a sting, then your heartbeat, slowly quickening, with the area pulled
   * back so you hear it. Off again (the room comes back): one thud, and the area returns.
   */
  setTension(on: boolean): void {
    if (on === (this.tension !== null)) return;
    const a = this.out();
    this.tension = on ? 0 : null;
    this.nextBeat = 1.6;
    this.play(on ? 'sting' : 'resolve');
    if (!a) return;
    // The place falls almost silent (designer), and comes back slowly afterwards.
    this.worldOut(a).gain.setTargetAtTime(on ? 0.03 : 1, a.ctx.currentTime, on ? 0.25 : 1.2);
    if (on) {
      this.drone?.stop();
      this.drone = makeLoop(a, a.out, 'drone');
      this.drone.gain.gain.setTargetAtTime(0.5, a.ctx.currentTime + 0.3, 1.2);
    } else if (this.drone) {
      const d = this.drone;
      this.drone = null;
      d.gain.gain.setTargetAtTime(0, a.ctx.currentTime, 0.4);
      setTimeout(() => d.stop(), 2500);
    }
  }

  /** The place's own output (made on first use). */
  private worldOut(a: Out): GainNode {
    if (!this.world) {
      this.world = a.ctx.createGain();
      this.world.connect(a.out);
    }
    return this.world;
  }

  update(delta: number, listener: { x: number; y: number }): void {
    const a = this.out();
    if (!a) return;
    this.listener = listener;
    const dt = delta / 1000;
    this.bedOut ??= (() => {
      setAcoustics(this.scene, this.acoustics);
      const g = a.ctx.createGain();
      g.connect(this.worldOut(a));
      return g;
    })();
    if (this.tension !== null) {
      this.tension += dt;
      if ((this.nextBeat -= dt) <= 0) {
        this.play('heartbeat', undefined, Math.min(1, 0.6 + this.tension * 0.02));
        this.nextBeat = Math.max(0.68, 1 - this.tension * 0.012);
      }
    }
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
      bed.loop ??= makeLoop(a, this.bedOut!, looped, ACOUSTICS[this.acoustics].hush);
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
        playSyllable(this.scene, voice, murmur(), { bus: 'sounds', muffled: true, gain: volume * 0.5, pan: rand(-0.7, 0.7), dest: this.bedOut! });
        break;
      }
      case 'footfall': {
        // Someone walking past: a few steps, somewhere to the left or right, near or far.
        const panner = a.ctx.createStereoPanner();
        panner.pan.value = rand(-0.8, 0.8);
        panner.connect(this.bedOut!);
        const count = Math.floor(rand(2, 6));
        const pace = rand(0.3, 0.45);
        const v = volume * rand(0.3, 0.9);
        for (let i = 0; i < count; i++) oneShot(a, panner, t + i * pace * rand(0.9, 1.1), 'step', v, this.surface);
        break;
      }
      case 'fizz':
        // The fungi: now and then a tiny, soft pop (it was a hiss that fluttered like a shaker).
        noise(a, this.bedOut!, t, 'lowpass', rand(700, 1200), 1, rand(0.01, 0.02), 0.06 * volume * rand(0.5, 1), 0.004);
        break;
      case 'pages':
        noise(a, this.bedOut!, t, 'bandpass', rand(2000, 3200), 0.8, rand(0.15, 0.3), 0.08 * volume, 0.05, rand(1500, 2500));
        break;
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
        e.panner.connect(this.worldOut(a));
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
      panner.connect(this.worldOut(a));
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
        e.wait = rand(0.25, 0.45);
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
          bus: 'sounds', gain: placed.gain * e.volume * 0.9, pan: placed.pan + rand(-0.2, 0.2), dest: this.worldOut(a),
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
    fadeOut(this.drone);
    this.emitters.forEach((e) => fadeOut(e.loop));
  }
}

/** Plays a one-off sound now, from a scene with no soundscape of its own (the close-ups). */
export function playSound(scene: Phaser.Scene, id: SoundId, volume = 1): void {
  const a = audioOut(scene, 'sounds');
  if (a) oneShot(a, a.out, a.ctx.currentTime, id, volume);
}
