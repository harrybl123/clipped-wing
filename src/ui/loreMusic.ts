import type Phaser from 'phaser';
import { audioOut, type AudioOut } from './audioMix';

// PLACEHOLDER music for Grounded's telling (Chapter 4, Day 1; designer: philosophical, soft), synthesised on
// the music bus until a real track replaces it. Slow (54 a minute), warm and unhurried: a held chord under
// everything (soft sines, swelling in and out), and a few notes like a felted piano picked out over it, each
// ringing a long time, echoing back quietly. Four chords going round and never quite resolving: F major 7,
// A minor 7, D minor 9, B flat major 7 (with its sharp eleventh, a little unsettled, in every other turn).
//
// Notes are scheduled a little ahead so they keep time if a frame is late. Phaser's mute and master volume
// apply, as for all music.

const F2 = 87.31;
const LEVEL = 0.8;
const BPM = 54;
/** Each bar's chord: semitones above F, the bass first. */
const CHORDS = [
  [0, 4, 7, 11], // F major 7
  [4, 7, 11, 14], // A minor 7
  [2, 5, 9, 12, 16], // D minor 9
  [-2, 2, 5, 9], // B flat major 7
];
/**
 * The melody over each chord: [eighth in the bar (0-7), semitones above F, octave]. A slow phrase that asks,
 * then answers a little differently the second time round.
 */
const PHRASES: [number, number, number][][] = [
  [[0, 12, 2], [3, 11, 2], [5, 7, 2]],
  [[1, 14, 2], [4, 11, 2]],
  [[0, 9, 2], [2, 12, 2], [4, 16, 2], [6, 14, 2]],
  [[2, 9, 2], [5, 4, 2]],
  [[0, 12, 2], [3, 16, 2], [5, 14, 2]],
  [[1, 11, 2], [4, 7, 2]],
  [[0, 9, 2], [3, 12, 2], [6, 9, 2]],
  [[0, 5, 2], [4, 6, 2], [6, 4, 2]],
];

export interface LoreMusic {
  /** Fades out and stops. */
  stop(): void;
}

const SILENT: LoreMusic = { stop: () => {} };

export function startLoreMusic(scene: Phaser.Scene): LoreMusic {
  const a = audioOut(scene, 'music');
  if (!a) return SILENT;
  const { ctx } = a;
  const out = ctx.createGain();
  out.gain.value = 0;
  out.gain.setTargetAtTime(LEVEL, ctx.currentTime, 2.5);
  out.connect(a.out);
  // A quiet echo: what's played comes back a beat and a half later, softer, darker.
  const echo = ctx.createDelay(2);
  echo.delayTime.value = (60 / BPM) * 1.5;
  const back = ctx.createGain();
  back.gain.value = 0.32;
  const dark = ctx.createBiquadFilter();
  dark.type = 'lowpass';
  dark.frequency.value = 1400;
  echo.connect(dark).connect(back).connect(echo);
  back.connect(out);
  const eighth = 60 / BPM / 2;
  let step = 0;
  let next = ctx.currentTime + 0.3;
  let stopped = false;
  const timer = setInterval(() => {
    while (next < ctx.currentTime + 0.4) {
      playStep(a, out, echo, step, next, eighth);
      next += eighth;
      step++;
    }
  }, 60);
  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      clearInterval(timer);
      out.gain.cancelScheduledValues(ctx.currentTime);
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.8);
      setTimeout(() => out.disconnect(), 5000);
    },
  };
}

function playStep(a: AudioOut, out: AudioNode, echo: AudioNode, step: number, t: number, eighth: number): void {
  const bar = Math.floor(step / 8);
  const i = step % 8;
  const chord = CHORDS[bar % CHORDS.length]!;
  const note = (semis: number, octave: number) => F2 * 2 ** (semis / 12 + octave);
  if (i === 0) {
    // The held chord, and the bass a little under it.
    pad(a, out, chord.map((s) => note(s, 1)), t, eighth * 8);
    keys(a, out, echo, note(chord[0]!, 0), t, 0.16, 5);
    // B flat's sharp eleventh, every other time round.
    if (bar % CHORDS.length === 3 && Math.floor(bar / CHORDS.length) % 2 === 1) keys(a, out, echo, note(11, 2), t + eighth * 3, 0.05, 3);
  }
  // A chord tone low in the middle, now and then, like a hand resting on the keys.
  if (i === 4 && bar % 2 === 0) keys(a, out, echo, note(chord[1]!, 1), t, 0.07, 3);
  // The melody, starting on the second time round so it opens on the chords alone.
  if (bar >= CHORDS.length) {
    const phrase = PHRASES[(bar - CHORDS.length) % PHRASES.length]!;
    for (const [at, semis, octave] of phrase) if (at === i) keys(a, out, echo, note(semis, octave), t, 0.1, 3.5);
  }
}

/** A felted piano-ish note: a sine and a quieter octave, a soft strike, a long fade, and into the echo. */
function keys(a: AudioOut, out: AudioNode, echo: AudioNode, f: number, t: number, vol: number, ring: number): void {
  const { ctx } = a;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(vol * 0.4, t + 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + ring);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(2600, t);
  lp.frequency.exponentialRampToValueAtTime(700, t + 1.2);
  for (const [mult, level, type] of [[1, 1, 'sine'], [2, 0.25, 'triangle'], [3, 0.06, 'sine']] as const) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f * mult;
    const og = ctx.createGain();
    og.gain.value = level;
    o.connect(og).connect(lp);
    o.start(t);
    o.stop(t + ring + 0.1);
  }
  lp.connect(g);
  g.connect(out);
  g.connect(echo);
}

/** A soft held chord: sines, slightly detuned, swelling in and out over the bar. */
function pad(a: AudioOut, out: AudioNode, freqs: number[], t: number, len: number): void {
  const { ctx } = a;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.035, t + len * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len * 1.15);
  for (const f of freqs) {
    for (const detune of [1, 1.003]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * detune;
      o.connect(g);
      o.start(t);
      o.stop(t + len * 1.2);
    }
  }
  g.connect(out);
}
