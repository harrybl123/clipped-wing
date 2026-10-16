import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from '../config';
import type { Side } from '../systems/Riot';
import { CITIZEN_LOOKS, GUARD_LOOKS, courtlyFrames, type CapitalLook } from './capitalFolk';
import { SHADES } from './pixelArt';
import { makeSpriteTexture } from './pixelTextures';
import { PixelText } from './PixelText';
import { playSound } from './soundscape';

// A clash on the war table (Jack): "Clash!", the camera dives into the circle, and we see it: the guard in
// their helmets and the rising with whatever they could pick up, in the city's own look, war cries, a charge,
// swords meeting, and one by one they fall, until one is left standing on the winning side. A race for something
// on the map (Jack) is the same street, but both sides charge in from the edges of the screen on horseback,
// galloping, and the loser turns and rides off. The Lord's judgement shows itself in either (Jack): the Lord's grace,
// a side wrapped in golden light; a heretic's, wrapped in darkness. Any key or click skips to the end.

/** The rising: city folk with what came to hand. */
const REBELS: CapitalLook[] = CITIZEN_LOOKS.filter((l) => l.height >= 23).slice(0, 6).map((l, i) => ({ ...l, hold: (['spanner', 'baton', 'pike', 'brush'] as const)[i % 4], pose: 'side' }));
/** Most a side shows. */
const MOST = 6;
const GROUND = 206;

/** The Lord's judgement on a side, to show (Jack): grace (golden light) or heresy (darkness). */
export interface Judged {
  side: Side;
  grace: boolean;
}

export interface ClashShow {
  /** The circle it happens in, on the table. */
  at: { x: number; y: number };
  /** How many each side brings (the same: it's only a clash when they match). */
  strength: number;
  winner: Side;
  /** How many of the winners are left standing. */
  left: number;
  /** The side you're playing, and your odds of winning it (shown at the top). */
  you: Side;
  chance: number;
  /** The Lord's judgement on either side, if any. */
  judged?: Judged[];
}

export interface RaceShow {
  at: { x: number; y: number };
  /** Each side's number ("7 v 6", Jack). */
  guard: number;
  rising: number;
  winner: Side;
  you: Side;
  chance: number;
  /** What it's for: "the crest". */
  what: string;
  judged?: Judged[];
  /** The loser wiped out (only under the Lord's judgement: Jack). */
  wiped: boolean;
}

/** The look's frames as textures: standing, and walking. */
function textures(scene: Phaser.Scene, key: string, look: CapitalLook): { idle: string; walk: string[] } {
  const f = courtlyFrames(look);
  const idle = f.idle[0]!;
  return {
    idle: makeSpriteTexture(scene, `${key}-idle`, idle.rows, idle.colours),
    walk: f.walk.map((w, i) => makeSpriteTexture(scene, `${key}-walk${i}`, w.rows, w.colours)),
  };
}

/** A horse, side on, facing right, two frames of a gallop (legs gathered, legs stretched); the guard's in barding. */
function horses(scene: Phaser.Scene, side: Side): string[] {
  return [0, 1].map((frame) => {
    const key = `clash-horse-${side}-${frame}`;
    if (scene.textures.exists(key)) return key;
    const g = scene.make.graphics({}, false);
    const coat = side === 'guard' ? SHADES.dim : SHADES.woodLight;
    const mane = side === 'guard' ? SHADES.light : SHADES.wood;
    // Legs.
    g.lineStyle(2, coat, 1);
    const legs = frame ? [[5, 13, 1, 20], [8, 13, 5, 20], [17, 13, 21, 20], [20, 13, 24, 19]] : [[5, 13, 7, 20], [8, 13, 9, 20], [17, 13, 16, 20], [20, 13, 18, 20]];
    for (const [x1, y1, x2, y2] of legs) g.lineBetween(x1!, y1!, x2!, y2!);
    // Body, neck, head, tail.
    g.fillStyle(coat, 1).fillEllipse(13, 10, 20, 9);
    g.fillTriangle(19, 9, 23, 2, 25, 8).fillRect(22, 1, 6, 4);
    g.fillStyle(mane, 1).fillTriangle(19, 7, 22, 1, 21, 8).fillTriangle(3, 8, 0, frame ? 6 : 14, 4, 11);
    g.fillStyle(SHADES.shadow, 1).fillRect(26, 2, 1, 1); // an eye
    if (side === 'guard') g.fillStyle(SHADES.cyanDeep, 1).fillRect(7, 6, 12, 5).fillStyle(SHADES.amber, 1).fillRect(7, 10, 12, 1); // barding, gold-edged
    else g.fillStyle(SHADES.amberDeep, 1).fillRect(9, 6, 7, 3); // a saddle cloth
    g.generateTexture(key, 29, 22);
    g.destroy();
    return key;
  });
}

/**
 * The scene's frame: the word across the table, the camera diving in, then a letterboxed street at night (the
 * guard's blue glow on the left, the rising's fires on the right). Gives back the layer and its helpers.
 */
async function open(scene: Phaser.Scene, at: { x: number; y: number }, word: string) {
  const cam = scene.cameras.main;
  const before = { zoom: cam.zoom, x: cam.scrollX, y: cam.scrollY };
  const state = { skip: false };
  const onSkip = () => (state.skip = true);
  scene.input.keyboard?.on('keydown', onSkip);
  scene.input.on('pointerdown', onSkip);
  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      let left = ms;
      const ev = scene.time.addEvent({ delay: 20, loop: true, callback: () => {
        left -= 20;
        if (state.skip || left <= 0) (ev.remove(), resolve());
      } });
    });

  playSound(scene, 'clash', 1);
  cam.shake(250, 0.01);
  const big = new PixelText(scene, 0, 0, word, { color: SHADES.white, shadow: SHADES.shadow, scale: 3 }).setDepth(120).setScrollFactor(0);
  big.setPosition(Math.round((W - big.width) / 2), Math.round(H / 2 - 40));
  cam.pan(at.x, at.y, 450, 'Sine.easeIn');
  cam.zoomTo(4, 450, 'Sine.easeIn');
  await wait(500);
  cam.fadeOut(140, 0, 0, 0);
  await wait(160);
  big.destroy();
  cam.setZoom(1).setScroll(0, 0);

  // (Fixed to the screen: on a table that pans, the camera's free to wander underneath.)
  const layer = scene.add.container(0, 0).setDepth(110).setScrollFactor(0);
  // (Each thing in it too: Phaser goes by their own.)
  const add = layer.add.bind(layer);
  layer.add = ((child: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]) => {
    for (const c of [child].flat()) (c as unknown as Phaser.GameObjects.Components.ScrollFactor).setScrollFactor?.(0);
    return add(child);
  }) as typeof layer.add;
  const g = scene.add.graphics();
  layer.add(g);
  g.fillStyle(SHADES.shadow, 1).fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) {
    g.fillStyle(SHADES.cyanDeep, 0.18).fillRect(0, 60 + i * 8, W / 2 - i * 20, GROUND - 60 - i * 8);
    g.fillStyle(SHADES.amberDeep, 0.18).fillRect(W / 2 + i * 20, 60 + i * 8, W / 2 - i * 20, GROUND - 60 - i * 8);
  }
  for (let x = 0; x < W; x += 34) {
    const h = 40 + ((x * 37) % 50);
    g.fillStyle(SHADES.deep, 1).fillRect(x, GROUND - h - 30, 30, h + 30);
    for (let wy = GROUND - h - 22; wy < GROUND - 40; wy += 10) g.fillStyle(x < W / 2 ? SHADES.cyanDeep : SHADES.amberDeep, 1).fillRect(x + 6 + ((wy * 3) % 14), wy, 3, 4);
  }
  g.fillStyle(SHADES.wood, 1).fillRect(0, GROUND, W, 3);
  g.fillStyle(SHADES.deep, 1).fillRect(0, GROUND + 3, W, H - GROUND - 3);
  g.fillStyle(0x000000, 1).fillRect(0, 0, W, 34).fillRect(0, H - 30, W, 30);
  const fire = scene.add.graphics();
  layer.add(fire);
  const flicker = scene.time.addEvent({ delay: 110, loop: true, callback: () => {
    fire.clear();
    for (let i = 0; i < 5; i++) {
      const fx = W - 30 - i * 44;
      const fh = 4 + Math.floor(Math.random() * 6);
      fire.fillStyle(SHADES.amber, 1).fillRect(fx, GROUND - fh, 3, fh);
      fire.fillStyle(SHADES.white, 1).fillRect(fx + 1, GROUND - Math.floor(fh / 2), 1, 2);
    }
  } });
  cam.fadeIn(160);

  const close = async () => {
    cam.fadeOut(140, 0, 0, 0);
    await new Promise<void>((r) => scene.time.delayedCall(160, r));
    flicker.remove();
    layer.destroy();
    cam.setZoom(before.zoom).setScroll(before.x, before.y);
    cam.fadeIn(200);
    scene.input.keyboard?.off('keydown', onSkip);
    scene.input.off('pointerdown', onSkip);
  };
  return { layer, wait, state, close };
}

/** Words centred across the scene. */
function words(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, y: number, text: string, color: number, scale = 1): PixelText {
  const t = new PixelText(scene, 0, y, text, { color, shadow: SHADES.shadow, scale });
  t.setX(Math.round((W - t.width) / 2));
  layer.add(t);
  return t;
}

/**
 * The Lord's judgement, showing itself (Jack): "Lord's grace!" and a side's half of the street filling with golden
 * light; or "Heretic!", a side's half plunged into darkness, its fighters only shapes.
 */
async function judgement(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, judged: Judged[], figures: Record<Side, Phaser.GameObjects.Image[]>, wait: (ms: number) => Promise<void>): Promise<void> {
  for (const j of judged) {
    const left = j.side === 'guard';
    const wash = scene.add.rectangle(left ? 0 : W / 2, 34, W / 2, H - 64, j.grace ? SHADES.amber : 0x000000, 0).setOrigin(0);
    layer.add(wash);
    if (j.grace) {
      playSound(scene, 'angel', 0.9);
      for (const f of figures[j.side]) f.setTint(0xffe6a0);
      layer.moveTo(wash, 2); // (over the street, under the riders)
      scene.tweens.add({ targets: wash, fillAlpha: 0.3, duration: 500 });
    } else {
      playSound(scene, 'slam', 0.8);
      for (const f of figures[j.side]) f.setTint(0x262626);
      scene.tweens.add({ targets: wash, fillAlpha: 0.65, duration: 500 });
    }
    const t = words(scene, layer, 46, j.grace ? "Lord's grace!" : 'Heretic!', j.grace ? SHADES.amber : SHADES.dim, 3);
    t.setX(Math.round((left ? W / 4 : (W * 3) / 4) - t.width / 2));
    await wait(900);
    t.destroy();
  }
}

export async function playClash(scene: Phaser.Scene, show: ClashShow): Promise<void> {
  const { layer, wait, state, close } = await open(scene, show.at, 'Clash!');
  const pct = Math.round(show.chance * 100);
  words(scene, layer, 12, `The guard v the rising, ${show.strength} each. Your odds: ${pct}%`, SHADES.light);

  // The two sides, facing each other.
  const n = Math.min(MOST, Math.max(1, show.strength));
  const make = (side: Side, i: number) => {
    const look = side === 'guard' ? GUARD_LOOKS[i % 2]! : REBELS[i % REBELS.length]!;
    const tex = textures(scene, `clash-${side}-${i % (side === 'guard' ? 2 : REBELS.length)}`, look);
    const x = side === 'guard' ? 30 + i * 14 : W - 30 - i * 14;
    const img = scene.add.image(x, GROUND + 1 + (i % 2) * 4, tex.idle).setOrigin(0.5, 1).setScale(2).setFlipX(side === 'rising');
    layer.add(img);
    return { img, tex, side };
  };
  const guard = Array.from({ length: n }, (_, i) => make('guard', i));
  const rising = Array.from({ length: n }, (_, i) => make('rising', i));
  for (const w of [...guard, ...rising].reverse()) layer.bringToTop(w.img);
  await wait(250);

  // War cries, and the charge.
  playSound(scene, 'warcry', 1);
  playSound(scene, 'warcryLow', 0.9);
  let step = 0;
  const walking = scene.time.addEvent({ delay: 90, loop: true, callback: () => {
    step++;
    for (const w of [...guard, ...rising]) w.img.setTexture(w.tex.walk[step % w.tex.walk.length]!);
  } });
  await Promise.all([...guard, ...rising].map((w, i) => {
    const k = i % n;
    const x = w.side === 'guard' ? W / 2 - 12 - k * 13 : W / 2 + 12 + k * 13;
    return new Promise<void>((resolve) => scene.tweens.add({ targets: w.img, x, duration: state.skip ? 0 : 700, ease: 'Quad.easeIn', onComplete: () => resolve() }));
  }));
  walking.remove();
  for (const w of [...guard, ...rising]) w.img.setTexture(w.tex.idle);
  if (show.judged?.length && !state.skip) await judgement(scene, layer, show.judged, { guard: guard.map((w) => w.img), rising: rising.map((w) => w.img) }, wait);

  // Swords meet; they fall one by one, until only the winners' last are left.
  const winners = show.winner === 'guard' ? guard : rising;
  const losers = show.winner === 'guard' ? rising : guard;
  const standing = Math.min(n, Math.max(1, show.left));
  const falls = [...losers.slice(1), ...winners.slice(standing)].sort(() => Math.random() - 0.5);
  falls.push(losers[0]!);
  for (const w of falls) {
    if (!state.skip) playSound(scene, 'clash', 0.8);
    sparks(scene, layer, W / 2, GROUND - 30);
    for (const front of [guard[0]!, rising[0]!]) scene.tweens.add({ targets: front.img, x: front.img.x + (front.side === 'guard' ? 4 : -4), duration: 80, yoyo: true });
    fall(scene, w.img, w.side, state.skip);
    await wait(320);
  }
  for (const w of winners.slice(0, standing)) scene.tweens.add({ targets: w.img, y: w.img.y - 10, duration: 160, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
  words(scene, layer, H - 22, `${show.winner === 'guard' ? 'The guard take' : 'The rising take'} it, with ${show.left} left.`, show.winner === 'guard' ? SHADES.cyan : SHADES.amber);
  const yours = show.winner === show.you;
  words(scene, layer, 50, yours ? 'Won!' : 'Lost!', yours ? SHADES.white : SHADES.dim, 3);
  state.skip = false;
  await wait(1200);
  await close();
}

/**
 * A race (Jack): "7 v 6" in each side's colour and your odds; both sides gallop in on horseback from the edges of
 * the screen, war cries, swords ringing as they meet; then the loser turns and rides off (or, under the Lord's
 * judgement, is cut down to the last).
 */
export async function playRace(scene: Phaser.Scene, show: RaceShow): Promise<void> {
  const { layer, wait, state, close } = await open(scene, show.at, 'Race!');
  // "7 v 6", each in its side's colour, and the odds.
  const a = new PixelText(scene, 0, 8, String(show.guard), { color: SHADES.cyan, shadow: SHADES.shadow, scale: 2 });
  const v = new PixelText(scene, 0, 12, 'v', { color: SHADES.light, shadow: SHADES.shadow });
  const b = new PixelText(scene, 0, 8, String(show.rising), { color: SHADES.amber, shadow: SHADES.shadow, scale: 2 });
  const total = a.width + v.width + b.width + 12;
  a.setX(Math.round(W / 2 - total / 2));
  v.setX(a.x + a.width + 6);
  b.setX(v.x + v.width + 6);
  layer.add([a, v, b]);
  words(scene, layer, H - 22, `For ${show.what}. Your odds: ${Math.round(show.chance * 100)}%`, SHADES.light);

  // The riders: each on a horse, off the edges of the screen.
  const ride = (side: Side, i: number) => {
    const look = side === 'guard' ? GUARD_LOOKS[i % 2]! : REBELS[i % REBELS.length]!;
    const tex = textures(scene, `clash-${side}-${i % (side === 'guard' ? 2 : REBELS.length)}`, look);
    const legs = horses(scene, side);
    const x = side === 'guard' ? -40 - i * 26 : W + 40 + i * 26;
    const y = GROUND + 1 + (i % 2) * 5;
    const horse = scene.add.image(x, y, legs[0]!).setOrigin(0.5, 1).setScale(2).setFlipX(side === 'rising');
    const rider = scene.add.image(x, y - 26, tex.idle).setOrigin(0.5, 1).setScale(2).setFlipX(side === 'rising');
    rider.setCrop(0, 0, rider.width, Math.round(rider.height * 0.62)); // (sat in the saddle: his legs behind the horse)
    rider.y += Math.round(rider.height * 0.38 * 2);
    layer.add([rider, horse]);
    return { horse, rider, legs, side };
  };
  const g = Array.from({ length: Math.min(MOST, Math.max(1, show.guard)) }, (_, i) => ride('guard', i));
  const r = Array.from({ length: Math.min(MOST, Math.max(1, show.rising)) }, (_, i) => ride('rising', i));
  const all = [...g, ...r];
  // Galloping in.
  let frame = 0;
  const gallop = scene.time.addEvent({ delay: 110, loop: true, callback: () => {
    frame++;
    for (const k of all) {
      k.horse.setTexture(k.legs[frame % 2]!);
      k.rider.y += frame % 2 ? -1 : 1;
    }
  } });
  const hooves = scene.time.addEvent({ delay: 330, loop: true, callback: () => !state.skip && playSound(scene, 'gallop', 0.8) });
  playSound(scene, 'gallop', 0.8);
  playSound(scene, 'warcry', 1);
  playSound(scene, 'warcryLow', 0.9);
  const move = (k: (typeof all)[number], x: number, duration: number) =>
    new Promise<void>((resolve) => scene.tweens.add({ targets: [k.horse, k.rider], x, duration: state.skip ? 0 : duration, ease: 'Quad.easeIn', onComplete: () => resolve() }));
  await Promise.all(all.map((k) => {
    const i = (k.side === 'guard' ? g : r).indexOf(k);
    return move(k, k.side === 'guard' ? W / 2 - 22 - i * 22 : W / 2 + 22 + i * 22, 1100);
  }));
  hooves.remove();
  if (show.judged?.length && !state.skip) await judgement(scene, layer, show.judged, { guard: g.flatMap((k) => [k.horse, k.rider]), rising: r.flatMap((k) => [k.horse, k.rider]) }, wait);

  // Swords ring as they meet.
  for (let i = 0; i < 3; i++) {
    if (!state.skip) playSound(scene, 'clash', 0.7);
    sparks(scene, layer, W / 2, GROUND - 40);
    for (const k of [g[0]!, r[0]!]) scene.tweens.add({ targets: [k.horse, k.rider], x: k.horse.x + (k.side === 'guard' ? 4 : -4), duration: 80, yoyo: true });
    await wait(260);
  }
  const winners = show.winner === 'guard' ? g : r;
  const losers = show.winner === 'guard' ? r : g;
  if (show.wiped) {
    // Under the Lord's judgement (Jack): this once, the losers are cut down to the last.
    for (const k of losers) {
      if (!state.skip) playSound(scene, 'clash', 0.8);
      sparks(scene, layer, k.horse.x, GROUND - 30);
      fall(scene, k.rider, k.side, state.skip);
      fall(scene, k.horse, k.side, state.skip);
      await wait(260);
    }
  } else {
    // The losers turn and ride off the way they came; the winners ride on through.
    for (const k of losers) (k.horse.setFlipX(!k.horse.flipX), k.rider.setFlipX(!k.rider.flipX));
    if (!state.skip) playSound(scene, 'gallop', 0.7);
    await Promise.all(losers.map((k) => move(k, k.side === 'guard' ? -60 : W + 60, 900)));
  }
  gallop.remove();
  for (const k of winners) scene.tweens.add({ targets: k.rider, y: k.rider.y - 8, duration: 160, yoyo: true, repeat: 1 });
  const yours = show.winner === show.you;
  words(scene, layer, 50, yours ? 'First there!' : 'Beaten to it!', yours ? SHADES.white : SHADES.dim, 3);
  if (show.wiped) words(scene, layer, 78, `${show.winner === show.you ? 'Theirs' : 'Yours'} wiped out.`, SHADES.light);
  state.skip = false;
  await wait(1200);
  await close();
}

function sparks(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, x: number, y: number): void {
  for (let i = 0; i < 6; i++) {
    const sx = x + Phaser.Math.Between(-6, 6);
    const sy = y + Phaser.Math.Between(-8, 8);
    const spark = scene.add.rectangle(sx, sy, 2, 2, i % 2 ? SHADES.white : SHADES.amber);
    layer.add(spark);
    scene.tweens.add({ targets: spark, x: sx + Phaser.Math.Between(-18, 18), y: sy + Phaser.Math.Between(-14, 6), alpha: 0, duration: 300, onComplete: () => spark.destroy() });
  }
}

function fall(scene: Phaser.Scene, img: Phaser.GameObjects.Image, side: Side, skip: boolean): void {
  const away = side === 'guard' ? -1 : 1;
  scene.tweens.add({ targets: img, angle: 80 * away, x: img.x + 8 * away, y: img.y + 4, alpha: 0.55, duration: skip ? 0 : 260, ease: 'Quad.easeIn' });
  img.setTint(0x777777);
}
