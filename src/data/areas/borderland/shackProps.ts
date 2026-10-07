import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for your shack (Chapter 2): small, cramped, kept tidy by someone who's
// trying. Built from whatever could be carried home: a door cut from a panel, a fire in a cut-down
// casing, a table that was a hatch, crates; your brother's collection of small finds lined up by
// size, and one dead part that still glows faint cyan, his night light. Under a loose floor panel,
// a hollow where something could be kept out of sight.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  g: S.cyanDeep, G: S.cyanMid, c: S.cyan, W: S.white, a: S.amber, A: S.amberDeep, e: S.greenMid,
};

/** The door: a panel cut to size, a bar for a handle, a strip of cloth nailed over the gap at the top. */
export const DOOR: RowSprite = {
  rows: fill(18, 36, (x, y) => {
    if (x === 0 || x === 17) return 'd';
    if (y < 3) return x % 3 === 0 ? 'A' : 'a'; // the cloth
    if (y === 3) return 'd';
    if (x === 14 && y >= 16 && y <= 21) return 'h'; // the bar
    if (y === 12 || y === 26) return 'd'; // where two panels were joined
    if ((x === 2 || x === 15) && (y === 5 || y === 33 || y === 14 || y === 24)) return 'h';
    return y < 12 ? 'm' : y < 26 ? 'n' : 'p';
  }),
  colours: C,
};

/** Your kit by the door: a hook on a pole, a sack, a pry bar leaning. */
export const KIT: RowSprite = {
  rows: [
    '.mm.........',
    'm..m........',
    'm...........',
    'm...........',
    '.m.......h..',
    '.m......hm..',
    '.m......m...',
    '.m.....hm...',
    '.m.....m....',
    '.m....hm....',
    '.m.pp.m.....',
    '.mpppphm....',
    '.mpppnpm....',
    '.mppppp.....',
    '.mpnpppp....',
    '.mppppnp....',
    '.mppppppp...',
  ],
  colours: C,
};

/** The fire in a cut-down casing: a round drum with a grille, on three stubby legs. */
export const STOVE: RowSprite = {
  rows: fill(24, 18, (x, y) => {
    if (y >= 15) return x === 3 || x === 12 || x === 20 ? 'd' : '.';
    const d = Math.abs(x - 11.5) / 12;
    if (d > 0.98) return '.';
    if (y === 0) return 'h';
    if (y === 1) return 'm';
    if (y >= 5 && y <= 10 && x >= 5 && x <= 18) return x % 3 === 0 ? 'd' : '.'; // the grille, fire behind
    if (y === 14) return 'd';
    return x < 7 ? 'm' : x > 18 ? 'd' : 'n';
  }),
  colours: C,
};

/** A pipe for a chimney, up through the roof, a joint every so often. */
export const chimney = (height: number): RowSprite => ({
  rows: fill(4, height, (x, y) => (y % 22 === 0 ? 'h' : x === 0 ? 'm' : x === 3 ? 'd' : 'n')),
  colours: C,
});

/** The table: a round hatch (with its wheel still on) laid across two crates. */
export const TABLE: RowSprite = {
  rows: fill(42, 14, (x, y) => {
    if (y === 0) return x === 0 || x === 41 ? '.' : 'h';
    if (y === 1) return 'm';
    if (y === 2) return 'd';
    // Crates underneath.
    if (x <= 9 || x >= 32) {
      const lx = x <= 9 ? x : x - 32;
      if (lx === 0 || lx === 9 || y === 3 || y === 13 || lx === y - 3) return 'd';
      return 'p';
    }
    return '.';
  }),
  colours: C,
};

/** A crate (a seat, or a step up to the loft). */
export const crate = (w: number, h: number): RowSprite => ({
  rows: fill(w, h, (x, y) => (x === 0 || x === w - 1 || y === 0 || y === h - 1 || Math.abs(x - y * (w / h)) < 1 ? 'd' : y === 1 ? 'h' : 'p')),
  colours: C,
});

/** The loose floor panel: a plate that doesn't quite sit flat, a dark gap along one edge. */
export const FLOOR_PANEL: RowSprite = {
  rows: [
    'ssssssssssssssssssssssssss',
    'shhhhhhhhhhhhhhhhhhhhhhhhs',
    'smmhmmmmmmmmmmmmmmmmmhmmms',
  ],
  colours: C,
};

/** A water drum with a lid and a dipper. */
export const DRUM: RowSprite = {
  rows: fill(16, 22, (x, y) => {
    if (y === 0) return x === 0 || x === 15 ? '.' : 'h';
    if (y === 1 && x === 11) return 'm';
    if (x === 0 || x === 15) return 'd';
    if (y === 6 || y === 16) return 'd'; // hoops
    return x < 4 ? 'G' : x > 12 ? 'g' : 'G';
  }),
  colours: { ...C, G: S.cyanMid, g: S.cyanDeep },
};

/** The ration tally scratched into a wall panel: strokes in fives. */
export const tally = (count: number): RowSprite => {
  const groups = Math.ceil(count / 5);
  const width = groups * 7;
  return {
    rows: fill(width, 7, (x, y) => {
      const g = Math.floor(x / 7);
      const lx = x % 7;
      const inGroup = Math.min(5, count - g * 5);
      if (inGroup === 5 && lx <= 5 && Math.abs(y - (6 - lx)) < 0.6) return 'h'; // the fifth, struck through
      if (lx < 4 && lx < inGroup) return 'h'; // four strokes
      return '.';
    }),
    colours: C,
  };
};

/** The window: a slab of dark glass for a shutter, propped open on a rod, daylight in the gap. */
export const WINDOW: RowSprite = {
  rows: fill(30, 22, (x, y) => {
    if (x === 0 || x === 29 || y === 21) return 'd';
    if (y < 8) {
      // The glass shutter, propped out at the top.
      if (y === 0) return 'm';
      return (x + y) % 9 === 0 ? 'G' : 'g';
    }
    if (y === 8) return 'd';
    if (x === 22 && y < 16) return 'm'; // the rod
    // Daylight outside: pale haze, the plain.
    return y > 16 ? 'p' : y > 14 ? 'n' : 'W';
  }),
  colours: C,
};

/** A bed: a pad of stuffed cloth on a pallet, a blanket. */
export const bed = (w: number, blanket: string): RowSprite => ({
  rows: fill(w, 9, (x, y) => {
    if (y >= 7) return x % 6 === 0 ? 'd' : 'n'; // pallet
    if (y < 2) return x < 9 ? (y === 0 ? (x === 0 ? '.' : 'h') : 'h') : '.'; // pillow
    if (x < 9) return 'p';
    if (y === 2) return x === 9 ? blanket : 'h';
    return (x + y) % 5 === 0 ? 'd' : blanket;
  }),
  colours: C,
});

/** Your brother's collection: small finds on a shelf, lined up by size, smallest first. */
export const COLLECTION: RowSprite = {
  rows: [
    '.......................h..........',
    '...................c..hm.....WW...',
    '..............a...cGc.hm....WhhW..',
    '.........G...aAa..cGc.hm...WhhhhW.',
    '....m...GcG..aAa..GGG.hm...hhhhhh.',
    '.h.mhm..GcG.aAAAa.GgG.hm..hmhhmhh.',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'dddddddddddddddddddddddddddddddddd',
  ],
  colours: C,
};

/** His night light: a dead part that still glows faint cyan, nobody knows why. */
export const NIGHT_LIGHT: RowSprite = {
  rows: ['.mmmm.', 'mcWcGm', 'mGccGm', '.mmmm.'],
  colours: C,
};

/** The hole in the roof: sky through a torn sheet, its edges bent up. */
export const roofHole = (w: number): RowSprite => ({
  rows: fill(w, 6, (x, y) => {
    const edge = Math.round(2 + Math.sin(x * 1.3) * 1.5);
    if (y < edge) return x === 0 || x === w - 1 ? 'm' : 'W';
    if (y === edge) return 'h';
    return '.';
  }),
  colours: C,
});

/** A cloth hung on a line, dividing the loft. */
export const curtain = (h: number): RowSprite => ({
  rows: fill(10, h, (x, y) => (y === 0 ? 'm' : (x + Math.floor(y / 4)) % 4 === 0 ? 'A' : x % 3 === 0 ? 'p' : 'a')),
  colours: C,
});

/** The roof in section: corrugated sheets sloping down to the right, overhanging, weighed down with junk. */
export const roof = (w: number, drop: number): RowSprite => ({
  rows: fill(w, drop + 8, (x, y) => {
    const top = Math.round((x / w) * drop);
    const ly = y - top;
    if (ly < 0 || ly > 5) return '.';
    if (ly === 0) return x % 3 === 0 ? 'h' : 'm';
    if (ly === 5) return 'd';
    return x % 3 === 0 ? 'd' : (Math.floor(x / 40) % 3 === 1 ? 'A' : 'n');
  }),
  colours: C,
});

/** Weights on the roof: a tyre-shaped ring and a lump of casing. */
export const ROOF_JUNK: RowSprite = {
  rows: ['.mmmm.....hh.', 'm.dd.m...hmmh', 'mm..mm..hmmmm'],
  colours: C,
};

/** A rug of knotted strips of cloth. */
export const rug = (w: number): RowSprite => ({
  rows: fill(w, 2, (x, y) => (y === 0 ? (x === 0 || x === w - 1 ? '.' : (x >> 2) % 3 === 0 ? 'A' : (x >> 2) % 3 === 1 ? 'G' : 'p') : (x >> 2) % 2 ? 'A' : 'n')),
  colours: C,
});

/** Pegs on the wall with clothes hung on them. */
export const PEGS: RowSprite = {
  rows: [
    'mmmmmmmmmmmmmmmmmmmmmm',
    '.d.....d......d.......',
    'aaa...GGGG...ppp......',
    'aAaa..GgGG..pppp......',
    'aaAa..GGgG..ppnp......',
    '.aaa..GGGG...ppp......',
    '.aa....GG....pp.......',
    '..a..........p........',
  ],
  colours: C,
};

/** A shelf by the fire: a pot, a pan, tins cut from parts. */
export const POTS: RowSprite = {
  rows: [
    '......................',
    '.nnnn...........G.....',
    'nmmmmn..hhh..a.GcG.mm.',
    'nmmmmn.hmmmh.A.GGG.mm.',
    'nnnnnn.hmmmh.A.GGG.mm.',
    'mmmmmmmmmmmmmmmmmmmmmm',
    'd..................d..',
  ],
  colours: C,
};

/** A loose sheet in the back wall, bent out at the bottom: a way out to the scrap stacks. */
export const LOOSE_SHEET: RowSprite = {
  rows: fill(16, 30, (x, y) => {
    if (x === 0 || x === 15 || y === 0) return 'd';
    if (y > 22 && x > 30 - y) return 's'; // the gap where it's bent out
    return x % 4 === 0 ? 'n' : 'm';
  }),
  colours: C,
};
