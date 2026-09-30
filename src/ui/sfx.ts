import type Phaser from 'phaser';

// Small UI sounds, synthesised with Web Audio (no sound files): a soft tick when a cursor moves, a
// gentle two-note chime when something is chosen. They go through Phaser's master volume and mute,
// and do nothing if Web Audio isn't available or hasn't been unlocked by a key press or click yet.

/** Overall loudness of UI sounds (0–1). */
const UI_VOLUME = 0.9;

function audio(scene: Phaser.Scene): { ctx: AudioContext; out: AudioNode } | null {
  const sound = scene.sound as Partial<Phaser.Sound.WebAudioSoundManager>;
  if (!sound.context || !sound.destination || sound.locked) return null;
  return { ctx: sound.context, out: sound.destination };
}

/** One short tone that glides from `from` to `to` Hz and fades out: the building block of every UI sound. */
function tone(ctx: AudioContext, out: AudioNode, at: number, from: number, to: number, duration: number, peak: number, type: OscillatorType): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + duration);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak * UI_VOLUME, at + 0.004); // quick, soft attack
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

/** A soft click for moving a menu cursor or a choice selection up and down. */
export function playMove(scene: Phaser.Scene): void {
  const a = audio(scene);
  if (!a) return;
  const t = a.ctx.currentTime;
  tone(a.ctx, a.out, t, 1900, 1100, 0.035, 0.07, 'sine');
  tone(a.ctx, a.out, t, 3800, 2400, 0.012, 0.02, 'triangle'); // a little brightness on the front edge
}

/** A gentle rising two-note chime for choosing something. */
export function playConfirm(scene: Phaser.Scene): void {
  const a = audio(scene);
  if (!a) return;
  const t = a.ctx.currentTime;
  tone(a.ctx, a.out, t, 880, 870, 0.12, 0.06, 'sine');
  tone(a.ctx, a.out, t + 0.07, 1320, 1310, 0.18, 0.05, 'sine');
}

/** A burst of filtered noise: the building block of scrapes, crackles and the slip. */
function noiseBurst(ctx: AudioContext, out: AudioNode, at: number, duration: number, peak: number, filter: BiquadFilterType, freq: number, q = 1): void {
  const length = Math.max(1, Math.round(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const band = ctx.createBiquadFilter();
  band.type = filter;
  band.frequency.value = freq;
  band.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak * UI_VOLUME, at + Math.min(0.01, duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  src.connect(band).connect(gain).connect(out);
  src.start(at);
  src.stop(at + duration + 0.02);
}

/** One short scrape of a chisel through wood (played repeatedly while carving). */
export function playScrape(scene: Phaser.Scene): void {
  const a = audio(scene);
  if (!a) return;
  noiseBurst(a.ctx, a.out, a.ctx.currentTime, 0.07 + Math.random() * 0.04, 0.05, 'bandpass', 2400 + Math.random() * 1200, 2.5);
}

/** A small pop from the fire. */
export function playCrackle(scene: Phaser.Scene): void {
  const a = audio(scene);
  if (!a) return;
  noiseBurst(a.ctx, a.out, a.ctx.currentTime, 0.02 + Math.random() * 0.03, 0.03 + Math.random() * 0.03, 'highpass', 1800, 0.7);
}

/** The slip: a sharp crack of the blade, and a dull thud under it. */
export function playSlip(scene: Phaser.Scene): void {
  const a = audio(scene);
  if (!a) return;
  const t = a.ctx.currentTime;
  noiseBurst(a.ctx, a.out, t, 0.16, 0.22, 'highpass', 900, 0.8);
  tone(a.ctx, a.out, t, 180, 55, 0.3, 0.2, 'sine');
}
