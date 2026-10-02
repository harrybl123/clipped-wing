import type Phaser from 'phaser';
import type { Syllable, Voice } from '../systems/voices';
import { audioOut, noiseBuffer } from './audioMix';

// Plays one syllable of a voice (src/systems/voices.ts) with Web Audio: a tone shaped into a vowel by
// two band-pass filters (the vowel's formants), a breath of noise under it, a little vibrato, and a short
// envelope. `muffled` puts it behind a door or a curtain.

/** The first two formants of each vowel, in Hz (a rough adult average). */
const FORMANTS: Record<Syllable['vowel'], [number, number]> = {
  a: [800, 1200],
  e: [450, 1900],
  i: [320, 2300],
  o: [480, 850],
  u: [340, 750],
};

const LOUDNESS = 0.22;

export function playSyllable(scene: Phaser.Scene, voice: Voice, syllable: Syllable, options: { muffled?: boolean; gain?: number; delay?: number } = {}): void {
  const a = audioOut(scene, 'voices');
  if (!a) return;
  const { ctx } = a;
  const t = ctx.currentTime + (options.delay ?? 0);
  const length = voice.length * (syllable.emphatic ? 1.15 : 1);
  const semis = syllable.step * (voice.spread / 2) + (Math.random() - 0.5) * 0.6 + (syllable.rise ? 4 : 0) + (syllable.emphatic ? 1 : 0);
  const freq = voice.pitch * 2 ** (semis / 12);
  const peak = LOUDNESS * voice.volume * (syllable.emphatic ? 1.3 : 1) * (options.gain ?? 1);

  // Everything for this syllable goes through one envelope, then (maybe) a muffle, then out.
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  env.gain.setValueAtTime(peak, t + length * 0.45);
  env.gain.exponentialRampToValueAtTime(0.0001, t + length);
  let tail: AudioNode = env;
  if (options.muffled) {
    const muffle = ctx.createBiquadFilter();
    muffle.type = 'lowpass';
    muffle.frequency.value = 500;
    env.connect(muffle);
    tail = muffle;
  }
  tail.connect(a.out);

  // The tone, sliding by `glide`, with a wobble.
  const osc = ctx.createOscillator();
  osc.type = voice.wave;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 2 ** (voice.glide / 12), t + length);
  if (voice.wobble > 0) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = 7 + Math.random() * 2;
    depth.gain.value = freq * (2 ** (voice.wobble / 12) - 1);
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + length + 0.02);
  }

  // Shaped into the vowel: two formant filters in parallel.
  const [f1, f2] = FORMANTS[syllable.vowel];
  for (const [f, level] of [[f1 * voice.formant, 1], [f2 * voice.formant, 0.6]] as const) {
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = f;
    band.Q.value = 5;
    const g = ctx.createGain();
    g.gain.value = level * 3;
    osc.connect(band).connect(g).connect(env);
  }
  // A little of the raw tone, so low voices still carry.
  const dry = ctx.createGain();
  dry.gain.value = 0.25;
  osc.connect(dry).connect(env);
  osc.start(t);
  osc.stop(t + length + 0.02);

  // Breath.
  if (voice.breath > 0) {
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = f2 * voice.formant;
    band.Q.value = 1.5;
    const g = ctx.createGain();
    g.gain.value = voice.breath * 0.8;
    noise.connect(band).connect(g).connect(env);
    noise.start(t, Math.random());
    noise.stop(t + length + 0.02);
  }
}
