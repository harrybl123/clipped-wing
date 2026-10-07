import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the dog's hollow (Chapter 2): your secret training spot, a dip in the ground
// on the outskirts, sheltered by a toppled structure leaning over it like a roof. Quieter than anywhere
// else. Tough dry scrub (green belongs to the tree), the dog's bed, finds buried and dug up again.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  g: S.cyanDeep, G: S.cyanMid, c: S.cyan, W: S.white, a: S.amber, A: S.amberDeep,
};

/** The leaning shelter: a great slab toppled against the rim, its underside in shadow, struts still on it. */
export const SHELTER: RowSprite = {
  rows: fill(150, 74, (x, y) => {
    // The slab runs from the top left down to the ground on the right.
    const topEdge = Math.round(x * 0.42);
    const thick = 15;
    if (y >= topEdge && y < topEdge + thick) {
      const ly = y - topEdge;
      if (ly === 0) return 'h';
      if (ly === thick - 1) return 'd';
      if (x % 26 === 0) return 'd'; // seams
      if (x % 26 === 13 && ly === 3) return 'h'; // a bolt
      return ly < 3 ? 'm' : 'n';
    }
    // Struts hanging from its underside, broken off.
    if ((x === 40 || x === 41) && y >= topEdge + thick && y < topEdge + thick + 10) return 'n';
    if ((x === 90 || x === 91) && y >= topEdge + thick && y < topEdge + thick + 6) return 'n';
    return '.';
  }),
  colours: C,
};

/** The dog's bed: a nest of sacking and a blanket, in the slab's shadow. */
export const BED: RowSprite = {
  rows: ['...pppppppppp...', '.ppnpppAAAApppp.', 'pnppAAaaaaAAppnp', 'nnnnnnnnnnnnnnnn'],
  colours: C,
};

/** Your training things: a sack of finds to bury, a short spade, a bowl. */
export const TRAINING: RowSprite = {
  rows: [
    '..........m.......',
    '..........m.......',
    '.pp.......m.......',
    'pppp......m.......',
    'pnpp......m...mm..',
    'ppcpp....mmm.mhhm.',
    'ppppp....mmm..mm..',
  ],
  colours: C,
};

/** A spot where something was buried and dug up: a little mound, a stick pushed in to mark it. */
export const MARK: RowSprite = { rows: ['...n...', '...n...', '...n...', '..pnp..', '.ppppp.'], colours: C };

/** Tough dry scrub. */
export const scrub = (width: number, seed: number): RowSprite => ({
  rows: fill(width, 8, (x, y) => {
    const h = 3 + ((x * 7 + seed * 3) % 6);
    if (8 - y > h) return '.';
    return (x + y + seed) % 3 === 0 ? 'A' : (x + seed) % 2 ? 'p' : '.';
  }),
  colours: C,
});
