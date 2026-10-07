import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the brothel (Chapter 2), shown with restraint: the front room and the
// madam, nothing explicit. The most comfortable room in the settlement, which says something: soft
// cloth hung over the metal everywhere, cushions, lamps with coloured glass shades. The signature:
// the madam's ledger.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  g: S.cyanDeep, G: S.cyanMid, c: S.cyan, W: S.white, a: S.amber, A: S.amberDeep, e: S.greenMid, E: S.greenDeep,
};

/** Cloth hung over the wall in folds, gathered at the top, falling to a hem. `tone`: its colour. */
export const drape = (width: number, height: number, tone: 'a' | 'G' | 'e'): RowSprite => {
  const dark = tone === 'a' ? 'A' : tone === 'G' ? 'g' : 'E';
  return {
    rows: fill(width, height, (x, y) => {
      if (y === 0) return 'm';
      // Folds: light and dark stripes, narrower near the top where it's gathered.
      const pinch = 1 - Math.min(1, y / 12) * 0.5;
      const fold = Math.sin((x / (5 * (1.5 - pinch))) * Math.PI);
      if (y === height - 1 && x % 4 === 2) return '.';
      return fold > 0.75 ? tone : fold < -0.3 ? 's' : dark; // deep cloth, light only on the folds
    }),
    colours: C,
  };
};

/** A swag of cloth hung across the ceiling between two points, sagging. */
export const swag = (width: number, tone: 'a' | 'G' | 'e'): RowSprite => ({
  rows: fill(width, 12, (x, y) => {
    const sag = Math.round(Math.sin((x / (width - 1)) * Math.PI) * 8);
    if (y < sag || y > sag + 3) return '.';
    return y === sag + 3 ? (tone === 'a' ? 'A' : tone === 'G' ? 'g' : 'E') : tone;
  }),
  colours: C,
});

/** The madam's seat: a high-backed chair, padded, a cushion; a little desk beside it with the ledger. */
export const MADAMS_SEAT: RowSprite = {
  rows: fill(40, 36, (x, y) => {
    // The chair.
    if (x < 22) {
      if (x < 4 && y >= 2) return x === 0 ? 'd' : y % 6 === 0 ? 'A' : 'a'; // the high back
      if (y >= 18 && y < 24) return y === 18 ? 'h' : 'a'; // the seat
      if (y >= 22 && y < 26 && x > 4 && x < 12) return 'G'; // a cushion
      if (y >= 24 && (x === 2 || x === 19)) return 'n';
      if (y >= 12 && y < 18 && x >= 18) return y === 12 ? 'h' : 'A'; // the arm
      return '.';
    }
    // The desk and the ledger on it.
    if (y >= 20 && y < 22) return 'h';
    if (y >= 22 && (x === 24 || x === 37)) return 'n';
    if (y >= 14 && y < 20 && x >= 26 && x < 36) return y === 14 ? 'p' : y === 19 ? 'd' : x === 31 ? 'd' : x < 31 ? 'p' : 'h'; // the open ledger
    if (y >= 8 && y < 14 && x >= 33 && x < 35) return y < 10 ? 'a' : 'm'; // a lamp
    return '.';
  }),
  colours: C,
};

/** A low couch heaped with cushions. */
export const couch = (width: number): RowSprite => ({
  rows: fill(width, 16, (x, y) => {
    if (y < 6) {
      const c = Math.floor(x / 9);
      const lx = x % 9;
      if (lx === 0 || lx === 8) return '.';
      const top = 1 + (c % 2);
      if (y < top) return '.';
      return ['a', 'G', 'e', 'A'][c % 4]!;
    }
    if (y === 6) return 'h';
    if (y < 12) return x === 0 || x === width - 1 ? 'A' : 'a';
    if (y === 12) return 'A';
    return x < 3 || x > width - 4 ? 'n' : '.';
  }),
  colours: C,
});

/** A lamp with a coloured glass shade, hung on a cord. */
export const shadedLamp = (tone: 'a' | 'G'): RowSprite => ({
  rows: tone === 'a' ? ['..mm..', '.aaaa.', 'aAWWAa', '.AaaA.'] : ['..mm..', '.GGGG.', 'GgWWgG', '.gGGg.'],
  colours: C,
});

/** A curtained doorway along the gallery. */
export const curtainedDoor = (tone: 'a' | 'G' | 'e'): RowSprite => {
  const dark = tone === 'a' ? 'A' : tone === 'G' ? 'g' : 'E';
  return {
    rows: fill(18, 32, (x, y) => (x === 0 || x === 17 || y === 0 ? 'd' : y === 1 ? 'm' : x % 4 === 0 ? dark : tone)),
    colours: C,
  };
};

/** The back door to the alley: plain, a bar across it. */
export const BACK_DOOR: RowSprite = {
  rows: fill(16, 34, (x, y) => (x === 0 || x === 15 || y === 0 ? 'd' : y === 17 ? 'h' : y % 11 === 0 ? 'd' : 'n')),
  colours: C,
};

/** A rug, thick, patterned. */
export const rug = (width: number): RowSprite => ({
  rows: fill(width, 3, (x, y) => (y === 0 ? (x % 6 < 3 ? 'a' : 'G') : y === 1 ? (x % 4 === 0 ? 'h' : 'A') : 'A')),
  colours: C,
});
