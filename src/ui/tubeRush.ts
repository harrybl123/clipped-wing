import type Phaser from 'phaser';
import { audioOut, noiseBuffer } from './audioMix';

// Rising up the tube (Chapter 4's opening, through your eyes): a sustained, technological whirl (designer: not
// wind), synthesised on the sounds bus, that builds with the cinematic's beats (`#rush:<level>` in
// story/canopy/lore.ink) and cuts dead to silence at the black (`#rush:off`). Under it all, the tube's hum (the
// one you knew from every morning rite), climbing in pitch; over it, a whirring like something spinning up, a
// resonant filter swirling round it faster and faster; an electronic "vwip" as each ring of the tube flies
// past, closer together as you speed up; and, as the light swells, a high shimmer like the light itself. Only
// a breath of air under it.

export interface TubeRush {
  /** How hard you're rising: 1 (setting off) to 3 (into the white). */
  level(n: number): void;
  /** Cut dead (the black). */
  cut(): void;
  /** Fade out (leaving). */
  stop(): void;
}

const SILENT: TubeRush = { level: () => {}, cut: () => {}, stop: () => {} };

export function startTubeRush(scene: Phaser.Scene): TubeRush {
  const a = audioOut(scene, 'sounds');
  if (!a) return SILENT;
  const { ctx } = a;
  const now = () => ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0;
  master.gain.setTargetAtTime(0.9, now(), 0.8);
  master.connect(a.out);

  // The air rushing past: noise through a band that brightens and widens as you speed up.
  const air = ctx.createBufferSource();
  air.buffer = noiseBuffer(ctx);
  air.loop = true;
  const airBand = ctx.createBiquadFilter();
  airBand.type = 'bandpass';
  airBand.frequency.value = 420;
  airBand.Q.value = 0.7;
  const airGain = ctx.createGain();
  airGain.gain.value = 0.05;
  air.connect(airBand).connect(airGain).connect(master);
  air.start();
  // A slow wobble in the air, so it breathes rather than hisses.
  const wobble = ctx.createOscillator();
  wobble.frequency.value = 0.35;
  const wobbleDepth = ctx.createGain();
  wobbleDepth.gain.value = 120;
  wobble.connect(wobbleDepth).connect(airBand.frequency);
  wobble.start();

  // The tube's hum: a low fifth, slightly beating, climbing as you rise.
  const hum = ctx.createGain();
  hum.gain.value = 0.22;
  const humTone = ctx.createBiquadFilter();
  humTone.type = 'lowpass';
  humTone.frequency.value = 380;
  humTone.connect(hum).connect(master);
  const humOscs = [55, 55.6, 82.5].map((f) => {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    o.connect(humTone);
    o.start();
    return o;
  });

  // The whirl: two buzzing tones a hair apart, through a resonant filter that swirls round and round them,
  // faster as you rise; their pitch climbing too, like something spinning up.
  const whirlFilter = ctx.createBiquadFilter();
  whirlFilter.type = 'lowpass';
  whirlFilter.frequency.value = 700;
  whirlFilter.Q.value = 9;
  const whirl = ctx.createGain();
  whirl.gain.value = 0.07;
  whirlFilter.connect(whirl).connect(master);
  const whirlOscs = [110, 110.9].map((f) => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    o.connect(whirlFilter);
    o.start();
    return o;
  });
  const swirl = ctx.createOscillator();
  swirl.frequency.value = 2.2;
  const swirlDepth = ctx.createGain();
  swirlDepth.gain.value = 520;
  swirl.connect(swirlDepth).connect(whirlFilter.frequency);
  swirl.start();

  // The light: a faint high shimmer, trembling, that swells into the white.
  const shimmer = ctx.createGain();
  shimmer.gain.value = 0;
  const tremolo = ctx.createOscillator();
  tremolo.frequency.value = 7;
  const tremoloDepth = ctx.createGain();
  tremoloDepth.gain.value = 0.02;
  tremolo.connect(tremoloDepth).connect(shimmer.gain);
  tremolo.start();
  shimmer.connect(master);
  const shimmerOscs = [1320, 1760, 2217].map((f) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = 0.33;
    o.connect(g).connect(shimmer);
    o.start();
    return o;
  });

  // As each ring goes past: an electronic "vwip", a tone falling fast as it goes behind you.
  let pace = 1;
  let gone = false;
  const whoosh = () => {
    if (gone) return;
    const t = now() + 0.02;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(1500 + pace * 450, t);
    o.frequency.exponentialRampToValueAtTime(220, t + 0.22);
    const edge = ctx.createOscillator();
    edge.type = 'square';
    edge.frequency.setValueAtTime(750 + pace * 220, t);
    edge.frequency.exponentialRampToValueAtTime(110, t + 0.22);
    const edgeGain = ctx.createGain();
    edgeGain.gain.value = 0.18;
    const soft = ctx.createBiquadFilter();
    soft.type = 'lowpass';
    soft.frequency.value = 2400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.08 + pace * 0.03, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    o.connect(soft);
    edge.connect(edgeGain).connect(soft);
    soft.connect(g).connect(master);
    for (const osc of [o, edge]) {
      osc.start(t);
      osc.stop(t + 0.3);
    }
    timer = setTimeout(whoosh, (700 / pace) * (0.8 + Math.random() * 0.4));
  };
  let timer = setTimeout(whoosh, 400);

  const set = (param: AudioParam, value: number, over: number) => {
    param.cancelScheduledValues(now());
    param.setTargetAtTime(value, now(), over);
  };
  const end = (fade: number) => {
    if (gone) return;
    gone = true;
    clearTimeout(timer);
    master.gain.cancelScheduledValues(now());
    if (fade <= 0) master.gain.setValueAtTime(0, now());
    else master.gain.setTargetAtTime(0, now(), fade);
    setTimeout(() => {
      for (const o of [...humOscs, ...shimmerOscs, ...whirlOscs, wobble, tremolo, swirl]) o.stop();
      air.stop();
      master.disconnect();
    }, 1500 + fade * 5000);
  };

  return {
    level: (n) => {
      if (gone) return;
      pace = n <= 1 ? 1 : n === 2 ? 2 : 3.5;
      // Faster, brighter, louder; the hum climbing; the light swelling in.
      set(airBand.frequency, n <= 1 ? 420 : n === 2 ? 900 : 1700, 1.2);
      set(airBand.Q, n <= 1 ? 0.7 : 0.45, 1);
      set(airGain.gain, n <= 1 ? 0.05 : n === 2 ? 0.08 : 0.12, 1);
      whirlOscs.forEach((o, i) => set(o.frequency, [110, 110.9][i]! * (n <= 1 ? 1 : n === 2 ? 1.6 : 2.6), 2.5));
      set(swirl.frequency, n <= 1 ? 2.2 : n === 2 ? 5 : 11, 2);
      set(whirlFilter.frequency, n <= 1 ? 700 : n === 2 ? 1100 : 1700, 2);
      set(whirl.gain, n <= 1 ? 0.07 : n === 2 ? 0.1 : 0.14, 1.5);
      humOscs.forEach((o, i) => set(o.frequency, [55, 55.6, 82.5][i]! * (n <= 1 ? 1 : n === 2 ? 1.3 : 1.7), 2));
      set(hum.gain, n <= 1 ? 0.22 : n === 2 ? 0.3 : 0.38, 1.5);
      set(shimmer.gain, n <= 1 ? 0 : n === 2 ? 0.05 : 0.14, 1.5);
    },
    cut: () => end(0),
    stop: () => end(0.4),
  };
}
