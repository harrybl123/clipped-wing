import { noise, SHADES } from './pixelArt';
import type { RowSprite } from './sprites';

// PLACEHOLDER art for the carving close-up (src/scenes/CarveScene.ts): the bird on the bench at each
// stage of carving, from a plain block to the finished bird. Bare wood (carvings are never red), lit
// from the fire on the left. Pure (no Phaser), so it can be tested.

export const CARVE_W = 150;
export const CARVE_H = 100;

/** 0 the block, 1 roughed out, 2 smoothed, 3 the wing cut, 4 the eye. */
export type CarveStage = 0 | 1 | 2 | 3 | 4;

export interface CarveOptions {
  kind: 'fledgling' | 'usual';
  size?: string; // "tiny" | "small" (fledgling)
  eye?: string; // "open" | "sleepy"
}

/** Freshly carved wood is pale: lit edge, face, shaded edge, grooves, and the clean white of a new cut. */
const COLOURS = { l: SHADES.white, w: SHADES.light, d: SHADES.dim, s: SHADES.woodLight, c: SHADES.white };

/** The bird's size and centre on the canvas. */
function frame(opts: CarveOptions) {
  const fledgling = opts.kind === 'fledgling';
  return { fledgling, k: fledgling ? (opts.size === 'tiny' ? 0.62 : 0.78) : 1, cx: CARVE_W / 2 + 8, cy: CARVE_H / 2 + 12 };
}

/** Where the eye goes on the canvas (for the eye step's ring). */
export function eyePosition(opts: CarveOptions): { x: number; y: number } {
  const { fledgling, k, cx, cy } = frame(opts);
  const head = { x: cx - (fledgling ? 30 : 38) * k, y: cy - 18 * k, r: (fledgling ? 16 : 13) * k };
  return { x: Math.round(head.x - head.r * 0.35), y: Math.round(head.y - head.r * 0.15) };
}

/** Where the wing ends (a fledgling's is clipped there): the x on the canvas, and the wing's centre y. */
export function wingPosition(opts: CarveOptions): { x: number; y: number; from: number } {
  const { fledgling, k, cx, cy } = frame(opts);
  const wingX = cx + 4 * k;
  return { x: Math.round(fledgling ? wingX + 6 * k : wingX + 26 * k), y: Math.round(cy - 6 * k), from: Math.round(wingX - 26 * k) };
}

/** The bird, facing left, at a stage of carving. */
export function carvedBird(stage: CarveStage, opts: CarveOptions): RowSprite {
  const { fledgling, k, cx, cy } = frame(opts);
  // The bird's parts (a fledgling: rounder, bigger head, stubby tail).
  const body = { x: cx, y: cy, rx: 36 * k, ry: (fledgling ? 24 : 19) * k };
  const head = { x: cx - (fledgling ? 30 : 38) * k, y: cy - 18 * k, r: (fledgling ? 16 : 13) * k };
  const tail: [number, number][] = fledgling
    ? [[cx + 30 * k, cy - 6 * k], [cx + 46 * k, cy - 12 * k], [cx + 44 * k, cy + 2 * k]]
    : [[cx + 30 * k, cy - 6 * k], [cx + 62 * k, cy - 16 * k], [cx + 58 * k, cy + 4 * k]];
  const beak: [number, number][] = [[head.x - head.r + 2, head.y - 3 * k], [head.x - head.r - 10 * k, head.y + 1], [head.x - head.r + 2, head.y + 4 * k]];
  const wing = { x: cx + 4 * k, y: cy - 6 * k, rx: 26 * k, ry: 11 * k };
  // A fledgling's wing is clipped: cut off straight, short of where it should end. Your usual bird's sags a little (heavy).
  const wingEnd = fledgling ? wing.x + 6 * k : Infinity;
  const sag = fledgling ? 0 : 3 * k;

  const inEllipse = (x: number, y: number, e: { x: number; y: number; rx: number; ry: number }, slack = 0) => ((x - e.x) / e.rx) ** 2 + ((y - e.y) / e.ry) ** 2 <= 1 + slack;
  const inTriangle = (x: number, y: number, t: [number, number][]) => {
    const [a, b, c] = t as [[number, number], [number, number], [number, number]];
    const d = (p: [number, number], q: [number, number]) => (x - q[0]) * (p[1] - q[1]) - (p[0] - q[0]) * (y - q[1]);
    const d1 = d(a, b), d2 = d(b, c), d3 = d(c, a);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  const inBird = (x: number, y: number, slack = 0) =>
    inEllipse(x, y, body, slack) || inEllipse(x, y, { x: head.x, y: head.y, rx: head.r, ry: head.r }, slack) || inTriangle(x, y, tail) || inTriangle(x, y, beak);
  const inWing = (x: number, y: number) => x <= wingEnd && inEllipse(x, y - (x > wing.x ? ((x - wing.x) / wing.rx) * sag : 0), wing);

  const grid: string[][] = Array.from({ length: CARVE_H }, () => Array<string>(CARVE_W).fill('.'));
  const inside = (x: number, y: number): boolean => {
    if (stage === 0) return Math.abs(x - cx) < 52 * k + 6 && Math.abs(y - cy + 6) < 34 * k + 4;
    if (stage === 1) {
      // Roughed out: blocky, with chunks still to come off.
      const bx = Math.floor(x / 3) * 3 + 1;
      const by = Math.floor(y / 3) * 3 + 1;
      return inBird(bx, by, 0.25 + 0.2 * noise(bx * 0.3 + by * 0.7));
    }
    return inBird(x, y);
  };
  for (let y = 0; y < CARVE_H; y++) {
    for (let x = 0; x < CARVE_W; x++) {
      if (!inside(x, y)) continue;
      const edgeLit = !inside(x - 1, y) || !inside(x, y - 1);
      const edgeDark = !inside(x + 1, y) || !inside(x, y + 1);
      let ch = edgeLit ? 'l' : edgeDark ? 'd' : 'w';
      if (stage === 0 && (y + Math.round(noise(x * 0.1) * 2)) % 6 === 0) ch = 'd'; // grain on the block
      if (stage >= 3 && inWing(x, y)) {
        const wingEdge = !inWing(x - 1, y) || !inWing(x + 1, y) || !inWing(x, y - 1) || !inWing(x, y + 1);
        // Feather grooves along the wing.
        ch = wingEdge ? 's' : (x - y * 0.6) % 6 < 1 ? 'd' : ch;
        if (fledgling && x >= wingEnd - 1) ch = 'c'; // the fresh, clean cut
      }
      grid[y]![x] = ch;
    }
  }
  if (stage >= 4) {
    const { x: ex, y: ey } = eyePosition(opts);
    if (opts.eye === 'sleepy') for (let dx = -2; dx <= 2; dx++) grid[ey]![ex + dx] = 's';
    else {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) grid[ey + dy]![ex + dx] = 's';
      grid[ey - 1]![ex - 1] = 'c';
    }
  }
  return { rows: grid.map((r) => r.join('')), colours: COLOURS };
}
