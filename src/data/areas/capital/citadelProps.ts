import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the capital's citadel (Chapter 3; docs/chapter-3-world.md): clean marble,
// gold, and a blue glow (designer), obviously futuristic, more cyberpunk than anything before, and still
// earthy: old stone worn smooth, dark wood, cloth. Screens in gold frames, strips of blue light, doors that
// are tall dark openings in marble. Wine is the prince's own colour, so it stays off the props.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  W: S.white, h: S.light, m: S.dim, p: S.woodPale, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow,
  a: S.amber, A: S.amberDeep, c: S.cyan, G: S.cyanMid, g: S.cyanDeep,
};

/** A doorway in the marble: a tall dark opening, a gold frame, a lintel, blue light up its sides. */
export const doorway = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (y < 3) return y === 0 ? 'W' : y === 1 ? 'a' : 'A'; // the lintel, gold under it
    if (x === 0 || x === width - 1) return 'h';
    if (x === 1 || x === width - 2) return 'a';
    if (x === 2 || x === width - 3) return y % 3 === 0 ? 'c' : 'G';
    return y > height - 3 ? 'd' : 's';
  }),
  colours: C,
});

/** The great doors (the audience hall): taller, a gold arch, two leaves of dark wood with gold studs, shut. */
export const greatDoors = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const arch = Math.sqrt(Math.max(0, 1 - ((x - width / 2 + 0.5) / (width / 2)) ** 2)) * 10;
    if (y < 10 - arch) return '.';
    if (y < 12 - arch) return 'a';
    if (x === 0 || x === width - 1) return 'W';
    if (x === 1 || x === width - 2) return 'a';
    if (Math.abs(x - width / 2 + 0.5) < 1) return 'd'; // where the leaves meet
    if ((x % 6 === 3 && y % 8 === 4) || y === height - 12) return 'a'; // gold studs, a band
    return x % 6 === 0 ? 'n' : 'w';
  }),
  colours: C,
});

/** A marble column: a gold capital and base, fluted, lit on the right. */
export const column = (height: number): RowSprite => ({
  rows: fill(10, height, (x, y) => {
    if (y < 3 || y > height - 4) return y === 0 || y === height - 1 ? 'A' : 'a';
    if (x === 0 || x === 9) return '.';
    return x === 1 ? 'm' : x === 8 ? 'W' : x % 2 ? 'h' : 'W';
  }),
  colours: C,
});

/** A screen in a gold frame: a dim blue glow, lines of something scrolling across it. */
export const screen = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return 'a';
    if (x === 1 || y === 1 || x === width - 2 || y === height - 2) return 'd';
    if (y % 3 === 0 && x > 3 && x < width - 4 - ((y * 7) % 9)) return 'G';
    return (x + y) % 7 === 0 ? 'g' : 's';
  }),
  colours: C,
});

/** A strip of blue light, upright, set into the wall. */
export const lightStrip = (height: number): RowSprite => ({
  rows: fill(3, height, (x, y) => (x === 1 ? (y % 5 === 0 ? 'W' : 'c') : y === 0 || y === height - 1 ? '.' : 'G')),
  colours: C,
});

/** A rail: gold along the top, balusters below, for a balcony or the gallery's edge. */
export const rail = (width: number, height = 14): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (y === 0) return 'a';
    if (y === 1) return 'A';
    if (y === height - 1) return 'A';
    return x % 6 === 2 ? (y === 2 || y === height - 2 ? 'h' : 'W') : '.';
  }),
  colours: C,
});

/** A ruler before your father, in marble on a plinth: a robed figure, a gold circlet. */
export const STATUE: RowSprite = {
  rows: fill(16, 46, (x, y) => {
    if (y >= 38) return y === 38 ? 'W' : y === 45 ? 'm' : x === 0 || x === 15 ? 'm' : 'h'; // the plinth
    const cx = 7.5;
    if (y < 7) return Math.hypot(x - cx, y - 3.5) < 3.4 ? (y === 1 ? 'a' : x > cx ? 'W' : 'h') : '.'; // the head and circlet
    const half = 2.5 + (y - 7) * 0.17;
    if (Math.abs(x - cx) > half) return '.';
    if ((x + y) % 5 === 0) return 'm'; // the folds
    return x > cx + 1 ? 'W' : x < cx - 1.5 ? 'm' : 'h';
  }),
  colours: C,
};

/** A bed: a dark wood frame, a gold rail at its head, pale linen, a cover thrown back. */
export const BED: RowSprite = {
  rows: fill(56, 22, (x, y) => {
    if (x < 3) return y < 2 ? 'a' : 'w'; // the headboard
    if (y < 8) return '.';
    if (y < 11) return x < 14 ? (y === 8 ? 'W' : 'h') : '.'; // the pillow
    if (y < 15) return x > 30 ? (y === 11 ? 'G' : 'g') : y === 11 ? 'W' : 'h'; // the linen, the cover thrown back
    if (y < 18) return y === 15 ? 'a' : 'w'; // the frame, gold along it
    return x === 3 || x === 53 ? 'w' : '.'; // the legs
  }),
  colours: C,
};

/** A tall wardrobe of dark wood, gold handles. */
export const WARDROBE: RowSprite = {
  rows: fill(24, 52, (x, y) => {
    if (y === 0) return 'a';
    if (x === 0 || x === 23 || y === 51) return 'd';
    if (x === 12) return 'd';
    if ((x === 10 || x === 14) && y > 22 && y < 30) return 'a';
    return x > 12 ? (x === 22 ? 'p' : 'n') : 'w';
  }),
  colours: C,
};

/** A long mirror in a gold frame, catching the room's light. */
export const MIRROR: RowSprite = {
  rows: fill(14, 34, (x, y) => {
    if (x === 0 || x === 13 || y === 0 || y === 33) return 'a';
    if (x === 1 || x === 12 || y === 1 || y === 32) return 'A';
    return (x - y * 0.4) % 9 < 1.5 ? 'W' : (x + y) % 3 === 0 ? 'G' : 'g';
  }),
  colours: C,
};

/** A low couch: dark wood, cushions. */
export const COUCH: RowSprite = {
  rows: fill(40, 16, (x, y) => {
    if (y < 6) return x < 3 || x > 36 ? (y === 0 ? 'a' : 'w') : y > 1 ? 'm' : '.';
    if (y < 11) return y === 6 ? 'h' : 'm';
    if (y < 13) return 'w';
    return x < 2 || x > 37 ? 'w' : '.';
  }),
  colours: C,
};

/** A low table of dark wood, a cup and a tray on it. */
export const LOW_TABLE: RowSprite = {
  rows: ['......aa..WW....', '.....aAAa.hh....', 'aaaaaaaaaaaaaaaa', 'wwwwwwwwwwwwwwww', '.w............w.', '.w............w.', '.w............w.'],
  colours: C,
};

/** A long rug, patterned in gold and blue. */
export const rug = (width: number): RowSprite => ({
  rows: fill(width, 3, (x, y) => (y === 1 ? (x % 8 < 2 ? 'a' : x % 8 < 4 ? 'G' : 'A') : 'A')),
  colours: C,
});

/** A lamp: a small dome of light on a gold stand. */
export const LAMP: RowSprite = { rows: ['.aWWa.', 'aWWWWa', '..aa..', '..AA..', '..AA..', '..AA..', '.AAAA.'], colours: C };

/** A panel of light hanging in the air, showing a pattern (the citadel's screens without frames). */
export const holoPanel = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (x === 0 || x === width - 1 || y === 0 || y === height - 1) return (x + y) % 2 ? 'c' : '.';
    return (x * 3 + y * 5) % 11 === 0 ? 'c' : (x + y) % 4 === 0 ? 'G' : '.';
  }),
  colours: C,
});
