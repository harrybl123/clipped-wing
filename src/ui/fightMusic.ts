import type Phaser from 'phaser';
import { audioOut, noiseBuffer, type AudioOut } from './audioMix';

// PLACEHOLDER fight music, synthesised on the music bus until a real track replaces it (a file would be
// loaded in PreloadScene and played in CombatScene instead; nothing else depends on this). Tense and
// woody, for the roots market: a low drum and a wood block, a muted hat, a plucked bass riff in D
// (minor, with a flat second for menace) that climbs a fourth every other phrase, and a low drone that
// swells under it. Notes are scheduled a little ahead of time, so they keep time even if a frame is
// late. A short sting for winning and for losing. Phaser's mute and master volume apply, as for all
// music.

const BPM = 132;
const STEP = 60 / BPM / 4; // a sixteenth
const LEVEL = 0.55;
const D2 = 73.42;

/** The bass riff over two bars of sixteenths: semitones above D, or null for a rest. */
const RIFF: (number | null)[] = [0, null, 0, null, 3, null, 0, 1, null, 0, null, -2, 0, null, 3, 1, 0, null, 0, null, 3, null, 5, 3, null, 1, null, 0, -2, null, 0, null];
const KICK = new Set([0, 6, 10, 16, 22, 26, 28]);
const SNARE = new Set([8, 24]);
const BLOCK = new Set([3, 7, 13, 19, 23, 29, 31]);

export interface FightMusic {
  /** Fades out (over about a second) and stops. */
  stop(): void;
  /** Stops the loop and plays a short sting. */
  sting(kind: 'win' | 'lose'): void;
}

const SILENT: FightMusic = { stop: () => {}, sting: () => {} };

export function startFightMusic(scene: Phaser.Scene): FightMusic {
  const a = audioOut(scene, 'music');
  if (!a) return SILENT;
  const { ctx } = a;
  const out = ctx.createGain();
  out.gain.value = 0;
  out.gain.setTargetAtTime(LEVEL, ctx.currentTime, 0.4);
  out.connect(a.out);
  const drone = startDrone(a, out);
  let step = 0;
  let next = ctx.currentTime + 0.1;
  let stopped = false;
  // Schedule everything due in the next 0.2s, every 50ms.
  const timer = setInterval(() => {
    while (next < ctx.currentTime + 0.2) {
      playStep(a, out, step, next);
      next += STEP;
      step++;
    }
  }, 50);
  const halt = (fade: number) => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setTargetAtTime(0, ctx.currentTime, fade);
    setTimeout(() => (drone(), out.disconnect()), fade * 6000 + 200);
  };
  return {
    stop: () => halt(0.35),
    sting: (kind) => {
      halt(0.08);
      playSting(a, kind);
    },
  };
}

function playStep(a: AudioOut, out: AudioNode, step: number, t: number): void {
  const i = step % 32;
  // Every other phrase, the riff climbs a fourth.
  const lift = Math.floor(step / 64) % 2 ? 5 : 0;
  const note = RIFF[i];
  if (note !== null && note !== undefined) bass(a, out, D2 * 2 ** ((note + lift) / 12), t, i % 4 === 0 ? 0.5 : 0.36);
  if (KICK.has(i)) kick(a, out, t);
  if (SNARE.has(i)) snare(a, out, t);
  if (BLOCK.has(i)) block(a, out, t, i % 2 ? 1 : 0.7);
  if (i % 2 === 1) hat(a, out, t, i % 4 === 3 ? 0.07 : 0.04);
}

/** A plucked bass: a triangle and a soft square an octave apart through a closing low-pass. */
function bass(a: AudioOut, out: AudioNode, f: number, t: number, vol: number): void {
  const { ctx } = a;
  const g = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(900, t);
  lp.frequency.exponentialRampToValueAtTime(160, t + 0.18);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + STEP * 1.8);
  for (const [type, mult, v] of [['triangle', 1, 1], ['square', 2, 0.18]] as const) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f * mult;
    const og = ctx.createGain();
    og.gain.value = v;
    o.connect(og).connect(lp);
    o.start(t);
    o.stop(t + STEP * 2);
  }
  lp.connect(g).connect(out);
}

/** A low drum: a sine that drops in pitch. */
function kick(a: AudioOut, out: AudioNode, t: number): void {
  const { ctx } = a;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.32);
}

function noiseHit(a: AudioOut, out: AudioNode, t: number, type: BiquadFilterType, freq: number, q: number, vol: number, len: number): void {
  const { ctx } = a;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random());
  src.stop(t + len + 0.02);
}

/** A slap on a skin: a band of noise and a short low body. */
function snare(a: AudioOut, out: AudioNode, t: number): void {
  noiseHit(a, out, t, 'bandpass', 1500, 0.8, 0.5, 0.16);
  const o = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  o.frequency.setValueAtTime(190, t);
  o.frequency.exponentialRampToValueAtTime(120, t + 0.08);
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.12);
}

/** A wood block: the market's stalls and boards. */
function block(a: AudioOut, out: AudioNode, t: number, vol: number): void {
  noiseHit(a, out, t, 'bandpass', 950, 6, 0.55 * vol, 0.05);
}

function hat(a: AudioOut, out: AudioNode, t: number, vol: number): void {
  noiseHit(a, out, t, 'highpass', 5200, 0.7, vol, 0.035);
}

/** A low drone on D and A, swelling slowly under the beat. Returns a stop function. */
function startDrone(a: AudioOut, out: AudioNode): () => void {
  const { ctx } = a;
  const g = ctx.createGain();
  g.gain.value = 0.07;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 380;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.12;
  const depth = ctx.createGain();
  depth.gain.value = 0.045;
  lfo.connect(depth).connect(g.gain);
  const oscs = [D2 * 2, D2 * 2 * 1.004, D2 * 3].map((f) => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    o.connect(lp);
    o.start();
    return o;
  });
  lp.connect(g).connect(out);
  lfo.start();
  return () => {
    for (const o of [...oscs, lfo]) o.stop();
    g.disconnect();
  };
}

/** Won: a rising figure ending on a held open fifth. Lost: three low notes sinking into the dark. */
function playSting(a: AudioOut, kind: 'win' | 'lose'): void {
  const { ctx } = a;
  const out = ctx.createGain();
  out.gain.value = LEVEL;
  out.connect(a.out);
  const t0 = ctx.currentTime + 0.05;
  const notes = kind === 'win'
    ? [[0, 12, 0.12], [0.12, 15, 0.12], [0.24, 19, 0.12], [0.36, 24, 1.4], [0.36, 31, 1.4]]
    : [[0, 7, 0.5], [0.5, 6, 0.5], [1, 0, 1.6]];
  for (const [at, semis, len] of notes as [number, number, number][]) {
    const t = t0 + at;
    const f = D2 * 2 ** (semis / 12) * (kind === 'win' ? 2 : 1);
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(kind === 'win' ? 2400 : 900, t);
    lp.frequency.exponentialRampToValueAtTime(kind === 'win' ? 900 : 200, t + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(lp).connect(g).connect(out);
    o.start(t);
    o.stop(t + len + 0.05);
  }
  if (kind === 'win') kick(a, out, t0 + 0.36);
  else kick(a, out, t0 + 1);
  setTimeout(() => out.disconnect(), 3500);
}
