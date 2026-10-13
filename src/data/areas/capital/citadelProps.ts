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
export const HOLO_TABLE: RowSprite = {
  rows: fill(96, 66, (x, y) => {
    // The plinth.
    if (y >= 54) return y === 54 ? 'a' : y === 55 ? 'W' : x < 10 || x > 85 ? '.' : x === 10 ? 'm' : x === 85 ? 'W' : 'h';
    const cx = 47.5;
    if (y >= 48) return (x + y) % 2 === 0 && x > 14 && x < 81 ? 'G' : '.'; // its beam
    // The city in light: a hill of towers, the citadel at the top, drawn in outline; some districts dark.
    const hill = 46 - 34 * Math.exp(-(((x - cx) / 22) ** 2)) - (Math.floor(x / 4) % 3) * 2;
    if (y < hill) return Math.abs(x - cx) < 1 && y > hill - 10 ? 'c' : '.';
    const dark = x < 28 || (x > 62 && x < 72); // districts with the power cut
    if (y < hill + 1 || x % 4 === 0) return dark ? 'g' : 'c';
    return (x * 3 + y) % 5 === 0 ? (dark ? 'g' : 'W') : '.';
  }),
  colours: C,
};

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
export const FOUNTAIN: RowSprite = {
  rows: fill(40, 30, (x, y) => {
    if (y >= 18) return x < 1 || x > 38 ? '.' : y === 18 ? 'W' : y === 19 ? 'c' : x === 1 ? 'm' : x === 38 ? 'W' : 'h';
    if (x >= 18 && x <= 21) return y > 6 ? (x === 19 || x === 20 ? 'a' : '.') : y > 2 ? 'c' : '.';
    const fall = Math.abs(x - 19.5) - (y - 3) * 0.9;
    return Math.abs(fall) < 0.8 && y > 3 ? 'c' : '.';
  }),
  colours: C,
};

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
