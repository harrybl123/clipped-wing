import type Phaser from 'phaser';
import { audioOut, noiseBuffer, type AudioOut } from './audioMix';

// Music for a whole day, synthesised, on the music bus. Day 6 (designer: an eerie, anxiety-inducing
// soundtrack for the whole day; then "a little more intense"): a low drone of two notes rubbing against
// each other, swelling and sinking; a breath of air through wood; a trembling low cluster, like bowed
// strings shaking; a heartbeat, quick and usually doubled; every twenty seconds or so a swell that
// climbs and cuts off dead; and dark notes that sag as they fade. No high tones (designer: none of
// those). One score per audio context, so it carries on across areas; each AreaScene asks for the one
// its day wants.

export type ScoreId = 'day6';

interface Playing {
  id: ScoreId;
  a: AudioOut;
  /** Everything goes through this: faded in and out, and dipped under a big choice. */
  out: GainNode;
  stops: (() => void)[];
  nextPulse: number;
  nextNote: number;
  nextSwell: number;
  ducked: boolean;
}

const playing = new WeakMap<AudioContext, Playing>();
/** Loudest the score gets (under the music bus volume). */
const LEVEL = 0.8;

/** Plays `id` (or nothing, for null), fading between them. Call every frame from the area; `delta` in ms. */
export function updateScore(scene: Phaser.Scene, id: ScoreId | null, delta: number): void {
  const a = audioOut(scene, 'music');
  if (!a) return;
  let p = playing.get(a.ctx);
  if (p && p.id !== id) {
    fadeOut(p);
    playing.delete(a.ctx);
    p = undefined;
  }
  if (!id) return;
  if (!p) {
    p = start(a, id);
    playing.set(a.ctx, p);
  }
  tick(p, delta / 1000);
}

/** Stops whatever's playing (the title, an ending). */
export function stopScore(scene: Phaser.Scene): void {
  const a = audioOut(scene, 'music');
  const p = a && playing.get(a.ctx);
  if (!a || !p) return;
  fadeOut(p);
  playing.delete(a.ctx);
}

/** Under a big choice, the score sinks back with everything else. */
export function duckScore(scene: Phaser.Scene, on: boolean): void {
  const a = audioOut(scene, 'music');
  const p = a && playing.get(a.ctx);
  if (!a || !p || p.ducked === on) return;
  p.ducked = on;
  p.out.gain.setTargetAtTime(on ? LEVEL * 0.25 : LEVEL, a.ctx.currentTime, on ? 0.3 : 1.5);
}

function fadeOut(p: Playing): void {
  const { ctx } = p.a;
  p.out.gain.cancelScheduledValues(ctx.currentTime);
  p.out.gain.setTargetAtTime(0, ctx.currentTime, 1.2);
  setTimeout(() => {
    for (const stop of p.stops) stop();
    p.out.disconnect();
  }, 6000);
}

function start(a: AudioOut, id: ScoreId): Playing {
  const { ctx } = a;
  const out = ctx.createGain();
  out.gain.value = 0;
  out.gain.setTargetAtTime(LEVEL, ctx.currentTime, 0.6); // in within a second or two
  out.connect(a.out);
  const stops: (() => void)[] = [];
  const osc = (type: OscillatorType, freq: number, dest: AudioNode) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.connect(dest);
    o.start();
    stops.push(() => o.stop());
    return o;
  };

  // The drone: A and a flattened B-flat a semitone up, an octave apart, beating slowly against each
  // other; under a dark low-pass, swelling and sinking over half a minute.
  const drone = ctx.createGain();
  drone.gain.value = 0.5;
  const dark = ctx.createBiquadFilter();
  dark.type = 'lowpass';
  dark.frequency.value = 420;
  drone.connect(dark).connect(out);
  for (const [type, f, level] of [['sine', 55, 0.6], ['triangle', 110, 0.22], ['triangle', 116.2, 0.18], ['sine', 58.1, 0.3]] as const) {
    const g = ctx.createGain();
    g.gain.value = level;
    g.connect(drone);
    osc(type, f, g);
  }
  const swell = ctx.createGain();
  swell.gain.value = 0.3;
  swell.connect(drone.gain);
  osc('sine', 1 / 31, swell);
  // The filter breathes too, opening a little as the drone swells.
  const open = ctx.createGain();
  open.gain.value = 140;
  open.connect(dark.frequency);
  osc('sine', 1 / 23, open);

  // Air through the wood: low, filtered noise, rising and falling.
  const air = ctx.createGain();
  air.gain.value = 0.12;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 260;
  band.Q.value = 0.8;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  src.connect(band).connect(air).connect(out);
  src.start(0, Math.random());
  stops.push(() => src.stop());
  const gust = ctx.createGain();
  gust.gain.value = 0.08;
  gust.connect(air.gain);
  osc('sine', 1 / 13, gust);

  // The tremble: two notes a semitone apart, shaking about seven times a second, fading in and out.
  const tremble = ctx.createGain();
  tremble.gain.value = 0.11;
  const trembleDark = ctx.createBiquadFilter();
  trembleDark.type = 'lowpass';
  trembleDark.frequency.value = 650;
  const shake = ctx.createGain();
  shake.gain.value = 0.5;
  tremble.connect(shake).connect(trembleDark).connect(out);
  osc('triangle', 146.8, tremble);
  osc('triangle', 155.6, tremble);
  const shiver = ctx.createGain();
  shiver.gain.value = 0.5;
  shiver.connect(shake.gain);
  osc('sine', 7, shiver);
  const comes = ctx.createGain();
  comes.gain.value = 0.09;
  comes.connect(tremble.gain);
  osc('sine', 1 / 17, comes);

  return { id, a, out, stops, nextPulse: 2, nextNote: 6 + Math.random() * 4, nextSwell: 14 + Math.random() * 8, ducked: false };
}

/** The pulse and the sagging notes, on their uneven clocks. */
function tick(p: Playing, dt: number): void {
  if ((p.nextPulse -= dt) <= 0) {
    pulse(p, 0);
    // Usually a second beat right after, like a heart; now and then it skips.
    if (Math.random() < 0.75) pulse(p, 0.28);
    p.nextPulse = 0.85 + Math.random() * 0.35 + (Math.random() < 0.08 ? 1.2 : 0);
  }
  if ((p.nextNote -= dt) <= 0) {
    sag(p);
    p.nextNote = 7 + Math.random() * 7;
  }
  if ((p.nextSwell -= dt) <= 0) {
    swell(p);
    p.nextSwell = 18 + Math.random() * 12;
  }
}

/** A soft, distant thump: low, felt more than heard. */
function pulse(p: Playing, delay: number): void {
  const { ctx } = p.a;
  const t = ctx.currentTime + delay;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.75, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  g.connect(p.out);
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(72, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.3);
  o.connect(g);
  o.start(t);
  o.stop(t + 0.5);
}

/** A dark note that swells in, then sags flat as it dies away (a tritone or a semitone off the drone). */
function sag(p: Playing): void {
  const { ctx } = p.a;
  const t = ctx.currentTime;
  const base = [155.6, 146.8, 233.1, 207.7][Math.floor(Math.random() * 4)]!;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.2, t + 2.5);
  g.gain.linearRampToValueAtTime(0, t + 7);
  const warm = ctx.createBiquadFilter();
  warm.type = 'lowpass';
  warm.frequency.value = 900;
  g.connect(warm).connect(p.out);
  for (const detune of [0, 7]) {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(base, t);
    o.frequency.linearRampToValueAtTime(base * 0.94, t + 7); // sagging
    o.detune.value = detune;
    o.connect(g);
    o.start(t);
    o.stop(t + 7.2);
  }
}

/** Which score is playing (for checking in dev), or null. */
export function scorePlaying(scene: Phaser.Scene): ScoreId | null {
  const a = audioOut(scene, 'music');
  return (a && playing.get(a.ctx)?.id) ?? null;
}

/** Dread rising: a low cluster climbing for six seconds, louder and brighter, then cut off dead. */
function swell(p: Playing): void {
  const { ctx } = p.a;
  const t = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.3, t + 6);
  g.gain.linearRampToValueAtTime(0, t + 6.12);
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(250, t);
  f.frequency.exponentialRampToValueAtTime(1100, t + 6);
  g.connect(f).connect(p.out);
  for (const base of [110, 116.5, 123.5]) {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(base, t);
    o.frequency.exponentialRampToValueAtTime(base * 1.06, t + 6);
    o.connect(g);
    o.start(t);
    o.stop(t + 6.3);
  }
}
