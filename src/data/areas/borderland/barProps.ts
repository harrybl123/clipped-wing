import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the bar (Chapter 2): where crews gather and gossip spreads. Warm, smoky,
// loud. The signature: the counter, a single smooth curved panel with no joins, polished by elbows.
// Lamps that were something else once, rigged to burn oil, glowing amber through old cyan glass;
// bottles of odd glass; crew marks scratched into every table; a corner for music.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  g: S.cyanDeep, G: S.cyanMid, c: S.cyan, W: S.white, a: S.amber, A: S.amberDeep, e: S.greenMid, E: S.greenDeep,
};

/** The counter: one smooth curved panel, no joins, a long polished streak along the top where elbows rest. */
export const barCounter = (width: number): RowSprite => ({
  rows: fill(width, 26, (x, y) => {
    // The front bows out: rounded at both ends.
    const end = Math.min(x, width - 1 - x);
    if (end < 4 && y < 4 - end) return '.';
    if (y === 0) return 'W';
    if (y === 1) return x % 9 < 6 ? 'h' : 'm'; // the polished streak
    if (y === 2) return 'm';
    if (y === 25) return 'd';
    const bow = Math.sin((x / width) * Math.PI); // lit in the middle of the curve
    if (y < 8 && bow > 0.6) return 'm';
    return end < 2 ? 'd' : y > 20 ? 'w' : 'n';
  }),
  colours: C,
});

/** Shelves of bottles behind the counter: odd glass, odd shapes. */
export const bottles = (width: number): RowSprite => ({
  rows: fill(width, 28, (x, y) => {
    if (y === 13 || y === 27) return 'm';
    if (y === 14 || (y === 0 && false)) return 'd';
    const shelf = y < 13 ? 0 : 1;
    const ly = shelf ? y - 15 : y;
    const slot = Math.floor(x / 5);
    const lx = x % 5;
    const h = 6 + ((slot * 7 + shelf * 3) % 6);
    if (lx > 2 || ly < 12 - h) return '.';
    if (ly < 12 - h + 2) return lx === 1 ? 'm' : '.'; // necks
    return [['c', 'G'], ['a', 'A'], ['W', 'h'], ['e', 'E'], ['G', 'g']][(slot * 3 + shelf) % 5]![lx === 0 ? 0 : 1]!;
  }),
  colours: C,
});

/** A lamp that was something else once: a cyan glass globe in a casing, an oil flame burning amber inside. */
export const OIL_LAMP: RowSprite = {
  rows: ['...mm...', '..mhhm..', '.gGGGGg.', 'gGaWWaGg', 'gGaaaaGg', '.gGAAGg.', '..mmmm..'],
  colours: C,
};

/** A table: a drum lid on a post, crew marks scratched into the top, a cup or two. */
export const table = (width: number, seed: number): RowSprite => ({
  rows: fill(width, 18, (x, y) => {
    if (y < 3) {
      // Cups.
      const cx = 3 + ((seed * 5) % (width - 8));
      if (x >= cx && x < cx + 2 && y > 0) return seed % 2 ? 'h' : 'G';
      if (seed % 3 === 0 && x >= cx + 6 && x < cx + 8 && y > 0) return 'a';
      return '.';
    }
    if (y === 3) return 'h';
    if (y === 4) return (x + seed) % 5 === 0 ? 'd' : 'm'; // the crew marks
    if (y === 5) return 'd';
    if (y > 5 && Math.abs(x - width / 2 + 0.5) < 2) return y === 17 ? 'd' : 'n';
    if (y === 17 && Math.abs(x - width / 2 + 0.5) < 6) return 'd';
    return '.';
  }),
  colours: C,
});

export const STOOL: RowSprite = { rows: ['mmmmmm', 'dddddd', '.n..n.', '.n..n.', '.n..n.', '.n..n.', 'nn..nn'], colours: C };

/** The corner for music: a low stage of plates, an instrument made of parts (strings across a casing). */
export const STAGE: RowSprite = {
  rows: fill(46, 34, (x, y) => {
    if (y >= 28) return y === 28 ? 'h' : y === 33 ? 'd' : x % 11 === 0 ? 'd' : 'm';
    // The instrument: a casing body leaning on a stool, a neck, strings.
    const bx = x - 14;
    const by = y - 12;
    if (bx >= 0 && bx < 14 && by >= 0 && by < 14) {
      const d = Math.hypot(bx - 6.5, by - 8);
      if (d < 6.5) return d > 5.5 ? 'd' : by > 6 && bx > 3 && bx < 10 && (bx - 3) % 2 === 0 ? 'h' : d < 1.5 ? 's' : 'A';
    }
    if (x >= 20 && x <= 21 && y >= 0 && y < 14) return y < 3 ? 'm' : x === 20 ? 'n' : 'd';
    if (x >= 22 && x < 34 && y >= 22 && y < 28) return y === 22 ? 'm' : x === 23 || x === 32 ? 'n' : '.'; // its stool
    return '.';
  }),
  colours: C,
};

/** A crew's banner: a long strip of cloth with their mark, hung on the wall. */
export const banner = (height: number, colour: 'a' | 'G' | 'e' | 'h'): RowSprite => ({
  rows: fill(12, height, (x, y) => {
    if (y === 0) return 'm';
    if (y === height - 1 && x % 3 === 1) return '.'; // a ragged hem
    const d = Math.hypot(x - 5.5, y - height * 0.4);
    if (Math.abs(d - 3) < 0.7 || (Math.abs(x - 5.5) < 0.6 && d < 3)) return 'd'; // the mark
    return x === 0 || x === 11 ? 'd' : colour;
  }),
  colours: C,
});

/** The front door: panels, a lit gap at the top. */
export const DOOR: RowSprite = {
  rows: fill(18, 36, (x, y) => (x === 0 || x === 17 ? 'd' : y < 2 ? 'a' : y === 2 ? 'd' : x === 14 && y > 16 && y < 21 ? 'h' : y % 12 === 0 ? 'd' : 'n')),
  colours: C,
};

/** The way down to the gambling den: a dark opening in the floor's edge, steps going down, a lamp. */
export const DEN_STAIRS: RowSprite = {
  rows: fill(30, 36, (x, y) => {
    if (y < 3) return y === 0 ? 'h' : 'm';
    if (x < 2 || x > 27) return 'd';
    if (x > 22 && x < 26 && y > 8 && y < 13) return y === 9 ? 'a' : 'A';
    const step = Math.floor((x - 2) / 5);
    if (y > 36 - 6 - step * 5 && y < 36 - step * 5) return y === 36 - 5 - step * 5 ? 'm' : 's';
    return 's';
  }),
  colours: C,
};

/** A door hung with cloth: through to the brothel. */
export const CLOTH_DOOR: RowSprite = {
  rows: fill(16, 32, (x, y) => (x === 0 || x === 15 || y === 0 ? 'd' : (x + Math.floor(y / 6)) % 4 === 0 ? 'A' : x % 3 === 0 ? 'G' : 'a')),
  colours: C,
};

/** A booth: a bench and a small table behind a curtain on a rail, the curtain half drawn. */
export const booth = (width: number, seed: number): RowSprite => ({
  rows: fill(width, 34, (x, y) => {
    if (y === 0) return 'm';
    // The curtain, drawn to one side.
    const curtainW = 8 + (seed % 3) * 4;
    const fromRight = seed % 2 === 1;
    const inCurtain = fromRight ? x >= width - curtainW : x < curtainW;
    if (inCurtain) return (x + Math.floor(y / 5)) % 4 === 0 ? 'A' : x % 3 === 0 ? 'E' : 'e';
    // Inside: dark, a bench, a little table with a lamp.
    if (y > 22 && y < 26) return 'n';
    if (y >= 26 && (x % 9 === 2)) return 'n';
    if (y > 16 && y < 19 && Math.abs(x - width / 2) < 4) return y === 17 ? 'm' : 'd';
    if (y > 13 && y < 17 && Math.abs(x - width / 2) < 1) return 'a';
    return 's';
  }),
  colours: C,
});
