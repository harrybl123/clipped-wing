import type Phaser from 'phaser';
import { audioOut, noiseBuffer, type AudioOut } from './audioMix';

// PLACEHOLDER music for the war table (Chapter 3; designer: tense, more thoughtful but still dramatic, and
// different from the fights'), synthesised on the music bus until a real track replaces it. Two moods:
//
//   lesson  slow and thinking: a soft pad holding each chord, a plucked arpeggio picking through it, a
//           tick like a clock on the beat; D minor going round D minor, B flat, G minor, A (it never settles).
//   now     when he turns it on: the same chords, darker and driving: a low ostinato under them, a drum on
//           the beat, the arpeggio quicker and harder, and a flat second grinding against the root.
//
// Notes are scheduled a little ahead, so they keep time if a frame is late. Phaser's mute and master volume
// apply, as for all music.

const D2 = 73.42;
const LEVEL = 0.5;
/** Each bar's chord: semitones above D, root first. */
const CHORDS = [
  [0, 3, 7], // D minor
  [-4, 0, 3], // B flat
  [-7, -4, 0], // G minor
  [-5, -1, 2], // A (major: the pull back home that never quite lands)
];
/** The lesson's arpeggio: which sixteenths, and which chord tone (index, octave). */
const LESSON_ARP: [number, number, number][] = [[0, 0, 1], [3, 1, 1], [6, 2, 1], [8, 0, 2], [11, 2, 1], [14, 1, 1]];

export type TableMood = 'lesson' | 'now';

export interface TableMusic {
  mood(m: TableMood): void;
  /** Fades out and stops. */
  stop(): void;
}

const SILENT: TableMusic = { mood: () => {}, stop: () => {} };

export function startTableMusic(scene: Phaser.Scene, initial: TableMood = 'lesson'): TableMusic {
  const a = audioOut(scene, 'music');
  if (!a) return SILENT;
  const { ctx } = a;
  const out = ctx.createGain();
  out.gain.value = 0;
  out.gain.setTargetAtTime(LEVEL, ctx.currentTime, 0.8);
  out.connect(a.out);
  let mood: TableMood = initial;
  let step = 0;
  let next = ctx.currentTime + 0.15;
  let stopped = false;
  const stepLength = () => 60 / (mood === 'now' ? 100 : 76) / 4;
  const timer = setInterval(() => {
    while (next < ctx.currentTime + 0.25) {
      playStep(a, out, step, next, mood, stepLength());
      next += stepLength();
      step++;
    }
  }, 50);
  return {
    mood: (m) => {
      if (m === mood) return;
      mood = m;
      // A hit as it changes: a low boom and a swell.
      boom(a, out, ctx.currentTime + 0.02);
    },
    stop: () => {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      out.gain.cancelScheduledValues(ctx.currentTime);
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      setTimeout(() => out.disconnect(), 3500);
    },
  };
}

function playStep(a: AudioOut, out: AudioNode, step: number, t: number, mood: TableMood, len: number): void {
  const i = step % 16;
  const chord = CHORDS[Math.floor(step / 16) % CHORDS.length]!;
  const note = (semis: number, octave: number) => D2 * 2 ** (semis / 12 + octave);
  if (i === 0) pad(a, out, chord.map((s) => note(s, 1)), t, len * 16, mood === 'now' ? 0.09 : 0.06, mood === 'now' ? 700 : 1100);
  if (mood === 'lesson') {
    for (const [at, tone, oct] of LESSON_ARP) if (at === i) pluck(a, out, note(chord[tone]!, oct + 1), t, 0.22, 'triangle', 2200);
    if (i % 4 === 0) tick(a, out, t, i === 0 ? 0.08 : 0.045);
  } else {
    // A low ostinato on the chord's root, every eighth; a drum on the beat; the arpeggio twice as busy.
    if (i % 2 === 0) pluck(a, out, note(chord[0]!, 0), t, i % 4 === 0 ? 0.4 : 0.28, 'sawtooth', 420);
    if (i % 4 === 0) drum(a, out, t, i === 0 ? 0.8 : 0.45);
    if (i % 2 === 1) pluck(a, out, note(chord[(i >> 1) % 3]!, 2), t, 0.16, 'square', 1800);
    // The flat second against the root, now and then.
    if (i === 12 && Math.floor(step / 16) % 2 === 1) pluck(a, out, note(chord[0]! + 1, 1), t, 0.2, 'sawtooth', 900);
  }
}

/** A plucked note through a closing low-pass. */
function pluck(a: AudioOut, out: AudioNode, f: number, t: number, vol: number, type: OscillatorType, bright: number): void {
  const { ctx } = a;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = f;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(bright, t);
  lp.frequency.exponentialRampToValueAtTime(Math.max(120, bright / 6), t + 0.35);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  o.connect(lp).connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.65);
}

/** A soft held chord: detuned saws under a low-pass, swelling in and out over the bar. */
function pad(a: AudioOut, out: AudioNode, freqs: number[], t: number, len: number, vol: number, cutoff: number): void {
  const { ctx } = a;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = cutoff;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + len * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len * 1.05);
  for (const f of freqs) {
    for (const detune of [1, 1.005]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f * detune;
      o.connect(lp);
      o.start(t);
      o.stop(t + len * 1.1);
    }
  }
  lp.connect(g).connect(out);
}

/** A tick like a clock's, on the beat. */
function tick(a: AudioOut, out: AudioNode, t: number, vol: number): void {
  noise(a, out, t, 'bandpass', 3200, 9, vol, 0.03);
}

/** A low drum: a sine falling in pitch, and a breath of noise. */
function drum(a: AudioOut, out: AudioNode, t: number, vol: number): void {
  const { ctx } = a;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.setValueAtTime(90, t);
  o.frequency.exponentialRampToValueAtTime(38, t + 0.2);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.4);
  noise(a, out, t, 'lowpass', 400, 0.7, vol * 0.25, 0.12);
}

/** When he turns it on: a deep boom. */
function boom(a: AudioOut, out: AudioNode, t: number): void {
  drum(a, out, t, 1);
  noise(a, out, t, 'lowpass', 200, 0.7, 0.5, 1.2);
}

function noise(a: AudioOut, out: AudioNode, t: number, type: BiquadFilterType, freq: number, q: number, vol: number, len: number): void {
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
