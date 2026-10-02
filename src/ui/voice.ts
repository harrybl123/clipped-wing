import type Phaser from 'phaser';
import type { Syllable, Voice } from '../systems/voices';
import { audioOut, type Bus, noiseBuffer } from './audioMix';

// Plays one syllable of a voice (src/systems/voices.ts) with Web Audio. Soft and smooth (designer: "a
// touch too alien, a bit abrasive"; "earthy"): a rounded tone, a gentle swell rather than a click, a
// natural unsteadiness in the pitch, shaped into a vowel by two broad formant filters, with a warm
// breath under it and the top end rolled off. `muffled` puts it behind a door or a curtain.

/** The first two formants of each vowel, in Hz (a rough adult average). */
const FORMANTS: Record<Syllable['vowel'], [number, number]> = {
  a: [750, 1150],
  e: [450, 1750],
  i: [330, 2000],
  o: [480, 850],
  u: [350, 720],
};

const LOUDNESS = 0.2;

export function playSyllable(scene: Phaser.Scene, voice: Voice, syllable: Syllable, options: { muffled?: boolean; gain?: number; delay?: number; bus?: Bus; pan?: number; dest?: AudioNode } = {}): void {
  const a = audioOut(scene, options.bus ?? 'voices');
  if (!a) return;
  const { ctx } = a;
  const t = ctx.currentTime + (options.delay ?? 0);
  const length = voice.length * (syllable.emphatic ? 1.15 : 1) * (0.85 + Math.random() * 0.3);
  const semis = syllable.step * (voice.spread / 2) + (Math.random() - 0.5) * 0.8 + (syllable.rise ? 3 : 0) + (syllable.emphatic ? 0.7 : 0);
  const freq = voice.pitch * 2 ** (semis / 12);
  const peak = LOUDNESS * voice.volume * (syllable.emphatic ? 1.2 : 1) * (options.gain ?? 1);

  // A gentle swell and fall, never a click.
  const attack = Math.min(0.025, length * 0.3);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(peak, t + attack);
  env.gain.setTargetAtTime(0, t + length * 0.5, length * 0.22);
  // Rounded off at the top: warm, not buzzy.
  const warm = ctx.createBiquadFilter();
  warm.type = 'lowpass';
  warm.frequency.value = (options.muffled ? 450 : 1600) * voice.formant;
  warm.Q.value = 0.3;
  env.connect(warm);
  const out = options.dest ?? a.out;
  if (options.pan) {
    const panner = ctx.createStereoPanner();
    panner.pan.value = options.pan;
    warm.connect(panner).connect(out);
  } else warm.connect(out);

  const end = t + length * 2;
  // The tone, drifting by `glide`, with a wobble, and a little natural unsteadiness.
  const osc = ctx.createOscillator();
  osc.type = voice.wave;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.linearRampToValueAtTime(freq * 2 ** (voice.glide / 12), t + length);
  const lfo = ctx.createOscillator();
  const depth = ctx.createGain();
  lfo.frequency.value = voice.wobble > 0 ? 6 + Math.random() * 2 : 4 + Math.random() * 3;
  depth.gain.value = freq * (2 ** (Math.max(voice.wobble, 0.12) / 12) - 1);
  lfo.connect(depth).connect(osc.frequency);
  lfo.start(t);
  lfo.stop(end);

  // Shaped into the vowel: two broad formant filters in parallel, and most of the plain tone.
  const [f1, f2] = FORMANTS[syllable.vowel];
  for (const [f, level] of [[f1 * voice.formant, 1.2], [f2 * voice.formant, 0.35]] as const) {
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = f;
    band.Q.value = 2;
    const g = ctx.createGain();
    g.gain.value = level;
    osc.connect(band).connect(g).connect(env);
  }
  const dry = ctx.createGain();
  dry.gain.value = 0.55;
  osc.connect(dry).connect(env);
  osc.start(t);
  osc.stop(end);

  // A warm breath under it (low, never hissy).
  if (voice.breath > 0) {
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = f1 * voice.formant * 1.5;
    band.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.value = voice.breath * 0.5;
    noise.connect(band).connect(g).connect(env);
    noise.start(t, Math.random());
    noise.stop(end);
  }
}
