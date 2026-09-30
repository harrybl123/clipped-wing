import { addLight, falloff, noise, rgb, SHADES, smoothstep, type PixelColour, type RGB } from './pixelArt';
import type { RowSprite } from './sprites';

// PLACEHOLDER close-up art for the prologue, seen from the child's eyes looking down at the bench:
// the child's small arms come up from the bottom of the screen, one hand cupping the half-carved
// bird, the other gripping the chisel; Mum sits with you, her larger arms (in her patterned shawl)
// reaching round from the bottom corners, her hands over yours. No faces. Firelight from the left.
// Each layer is drawn full-screen (480×270, transparent elsewhere) so the composition is easy to
// reason about; the carving layer is moved as a whole so the chisel tip follows the wing.

export const SCREEN_W = 480;
export const SCREEN_H = 270;

const SKIN = { L: SHADES.light, M: SHADES.dim, S: SHADES.woodPale, E: SHADES.woodLight, o: SHADES.deep };
/** Mum's hands: a shade older and more worn than the child's. */
const MUM_SKIN = { l: SHADES.dim, m: SHADES.woodPale, s: SHADES.woodLight, e: SHADES.wood };
const CLOTH = { c: SHADES.deep, C: SHADES.wood, w: SHADES.amberDeep, t: SHADES.woodPale, k: SHADES.shadow };

type Shade = (u: number, edgePx: number) => string;

/** A full-screen drawing surface with shape helpers. */
class Sheet {
  readonly g: string[][] = Array.from({ length: SCREEN_H }, () => Array.from({ length: SCREEN_W }, () => '.'));

  set(x: number, y: number, c: string): void {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px >= 0 && py >= 0 && px < SCREEN_W && py < SCREEN_H) this.g[py]![px] = c;
  }

  clear(x: number, y: number): void {
    this.set(x, y, '.');
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

  /** A rounded bar (a finger, an arm) from (x0, y0) to (x1, y1), radius r. */
  capsule(x0: number, y0: number, x1: number, y1: number, r: number, shade: Shade): void {
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = (x1 - x0) / len;
    const ny = (y1 - y0) / len;
    for (let y = Math.floor(Math.min(y0, y1) - r); y <= Math.ceil(Math.max(y0, y1) + r); y++) {
      for (let x = Math.floor(Math.min(x0, x1) - r); x <= Math.ceil(Math.max(x0, x1) + r); x++) {
        const t = Math.max(0, Math.min(len, (x - x0) * nx + (y - y0) * ny));
        const dx = x - (x0 + nx * t);
        const dy = y - (y0 + ny * t);
        const d = Math.hypot(dx, dy) / r;
        if (d <= 1) this.set(x, y, shade(-ny * dx + nx * dy > 0 ? d : -d, (1 - d) * r));
      }
    }
  }

  sprite(colours: Record<string, number>): RowSprite {
    return { rows: this.g.map((r) => r.join('')), colours };
  }
}

/** Skin lit from the left, with a 1px outline. */
const skin: Shade = (u, e) => (e < 1.1 ? 'o' : u < -0.35 ? 'L' : u < 0.25 ? 'M' : u < 0.7 ? 'S' : 'E');
const mumSkin: Shade = (u, e) => (e < 1.1 ? 'o' : u < -0.35 ? 'l' : u < 0.25 ? 'm' : u < 0.7 ? 's' : 'e');
/** The child's plain tunic sleeve. */
const tunic: Shade = (u, e) => (e < 1.1 ? 'k' : u < -0.3 ? 'C' : 'c');
/** Mum's patterned shawl sleeve (her signature detail). */
const shawl: Shade = (u, e) => (e < 1.1 ? 'k' : Math.abs(Math.round(u * 7)) % 3 === 0 ? 't' : 'w');

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

const BIRD_CX = 250;

/** The wing's arc (bird facing left): top edge y for x from 222 to 286. */
const wingTop = (x: number) => 102 - Math.sqrt(Math.max(0, 1 - ((x - 254) / 32) ** 2)) * 16;

/**
 * The bird being carved, big: plump body, head, beak, tail, and the near wing. Rough-hewn until carved:
 * `wings` 0 = both rough, 1 = the first (left-facing side) carved, 2 = both carved.
 */
export function birdLayer(facing: BirdFacing, wings: number): RowSprite {
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
  const carved = wings >= (facing === 'right' ? 2 : 1);
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

// --- The hands ---

/** The chisel tip's position in the carving layer as drawn (the layer is moved so the tip follows the wing). */
export const CHISEL_TIP = { x: 224, y: 98 };
/** Where the child's thumb and forefinger are: where the chisel lands when it slips. */
export const THUMB = { x: 207, y: 108 };

/**
 * The child's left arm up from the bottom, the hand cupping the bird under its chest: fingers curled
 * over its belly, the thumb up round its neck. After the slip (`hurt`) the thumb and forefinger are
 * gone and it bleeds (red is the protagonist's colour).
 */
export function childLeftLayer(hurt: boolean): RowSprite {
  const s = new Sheet();
  s.capsule(212, 150, 176, 300, 15, tunic); // forearm in its sleeve, from off the bottom
  s.capsule(212, 146, 198, 176, 12, skin); // wrist
  s.ellipse(214, 138, 22, 15, skin); // palm
  const fingers: [number, number, number, number, number][] = [
    [226, 128, 262, 118, 5.2], // forefinger
    [230, 134, 268, 126, 5],
    [230, 141, 270, 135, 4.8],
    [226, 147, 262, 144, 4.4], // little finger
  ];
  fingers.forEach(([x0, y0, x1, y1, r], i) => {
    if (!(hurt && i === 0)) s.capsule(x0, y0, x1, y1, r, skin);
  });
  if (!hurt) s.capsule(198, 132, 207, 100, 6, skin); // thumb up round the bird's neck
  if (hurt) {
    const blood: [number, number, string][] = [];
    for (let i = 0; i < 9; i++) blood.push([200 + (i % 3), 128 + Math.floor(i / 3), 'r'], [226 + (i % 3), 125 + Math.floor(i / 3), 'r']);
    blood.push([201, 134, 'd'], [202, 138, 'd'], [228, 131, 'd'], [229, 136, 'd'], [214, 150, 'd'], [215, 156, 'd']);
    for (const [x, y, c] of blood) s.set(x, y, c);
  }
  return s.sprite({ ...SKIN, ...CLOTH, r: SHADES.red, d: SHADES.redDark });
}

/** Mum's left arm reaching round from the bottom-left, her hand steadying the bird's back over yours. */
export function mumLeftLayer(): RowSprite {
  const s = new Sheet();
  s.capsule(150, 140, 20, 300, 22, shawl); // her arm in the shawl, from off the bottom corner
  s.capsule(170, 120, 150, 142, 14, mumSkin); // wrist
  s.ellipse(184, 110, 21, 16, mumSkin); // back of her hand
  const fingers: [number, number, number, number][] = [
    [196, 98, 226, 80],
    [200, 104, 234, 90],
    [200, 111, 238, 102],
    [196, 118, 230, 114],
  ];
  for (const [x0, y0, x1, y1] of fingers) s.capsule(x0, y0, x1, y1, 5.6, mumSkin);
  return s.sprite({ ...MUM_SKIN, o: SHADES.deep, ...CLOTH });
}

/**
 * The carving hands: the child's right fist on the chisel (blade down-left to the wing), Mum's right
 * hand wrapped over it, both arms coming up from the bottom-right. The chisel tip is at CHISEL_TIP.
 */
export function carvingLayer(): RowSprite {
  const s = new Sheet();
  // Arms first (they're underneath): Mum's outside, the child's inside.
  s.capsule(290, 72, 470, 320, 22, shawl);
  s.capsule(270, 70, 360, 320, 14, tunic);
  // The chisel: blade, ferrule, handle, from the tip up and right.
  const along = (t: number) => ({ x: CHISEL_TIP.x + t * 0.8, y: CHISEL_TIP.y - t * 0.6 });
  for (let t = 0; t <= 70; t += 0.5) {
    const p = along(t);
    const half = t < 3 ? 1 : t < 26 ? 2 : t < 32 ? 3 : 3.5;
    for (let w = -half; w <= half; w++) {
      const c = t < 26 ? (w < 0 ? 'B' : 'b') : t < 32 ? 'm' : w < 0 ? 'H' : 'h';
      s.set(p.x - w * 0.6, p.y - w * 0.8, c);
    }
  }
  // The child's fist round the handle.
  s.ellipse(272, 62, 14, 12, skin);
  for (let i = 0; i < 4; i++) s.capsule(262 + i * 6, 70, 264 + i * 6, 75, 3.6, skin); // knuckles
  // Mum's hand over it: palm over the back of the fist, fingers curled round, thumb along the handle.
  s.ellipse(286, 56, 20, 15, mumSkin);
  for (let i = 0; i < 4; i++) s.capsule(272 + i * 8, 64, 266 + i * 7, 80, 5.4, mumSkin);
  s.capsule(272, 50, 252, 44, 6, mumSkin);
  return s.sprite({ ...SKIN, ...MUM_SKIN, o: SHADES.deep, ...CLOTH, b: SHADES.light, B: SHADES.white, m: SHADES.dim, h: SHADES.woodLight, H: SHADES.woodPale });
}
