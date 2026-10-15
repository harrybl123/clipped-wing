import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';
import { EMBLEM } from './cityProps';

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

/** A screen in a gold frame: a dim blue glow, lines of something across it (`scroll` moves them up a row each). */
export const screen = (width: number, height: number, scroll = 0): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return 'a';
    if (x === 1 || y === 1 || x === width - 2 || y === height - 2) return 'd';
    const line = y + scroll;
    if (line % 3 === 0 && x > 3 && x < width - 4 - ((line * 7) % 9)) return line % 12 === 0 ? 'c' : 'G';
    return (x + y) % 7 === 0 ? 'g' : 's';
  }),
  colours: C,
});

/**
 * A screen gone over to the symbol (Chapter 3, Day 3: the bird on the citadel's own screens for a moment,
 * and nobody can find where it comes from): the bird, as large as fits, pale on black.
 */
export const birdScreen = (width: number, height: number): RowSprite => {
  const scale = Math.max(1, Math.floor((height - 4) / EMBLEM.length));
  const size = EMBLEM.length * scale;
  const [ox, oy] = [Math.floor((width - size) / 2), Math.floor((height - size) / 2)];
  return {
    rows: fill(width, height, (x, y) => {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return 'a';
      if (x === 1 || y === 1 || x === width - 2 || y === height - 2) return 'd';
      const [ex, ey] = [Math.floor((x - ox) / scale), Math.floor((y - oy) / scale)];
      if (x >= ox && y >= oy && EMBLEM[ey]?.[ex] === '#') return 'W';
      return 's';
    }),
    colours: C,
  };
};

/** A screen's frames, its lines scrolling up (for the `frames` feature). */
export const scrollingScreen = (width: number, height: number): RowSprite[] => [0, 1, 2].map((i) => screen(width, height, i));

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

// --- The audience hall ---

/** The throne: tall, a back of gold over marble, a dark cushion; a line of blue light up its spine. */
export const THRONE: RowSprite = {
  rows: fill(30, 60, (x, y) => {
    if (y < 36) {
      // The back: a pointed gold crest, a gold panel framed in marble, the blue line up its middle.
      const crest = Math.abs(x - 14.5) * 0.9;
      if (y < 8 && y < 8 - (8 - crest)) return '.';
      if (x < 4 || x > 25) return '.';
      if (y < 8) return y === Math.ceil(crest) ? 'W' : 'a';
      if (x === 14 || x === 15) return y % 4 === 0 ? 'W' : 'c';
      if (x === 4 || x === 25) return x === 25 ? 'W' : 'm';
      if (x === 5 || x === 24 || y === 8 || y === 35) return 'h';
      return (x + y) % 6 === 0 ? 'A' : 'a';
    }
    if (y < 41) return x < 1 || x > 28 ? '.' : y === 36 ? 'a' : 'n'; // the seat and its cushion
    if (y < 43) return 'a';
    return x < 3 || x > 26 ? '.' : x === 3 || x === 26 ? 'a' : x > 22 ? 'W' : (y - 43) % 6 === 5 ? 'm' : 'h'; // the base
  }),
  colours: C,
};

/** The heir's seat beside it: lower, plainer, gold only at its edges. */
export const HEIR_SEAT: RowSprite = {
  rows: fill(16, 32, (x, y) => {
    if (y < 16) return x < 3 || x > 12 ? '.' : y === 0 ? 'a' : x === 3 || x === 12 ? 'a' : x > 10 ? 'W' : 'h';
    if (y < 20) return x < 1 || x > 14 ? '.' : y === 16 ? 'a' : 'n';
    return x < 2 || x > 13 ? '.' : x === 2 || x === 13 ? 'a' : 'h';
  }),
  colours: C,
};

/** A bench for petitioners: dark wood on marble legs. */
export const bench = (width: number): RowSprite => ({
  rows: fill(width, 9, (x, y) => (y < 2 ? (y === 0 ? 'p' : 'w') : y < 3 ? 'd' : x < 3 || x > width - 4 ? 'h' : '.')),
  colours: C,
});

/** A post with a gold rope slung to the next: where the petitioners wait. */
export const ropeLine = (width: number): RowSprite => ({
  rows: fill(width, 16, (x, y) => {
    const post = x % 30 < 2;
    if (post) return y === 0 ? 'a' : y > 13 ? 'm' : 'A';
    const u = (x % 30) / 30;
    return y === 3 + Math.round(Math.sin(u * Math.PI) * 4) ? 'a' : '.';
  }),
  colours: C,
});

// --- The council chamber ---

/** A councillor's seat: a marble seat with a small gold light on its back, lit if someone sits there, dark if not. */
export const councilSeat = (taken: boolean): RowSprite => ({
  rows: fill(12, 18, (x, y) => {
    if (y < 2) return x > 3 && x < 8 ? (taken ? 'a' : 'm') : '.';
    if (y < 10) return x < 2 || x > 9 ? '.' : x === 9 ? 'W' : x === 2 ? 'm' : 'h';
    if (y < 12) return y === 10 ? 'W' : 'h';
    return x < 2 || x > 9 ? '.' : x === 2 ? 'm' : 'h';
  }),
  colours: C,
});

/** The council's table of light: a round plinth, and above it the city drawn in blue light, districts lit or dark. */
export const holoTable = (phase: number): RowSprite => ({
  rows: fill(96, 66, (x, y) => {
    // The plinth.
    if (y >= 54) return y === 54 ? 'a' : y === 55 ? 'W' : x < 10 || x > 85 ? '.' : x === 10 ? 'm' : x === 85 ? 'W' : 'h';
    const cx = 47.5;
    if (y >= 48) return (x + y) % 2 === 0 && x > 14 && x < 81 ? 'G' : '.'; // its beam
    // The city in light: a hill of towers, the citadel at the top, drawn in outline; some districts dark.
    const hill = 46 - 34 * Math.exp(-(((x - cx) / 22) ** 2)) - (Math.floor(x / 4) % 3) * 2;
    if (y < hill) return Math.abs(x - cx) < 1 && y > hill - 10 ? 'c' : '.';
    const dark = x < 28 || (x > 62 && x < 72); // districts with the power cut
    // A scan sweeping across it, a bright line; the cut districts flickering.
    if (Math.abs(x - (14 + phase * 22)) < 1) return dark ? 'G' : 'W';
    if (dark && (x + phase * 5) % 9 === 0 && y % 2 === 0) return 'G';
    if (y < hill + 1 || x % 4 === 0) return dark ? 'g' : 'c';
    return (x * 3 + y + phase) % 5 === 0 ? (dark ? 'g' : 'W') : '.';
  }),
  colours: C,
});
export const HOLO_TABLE = holoTable(0);
/** The table of light, flickering, a scan sweeping across it (for the `frames` feature). */
export const HOLO_FRAMES = [0, 1, 2, 3].map(holoTable);

// --- Your father's study ---

/** Shelves of books and old things from before, in dark wood. */
export const bookshelf = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (x === 0 || x === width - 1 || y === 0 || y === height - 1) return 'w';
    const shelf = y % 14;
    if (shelf === 13) return 'n';
    // Books of every height, in muted colours, now and then an old thing instead.
    const book = Math.floor(x / 2);
    const tall = 6 + Math.floor((((book * 37 + Math.floor(y / 14) * 11) % 7) / 7) * 6);
    if (shelf < 13 - tall) return 's';
    const kind = (book * 13 + Math.floor(y / 14) * 5) % 9;
    if (kind === 0) return shelf === 12 ? 'a' : shelf > 9 ? 'A' : 's'; // an old thing in gold
    return x % 2 === 0 ? 'd' : (['A', 'n', 'p', 'm', 'g', 'w', 'n', 'A'] as const)[kind % 8]!;
  }),
  colours: C,
});

/**
 * The bookshelf swung back into the wall (Chapter 3, Day 2): the shelf turned edge-on at the left, and behind
 * it a dark way through, cyan light from the room beyond along its edges and its floor.
 */
export const openShelf = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (x < 6) return x === 0 || x === 5 ? 'w' : y % 14 === 13 ? 'n' : x % 2 ? 'A' : 'd'; // the shelf, edge-on
    if (x === width - 1 || y === 0) return 'w';
    if (y >= height - 3) return y === height - 1 ? 'G' : 'g'; // the light along the floor
    if (x === 6 || x === width - 2) return y > 10 ? 'G' : 'g';
    return (x + y * 3) % 23 === 0 && y > 20 ? 'g' : 's';
  }),
  colours: C,
});

/**
 * The war table (Chapter 3, the simulation room): a long low plinth, and over it the capital in light, side-on,
 * the citadel at its top and the city stepping down to the low district, points of light moving on it.
 */
export const warTable = (phase: number): RowSprite => ({
  rows: fill(160, 56, (x, y) => {
    if (y >= 44) return y === 44 ? 'G' : y === 45 ? 'h' : x < 6 || x > 153 ? '.' : x === 6 ? 'm' : x === 153 ? 'W' : y > 52 ? 'd' : 'n';
    if (y >= 40) return (x + y) % 2 === 0 && x > 8 && x < 151 ? 'g' : '.'; // its beam
    const cx = 80;
    const hill = 39 - 30 * Math.exp(-(((x - cx) / 34) ** 2)) - (Math.floor(x / 5) % 3) * 2;
    if (y < hill) return Math.abs(x - cx) < 1 && y > hill - 9 ? 'c' : '.';
    // Squads: points moving along the streets, and the scan sweeping across.
    const dot = (x * 7 + y * 13 + phase * 17) % 97 === 0;
    if (dot) return 'a';
    if (Math.abs(x - (10 + phase * 38)) < 1) return 'W';
    if (y < hill + 1 || x % 5 === 0) return 'c';
    return (x * 3 + y + phase) % 6 === 0 ? 'G' : '.';
  }),
  colours: C,
});
export const WAR_TABLE_FRAMES = [0, 1, 2, 3].map(warTable);

/** His desk: dark wood, a green-shaded lamp's warm light, papers, a screen kept face down. */
export const DESK: RowSprite = {
  rows: fill(48, 26, (x, y) => {
    if (y < 8) {
      if (x >= 34 && x <= 40) return y < 3 ? (y === 0 ? 'A' : 'a') : x === 37 ? 'A' : '.'; // the lamp
      if (y >= 6 && x > 6 && x < 22) return y === 6 ? 'W' : 'h'; // papers
      if (y === 7 && x > 24 && x < 32) return 'g'; // the screen, face down
      return '.';
    }
    if (y < 10) return y === 8 ? 'p' : 'w';
    if (x < 3 || x > 44) return 'w';
    if (x > 18 && x < 30) return '.'; // the space for his knees
    return (y - 10) % 5 === 4 ? 'd' : x === 3 || x === 18 || x === 30 || x === 44 ? 'd' : 'n';
  }),
  colours: C,
};

/** A high-backed chair of dark wood. */
export const HIGH_CHAIR: RowSprite = {
  rows: fill(12, 28, (x, y) => {
    if (y < 16) return x > 7 && x < 11 ? (y === 0 ? 'a' : 'w') : '.';
    if (y < 18) return x < 11 ? (y === 16 ? 'p' : 'w') : '.';
    return x === 1 || x === 9 ? 'w' : '.';
  }),
  colours: C,
};

// --- The sealed wing ---

/** The door at the end: seamless, no handle, a line of blue light round its edge that pulses when it hums. */
export const SEALED_DOOR: RowSprite = {
  rows: fill(40, 68, (x, y) => {
    if (x < 2 || x > 37 || y < 2) return x === 0 || x === 39 || y === 0 ? 'c' : 'G';
    if (x < 4 || x > 35 || y < 4) return 'g';
    return (x + y * 3) % 23 === 0 ? 'd' : 's';
  }),
  colours: C,
};

// --- The glasshouse ---

/** A bed of plants with a gold rim: leaves of greens, a flower or two. */
export const plantBed = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (y >= height - 6) return y === height - 6 ? 'a' : y === height - 1 ? 'm' : 'h';
    const crown = height - 6 - (4 + Math.abs(Math.sin(x / 3.1) * 7 + Math.sin(x / 1.7) * 3));
    if (y < crown) return '.';
    if ((x * 7 + y * 3) % 29 === 0) return 'a'; // a flower
    return (x + y) % 3 === 0 ? 'E' : (x * y) % 5 === 0 ? 'e' : 'L';
  }),
  colours: { ...C, L: S.greenMid, e: S.green, E: S.greenDeep },
});

/** A small tree in a gold-rimmed pot: the only trees in the city. */
export const POTTED_TREE: RowSprite = {
  rows: fill(30, 56, (x, y) => {
    if (y >= 46) return x < 7 || x > 22 ? '.' : y === 46 ? 'a' : x === 7 ? 'm' : x === 22 ? 'W' : 'h';
    if (y >= 24) return x === 14 || x === 15 ? 'w' : '.';
    const d = Math.hypot((x - 14.5) / 14, (y - 12) / 12);
    if (d > 1 - Math.abs(Math.sin(x * 1.3 + y)) * 0.12) return '.';
    return y < 8 && x > 14 ? 'e' : (x + y) % 3 === 0 ? 'E' : 'L';
  }),
  colours: { ...C, L: S.greenMid, e: S.green, E: S.greenDeep },
};

/** A fountain: a marble basin, a gold spout, water caught in the light. */
const fountain = (phase: number): RowSprite => ({
  rows: fill(40, 30, (x, y) => {
    if (y >= 18) return x < 1 || x > 38 ? '.' : y === 18 ? 'W' : y === 19 ? ((x + phase) % 4 === 0 ? 'W' : 'c') : x === 1 ? 'm' : x === 38 ? 'W' : 'h';
    if (x >= 18 && x <= 21) return y > 6 ? (x === 19 || x === 20 ? 'a' : '.') : y > 2 ? ((y + phase) % 3 === 0 ? 'W' : 'c') : '.';
    const fall = Math.abs(x - 19.5) - (y - 3) * 0.9;
    return Math.abs(fall) < 0.8 && y > 3 ? ((y + phase) % 3 === 0 ? 'W' : 'c') : '.';
  }),
  colours: C,
});
export const FOUNTAIN = fountain(0);
/** The fountain's water running (for the `frames` feature). */
export const FOUNTAIN_FRAMES = [0, 1, 2].map(fountain);

// --- The banquet gallery ---

/** The long table: a white cloth, gold plates and cups, a strip of light down its middle. */
export const longTable = (width: number): RowSprite => ({
  rows: fill(width, 20, (x, y) => {
    if (y < 3) return x % 22 === 6 ? 'a' : x % 22 === 14 && y > 0 ? 'A' : '.'; // cups and plates
    if (y === 3) return x % 11 === 5 ? 'c' : 'W'; // the cloth, light running down it
    if (y < 8) return y === 7 ? 'h' : 'W';
    return x < 3 || x > width - 4 || x % 60 === 30 ? 'w' : '.';
  }),
  colours: C,
});

/** A high-backed chair at the banquet: gold, a dark seat. Empty, or with someone's things on it. */
export const BANQUET_CHAIR: RowSprite = {
  rows: fill(10, 26, (x, y) => {
    if (y < 14) return x > 5 && x < 9 ? (y === 0 ? 'W' : 'a') : '.';
    if (y < 16) return y === 14 ? 'a' : 'n';
    return x === 1 || x === 8 ? 'A' : '.';
  }),
  colours: C,
};

// --- The diplomat's office ---

/** The wall of maps: the city, and the managed places beyond, pinned up, with threads between the pins. */
export const MAP_WALL: RowSprite = {
  rows: fill(110, 60, (x, y) => {
    const sheets = [{ x: 0, y: 4, w: 46, h: 40 }, { x: 50, y: 0, w: 30, h: 26 }, { x: 52, y: 30, w: 26, h: 28 }, { x: 84, y: 8, w: 26, h: 34 }];
    const pins = [[20, 18], [64, 12], [64, 40], [96, 22], [34, 30]] as const;
    for (const [px, py] of pins) if (Math.abs(x - px) <= 1 && Math.abs(y - py) <= 1) return x === px && y === py ? 'a' : 'A';
    // Threads between the pins.
    for (let i = 0; i < pins.length - 1; i++) {
      const [ax, ay] = pins[i]!;
      const [bx, by] = pins[i + 1]!;
      const t = (x - ax) / (bx - ax);
      if (t > 0 && t < 1 && Math.abs(y - (ay + (by - ay) * t)) < 0.6) return 'a';
    }
    for (const s of sheets) {
      if (x < s.x || x >= s.x + s.w || y < s.y || y >= s.y + s.h) continue;
      if (x === s.x || y === s.y || x === s.x + s.w - 1 || y === s.y + s.h - 1) return 'm';
      // Lines on the maps: streets, contours, a coast.
      return (x * 2 + y * 3) % 11 === 0 || (x - s.x) % 9 === 0 ? 'p' : 'h';
    }
    return '.';
  }),
  colours: C,
};

/** Letters in piles, some sealed in gold. */
export const LETTERS: RowSprite = {
  rows: ['...WWW.........', '..hWWWh....W...', '..hhWhh...WWh..', '.WWWWWWa.hWWWW.', '.hhhhhhh.hhhhhh', 'WWWWaWWWWWWWWWW', 'hhhhhhhhhhhhhhh'],
  colours: C,
};

// --- The guest wing ---

/** A guest's room seen through its open door: a bed, a lamp, a window that doesn't open. */
export const GUEST_BED: RowSprite = {
  rows: fill(36, 16, (x, y) => {
    if (x < 2) return y < 1 ? 'a' : 'w';
    if (y < 4) return '.';
    if (y < 6) return x < 10 ? 'W' : '.';
    if (y < 10) return y === 6 ? 'W' : x > 16 ? 'G' : 'h';
    if (y < 12) return y === 10 ? 'a' : 'w';
    return x === 2 || x === 34 ? 'w' : '.';
  }),
  colours: C,
};

/** The guards' post at the end of the guest wing: a gold barrier across the corridor, a screen beside it. */
export const BARRIER: RowSprite = {
  rows: fill(30, 22, (x, y) => {
    if (x < 3 || x > 26) return y === 0 ? 'a' : y > 19 ? 'm' : 'A';
    return y === 4 || y === 10 ? 'a' : '.';
  }),
  colours: C,
};

/** A closed door: two leaves of dark wood in a marble frame, a gold handle. */
export const closedDoor = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (y < 2) return y === 0 ? 'W' : 'a';
    if (x === 0 || x === width - 1) return 'h';
    if (x === 1 || x === width - 2) return 'a';
    if (x === Math.floor(width / 2)) return 'd';
    if ((x === Math.floor(width / 2) - 2 || x === Math.floor(width / 2) + 2) && y > height / 2 - 3 && y < height / 2 + 2) return 'a';
    return x % 5 === 0 ? 'n' : 'w';
  }),
  colours: C,
});

/** A banner hanging from a gold rod: dark blue-black cloth, a gold border, a gold pattern down it, a pointed foot. */
export const banner = (width: number, height: number): RowSprite => ({
  rows: fill(width + 4, height, (x, y) => {
    if (y < 2) return y === 0 ? 'W' : 'a'; // the rod
    const lx = x - 2;
    if (lx < 0 || lx >= width) return '.';
    const foot = height - 1 - Math.abs(lx - (width - 1) / 2) * 0.7;
    if (y > foot) return '.';
    if (lx === 0 || lx === width - 1 || y > foot - 1) return 'a';
    // A pattern of gold diamonds down its middle.
    const d = Math.abs(lx - (width - 1) / 2) + Math.abs(((y - 6) % 14) - 6);
    if (Math.round(d) === 4) return 'a';
    return lx === 1 || lx === width - 2 ? 'g' : 'd';
  }),
  colours: C,
});

/** Vines hanging from above: a trailing green fall of leaves. */
export const vines = (height: number): RowSprite => ({
  rows: fill(9, height, (x, y) => {
    const strand = [1, 4, 7].find((sx) => Math.abs(x - sx - Math.round(Math.sin(y / 5 + sx) * 1)) < 1 && y < height - sx * 2);
    if (strand === undefined) return '.';
    return (x + y) % 4 === 0 ? 'e' : (x + y) % 3 === 0 ? 'E' : 'L';
  }),
  colours: { ...C, L: S.greenMid, e: S.green, E: S.greenDeep },
});

// --- The citadel's own things (designer: more creative) ---

/**
 * The castle's bones: where the marble's been cut back, the old rough stone of the castle it was built on,
 * an arch of it, worn, the mortar dark (the citadel was a castle before it was anything else).
 */
export const oldArch = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const cx = (width - 1) / 2;
    const inner = Math.max(0, height - 14 - Math.sqrt(Math.max(0, 1 - ((x - cx) / (width / 2 - 8)) ** 2)) * 14);
    const opening = Math.abs(x - cx) < width / 2 - 8 && y > height - 14 - Math.sqrt(Math.max(0, 1 - ((x - cx) / (width / 2 - 8)) ** 2)) * (height - 22);
    if (opening) return y > inner + 2 && (x + y) % 9 === 0 ? 'n' : 's';
    // Rough stones in courses, each its own shade; the mortar between them dark.
    const course = Math.floor(y / 7);
    const sx = x + (course % 2) * 5;
    if (y % 7 === 0 || sx % 11 === 0) return 'd';
    const r = ((Math.floor(sx / 11) * 37 + course * 17) % 10) / 10;
    if ((x * 7 + y * 3) % 13 === 0) return 'n'; // pitting
    return r > 0.7 ? 'm' : r > 0.35 ? 'p' : 'n';
  }),
  colours: C,
});

/** The old castle's portcullis, raised over the great doors for good: black iron, spikes along its foot. */
export const PORTCULLIS: RowSprite = {
  rows: fill(48, 16, (x, y) => {
    if (y === 0) return 'n';
    if (x % 6 === 2) return y === 15 ? 'd' : y === 14 ? 's' : 's';
    if (y % 5 === 2) return 's';
    return '.';
  }),
  colours: C,
};

/** A hearth of old rough stone, the castle's own: the only real fire in the citadel. */
export const HEARTH: RowSprite = {
  rows: fill(52, 46, (x, y) => {
    if (y < 4) return y === 0 ? 'm' : 'p'; // the mantel
    if (y < 6) return 'd';
    const opening = x > 9 && x < 42 && y > 14;
    if (opening) return y > 40 ? (x % 4 === 0 ? 'A' : 'd') : 's'; // the firebox, embers on its floor
    const course = Math.floor(y / 6);
    const sx = x + (course % 2) * 4;
    if (y % 6 === 0 || sx % 9 === 0) return 'd';
    const r = ((Math.floor(sx / 9) * 31 + course * 13) % 10) / 10;
    return r > 0.65 ? 'm' : r > 0.3 ? 'p' : 'n';
  }),
  colours: C,
};

/** A tall case clock of dark wood: a gold face, a glass door in its waist where the pendulum swings. */
export const CASE_CLOCK: RowSprite = {
  rows: fill(18, 64, (x, y) => {
    if (y < 16) {
      const d = Math.hypot(x - 8.5, y - 8);
      if (d < 6) return d > 5 ? 'a' : (x === 8 && y > 3 && y < 9) || (y === 8 && x > 8 && x < 13) ? 'd' : 'W'; // the face and its hands
      return x < 1 || x > 16 ? '.' : y === 0 ? 'a' : 'w';
    }
    if (x < 2 || x > 15) return '.';
    if (y > 18 && y < 48 && x > 4 && x < 13) return x === 5 || x === 12 ? 'A' : 's'; // the glass door, dark behind it
    return x === 2 || x === 15 ? 'd' : x > 12 ? 'n' : 'w';
  }),
  colours: C,
};

/** The pendulum's bob: a gold disc. */
export const PENDULUM: RowSprite = { rows: ['.aa.', 'aWaa', 'aaaa', '.aa.'], colours: C };

/** A model of the city under a glass dome, on a stand: the citadel at its top, tiny, in gold. */
export const CITY_MODEL: RowSprite = {
  rows: fill(30, 34, (x, y) => {
    if (y >= 26) return y === 26 ? 'a' : x < 10 || x > 19 ? '.' : x === 10 ? 'w' : 'n'; // the stand
    const d = Math.hypot((x - 14.5) / 14, (y - 25) / 24);
    if (d > 1) return '.';
    if (d > 0.93) return (x + y) % 2 ? 'G' : '.'; // the glass
    const hill = 25 - 16 * Math.exp(-(((x - 14.5) / 6) ** 2));
    if (y < hill) return Math.abs(x - 14.5) < 1 && y > hill - 4 ? 'a' : '.';
    return y < 13 ? (x % 2 ? 'W' : 'a') : (x + y) % 3 === 0 ? 'm' : 'h';
  }),
  colours: C,
};

/** A brass telescope on a tripod, pointed up and out at the horizon. */
export const TELESCOPE: RowSprite = {
  rows: fill(26, 26, (x, y) => {
    // The barrel, rising to the right.
    const along = x - 2;
    const barrelY = 12 - along * 0.45;
    if (along >= 0 && along < 22 && Math.abs(y - barrelY) < (along > 16 ? 2 : 1.4)) return y < barrelY ? 'W' : along % 6 === 0 ? 'A' : 'a';
    // The tripod.
    if (y > 10 && (Math.abs(x - 11 - (y - 10) * 0.45) < 0.6 || Math.abs(x - 11 + (y - 10) * 0.45) < 0.6 || (x === 11 && y > 12))) return 'A';
    return '.';
  }),
  colours: C,
};

/** A chandelier: a ring of gold hung with points of light. */
export const CHANDELIER: RowSprite = {
  rows: fill(32, 12, (x, y) => {
    const ring = Math.abs(((x - 15.5) / 15) ** 2 + ((y - 5) / 3) ** 2 - 1) < 0.18;
    if (ring) return y < 5 ? 'A' : 'a';
    if (y >= 8 && x % 4 === 1 && Math.abs(x - 15.5) < 14) return y === 8 ? 'a' : y === 9 ? 'c' : y === 10 ? 'W' : '.';
    return '.';
  }),
  colours: C,
};

/** A glass lift shaft: thin gold ribs, the glass's blue edges. */
export const liftShaft = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (x === 0 || x === width - 1) return 'G';
    if (x === 1 || x === width - 2) return y % 24 === 0 ? 'a' : (x + y) % 4 === 0 ? 'g' : '.';
    if (y % 24 === 0) return 'a';
    return (((x - y * 0.6) % 31) + 31) % 31 < 1 ? 'g' : '.'; // a glint across the glass
  }),
  colours: C,
});

/** The glass lift's floor: gold on top, a lit underside. */
export const liftCar = (width: number): RowSprite => ({
  rows: [fill(width, 1, () => 'W')[0]!, fill(width, 1, () => 'a')[0]!, fill(width, 1, (x) => (x % 4 === 0 ? 'c' : 'A'))[0]!, fill(width, 1, () => 'G')[0]!],
  colours: C,
});

/** A capsule in the message tubes: brass, a seal in gold. */
export const CAPSULE: RowSprite = { rows: ['aWWa', 'AaaA'], colours: C };

/** Where a message tube comes out: a brass mouth with a flap. */
export const TUBE_MOUTH: RowSprite = { rows: ['.aa.', 'aAAa', 'aAAa', 'AssA', 'A..A', 'AaaA'], colours: C };

/** The guards' screens: the corridor's doors, each in its own little frame, one flickering. */
export const surveillance = (phase: number): RowSprite => ({
  rows: fill(30, 20, (x, y) => {
    if (x === 0 || y === 0 || x === 29 || y === 19 || x === 14 || x === 15 || y === 9 || y === 10) return x === 14 || x === 15 || y === 9 || y === 10 ? 'd' : 'a';
    const cell = (x > 15 ? 1 : 0) + (y > 10 ? 2 : 0);
    if (cell === phase % 4 && (x + y + phase) % 3 === 0) return 'g'; // static
    const lx = x > 15 ? x - 16 : x - 1;
    const ly = y > 10 ? y - 11 : y - 1;
    if (lx > 4 && lx < 9 && ly > 1) return 'w'; // a door
    return ly === 7 ? 'G' : 's';
  }),
  colours: C,
});
export const SURVEILLANCE_FRAMES = [0, 1, 2, 3].map(surveillance);

// --- Each room its own (designer: lots of rooms have the same things) ---

/** Your bed: a canopy on four gold posts, deep blue curtains tied back, pale linen. */
export const CANOPY_BED: RowSprite = {
  rows: fill(60, 50, (x, y) => {
    if (y < 4) return y === 0 ? 'a' : 'g'; // the canopy
    const post = x === 1 || x === 58;
    if (post) return y > 46 ? 'A' : 'a';
    // Curtains tied back at each end, falling in folds.
    const tie = y > 26 && y < 30;
    if ((x < 9 && y < 46 && x < 9 - Math.max(0, (y - 28) / 6)) || (x > 50 && y < 46 && x > 50 + Math.max(0, (y - 28) / 6))) return tie ? 'a' : (x + Math.floor(y / 3)) % 3 === 0 ? 'g' : 'G';
    if (y < 30) return '.';
    if (y < 34) return x < 14 && x > 3 ? (y === 30 ? 'W' : 'h') : '.'; // the pillows
    if (y < 39) return y === 34 ? 'W' : x > 34 ? 'g' : 'h'; // linen, the cover thrown back
    if (y < 43) return y === 39 ? 'a' : 'w'; // the frame
    return x === 3 || x === 56 ? 'w' : '.';
  }),
  colours: C,
};

/** A rack of practice blades: three, blunted, on a dark wood stand. */
export const BLADE_RACK: RowSprite = {
  rows: fill(22, 40, (x, y) => {
    if (y > 36) return 'w';
    if (y === 8 || y === 30) return 'w';
    if (x === 0 || x === 21) return 'w';
    for (const bx of [5, 11, 17]) {
      if (x === bx && y > 2 && y < 34) return y < 8 ? (y === 7 ? 'a' : 'A') : 'h'; // the grip, the guard, the blade
      if (y === 8 && Math.abs(x - bx) <= 2) return 'a';
    }
    return '.';
  }),
  colours: C,
};

/** A sparring dummy: a padded post on a stand, scuffed, an arm out. */
export const DUMMY: RowSprite = {
  rows: fill(20, 40, (x, y) => {
    if (y < 7) return Math.hypot(x - 10, y - 3.5) < 3.6 ? (x > 10 ? 'p' : 'n') : '.';
    if (y < 24) {
      if (y > 9 && y < 12 && x > 1 && x < 19) return y === 10 ? 'p' : 'w'; // the arms
      return Math.abs(x - 10) < 4 ? ((x + y) % 5 === 0 ? 'w' : x > 11 ? 'p' : 'n') : '.';
    }
    if (y < 36) return x === 10 ? 'w' : '.';
    return Math.abs(x - 10) < 6 ? 'w' : '.';
  }),
  colours: C,
};

/** A game board on a low table: a strategy game of rule, its pieces in gold and dark, mid-game. */
export const GAME_TABLE: RowSprite = {
  rows: fill(22, 12, (x, y) => {
    if (y < 3) return [3, 7, 10, 15, 18].includes(x) ? (x % 2 ? 'a' : 'd') : '.'; // pieces
    if (y < 5) return x < 1 || x > 20 ? '.' : (x + y) % 2 ? 'W' : 'n'; // the board
    if (y < 7) return y === 5 ? 'p' : 'w';
    return x === 2 || x === 19 ? 'w' : '.';
  }),
  colours: C,
};

/** A curtain, deep blue, gathered and falling in folds (`flip` for the other side). */
export const curtain = (height: number, flip = false): RowSprite => ({
  rows: fill(14, height, (x0, y) => {
    const x = flip ? 13 - x0 : x0;
    if (y < 2) return 'a'; // the rail
    const width = 6 + Math.round(Math.sin((y / height) * Math.PI) * 2 + (y / height) * 5);
    if (x >= width) return '.';
    return (x + Math.floor(y / 4)) % 3 === 0 ? 'g' : x === width - 1 ? 'c' : 'G';
  }),
  colours: C,
});

/** A portrait of a ruler before your father, in a gold frame: a dark ground, a pale face, a gold circlet. */
export const portrait = (seed: number): RowSprite => ({
  rows: fill(22, 28, (x, y) => {
    if (x === 0 || y === 0 || x === 21 || y === 27) return 'a';
    if (x === 1 || y === 1 || x === 20 || y === 26) return 'A';
    const cx = 10.5 + ((seed % 3) - 1);
    const head = Math.hypot((x - cx) / 3.6, (y - 10) / 4.4) < 1;
    if (head) return y < 8 && (seed % 2 === 0) ? 'a' : x > cx ? 'h' : 'm'; // some crowned
    if (y > 14) {
      const half = 3 + (y - 14) * 0.7;
      if (Math.abs(x - cx) < half) return seed % 4 === 1 ? 'g' : seed % 4 === 2 ? 'A' : 'n'; // their robes
    }
    return (x + y) % 6 === 0 ? 'w' : 'd';
  }),
  colours: C,
});

/** A lamp hanging low on a long chain, its light pooled under it. */
export const PENDANT: RowSprite = { rows: ['..aa..', '.aAAa.', 'aWWWWa', '.cccc.'], colours: C };

/** A tall mirror panel in a gold frame, catching the room (the banquet gallery's hall of mirrors). */
export const mirrorPanel = (height: number): RowSprite => ({
  rows: fill(26, height, (x, y) => {
    if (x < 2 || x > 23 || y < 2 || y > height - 3) return x === 0 || x === 25 || y === 0 || y === height - 1 ? 'A' : 'a';
    if (y < 12 && Math.abs(x - 12.5) + (12 - y) > 12) return 'a'; // a gold arch at its top
    const glint = (x - y * 0.5 + 200) % 23;
    return glint < 1.5 ? 'W' : glint < 3 ? 'h' : (x + y) % 5 === 0 ? 'm' : 'p';
  }),
  colours: C,
});

/** A harp, gold, on the musicians' gallery. */
export const HARP: RowSprite = {
  rows: fill(14, 26, (x, y) => {
    if (y > 23) return x > 2 && x < 12 ? 'A' : '.';
    if (x === 2 && y > 3) return 'a'; // the pillar
    const neck = 3 + Math.round(Math.sin((x / 13) * Math.PI) * 3);
    if (y === neck && x > 1) return 'a';
    if (x > 2 && x < 13 && y > neck && y < 24 - (13 - x) && (x % 2 === 0)) return 'h'; // strings
    if (x === 12 && y > 3 && y < 24) return 'A';
    return '.';
  }),
  colours: C,
};

/** A drum on a stand. */
export const DRUM: RowSprite = { rows: ['.WWWWWW.', 'aAaAaAaa', 'wnnnnnnw', 'wnnnnnnw', 'aAaAaAaa', '.w....w.', 'w......w'], colours: C };

/** Brass filing drawers, many small ones, labels on each. */
export const DRAWERS: RowSprite = {
  rows: fill(36, 46, (x, y) => {
    if (x === 0 || x === 35 || y === 0 || y === 45) return 'A';
    if (x % 7 === 0 || y % 9 === 0) return 'A';
    if (x % 7 === 3 && y % 9 === 4) return 'W'; // the label
    if (x % 7 === 3 && y % 9 === 6) return 'd'; // the pull
    return (x + y) % 9 === 0 ? 'A' : 'a';
  }),
  colours: C,
};

/** Notes pinned up in rows, some with threads running off them. */
export const PINNED_NOTES: RowSprite = {
  rows: fill(44, 30, (x, y) => {
    for (const [nx, ny] of [[0, 2], [11, 0], [22, 4], [33, 1], [5, 16], [17, 15], [29, 17]] as const) {
      if (x >= nx && x < nx + 9 && y >= ny && y < ny + 11) {
        if (x === nx + 4 && y === ny) return 'c'; // the pin
        return (y - ny) % 3 === 2 && x > nx && x < nx + 8 ? 'm' : 'W';
      }
    }
    return '.';
  }),
  colours: C,
};

/** A gold lattice over a window: a grille, ornate, so it can't be opened (the guest wing). */
export const lattice = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const d1 = (x + y) % 8;
    const d2 = (x - y + 800) % 8;
    if (d1 === 0 || d2 === 0) return 'a';
    if (x === 0 || x === width - 1 || y === 0 || y === height - 1) return 'A';
    return '.';
  }),
  colours: C,
});

/** An empty gilded cage, hung for ornament. */
export const CAGE: RowSprite = {
  rows: fill(14, 20, (x, y) => {
    if (y < 3) return Math.abs(x - 6.5) < 1.5 ? 'a' : '.'; // the ring
    const dome = y < 8 ? Math.round(Math.sqrt(Math.max(0, 1 - ((8 - y) / 5) ** 2)) * 6.5) : 6;
    if (Math.abs(x - 6.5) > dome) return '.';
    if (y === 18 || y === 19) return 'A';
    if (y === 12) return 'a'; // a perch
    return x % 3 === 0 || Math.abs(x - 6.5) > dome - 1 ? 'a' : '.';
  }),
  colours: C,
};

/** A trellis on the wall, plants climbing it. */
export const trellis = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const leaf = Math.abs(Math.sin(x * 0.9 + y * 0.4) + Math.sin(y * 0.7 - x * 0.3)) > 1.1 && y > height * 0.15 * (1 + Math.sin(x / 4));
    if (leaf) return (x + y) % 3 === 0 ? 'E' : (x * y) % 4 === 0 ? 'e' : 'L';
    if ((x + y) % 10 === 0 || (x - y + 1000) % 10 === 0) return 'p';
    return '.';
  }),
  colours: { ...C, L: S.greenMid, e: S.green, E: S.greenDeep },
});
