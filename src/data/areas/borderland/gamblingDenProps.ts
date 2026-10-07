import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the gambling den (Chapter 2): below ground, in a sunken compartment of
// something big. Low light over the tables, faces in shadow, the rattle of the game. The signature:
// the game itself, played with tokens cut from small identical parts, all from the same thing; and the
// debt wall, names and amounts in scavenger signs.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  g: S.cyanDeep, G: S.cyanMid, c: S.cyan, W: S.white, a: S.amber, A: S.amberDeep, e: S.greenMid, E: S.greenDeep,
};

/** A game table: a cloth-covered top on crates, the tokens laid out in a pattern, two piles of stakes. */
export const gameTable = (width: number): RowSprite => ({
  rows: fill(width, 16, (x, y) => {
    if (y < 3) {
      // Tokens: small identical parts, a row of them, and two little piles.
      if (y === 2 && x > 6 && x < width - 6 && x % 4 === 0) return 'c';
      if ((x === 3 || x === 4 || x === width - 5 || x === width - 4) && y > 0) return 'h';
      return '.';
    }
    if (y === 3) return 'E';
    if (y < 6) return x === 0 || x === width - 1 ? 'E' : 'e';
    if (y === 6) return 'd';
    // The cloth hangs down at the front; crates beneath.
    if (y < 9) return x % 4 === 0 ? 'E' : 'e';
    if (x < 3 || x > width - 4 || (x > width / 2 - 3 && x < width / 2 + 2)) return y === 15 ? 'd' : 'p';
    return 's';
  }),
  colours: C,
});

/** A lamp hung low over a table, its shade throwing a circle of light. */
export const LOW_LAMP: RowSprite = { rows: ['..mm..', '.mmmm.', 'mnnnnm', 'naWWan'], colours: C };

/** The house's cage: a counter behind a grille, where stakes are held. */
export const HOUSE_CAGE: RowSprite = {
  rows: fill(48, 46, (x, y) => {
    if (y === 0) return 'h';
    if (y < 3) return 'm';
    if (y > 30) return y === 31 ? 'h' : y === 45 ? 'd' : x % 12 === 0 ? 'd' : 'n'; // the counter
    if (x % 5 === 0) return 'm'; // the bars
    if (y > 22 && x > 8 && x < 40) return (x + y) % 7 === 0 ? 'c' : (x + y) % 5 === 0 ? 'a' : (x * y) % 11 === 0 ? 'W' : 'A'; // stakes heaped behind
    return 's';
  }),
  colours: C,
};

/** The debt wall: rows of names and amounts in signs, chalked straight onto the metal. */
export const DEBT_WALL: RowSprite = {
  rows: fill(56, 60, (x, y) => {
    const row = Math.floor(y / 6);
    const ly = y % 6;
    if (ly > 2) return '.';
    if (x < 7) return (x * 3 + row + ly) % 4 === 0 ? 'h' : '.'; // a name sign
    const marks = 4 + ((row * 11) % 9);
    if (x >= 10 && x < 10 + marks * 3 && (x - 10) % 3 === 0) return 'h';
    if (row % 4 === 2 && ly === 1 && x >= 9 && x < 11 + marks * 3) return 'm'; // a debt paid off, struck through
    return '.';
  }),
  colours: C,
};

/** A plain stool. */
export const STOOL: RowSprite = { rows: ['mmmmm', 'ddddd', '.n.n.', '.n.n.', '.n.n.', 'nn.nn'], colours: C };
