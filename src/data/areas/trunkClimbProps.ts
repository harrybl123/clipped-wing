import { SHADES as S } from '../../ui/pixelArt';
import type { RowSprite } from '../../ui/sprites';

// PLACEHOLDER pixel props for the trunk climb: a tall shaft up the inside of the trunk beside the
// tube. The ledges change as you climb, from glowing fungus shelves in the roots, to bark, to
// climbers' planks, to scavenged metal near the top: green into gold, and more tech higher up.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

export type LedgeKind = 'fungus' | 'bark' | 'plank' | 'metal';

/** A ledge to stand on, `width` px wide; its top row is the surface, with a chunky underside below. */
export const ledge = (width: number, kind: LedgeKind = 'plank'): RowSprite => {
  const mid = (width - 1) / 2;
  // How far down the underside reaches at column x: deepest in the middle, tapering to the ends.
  const depth = (x: number, max: number) => Math.round(max * (1 - ((x - mid) / (mid + 1)) ** 2));
  if (kind === 'fungus') {
    return {
      rows: fill(width, 10, (x, y) => {
        if (y > depth(x, 9)) return '.';
        if (y === 0) return (x * 3) % 7 === 0 ? 'w' : 'G';
        if (y === 1) return 'G';
        if (y === depth(x, 9)) return 'd';
        return (x + y * 2) % 5 === 0 ? 'G' : (y > 5 ? 'm' : 'g'); // gills underneath
      }),
      colours: { w: S.white, G: S.green, g: S.greenMid, m: S.greenDeep, d: S.greenDeep },
    };
  }
  if (kind === 'bark') {
    return {
      rows: fill(width, 12, (x, y) => {
        const d = depth(x, 11) - ((x * 7) % 3 === 0 ? 1 : 0);
        if (y > d) return '.';
        if (y === 0) return 'h';
        if (y === d) return 'o';
        return (x * 5 + y * 3) % 7 === 0 ? 'd' : x > mid + 4 ? 'l' : y === 1 ? 'l' : 'w';
      }),
      colours: { h: S.woodPale, l: S.woodLight, w: S.wood, d: S.deep, o: S.shadow },
    };
  }
  if (kind === 'metal') {
    return {
      rows: fill(width, 12, (x, y) => {
        if (y === 0) return 'h';
        if (y <= 2) return x % 8 === 3 && y === 1 ? 'r' : 'm';
        if (y === 3) return 'd';
        // Angled brackets under each end.
        for (const bx of [3, width - 4]) if (Math.abs(x - bx) === Math.max(0, 11 - y) || (x === bx && y > 3)) return 'm';
        return '.';
      }),
      colours: { h: S.light, m: S.dim, d: S.deep, r: S.cyanMid },
    };
  }
  return {
    rows: fill(width, 12, (x, y) => {
      if (y === 0) return 'h';
      if (y <= 2) return x % 13 === 12 ? 'd' : 'p';
      if (y === 3) return 'd';
      // A diagonal strut from the wall under each end.
      for (const bx of [4, width - 5]) {
        const dx = bx < mid ? x - bx : bx - x;
        if (dx === y - 4 || dx === y - 3) return 'k';
      }
      return '.';
    }),
    colours: { h: S.woodPale, p: S.woodLight, d: S.deep, k: S.wood },
  };
};

/** A knothole in the trunk wall: a dark hollow with a rim. */
export const KNOTHOLE: RowSprite = {
  rows: fill(12, 14, (x, y) => {
    const d = Math.hypot((x - 5.5) / 6, (y - 6.5) / 7);
    if (d > 1) return '.';
    if (d > 0.75) return x > 6 ? 'l' : 'o';
    if (d > 0.5) return 'd';
    return 'k';
  }),
  colours: { o: S.deep, l: S.woodLight, d: S.deep, k: S.shadow },
};

/** A column of handholds cut into the wall, `height` px tall. */
export const handholds = (height: number): RowSprite => ({
  rows: fill(5, height, (x, y) => (y % 10 === 0 ? (x === 4 ? 'l' : 'd') : y % 10 === 1 && x < 4 ? 'o' : '.')),
  colours: { d: S.deep, o: S.shadow, l: S.woodLight },
});

/** A blanket and a water skin left in a rest nook by climbers. */
export const REST_GEAR: RowSprite = {
  rows: ['......ww.....', '.....wWWw....', 'aagaag.wWw...', 'agaagaawww...', 'aaaaaaaaaaaaa'],
  colours: { a: S.amberDeep, g: S.greenDeep, w: S.woodLight, W: S.woodPale },
};

/** Roots crossing in front of the tube: a loose lattice you can see the light through. */
export const rootLattice = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const a = (x + y) % 46;
    const b = (y - x + 460) % 58;
    if (a < 3 || b < 2) return a === 0 || b === 0 ? 'l' : 'd';
    return '.';
  }),
  colours: { d: S.deep, l: S.woodLight },
});

/** A scavenged metal ladder, riveted: a gift from above put to use. `height` px. */
export const metalLadder = (height: number): RowSprite => ({
  rows: fill(10, height, (x, y) => (x === 0 || x === 9 ? (y % 12 === 0 ? 'r' : x === 9 ? 'l' : 'm') : y % 6 === 2 ? 'l' : '.')),
  colours: { m: S.dim, l: S.light, r: S.cyanMid },
});

/** Climbers' marks scratched into the wall: little figures and notches, one for each who made it. */
export const CLIMBERS_MARKS: RowSprite = {
  rows: [
    '.s...s...s..s.s.s',
    'sss.sss.sss.s.s.s',
    '.s...s...s..s.s.s',
    's.s.s.s.s.s.s.s.s',
    '.................',
    's.s.s.s.s.s.s.s..',
    's.s.s.s.s.s.s.s..',
  ],
  colours: { s: S.woodPale },
};

/** A peg hammered into the wall to hang things from. */
export const PEG: RowSprite = { rows: ['kk', '.k'], colours: { k: S.woodPale } };

/** A plank hung on ropes, rigged by climbers: the platform of a lift or a slider. */
export const hangingPlank = (width: number): RowSprite => ({
  rows: fill(width, 4, (x, y) => (y === 0 ? 'h' : y === 3 ? (x === 2 || x === width - 3 ? 'k' : 'd') : x === 2 || x === width - 3 ? 'k' : 'p')),
  colours: { h: S.woodPale, p: S.woodLight, d: S.deep, k: S.dim },
});
