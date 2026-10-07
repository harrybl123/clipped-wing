import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the swap yard (Chapter 2): the market, finds for food. Loud and
// crowded; stalls made from upturned casings under awnings of cloth and cable-mesh, the food poor
// (roots, dried things, a pot of something), the scrap on the tables beautiful and nobody caring.
// Its signature: the food stall's scales, where a meal is weighed out against scrap.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const speck = (x: number, y: number, seed: number) => ((x * 73 + y * 151 + seed * 37) % 97) / 97;

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  g: S.cyanDeep, G: S.cyanMid, c: S.cyan, W: S.white, a: S.amber, A: S.amberDeep, e: S.greenMid, E: S.greenDeep,
};

/** Awning stripes, by stall. */
const STRIPES = [['a', 'p'], ['G', 'h'], ['A', 'a'], ['e', 'p'], ['h', 'G']] as const;

/**
 * A stall: an upturned casing for a counter, an awning on two poles (striped cloth, or cable-mesh),
 * wares on the counter and finds hanging from the awning's edge. `wares`: 'scrap' (bright parts),
 * 'food' (roots and dried things) or 'pots'.
 */
export const stall = (width: number, kind: number, wares: 'scrap' | 'food' | 'pots'): RowSprite => {
  const height = 46;
  const [s1, s2] = STRIPES[kind % STRIPES.length]!;
  const mesh = kind % 4 === 3;
  return {
    rows: fill(width, height, (x, y) => {
      // The awning: a sloped strip with a scalloped edge.
      if (y < 8) {
        if (y === 0) return x === 0 || x === width - 1 ? '.' : 'd';
        if (mesh) return (x + y) % 3 === 0 ? 'm' : (x - y) % 3 === 0 ? 'n' : '.';
        if (y === 7) return x % 4 < 2 ? (Math.floor(x / 4) % 2 ? s1 : s2) : '.';
        return Math.floor(x / 4) % 2 ? s1 : s2;
      }
      // Finds hanging from the edge on strings.
      if (y < 18 && x % 9 === 4 && x > 2 && x < width - 3) {
        const len = 3 + (x % 5);
        if (y < 8 + len) return 'm';
        if (y < 11 + len) return wares === 'food' ? (x % 2 ? 'A' : 'p') : (['c', 'a', 'W', 'G'][x % 4] as string);
        return '.';
      }
      // Poles.
      if (x === 1 || x === width - 2) return y < height ? 'n' : '.';
      // The counter: an upturned casing, rounded at the ends, a seam, bolts.
      if (y >= height - 20) {
        const cy = y - (height - 20);
        const inset = cy === 0 ? 3 : cy === 1 ? 1 : 0;
        if (x < 3 + inset || x > width - 4 - inset) return '.';
        if (cy === 0) return 'h';
        if (cy === 1) return 'm';
        if (cy === 10) return 'd';
        if ((x === 6 || x === width - 7) && (cy === 4 || cy === 15)) return 'h';
        return cy > 16 ? 'd' : speck(x, y, kind) > 0.9 ? 'm' : 'n';
      }
      // Wares on the counter.
      if (y >= height - 26 && y < height - 20) {
        const wy = y - (height - 26);
        const slot = Math.floor((x - 4) / 6);
        const lx = (x - 4) % 6;
        if (x < 4 || x > width - 6) return '.';
        const tall = 2 + ((slot * 7 + kind) % 4);
        if (wy < 6 - tall || lx > 3) return '.';
        if (wares === 'food') return (slot + kind) % 3 === 0 ? 'A' : (slot + kind) % 3 === 1 ? 'p' : 'E';
        if (wares === 'pots') return wy === 6 - tall ? 'h' : 'm';
        return [['c', 'G'], ['a', 'A'], ['W', 'h'], ['m', 'n'], ['e', 'E']][(slot * 3 + kind) % 5]![wy === 6 - tall ? 0 : 1]!;
      }
      return '.';
    }),
    colours: C,
  };
};

/** The food stall's scales: a beam on a post, a pan of food on one side, a heap of scrap on the other. */
export const SCALES: RowSprite = {
  rows: [
    '..........h..........',
    '.........hmh.........',
    'mmmmmmmmmmmmmmmmmmmmm',
    'm.........n.........m',
    'm.........n.........m',
    'm.........n.........m',
    'm.........n.........m',
    '.m.......n.n.......m.',
    '..m.....n...n.....m..',
    'pAp.....n...n...caW..',
    'AppA....n...n..GaWmc.',
    'hhhhh...n...n..hhhhh.',
    '.mmm...nnnnnnn..mmm..',
  ],
  colours: C,
};

/** The board of prices in scavenger signs: a meal against so much of each kind of find. */
export const PRICE_BOARD: RowSprite = {
  rows: fill(30, 22, (x, y) => {
    if (y >= 18) return x === 4 || x === 25 ? 'n' : '.'; // legs
    if (x === 0 || x === 29 || y === 0 || y === 17) return 'd';
    // Rows of signs: a bowl, then strokes for how much, then a mark for the kind of find.
    const row = Math.floor((y - 2) / 5);
    const ly = (y - 2) % 5;
    if (row > 2 || ly > 2) return 'p';
    if (x >= 3 && x <= 6) return ly === 2 || (ly === 1 && (x === 3 || x === 6)) ? 'd' : 'p'; // the bowl
    if (x >= 9 && x <= 9 + (row + 1) * 2 && (x - 9) % 2 === 0) return 'd'; // strokes
    if (x >= 20 && x <= 24) return [ly === 1, x === 22 || ly === 1, (x + ly) % 2 === 0][row] ? 'd' : 'p';
    return 'p';
  }),
  colours: C,
};

/** A pot of something on a fire ring. */
export const POT: RowSprite = {
  rows: [
    '..n.....n..',
    '.nmmmmmmmn.',
    'nmmmmmmmmmn',
    'nnmmmmmmmnn',
    '.nnnnnnnnn.',
    '..d.....d..',
    '.ddd...ddd.',
  ],
  colours: C,
};

/** The fence's alcove: a dark nook in a shack wall, a cloth half drawn across it, a lamp low inside. */
export const ALCOVE: RowSprite = {
  rows: fill(40, 50, (x, y) => {
    if (y < 4) return y === 0 ? 'h' : 'm'; // the lintel
    if (x < 3 || x > 36) return x === 2 || x === 37 ? 'd' : 'n';
    // The cloth, drawn across the left half.
    if (x < 18) return y === 4 ? 'm' : (x + Math.floor(y / 5)) % 5 === 0 ? 'A' : 'a';
    if (y > 38 && x > 26 && x < 32) return y === 39 ? 'a' : 'A'; // a lamp, low
    return y > 46 ? 'w' : 's';
  }),
  colours: C,
};

/** A shack front behind the stalls: panels, a door, a window, a strip of roof. */
export const shackFront = (width: number, height: number, seed: number): RowSprite => {
  const door = 4 + (seed * 13) % Math.max(1, width - 16);
  return {
    rows: fill(width, height, (x, y) => {
      if (y < 3) return y === 0 ? 'h' : 'm';
      if (x === 0 || x === width - 1) return 'd';
      if (x >= door && x < door + 9 && y >= height - 18) return x === door || x === door + 8 || y === height - 18 ? 'd' : 's';
      const wx = door > width / 2 ? 5 : width - 15;
      if (x >= wx && x < wx + 10 && y >= 8 && y < 16) return x === wx || x === wx + 9 || y === 8 || y === 15 ? 'd' : 'g';
      // Panels of different sizes: columns of varying width, each cut at its own heights.
      let col = 0;
      let left = 0;
      while (left + 8 + ((col * 7 + seed) % 9) <= x) left += 8 + ((col++ * 7 + seed) % 9);
      const cut = 6 + ((col * 5 + seed) % 11);
      if (x === left || y % (cut + 8) === cut) return 'd';
      const pick = (col * 13 + Math.floor(y / (cut + 8)) * 7 + seed * 3) % 16;
      if (pick === 0) return 'A';
      if (pick === 1) return 'g';
      if (pick < 4) return 'm';
      if ((pick === 5 || pick === 9) && x % 3 === 0) return 'w'; // corrugation
      return pick < 9 ? 'n' : 'w';
    }),
    colours: C,
  };
};

/** A gate: two posts and a crossbeam of hull plate, a sign hung under it. */
export const gate = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (y < 5) return y === 0 ? 'h' : y === 4 ? 'd' : 'm';
    if (x < 4 || x >= width - 4) return x === 0 || x === width - 1 ? 'd' : x < 2 || x > width - 3 ? 'm' : 'n';
    const sx = x - Math.floor(width / 2) + 6;
    if (y >= 6 && y < 7 && (sx === 2 || sx === 9)) return 'm';
    if (y >= 7 && y < 14 && sx >= 0 && sx < 12) return sx === 0 || sx === 11 || y === 7 || y === 13 ? 'd' : (sx + y) % 4 === 0 ? 'd' : 'p';
    return '.';
  }),
  colours: C,
});

/** A section of the settlement's wall: scrap plates standing on end, some taller, braced. */
export const wall = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const plate = Math.floor(x / 9);
    const top = (plate * 5) % 7;
    if (y < top) return '.';
    if (y === top) return 'h';
    if (x % 9 === 0) return 'd';
    return ['m', 'n', 'A', 'n', 'p', 'w'][(plate * 3) % 6]!;
  }),
  colours: C,
});

/** Crates stacked, to climb onto for a view over the crowd. */
export const crate = (w: number, h: number): RowSprite => ({
  rows: fill(w, h, (x, y) => (x === 0 || x === w - 1 || y === 0 || y === h - 1 || Math.abs(x - y * (w / h)) < 1 ? 'd' : y === 1 ? 'h' : 'p')),
  colours: C,
});
