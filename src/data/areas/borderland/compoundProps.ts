import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the boss's compound (Chapter 2): walled with the best scrap, whole
// panels, matched, cleaned. Wealth by the borderland's standards: real food on a table, rugs, and the
// signature, a working light: a part that still glows a steady cyan, the only one in town.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  g: S.cyanDeep, G: S.cyanMid, c: S.cyan, W: S.white, a: S.amber, A: S.amberDeep, e: S.greenMid, E: S.greenDeep,
};

/** The compound's wall: whole matched panels, all the same height, clean, a lit cap along the top. */
export const matchedWall = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (y === 0) return 'W';
    if (y === 1) return 'h';
    if (x % 16 === 0) return 'm';
    if (x % 16 === 1) return 'h';
    if ((x % 16 === 3 || x % 16 === 13) && (y === 5 || y === height - 5)) return 'h'; // bolts
    return y > height - 4 ? 'n' : 'm';
  }),
  colours: C,
});

/** The gate: two heavy matched leaves, banded, one ajar; a lamp on each post. */
export const GATE: RowSprite = {
  rows: fill(48, 62, (x, y) => {
    if (x < 5 || x > 42) {
      if (y < 6) return y < 3 && (x === 2 || x === 45) ? 'a' : y < 4 ? 'm' : 'h'; // lamps on the posts
      return x === 0 || x === 47 ? 'd' : x === 4 || x === 43 ? 'd' : 'h';
    }
    if (y < 8) return '.';
    if (x > 22 && x < 28) return 's'; // the gap where it stands ajar
    if (y % 12 === 8) return 'd';
    if (x === 5 || x === 42 || x === 22 || x === 28) return 'd';
    return 'm';
  }),
  colours: C,
};

/**
 * The house in cutaway: clean matched panels inside, two floors (the floor between is a solid in the
 * area), a partition with a locked door, a window to the yard. `floorY` is the upper floor's row.
 */
export const houseInside = (width: number, height: number, floorY: number, partition: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (x < 4) return x < 2 ? 'h' : 'd'; // the outer wall, cut away
    if (y < 4) return y === 0 ? 'W' : 'h';
    if (y >= floorY - 1 && y < floorY + 6) return '.'; // the upper floor (a solid)
    // The partition downstairs, with the locked door.
    if (y > floorY + 6 && x >= partition && x < partition + 4) return x === partition ? 'h' : 'd';
    // Matched panels, dark and even; below a trim rail, panels painted amber.
    const rail = y > floorY ? height - 18 : floorY - 18;
    if (y === rail) return 'a';
    if (y === rail + 1) return 'd';
    if (y > rail) return x % 12 === 0 ? 'w' : 'A';
    if (x % 24 === 0) return 'w';
    if (x % 24 === 1) return 'm';
    return (x % 24 === 4 || x % 24 === 20) && (y % 20 === 6) ? 'm' : 'n';
  }),
  colours: C,
});

/** The working light: a casing in the ceiling with a steady cyan glow, and the glow round it. */
export const WORKING_LIGHT: RowSprite = {
  rows: fill(40, 22, (x, y) => {
    const d = Math.hypot((x - 19.5) / 2, y - 3);
    if (y < 3 && Math.abs(x - 19.5) < 8) return y === 0 ? 'm' : 'n';
    if (y < 6 && Math.abs(x - 19.5) < 6) return y === 5 ? 'c' : 'W';
    // The glow, dithered, fading.
    if (y >= 6 && d < 10 && (x + y) % 2 === 0) return d < 5 ? 'c' : 'G';
    if (y >= 6 && d < 14 && (x + y) % 4 === 0) return 'g';
    return '.';
  }),
  colours: C,
};

/** A hanging on the wall: a rug, patterned, with a fringe. */
export const hanging = (width: number, height: number, tone: 'a' | 'G' | 'e'): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (y === 0) return 'm';
    if (y === height - 1) return x % 2 ? tone : '.';
    const d = Math.abs(x - width / 2 + 0.5) + Math.abs(y - height / 2);
    if (Math.round(d) % 5 === 0) return 'h';
    return x === 1 || x === width - 2 || y === 2 || y === height - 3 ? 'A' : tone;
  }),
  colours: C,
});

/** A lamp on a bracket, burning. */
export const WALL_LAMP: RowSprite = { rows: ['.aa.', 'aWWa', '.aa.', '.mm.', 'mmmm'], colours: C };

/** The boss's table: long, laid with real food, chairs along it. */
export const feastTable = (width: number): RowSprite => ({
  rows: fill(width, 22, (x, y) => {
    if (y < 6) {
      // Food: bowls, bread, a jug.
      const slot = Math.floor(x / 10);
      const lx = x % 10;
      if (lx < 2 || lx > 7) return '.';
      const kind = slot % 4;
      if (kind === 0) return y > 2 ? (y === 3 ? 'h' : 'm') : '.'; // a bowl
      if (kind === 1) return y > 3 ? 'a' : '.'; // bread
      if (kind === 2) return y > 0 ? (lx === 4 || lx === 5 ? (y < 2 ? 'h' : 'G') : y > 2 ? 'G' : '.') : '.'; // a jug
      return y > 3 ? 'e' : '.'; // greens
    }
    if (y === 6) return 'W';
    if (y === 7) return 'h';
    if (y === 8) return 'd';
    // A cloth hanging over the front.
    if (y < 12) return x % 6 === 0 ? 'A' : 'a';
    return x < 3 || x > width - 4 ? 'n' : '.';
  }),
  colours: C,
});

export const CHAIR: RowSprite = { rows: ['nn....', 'nn....', 'nn....', 'nn....', 'nnnnnn', 'hhhhhh', 'n....n', 'n....n', 'n....n', 'n....n'], colours: C };

/** A rug, deep and patterned. */
export const rug = (width: number): RowSprite => ({
  rows: fill(width, 3, (x, y) => (y === 1 && x % 8 < 4 ? 'G' : y === 1 ? 'a' : 'A')),
  colours: C,
});

/** The locked door: heavier than the others, a bar and a lock. */
export const LOCKED_DOOR: RowSprite = {
  rows: fill(18, 34, (x, y) => (x === 0 || x === 17 || y === 0 ? 'd' : (y === 14 || y === 20) ? 'h' : x === 13 && y > 15 && y < 19 ? 'a' : 'n')),
  colours: C,
};

/** A bed upstairs: a real frame, a thick mattress, a blanket. */
export const bed = (width: number, blanket: 'a' | 'G' | 'e'): RowSprite => ({
  rows: fill(width, 12, (x, y) => {
    if (x < 3 && y < 12) return 'n'; // the headboard
    if (y < 3) return '.';
    if (y === 3) return x < 12 ? 'W' : blanket;
    if (y < 7) return x < 12 ? 'h' : blanket;
    if (y < 9) return 'n';
    return x === 3 || x === width - 1 ? 'n' : '.';
  }),
  colours: C,
});

/** A water tank in the yard: a whole sealed cylinder, still full. */
export const TANK: RowSprite = {
  rows: fill(30, 34, (x, y) => {
    if (y > 28) return x % 9 === 0 ? 'n' : '.';
    if (y === 0) return x < 2 || x > 27 ? '.' : 'h';
    if (x === 0 || x === 29) return 'd';
    if (y % 9 === 4) return 'd';
    return x < 6 ? 'h' : x > 24 ? 'n' : 'm';
  }),
  colours: C,
};

/** Crates of tribute under a cloth, waiting to be counted. */
export const TRIBUTE: RowSprite = {
  rows: fill(36, 20, (x, y) => {
    if (y < 8) return y < 3 ? (x > 4 && x < 30 && (x + y) % 3 === 0 ? 'c' : x > 6 && x < 28 && y > 0 ? 'a' : '.') : x % 9 === 0 ? 'A' : 'a';
    return x % 12 === 0 || y === 19 || y === 8 ? 'd' : 'p';
  }),
  colours: C,
};

/** A post with a lamp, in the yard. */
export const lampPost = (height: number): RowSprite => ({
  rows: fill(7, height, (x, y) => {
    if (y < 5) return x > 0 && x < 6 ? (y === 0 ? 'm' : y < 4 ? (x > 1 && x < 5 ? 'W' : 'a') : 'A') : '.';
    return x === 3 ? 'n' : y === height - 1 && x > 1 && x < 5 ? 'd' : '.';
  }),
  colours: C,
});
