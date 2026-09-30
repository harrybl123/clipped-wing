import { SHADES as S } from '../../ui/pixelArt';
import type { RowSprite } from '../../ui/sprites';

// PLACEHOLDER pixel props for the Ascension gate: high on the tube, where the chosen are given to
// it. The most machine-like thing in the tree (a riveted metal gate in the tube's wall, lit from
// within), framed by the finest carving (two great wings), under the Canopy's glare.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

/**
 * The gate: an arched opening in the tube's wall, framed in riveted metal with strips of cyan light,
 * the tube's white-hot light filling the opening.
 */
export const ASCENSION_GATE: RowSprite = {
  rows: fill(56, 72, (x, y) => {
    const cx = 27.5;
    const arch = (inset: number) => (y < 28 ? ((x - cx) / (28 - inset)) ** 2 + ((y - 28) / (28 - inset)) ** 2 <= 1 : Math.abs(x - cx) <= 28 - inset);
    if (!arch(0)) return '.';
    if (!arch(3)) return (x + y) % 6 === 0 ? 'r' : x > cx ? 'L' : 'm'; // outer metal band, rivets
    if (!arch(5)) return 'c'; // light strip
    if (!arch(8)) return (x + y) % 6 === 3 ? 'r' : x > cx ? 'L' : 'm'; // inner band
    // The opening, filled with the tube's light.
    const d = Math.abs(x - cx) / 20;
    return d < 0.35 ? 'W' : d < 0.75 ? 'C' : 'c';
  }),
  colours: { m: S.dim, L: S.light, r: S.cyanMid, c: S.cyanMid, C: S.cyan, W: S.white },
};

/** A great carved wing flanking the gate, feathers layered, bare polished wood. `flip` mirrors it. */
export const carvedWing = (flip: boolean): RowSprite => {
  const w = 60;
  const h = 64;
  return {
    rows: fill(w, h, (xx, y) => {
      const x = flip ? w - 1 - xx : xx; // drawn as a left wing; mirrored for the right
      // The wing's outline: a sweep from the root (right, near the gate) up and out to the tip (left).
      const t = 1 - x / (w - 1); // 0 at the root, 1 at the tip
      const top = 10 + t * 30 - Math.sin(t * Math.PI) * 26;
      const bottom = 60 - t * 16;
      if (y < top || y > bottom) return '.';
      // Rows of feathers: long primaries at the bottom edge, coverts above.
      const band = Math.floor((y - top) / 8);
      const fx = (x + band * 3) % 7;
      const featherEdge = (y - top) % 8 === 7 || fx === 0;
      if (y > bottom - 2 && x % 4 === 0) return '.'; // feather tips
      const lit = flip ? xx > w * 0.4 : xx < w * 0.6;
      if (featherEdge) return 'd';
      return (y - top) % 8 < 2 ? (lit ? 'W' : 'L') : lit ? 'p' : 'l';
    }),
    colours: { W: S.white, L: S.light, p: S.woodPale, l: S.woodLight, d: S.deep },
  };
};

/** A brazier on a stand. */
export const BRAZIER: RowSprite = {
  rows: ['dmmmmmmd', '.dmmmmd.', '..dmmd..', '...mm...', '...mm...', '...mm...', '..mmmm..', '.mmmmmm.'],
  colours: { d: S.dim, m: S.deep },
};

/** A viewing balcony for the crowd: a railed floor on carved brackets. `width` px. */
export const balcony = (width: number): RowSprite => ({
  rows: fill(width, 26, (x, y) => {
    if (y === 0) return 'h';
    if (y < 8) return x % 6 === 0 ? 'p' : '.';
    if (y === 8) return 'h';
    if (y <= 10) return 'p';
    if (y === 11) return 'd';
    const bx = x % 32;
    return bx === 26 - y || bx === 27 - y ? 'l' : '.';
  }),
  colours: { h: S.woodPale, p: S.woodLight, d: S.deep, l: S.woodLight },
});
