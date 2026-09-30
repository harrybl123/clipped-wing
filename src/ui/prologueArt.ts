import { addLight, falloff, noise, rgb, SHADES, smoothstep, type PixelColour, type RGB } from './pixelArt';
import type { RowSprite } from './sprites';

// PLACEHOLDER close-up art for the prologue: looking down at the workbench by firelight, the
// half-carved bird big in the middle, shavings and a spare chisel on the planks. No hands and no faces:
// the scene is the bird and the two voices (you and Mum). Each layer is drawn full-screen (480×270,
// transparent elsewhere) so the composition is easy to reason about. The carving knife is a small
// sprite moved so its tip follows the wing.

export const SCREEN_W = 480;
export const SCREEN_H = 270;

type Shade = (u: number, edgePx: number) => string;

/** A full-screen drawing surface with shape helpers. */
class Sheet {
  readonly g: string[][] = Array.from({ length: SCREEN_H }, () => Array.from({ length: SCREEN_W }, () => '.'));

  set(x: number, y: number, c: string): void {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px >= 0 && py >= 0 && px < SCREEN_W && py < SCREEN_H) this.g[py]![px] = c;
  }

  /** A filled ellipse. shade gets u (-1 left/lit … 1 right) and the distance in px to the rim. */
  ellipse(cx: number, cy: number, rx: number, ry: number, shade: Shade): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
        if (d <= 1) this.set(x, y, shade((x - cx) / rx, (1 - d) * Math.min(rx, ry)));
      }
    }
  }

  sprite(colours: Record<string, number>): RowSprite {
    return { rows: this.g.map((r) => r.join('')), colours };
  }
}

// --- The backdrop ---

/** The workbench from above, planks running across, lit by the fire off to the left; dark all round. */
export function paintBench(): (x: number, y: number) => PixelColour {
  const wood = rgb(SHADES.wood);
  const amber = rgb(SHADES.amber);
  return (x, y) => {
    const wobble = Math.round(noise(x / 60) * 3);
    if ((y + wobble) % 30 === 0) return SHADES.deep; // plank seams
    const plank = Math.floor((y + wobble) / 30);
    const grain = noise(x / 9 + plank * 13 + noise(y / 7) * 1.5) * 0.6 + noise(x / 2.5 + plank * 5) * 0.4;
    const vignette = smoothstep(0.35, 1.05, Math.hypot((x - 230) / 270, (y - 110) / 170));
    let c = wood.map((v) => v * (0.7 + 0.35 * grain) * (1 - 0.85 * vignette)) as RGB;
    c = addLight(c, amber, 0.6 * falloff(x, y, -40, 120, 380, 260)); // the fire
    return c;
  };
}

/** Shavings curled on the bench. */
export const SHAVINGS: RowSprite = {
  rows: ['.pp......l..', 'p..p....l.l.', '...p.pp.....', '.....p.p..pp', '..l.....pp..'],
  colours: { p: SHADES.woodPale, l: SHADES.light },
};

/** A second chisel lying on the bench. */
export const SPARE_CHISEL: RowSprite = {
  rows: ['hhhhhhhhhhhhmlllllllll.', 'HHHHHHHHHHHHmllllllllll', 'hhhhhhhhhhhhmlllllllll.'],
  colours: { h: SHADES.woodLight, H: SHADES.woodPale, m: SHADES.dim, l: SHADES.light },
};

// --- The bird ---

export type BirdFacing = 'left' | 'turning' | 'right';

/** The bird's centre line: it turns about this x. */
export const BIRD_CX = 250;

/** The wing's arc (bird facing left): top edge y for x from 222 to 286. */
const wingTop = (x: number) => 102 - Math.sqrt(Math.max(0, 1 - ((x - 254) / 32) ** 2)) * 16;

/**
 * The bird being carved, big: plump body, head, beak, tail, and the near wing: rough-hewn, or carved
 * with feathers if `nearWingCarved`.
 */
export function birdLayer(facing: BirdFacing, nearWingCarved: boolean): RowSprite {
  const s = new Sheet();
  const wood: Shade = (u, e) => (e < 1.1 ? 'o' : u < -0.3 ? 'P' : u < 0.35 ? 'p' : 'l');
  s.ellipse(BIRD_CX, 106, 50, 26, wood); // body
  s.ellipse(204, 84, 18, 17, wood); // head
  for (let i = 0; i < 14; i++) for (let dy = -Math.floor((14 - i) / 3); dy <= Math.floor((14 - i) / 3); dy++) s.set(186 - i, 88 + dy, i === 13 || Math.abs(dy) === Math.floor((14 - i) / 3) ? 'o' : 'P'); // beak
  for (let x = 294; x <= 324; x++) {
    const top = 92 - Math.floor((x - 294) * 0.45);
    const bottom = 112 + Math.floor((x - 294) * 0.2);
    for (let y = top; y <= bottom; y++) s.set(x, y, x === 324 || y === top || y === bottom ? 'o' : (x + y) % 9 === 0 ? 'f' : 'l'); // tail
  }
  s.ellipse(199, 79, 2.5, 2.5, () => 'k'); // eye
  const carved = nearWingCarved && facing !== 'turning';
  for (let x = 222; x <= 286; x++) {
    const top = wingTop(x);
    s.set(x, top, 'o');
    s.set(x, top + 1, 'o');
    if (carved) {
      if (x % 7 === 0) for (let k = 2; k <= 14; k++) s.set(x - Math.round(k * 0.45), top + k, 'f'); // feathers
    } else if ((x * 7) % 11 < 3) {
      s.set(x, top + 4, 'f'); // rough facets
      s.set(x + 1, top + 5, 'f');
    }
  }
  if (!carved) for (let i = 0; i < 26; i++) s.set(214 + ((i * 37) % 76), 112 + ((i * 11) % 14), 'f'); // chisel marks on the rough block
  let rows = s.g.map((r) => r.join(''));
  const mirror = (x: number) => 2 * BIRD_CX - x;
  if (facing === 'right') rows = rows.map((r) => Array.from({ length: SCREEN_W }, (_, x) => r[mirror(x)] ?? '.').join(''));
  if (facing === 'turning') rows = rows.map((r) => Array.from({ length: SCREEN_W }, (_, x) => r[Math.round(BIRD_CX + (x - BIRD_CX) / 0.5)] ?? '.').join(''));
  return { rows, colours: { P: SHADES.light, p: SHADES.woodPale, l: SHADES.woodLight, o: SHADES.deep, f: SHADES.wood, k: SHADES.shadow } };
}

/** Points along the wing to carve, in screen space, in the order the chisel travels. */
export function wingPath(facing: 'left' | 'right'): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let x = 224; x <= 284; x += 1) pts.push({ x: facing === 'left' ? x : 2 * BIRD_CX - x, y: wingTop(x) + 2 });
  return pts;
}

// --- The knife ---

/** Where the tip of the knife's blade is in CARVING_KNIFE (bottom-left). */
export const KNIFE_TIP = { x: 0, y: 25 };

/** The carving knife, blade down-left to the tip, the handle up-right; the blade catches the firelight. */
export const CARVING_KNIFE: RowSprite = (() => {
  const w = 44;
  const h = 27;
  const g = Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
  for (let t = 0; t <= 50; t += 0.5) {
    const x = KNIFE_TIP.x + t * 0.84;
    const y = KNIFE_TIP.y - t * 0.5;
    const half = t < 2 ? 0 : t < 20 ? 1 : t < 24 ? 2 : 2;
    for (let wv = -half; wv <= half; wv++) {
      const px = Math.round(x + wv * 0.5);
      const py = Math.round(y + wv * 0.84);
      if (px < 0 || py < 0 || px >= w || py >= h) continue;
      g[py]![px] = t < 20 ? (wv < 0 ? 'B' : 'b') : t < 24 ? 'm' : wv < 0 ? 'H' : wv > 1 ? 'o' : 'h';
    }
  }
  return { rows: g.map((r) => r.join('')), colours: { b: SHADES.light, B: SHADES.white, m: SHADES.dim, h: SHADES.woodLight, H: SHADES.woodPale, o: SHADES.deep } };
})();
