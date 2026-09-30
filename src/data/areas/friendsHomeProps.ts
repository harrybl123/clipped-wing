import { SHADES as S } from '../../ui/pixelArt';
import type { RowSprite } from '../../ui/sprites';

// PLACEHOLDER pixel props for your friend's home: a devout family, a little better off than
// yours and much tidier. Their one scavenged gift isn't put to use; it's kept as a relic in the
// household shrine.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

/**
 * The household shrine: an arched alcove carved into the wall, the tube's symbol inside it, and
 * the family's relic (a glowing scavenged cell) on a shelf between two candles, above a plinth.
 */
export const SHRINE: RowSprite = {
  rows: fill(40, 52, (x, y) => {
    const cx = 19.5;
    const inArch = (inset: number) =>
      y >= 12 ? Math.abs(x - cx) <= 19.5 - inset : ((x - cx) / (19.5 - inset)) ** 2 + ((y - 12) / (12 - inset)) ** 2 <= 1;
    if (!inArch(0)) return '.';
    if (y >= 38) return y === 38 ? 'h' : y === 51 ? 'k' : (x + 2) % 13 === 0 ? 'k' : 'f'; // plinth
    if (!inArch(2)) return x > cx ? 'r' : 'l';
    if (y === 35) return 'h'; // shelf
    if (y === 36) return 'k';
    // The relic: a cell in a little carved frame, white-hot at the centre.
    if (x >= 17 && x <= 22 && y >= 27 && y <= 34) {
      if (x === 17 || x === 22 || y === 27 || y === 34) return 'm';
      return (x === 19 || x === 20) && (y === 30 || y === 31) ? 'w' : 'c';
    }
    // Candles either side, flames amber.
    for (const cxl of [8, 31]) {
      if (x === cxl && y >= 30 && y <= 34) return 'p';
      if (x === cxl && y === 29) return 'a';
    }
    // The tube's symbol painted on the back of the alcove: a line through a ring.
    if ((x === 19 || x === 20) && y >= 6 && y <= 24) return 'q';
    if (Math.abs(Math.hypot(x - cx, y - 14) - 5) < 0.7) return 'q';
    return 'd';
  }),
  colours: { r: S.woodPale, l: S.woodLight, d: S.shadow, h: S.woodPale, k: S.deep, f: S.wood, m: S.dim, c: S.cyan, w: S.white, p: S.light, a: S.amber, q: S.cyanDeep },
};

/** A small picture drawn by your friend and pinned to the wall: the tube, someone rising, or the Canopy. */
export const drawing = (kind: 'tube' | 'rising' | 'canopy'): RowSprite => ({
  rows: fill(9, 11, (x, y) => {
    if (y === 0 && x === 4) return 'n'; // pin
    if (kind === 'tube') {
      if (y <= 2 && Math.abs(x - 4) <= 2 - y + 1 && y > 0) return 'w';
      if (x === 4 && y > 2 && y < 10) return 'c';
    } else if (kind === 'rising') {
      if (x === 6 && y >= 1) return 'c';
      if (x === 3 && y >= 3 && y <= 6) return 'd'; // a figure
      if ((x === 2 || x === 4) && y === 3) return 'd'; // arms up
      if (x === 3 && y === 2) return 'd';
      if (x === 3 && (y === 8 || y === 10)) return 'c'; // leaving the ground behind
    } else {
      if (Math.hypot(x - 4, y - 3) < 2.6) return 'w';
      if ((x + y) % 3 === 0 && Math.hypot(x - 4, y - 3) < 4.5) return 'a';
    }
    return y === 10 ? 'e' : 'p';
  }),
  colours: { p: S.woodPale, e: S.woodLight, n: S.light, w: S.white, c: S.cyanMid, d: S.shadow, a: S.amber },
});

/** A tidy chest with a band and a clasp. */
export const CHEST: RowSprite = {
  rows: fill(16, 10, (x, y) => {
    if (y === 0) return x === 0 || x === 15 ? '.' : 'h';
    if (y === 3) return 'b';
    if (x === 7 || x === 8) return y >= 2 && y <= 4 ? 'k' : 'b';
    return x === 0 || x === 15 ? 'e' : 'p';
  }),
  colours: { h: S.woodPale, p: S.woodLight, e: S.wood, b: S.deep, k: S.light },
};

/** A window frame round the back window, with its shutter swung open into the room. */
export const WINDOW_FRAME: RowSprite = {
  rows: fill(18, 30, (x, y) => {
    if (y <= 1) return y === 0 ? 'd' : 'f'; // lintel
    if (y >= 27) return y === 27 ? 'h' : 'f'; // sill
    if (x <= 1) return x === 0 ? 'd' : 'f';
    if (x >= 16) return 'f';
    return '.'; // the opening
  }),
  colours: { d: S.deep, f: S.woodLight, h: S.woodPale },
};

export const SHUTTER: RowSprite = {
  rows: fill(4, 24, (x, y) => (y % 7 === 3 ? 'b' : x === 0 ? 'e' : 'p')),
  colours: { p: S.woodPale, e: S.woodLight, b: S.deep },
};

/** A neat patterned runner laid along the family table. */
export const RUNNER: RowSprite = {
  rows: fill(30, 2, (x, y) => (y === 1 && x % 6 === 0 ? '.' : x % 6 < 3 ? 'a' : 'w')),
  colours: { a: S.amberDeep, w: S.light },
};

/** A handrail up the stairs: a diagonal rail rising left to right, with balusters down to each step. */
export const handrail = (steps: number, stepSize: number): RowSprite => {
  const w = steps * stepSize;
  const h = w + 20; // the rail runs about 12px above the step edges
  return {
    rows: fill(w, h, (x, y) => {
      const railY = h - 20 - x; // 45° up to the right
      if (y === railY || y === railY + 1) return y === railY ? 'h' : 'l';
      const stepTop = h - stepSize * (Math.floor(x / stepSize) + 1); // with the prop's bottom on the floor
      if (x % stepSize === stepSize - 4 && y > railY + 1 && y < stepTop) return 'l';
      return '.';
    }),
    colours: { h: S.woodPale, l: S.woodLight },
  };
};

/** A proper bed frame, a plain blanket folded straight, a pillow. (Yours is a straw mattress on the floor.) */
export const NEAT_BED: RowSprite = {
  rows: fill(48, 10, (x, y) => {
    if (y < 3) return x < 10 ? (y === 0 && (x === 0 || x === 9) ? '.' : 'w') : '.';
    if (y < 6) return x < 8 ? 's' : y === 3 ? 'C' : x === 30 ? 'e' : 'c';
    if (y === 6) return 'h';
    return x <= 1 || x >= 46 ? 'l' : y === 9 ? '.' : 'f';
  }),
  colours: { w: S.light, s: S.woodPale, c: S.cyanDeep, C: S.cyanMid, e: S.deep, h: S.woodPale, l: S.woodLight, f: S.wood },
};

/**
 * The family's mural above the shrine: the tube painted rising up the wall to a pale Canopy,
 * with little pale marks going up it (the risen). `height` px tall.
 */
export const mural = (height: number): RowSprite => ({
  rows: fill(15, height, (x, y) => {
    const dx = Math.abs(x - 7);
    if (y < 12) {
      const r = Math.hypot(x - 7, y - 6);
      if (r < 3) return 'w';
      if (r < 5.5) return (x + y) % 2 === 0 ? 'l' : '.';
      if (r < 7.5 && (x + y) % 4 === 0) return 'l';
      return '.';
    }
    if (dx === 0) return (y + 3) % 17 < 2 ? 'l' : 'c';
    if (dx <= 2) return 'q';
    return '.';
  }),
  colours: { w: S.white, l: S.light, c: S.cyanMid, q: S.cyanDeep },
});

/** A roof beam across the room, pegged into the walls. `width` px long. */
export const beam = (width: number): RowSprite => ({
  rows: fill(width, 5, (x, y) => (y === 0 ? 'h' : y === 4 ? 'd' : x % 30 === 15 && y === 2 ? 'k' : 'p')),
  colours: { h: S.woodPale, p: S.woodLight, d: S.deep, k: S.deep },
});

/** A cloak hung on a peg. */
export const CLOAK: RowSprite = {
  rows: ['..k..', '.ccc.', '.cCc.', 'ccCcc', 'ccCcc', 'ccCcc', 'cccCc', 'cccCc', 'ccccc', 'c.c.c'],
  colours: { k: S.light, c: S.woodLight, C: S.wood },
};

/** A neat stack of folded cloth. */
export const FOLDED_CLOTH: RowSprite = {
  rows: ['cccccccc', 'dddddddd', 'aaaaaaaa', 'dddddddd', 'wwwwwwww'],
  colours: { c: S.cyanDeep, a: S.amberDeep, w: S.woodPale, d: S.deep },
};
