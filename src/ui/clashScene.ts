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
// swords meeting, and one by one they fall, until one is left standing on the winning side. Any key or click
// skips to the end.

/** The rising: city folk with what came to hand. */
const REBELS: CapitalLook[] = CITIZEN_LOOKS.filter((l) => l.height >= 23).slice(0, 6).map((l, i) => ({ ...l, hold: (['spanner', 'baton', 'pike', 'brush'] as const)[i % 4], pose: 'side' }));
/** Most a side shows. */
const MOST = 6;
const GROUND = 206;

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
  /** The Lord's judgement on it (Jack): `dark`, the street plunged into darkness (cursed); `gold`, lit gold (blessed). */
  mood?: 'dark' | 'gold';
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

export async function playClash(scene: Phaser.Scene, show: ClashShow): Promise<void> {
  const cam = scene.cameras.main;
  const before = { zoom: cam.zoom, x: cam.scrollX, y: cam.scrollY };
  let skip = false;
  const onSkip = () => (skip = true);
  scene.input.keyboard?.on('keydown', onSkip);
  scene.input.on('pointerdown', onSkip);
  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      let left = ms;
      const ev = scene.time.addEvent({ delay: 20, loop: true, callback: () => {
        left -= 20;
        if (skip || left <= 0) (ev.remove(), resolve());
      } });
    });

  // "Clash!", and into the circle.
  playSound(scene, 'clash', 1);
  cam.shake(250, 0.01);
  const word = new PixelText(scene, 0, 0, 'Clash!', { color: SHADES.white, shadow: SHADES.shadow, scale: 3 }).setDepth(120).setScrollFactor(0);
  word.setPosition(Math.round((W - word.width) / 2), Math.round(H / 2 - 40));
  cam.pan(show.at.x, show.at.y, 450, 'Sine.easeIn');
  cam.zoomTo(4, 450, 'Sine.easeIn');
  await wait(500);
  cam.fadeOut(140, 0, 0, 0);
  await wait(160);
  word.destroy();
  cam.setZoom(1).setScroll(0, 0);

  // The street: dark, the guard's blue glow on the left, the rising's fires on the right, the ground.
  const layer = scene.add.container(0, 0).setDepth(110);
  const g = scene.add.graphics();
  layer.add(g);
  g.fillStyle(SHADES.shadow, 1).fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) {
    g.fillStyle(SHADES.cyanDeep, 0.18).fillRect(0, 60 + i * 8, W / 2 - i * 20, GROUND - 60 - i * 8);
    g.fillStyle(SHADES.amberDeep, 0.18).fillRect(W / 2 + i * 20, 60 + i * 8, W / 2 - i * 20, GROUND - 60 - i * 8);
  }
  // Buildings against the glow.
  for (let x = 0; x < W; x += 34) {
    const h = 40 + ((x * 37) % 50);
    g.fillStyle(SHADES.deep, 1).fillRect(x, GROUND - h - 30, 30, h + 30);
    for (let wy = GROUND - h - 22; wy < GROUND - 40; wy += 10) g.fillStyle(x < W / 2 ? SHADES.cyanDeep : SHADES.amberDeep, 1).fillRect(x + 6 + ((wy * 3) % 14), wy, 3, 4);
  }
  g.fillStyle(SHADES.wood, 1).fillRect(0, GROUND, W, 3);
  g.fillStyle(SHADES.deep, 1).fillRect(0, GROUND + 3, W, H - GROUND - 3);
  // Letterbox, and the odds.
  g.fillStyle(0x000000, 1).fillRect(0, 0, W, 34).fillRect(0, H - 30, W, 30);
  const pct = Math.round(show.chance * 100);
  const top = new PixelText(scene, 0, 12, `The guard v the rising, ${show.strength} each. Your odds: ${pct}%`, { color: SHADES.light, shadow: SHADES.shadow });
  top.setX(Math.round((W - top.width) / 2));
  layer.add(top);
  // Fires on the rising's side, flickering.
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
  // (The front ones in front.)
  for (const w of [...guard, ...rising].reverse()) layer.bringToTop(w.img);
  cam.fadeIn(160);
  await wait(250);

  // War cries, and the charge.
  playSound(scene, 'warcry', 1);
  playSound(scene, 'warcryLow', 0.9);
  let step = 0;
  const walking = scene.time.addEvent({ delay: 90, loop: true, callback: () => {
    step++;
    for (const w of [...guard, ...rising]) w.img.setTexture(w.tex.walk[step % w.tex.walk.length]!);
  } });
  const charge = [...guard, ...rising].map((w, i) => {
    const k = i % n;
    const x = w.side === 'guard' ? W / 2 - 12 - k * 13 : W / 2 + 12 + k * 13;
    return new Promise<void>((resolve) => scene.tweens.add({ targets: w.img, x, duration: skip ? 0 : 700, ease: 'Quad.easeIn', onComplete: () => resolve() }));
  });
  await Promise.all(charge);
  walking.remove();
  for (const w of [...guard, ...rising]) w.img.setTexture(w.tex.idle);

  // Cursed (Jack): the street's plunged into darkness, the fighters only shapes; blessed, it's lit gold.
  if (show.mood) {
    const wash = scene.add.rectangle(0, 34, W, H - 64, show.mood === 'dark' ? 0x000000 : SHADES.amber, 0).setOrigin(0);
    layer.add(wash);
    layer.bringToTop(wash);
    if (show.mood === 'dark') {
      for (const w of [...guard, ...rising]) w.img.setTint(0x2a2a2a);
      playSound(scene, 'slam', 0.6);
    } else playSound(scene, 'angel', 0.5);
    scene.tweens.add({ targets: wash, fillAlpha: show.mood === 'dark' ? 0.6 : 0.18, duration: skip ? 0 : 400 });
    await wait(400);
  }
  // Swords meet; they fall one by one, until only the winners' last are left.
  const winners = show.winner === 'guard' ? guard : rising;
  const losers = show.winner === 'guard' ? rising : guard;
  const standing = Math.min(n, Math.max(1, show.left));
  const falls = [...losers.slice(1), ...winners.slice(standing)].sort(() => Math.random() - 0.5);
  falls.push(losers[0]!);
  for (const w of falls) {
    if (!skip) playSound(scene, 'clash', 0.8);
    for (let i = 0; i < 6; i++) {
      const sx = W / 2 + Phaser.Math.Between(-6, 6);
      const sy = GROUND - 30 + Phaser.Math.Between(-8, 8);
      const spark = scene.add.rectangle(sx, sy, 2, 2, i % 2 ? SHADES.white : SHADES.amber);
      layer.add(spark);
      scene.tweens.add({ targets: spark, x: sx + Phaser.Math.Between(-18, 18), y: sy + Phaser.Math.Between(-14, 6), alpha: 0, duration: 300, onComplete: () => spark.destroy() });
    }
    // The front two lunge at each other.
    for (const front of [guard[0]!, rising[0]!]) scene.tweens.add({ targets: front.img, x: front.img.x + (front.side === 'guard' ? 4 : -4), duration: 80, yoyo: true });
    const away = w.side === 'guard' ? -1 : 1;
    scene.tweens.add({ targets: w.img, angle: 80 * away, x: w.img.x + 8 * away, y: w.img.y + 4, alpha: 0.55, duration: skip ? 0 : 260, ease: 'Quad.easeIn' });
    w.img.setTint(0x777777);
    await wait(320);
  }

  // Those left standing raise their weapons.
  for (const w of winners.slice(0, standing)) scene.tweens.add({ targets: w.img, y: w.img.y - 10, duration: 160, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
  const yours = show.winner === show.you;
  const result = new PixelText(scene, 0, H - 22, `${show.winner === 'guard' ? 'The guard take' : 'The rising take'} it, with ${show.left} left.`, { color: show.winner === 'guard' ? SHADES.cyan : SHADES.amber, shadow: SHADES.shadow });
  result.setX(Math.round((W - result.width) / 2));
  layer.add(result);
  const big = new PixelText(scene, 0, 50, yours ? 'Won!' : 'Lost!', { color: yours ? SHADES.white : SHADES.dim, shadow: SHADES.shadow, scale: 3 });
  big.setX(Math.round((W - big.width) / 2));
  layer.add(big);
  skip = false;
  await wait(1200);

  // Back to the table.
  cam.fadeOut(140, 0, 0, 0);
  await wait(160);
  flicker.remove();
  layer.destroy();
  cam.setZoom(before.zoom).setScroll(before.x, before.y);
  cam.fadeIn(200);
  scene.input.keyboard?.off('keydown', onSkip);
  scene.input.off('pointerdown', onSkip);
}
