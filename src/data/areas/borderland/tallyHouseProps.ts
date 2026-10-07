import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the tally house (Chapter 2): where finds are weighed and taxed each
// evening, inside the hull of something enormous. The signature: the great scale, built from parts
// nobody understands, a polished dish on a beam with counterweights made of finds. The queue's rail,
// the tallyman's counter, the slate of names and hauls, the clan's share piled behind a grille.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  g: S.cyanDeep, G: S.cyanMid, c: S.cyan, W: S.white, a: S.amber, A: S.amberDeep, e: S.greenMid,
};

/** The great scale: a polished dish hung from one end of a long beam, finds strung as counterweights on the other, on a post of something nobody can name. */
export const GREAT_SCALE: RowSprite = {
  rows: fill(64, 66, (x, y) => {
    // The post: a smooth column, ringed, a cyan seam that no longer glows.
    if (x >= 30 && x <= 33 && y >= 8) return y % 14 === 0 ? 'h' : x === 30 ? 'm' : x === 33 ? 'd' : x === 31 && y > 20 && y < 50 ? 'g' : 'n';
    if (y >= 62 && x >= 22 && x <= 41) return y === 62 ? 'h' : 'd'; // its foot
    // The pivot and the beam, tipped a little towards the dish.
    if (Math.abs(x - 31.5) < 3 && y >= 4 && y < 9) return y === 4 ? 'h' : 'm';
    const beamY = 7 + Math.round((31 - x) * 0.08);
    if (y === beamY && x >= 2 && x <= 61) return 'h';
    if (y === beamY + 1 && x >= 2 && x <= 61) return 'd';
    // The dish: chains down from the beam's left end, a wide polished bowl.
    const dishTop = 40;
    if ((x === 4 || x === 16) && y > beamY + 1 && y < dishTop) return 'm';
    if (y >= dishTop && y < dishTop + 5) {
      const half = 11 - (y - dishTop) * 1.8;
      if (Math.abs(x - 10) <= half) return y === dishTop ? 'W' : y === dishTop + 1 ? 'h' : 'm';
    }
    // The counterweights on the right: finds strung on a chain.
    if (x === 56 && y > beamY + 1 && y < 50) {
      return 'm';
    }
    if (y >= 20 && y < 50 && Math.abs(x - 56) <= 3) {
      const k = Math.floor((y - 20) / 6);
      const ly = (y - 20) % 6;
      if (ly === 5) return '.';
      return [['c', 'G'], ['a', 'A'], ['W', 'h'], ['m', 'n'], ['G', 'g']][k % 5]![Math.abs(x - 56) < 2 ? 0 : 1]!;
    }
    return '.';
  }),
  colours: C,
};

/** The tallyman's counter: one long panel on trestles, a lip along the front, a lamp-lit top. */
export const counter = (width: number): RowSprite => ({
  rows: fill(width, 22, (x, y) => {
    if (y === 0) return 'h';
    if (y === 1) return 'm';
    if (y === 2) return 'd';
    if (y > 2 && y < 18) return x === 0 || x === width - 1 ? 'd' : y === 9 ? 'd' : (x * 3 + y) % 23 === 0 ? 'm' : 'n';
    return x < 4 || x > width - 5 || (x > width / 2 - 2 && x < width / 2 + 2) ? 'd' : '.';
  }),
  colours: C,
});

/** The slate: names and hauls in signs, a column of marks for each. */
export const SLATE: RowSprite = {
  rows: fill(54, 34, (x, y) => {
    if (x === 0 || x === 53 || y === 0 || y === 33) return 'n';
    if (x === 1 || x === 52 || y === 1 || y === 32) return 'd';
    const row = Math.floor((y - 4) / 5);
    const ly = (y - 4) % 5;
    if (row > 4 || ly > 2 || x < 4 || x > 49) return 's';
    // A name sign, then strokes for the haul (some crossed out).
    if (x < 10) return (x + ly + row) % 3 === 0 ? 'h' : 's';
    const strokes = 3 + ((row * 7) % 8);
    if (x >= 14 && x < 14 + strokes * 3 && (x - 14) % 3 === 0) return 'h';
    if (row === 2 && ly === 1 && x >= 13 && x < 14 + strokes * 3) return 'm';
    return 's';
  }),
  colours: C,
};

/** The grille cage with the clan's share heaped inside, bright finds catching the lamplight. */
export const grille = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (y === 0 || y === height - 1) return 'm';
    if (x % 6 === 0) return x === 0 || x === width - 1 ? 'm' : 'n';
    if (y % 14 === 7) return 'd';
    // The heap.
    const heapTop = height - 4 - Math.round(Math.sin((x / width) * Math.PI) * (height * 0.55));
    if (y >= heapTop) {
      const r = (x * 37 + y * 11) % 23;
      return r < 3 ? 'c' : r < 6 ? 'a' : r < 8 ? 'W' : r < 11 ? 'G' : r < 15 ? 'm' : r < 19 ? 'A' : 'n';
    }
    return 's';
  }),
  colours: C,
});

/** A post for the queue's rail. */
export const POST: RowSprite = { rows: ['hh', 'mn', 'mn', 'mn', 'mn', 'mn', 'mn', 'mn', 'mn', 'mn', 'mn', 'mn', 'mn', 'dd'], colours: C };

/** A lamp hung from the ceiling: a casing with a glow. */
export const LAMP: RowSprite = {
  rows: ['..mm..', '.mhhm.', 'mnaanm', 'naWWan', '.naan.', '..AA..'],
  colours: C,
};

/** The big hatch you come in by, wheel and all. */
export const HATCH: RowSprite = {
  rows: fill(22, 40, (x, y) => {
    if (y < 4) return y === 0 ? 'h' : 'm';
    if (x < 2 || x > 19) return x === 0 || x === 21 ? 'd' : 'm';
    const d = Math.hypot(x - 10.5, y - 20);
    if (Math.abs(d - 5) < 0.8) return 'h'; // the wheel
    if (d < 1.2) return 'm';
    if (Math.abs(x - 10.5) < 0.6 && d < 5) return 'm';
    if (Math.abs(y - 20) < 0.6 && d < 5) return 'm';
    return y === 39 ? 'd' : 'n';
  }),
  colours: C,
};

/** A narrower door up on the walkway, the boss's people's way in from the compound. */
export const WALK_DOOR: RowSprite = {
  rows: fill(16, 32, (x, y) => (x === 0 || x === 15 || y === 0 ? 'd' : y === 1 ? 'm' : x === 12 && y > 14 && y < 18 ? 'h' : y % 10 === 0 ? 'd' : 'A')),
  colours: C,
};
