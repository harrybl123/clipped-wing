import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the tree's edge (Chapter 2): where the borderland meets the tree's roots.
// The roots come out of the ground like walls, bigger than anything in the settlement; the bark dark and
// wet; in the cracks between them, the green glow of fungus, the only green out here besides the canopy.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  e: S.green, E: S.greenMid, f: S.greenDeep, a: S.amberDeep,
};

const rand = (x: number, y: number, seed: number) => {
  const v = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return v - Math.floor(v);
};

/**
 * A great root: rising out of the ground on the left and climbing to the top-right corner, thick as a
 * house, dark wet bark with long grain, a sheen along its top, fungus in the cracks.
 */
/** The row of a root's top edge at column x: a curve from the ground at the left up to the top at the right. */
export function rootTop(width: number, height: number, x: number): number {
  const t = x / (width - 1);
  return Math.max(0, Math.round(height - height * Math.pow(t, 0.7) - Math.sin(t * Math.PI) * 10));
}

export const root = (width: number, height: number, thickness: number, seed: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const top = rootTop(width, height, x);
    // Massive: the root fills right down to the ground, a wall; `thickness` is how far the lit bark goes before the shadow under it.
    if (y < top) return '.';
    const under = height;
    const ly = y - top;
    if (ly === 0) return 'm'; // the wet sheen along its top
    if (ly === 1) return 'n';
    if (y === under) return 's';
    // Long grain, following the curve.
    const grain = Math.round((ly + Math.sin(x / 17 + seed) * 3) * 1.3) % 6;
    // Cracks with fungus in them.
    const crack = rand(Math.floor(x / 14), Math.floor(ly / 9), seed);
    if (crack > 0.86 && Math.abs(((x % 14) - 7) - (ly % 9 - 4) * 0.4) < 1) return crack > 0.93 ? 'e' : 'E';
    if (crack > 0.86 && Math.abs(((x % 14) - 7) - (ly % 9 - 4) * 0.4) < 2) return 'f';
    return grain === 0 ? 'd' : grain === 3 ? 'w' : ly > thickness * 0.7 ? 's' : 'w';
  }),
  colours: C,
});

/** The crack between two roots: a tall dark gap, fungus glowing round its edges, black inside. */
export const CRACK: RowSprite = {
  rows: fill(30, 96, (x, y) => {
    const half = 3 + Math.round((y / 96) * 9 + Math.sin(y / 7) * 2);
    const d = Math.abs(x - 14.5);
    if (d > half + 2) return '.';
    if (d > half) return (y + x) % 3 === 0 ? 'e' : 'E'; // the glow round its lips
    if (d > half - 1) return 'f';
    return 's';
  }),
  colours: C,
};

/** Fungus growing on a root: a cluster of glowing caps. */
export const FUNGUS: RowSprite = { rows: ['.ee..e.', 'eEEe.Ee', '.ff..f.', '..f..f.'], colours: C };

/** A scavengers' warning sign, at a distance from the roots: a post, a plate scratched with the tree crossed out. */
export const WARNING: RowSprite = {
  rows: fill(16, 36, (x, y) => {
    if (x === 7 || x === 8) return y < 2 ? 'h' : 'n';
    if (y >= 3 && y < 17 && x >= 1 && x < 15) {
      if (x === 1 || x === 14 || y === 3 || y === 16) return 'd';
      // The tree: a trunk and a round top; struck through.
      if (Math.abs(x - y + 2) < 0.8 || Math.abs(x + y - 21) < 0.8) return 'd';
      if (x === 7 && y > 9 && y < 15) return 'n';
      if (Math.hypot(x - 7.5, y - 8) < 3) return 'n';
      return 'p';
    }
    return '.';
  }),
  colours: C,
};
