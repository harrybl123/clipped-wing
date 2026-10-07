import { cellRandom, SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the sunk town (Chapter 2): the tops of buildings of the old society
// sticking out of the ground, and three levels of rooms beneath, darker the deeper you go. Smooth walls
// with no joins, rounded windows full of earth, the faint cyan of things still powered, and signs of the
// scavengers who came down before you (chalk marks, a rope, a dug crawl, a camp). Nothing is explained.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  g: S.cyanDeep, G: S.cyanMid, c: S.cyan, W: S.white, a: S.amber, A: S.amberDeep,
};

/** Dark to light, for the smooth walls. */
const RAMP = ['s', 'd', 'w', 'n', 'p', 'm', 'h'] as const;
const BAYER = [[0, 0.5], [0.75, 0.25]] as const;

/** Chalk tally marks: `groups` of four strokes with a fifth across, 10 px apart, 7 px tall, top-left at (0, 0). */
const tally = (tx: number, ty: number, groups: number): boolean => {
  if (tx < 0 || ty < 0 || ty >= 7 || tx >= groups * 10) return false;
  const lx = tx % 10;
  return (lx < 7 && lx % 2 === 0) || (lx < 8 && ty === 6 - lx);
};

/** A wall brightness (0..1) as a key, ordered-dithered between two steps of the ramp. */
const shade = (v: number, x: number, y: number): string => {
  const t = Math.min(0.999, Math.max(0, v)) * (RAMP.length - 1);
  const i = Math.floor(t);
  return RAMP[t - i > BAYER[y % 2]![x % 2]! ? i + 1 : i]!;
};

/** Dark to cyan, for walls lit by something still powered. */
const CYAN_RAMP = ['s', 'd', 'g', 'G'] as const;
const lit = (v: number, x: number, y: number): string => {
  const t = Math.min(0.999, Math.max(0, v)) * (CYAN_RAMP.length - 1);
  const i = Math.floor(t);
  return CYAN_RAMP[t - i > BAYER[y % 2]![x % 2]! ? i + 1 : i]!;
};

/** A rounded window: a pale rim, dark inside, sometimes filled with dirt to halfway. */
const roundWindow = (lx: number, ly: number, r: number, dirt: boolean): string | null => {
  const d = Math.hypot(lx, ly);
  if (d > r) return null;
  if (d > r - 1.2) return 'h';
  if (dirt && ly > 0) return 'p';
  return 's';
};

/** Earth drifted into a room: up the corners and along the floor (lighter, loose). */
const drifted = (x: number, y: number, width: number, height: number, depth = 1): string | null => {
  const drift = (Math.max(0, 12 - Math.min(x, width - 1 - x) * 0.3) + 3) * depth;
  if (y <= height - drift) return null;
  return cellRandom(x, y, 4) > 0.8 ? 'n' : cellRandom(x, y, 5) > 0.97 ? 'G' : 'p';
};

/** The smooth wall of a buried room: one surface, no joins, brighter in the middle, shadowed under the ceiling. */
const wall = (x: number, y: number, width: number, base: number): number =>
  base + Math.sin((x / width) * Math.PI) * 0.12 - Math.max(0, 1 - y / 10) * 0.25 + (cellRandom(x, y, 9) - 0.5) * 0.04;

// --- The surface ---

/** A dome rising out of the ground: smooth, seamless, pale, with a row of rounded windows. Bottom edge on the ground. */
export const dome = (width: number, height: number, seed: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const u = (x - width / 2 + 0.5) / (width / 2);
    const top = Math.round(height * (1 - Math.sqrt(Math.max(0, 1 - u * u))));
    if (y < top) return '.';
    if (y === top) return 'W';
    // A row of windows round it.
    const wy = height - Math.round(height * 0.45);
    for (let i = 1; i < 4; i++) {
      const wx = Math.round((width * i) / 4);
      const w = roundWindow(x - wx, y - wy, 4, (i + seed) % 2 === 0);
      if (w) return w;
    }
    // Smooth: a sheen on the upper left, shade on the lower right, dirt caked at the bottom.
    if (y > height - 4) return (x + y) % 3 === 0 ? 'n' : 'p';
    const light = -u * 0.5 + (1 - y / height) * 0.8;
    return light > 0.6 ? 'h' : light > 0.1 ? 'm' : 'n';
  }),
  colours: C,
});

/** The top of a tower, tipped over at an angle, a rounded window near its top, one faint cyan light. */
export const TOWER_TOP: RowSprite = {
  rows: fill(30, 44, (x, y) => {
    const lean = Math.round((44 - y) * 0.35);
    const lx = x - lean;
    if (lx < 2 || lx > 15) return '.';
    if (y < 3) return lx > 4 && lx < 13 ? (y === 0 ? 'W' : 'h') : '.'; // a rounded cap
    const w = roundWindow(lx - 8.5, y - 12, 3.5, false);
    if (w) return w;
    if (lx === 8 && y === 22) return 'c';
    return lx < 5 ? 'h' : lx > 13 ? 'n' : 'm';
  }),
  colours: C,
};

/** A staircase going down into the dirt: smooth steps, and earth swallowing it. */
export const STAIRS_DOWN: RowSprite = {
  rows: fill(40, 20, (x, y) => {
    const stepTop = Math.floor(x / 5) * 2;
    if (y < stepTop) return '.';
    if (y === stepTop) return 'h';
    if (y < stepTop + 3) return 'm';
    if (x > 26) return 'p'; // the earth has it
    return '.';
  }),
  colours: C,
};

/** A broken window frame lying in the ground round the way down. */
export const brokenFrame = (width: number): RowSprite => ({
  rows: fill(width + 8, 6, (x, y) => {
    if (y > 3) return x < 4 || x > width + 3 ? 'm' : '.';
    if (x < 4 || x > width + 3) return y === 0 ? 'h' : 'm';
    return y === 0 && x % 5 === 0 ? 'h' : '.'; // jagged glass at the edge
  }),
  colours: C,
});

/**
 * The mouth of the deep stairwell: a smooth rounded lip on each side (the gap between them is the
 * well), and on the left a stake hammered into the dirt with a rope tied to it, going over the edge.
 * Bottom edge on the ground; `gap` is the well's width.
 */
export const wellMouth = (gap: number): RowSprite => {
  const width = gap + 24;
  return {
    rows: fill(width, 12, (x, y) => {
      // The stake and the knot.
      if (x >= 2 && x <= 3 && y >= 2) return y === 2 ? 'n' : 'w';
      if (y === 8 && x >= 4 && x <= 11) return 'p'; // the rope to the edge
      // The lips.
      const lip = (lx: number) => {
        const top = Math.round(4 * (1 - Math.sqrt(Math.max(0, 1 - ((lx - 4.5) / 4.5) ** 2))));
        if (y < 4 + top) return null;
        return y === 4 + top ? 'W' : y > 9 ? 'p' : lx < 3 ? 'h' : 'm';
      };
      if (x >= 3 && x < 12) return lip(x - 3) ?? '.';
      if (x >= gap + 12 && x < gap + 21) return lip(x - gap - 12) ?? '.';
      if (x === 12 && y >= 8) return 'p'; // the rope over the edge
      return '.';
    }),
    colours: C,
  };
};

// --- Ways down ---

/** Earth seen in a shaft's walls (behind a way down): dark, packed, with chips of old things in it. */
export const earth = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const r = cellRandom(x, y, 11);
    if (r > 0.99) return y > 120 ? 'g' : 'm';
    // Packed in uneven layers, darker deeper down.
    const layer = Math.floor((y + Math.sin(x / 9) * 3 + cellRandom(x >> 3, 0, 12) * 4) / 7);
    const v = 0.34 - (y / Math.max(1, height)) * 0.14 + (layer % 3 === 0 ? -0.06 : layer % 3 === 1 ? 0.03 : 0) + (r - 0.5) * 0.08;
    return shade(v, x, y);
  }),
  colours: C,
});

/**
 * The deep stairwell: a smooth shaft going down past every level. Its flights have fallen, leaving
 * pale scars zigzagging down the walls where they were fixed; dark doorways where each level opens off
 * it; and the scavengers' rope hanging down the middle, knotted for climbing, stopping short of the bottom.
 * Darker the deeper it goes.
 */
export const stairwell = (width: number, height: number, ropeEnd: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    // The rope, knotted every 24 px.
    if (x === Math.floor(width / 2) && y < ropeEnd) return y % 24 === 0 ? 'm' : 'p';
    if (x === Math.floor(width / 2) + 1 && y % 24 === 0 && y < ropeEnd) return 'p';
    if (x === Math.floor(width / 2) && y < ropeEnd + 3 && y >= ropeEnd) return 'n'; // the frayed end
    // Scars where the flights were: diagonals, alternating direction every 80 px.
    const flight = Math.floor(y / 80);
    const fy = y % 80;
    const fx = flight % 2 === 0 ? (fy * width) / 80 : width - (fy * width) / 80;
    if (Math.abs(x - fx) < 1) return y > height * 0.6 ? 'n' : 'p';
    const depth = y / height;
    return shade(0.62 - depth * 0.5 + Math.sin((x / width) * Math.PI) * 0.08 + (cellRandom(x, y, 3) - 0.5) * 0.04, x, y);
  }),
  colours: C,
});

// --- The first level: the screen room and the long room ---

/**
 * The screen room: smooth pale walls, rounded windows full of earth, two dead screens still glowing
 * faintly cyan (one big, one small), a chalk arrow pointing at the door. Fills the room's opening.
 */
export const screenRoom = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const d = drifted(x, y, width, height);
    if (d) return d;
    for (let i = 0; i < 3; i++) {
      const w = roundWindow(x - (36 + i * 90), y - 18, 7, true);
      if (w) return w === 'p' ? 'w' : w;
    }
    // The big screen and the small one: a pale bezel, dark glass, faint cyan breaking through in lines.
    const screen = (sx: number, sy: number, sw: number, sh: number) => {
      if (x < sx || x >= sx + sw || y < sy || y >= sy + sh) return null;
      if (x === sx || x === sx + sw - 1 || y === sy || y === sy + sh - 1) return 'n';
      if (y % 3 === 0 && cellRandom(x >> 2, y, 7) > 0.5) return 'G';
      return (x + y * 3) % 7 === 0 ? 'G' : 'g';
    };
    const s = screen(112, 30, 48, 28) ?? screen(176, 36, 20, 14);
    if (s) return s;
    // A crack across the big screen.
    if (x > 116 && x < 150 && y === 40 + Math.round((x - 116) * 0.3)) return 'h';
    // A chalk arrow by the door: "this way".
    const ax = width - 34;
    if (y === 42 && x >= ax && x < ax + 12) return 'W';
    if ((x === ax + 9 || x === ax + 10) && Math.abs(y - 42) === ax + 12 - x - 1) return 'W';
    return shade(wall(x, y, width, 0.62), x, y);
  }),
  colours: C,
});

/** A row of seats fixed to the floor, all one piece, facing left (towards the screen), half buried. Bottom edge on the floor. */
export const seats = (count: number): RowSprite => ({
  rows: fill(count * 16, 16, (x, y) => {
    const lx = x % 16;
    if (y > 13) return lx < 14 || y === 15 ? 'p' : '.'; // buried
    if (lx > 12) return '.';
    // The back: a rounded upright on the right, darker than the wall so it stands out.
    if (lx >= 9) {
      if (y === 0) return lx === 10 || lx === 11 ? 'n' : '.';
      return lx === 9 ? 'n' : lx === 12 ? 's' : 'w';
    }
    // The seat: a thick pad with rounded front.
    if (y === 7) return lx >= 2 ? 'n' : '.';
    if (y === 8 || y === 9) return lx >= 1 || y === 8 ? (y === 9 ? 'd' : 'w') : '.';
    // The single stem.
    if (y > 9) return lx === 5 || lx === 6 ? 'd' : '.';
    return '.';
  }),
  colours: C,
});

/** A ceiling panel that's come loose at one end and hangs down at an angle. Top-left at the ceiling. */
export const HANGING_PANEL: RowSprite = {
  rows: fill(30, 20, (x, y) => {
    const ly = Math.round(x * 0.55);
    if (y < ly || y > ly + 2) return x > 1 && x < 4 && y < ly ? 'n' : '.';
    return y === ly ? 'h' : y === ly + 2 ? 'n' : 'm';
  }),
  colours: C,
};

/**
 * The long room: a dead strip light along the ceiling with one cell still lit, recesses in the wall
 * like empty shelves, a crack running along the ceiling, and chalk tallies by the stairwell (who went
 * down, and how many came back?). Fills the room's opening.
 */
export const longRoom = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const d = drifted(x, y, width, height, 1.2);
    if (d) return d;
    // The strip light.
    if (y === 4 && x > 10 && x < width - 10) return x > 210 && x < 222 ? 'c' : x % 12 === 0 ? 'w' : 'n';
    if (y === 5 && x > 210 && x < 222) return 'G';
    // A crack along the ceiling.
    if (y === 8 + Math.round(Math.sin(x / 7) * 1.5) && x > 40 && x < 260) return 's';
    // Recesses: rounded, dark, a lip at the bottom.
    const rx = (x - 20) % 70;
    if (x > 20 && rx < 40 && y >= 22 && y < 48) {
      const corner = (rx < 2 || rx > 37) && (y < 24 || y > 45);
      if (corner) return shade(wall(x, y, width, 0.56), x, y);
      if (y === 47) return 'h';
      if (y === 46 && cellRandom(x, 0, 2) > 0.7) return 'n'; // something small left on the shelf
      return rx < 3 ? 'w' : 'd';
    }
    // Chalk tallies near the stairwell end: who went down, and how many came back?
    if (tally(x - (width - 64), y - 54, 4)) return 'W';
    return shade(wall(x, y, width, 0.52), x, y);
  }),
  colours: C,
});

/** The door that still opens by itself: one smooth panel, a seam of dead light down it. */
export const AUTODOOR: RowSprite = {
  rows: fill(10, 40, (x, y) => (x === 0 || x === 9 ? 'n' : x === 5 ? (y % 6 === 0 ? 'G' : 'g') : y === 39 ? 'd' : 'h')),
  colours: C,
};

/** A ledge of fallen slab, to climb on. */
export const slab = (width: number): RowSprite => ({
  rows: fill(width, 4, (x, y) => (y === 0 ? 'h' : y === 3 ? 'd' : x % 9 === 4 ? 'n' : 'm')),
  colours: C,
});

// --- The second level: the hall of boxes, the filled room, the camp ---

/**
 * The hall of boxes: the walls are rows and rows of identical sealed boxes, each with a tiny dead
 * light. Most are shut, some prised open (dark inside), and two still show a faint cyan light. Gouges
 * round the open ones where someone worked at them. Fills the room's opening.
 */
export const boxHall = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const d = drifted(x, y, width, height, 0.8);
    if (d) return d;
    if (y < 4) return y === 3 ? 'd' : shade(0.3, x, y);
    const bx = x % 16;
    const by = (y - 4) % 12;
    const col = Math.floor(x / 16);
    const row = Math.floor((y - 4) / 12);
    if (bx === 15 || by === 11) return 'd'; // the gaps between boxes
    const seed = cellRandom(col, row, 17);
    const open = seed > 0.82;
    const lit = !open && seed < 0.035;
    const corner = (bx === 0 || bx === 14) && (by === 0 || by === 10);
    if (corner) return 'd';
    if (open) {
      if (bx === 0 || bx === 14 || by === 0 || by === 10) return cellRandom(x, y, 8) > 0.5 ? 'h' : 'n'; // gouged edges
      return by > 7 && cellRandom(x, row, 6) > 0.6 ? 'w' : 's';
    }
    if (bx === 12 && by === 5) return lit ? 'c' : 'w'; // its light
    if (bx === 12 && by === 4 && lit) return 'G';
    const v = 0.5 - (y / height) * 0.18 + (by === 0 ? 0.12 : by === 10 ? -0.1 : 0) + (bx === 0 ? 0.08 : 0);
    return shade(v, x, y);
  }),
  colours: C,
});

/** A box that's fallen out of the wall onto the floor, split along one edge. Bottom edge on the floor. */
export const FALLEN_BOX: RowSprite = {
  rows: fill(16, 10, (x, y) => {
    if ((x === 0 || x === 15) && (y === 0 || y === 9)) return '.';
    if (y === 0) return 'h';
    if (x === 15 || y === 9) return 'n';
    if (x > 2 && x < 13 && y === 4) return 's'; // the split
    if (x === 12 && y === 6) return 'w';
    return 'm';
  }),
  colours: C,
};

/**
 * The filled room: a room packed to its ceiling with earth that came in from above, and a crawl dug
 * along the bottom of it (the carved gap, `crawlTop` down), shored with bent plates by whoever dug it.
 * The ceiling and the tops of two round windows show above the fill. Placed over the earth solids.
 */
export const filledRoom = (width: number, height: number, crawlTop: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (y < 3) return y === 2 ? 'd' : 'n'; // the ceiling
    for (let i = 0; i < 2; i++) {
      const w = roundWindow(x - (34 + i * 64), y - 6, 6, false);
      if (w) return w === 's' ? 'w' : w; // the window, full of the same earth
    }
    if (x === 0 || x === width - 1) return 'm'; // the room's walls
    if (y >= crawlTop) {
      // The crawl: dark, with the dig marks of a tool on the back wall, and the shoring plates.
      if (x % 24 < 2) return x % 24 === 0 ? 'm' : 'n';
      if (y === crawlTop) return 'h'; // the plates across the top
      return (x * 3 + y * 5) % 13 === 0 ? 'w' : 's';
    }
    // The fill: loose, lumpy, lighter than the packed ground, with bits of old things in it.
    const r = cellRandom(x >> 1, y >> 1, 23);
    if (r > 0.985) return 'm';
    return shade(0.42 + (r - 0.5) * 0.12 + Math.sin(x / 5 + y / 3) * 0.03, x, y);
  }),
  colours: C,
});

/**
 * Someone's camp: a small room reached only by the dug crawl. One round window full of earth, the walls
 * covered in chalk (tallies, arrows, a circle crossed through), and the light of nothing at all.
 * Fills the room's opening.
 */
export const camp = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const d = drifted(x, y, width, height, 0.6);
    if (d) return d;
    const w = roundWindow(x - 30, y - 20, 9, true);
    if (w) return w === 'p' ? 'w' : w;
    // Chalk: rows of tallies, a circle crossed through, an arrow pointing back the way you came.
    const cd = Math.hypot(x - 104, y - 38);
    const chalk =
      tally(x - 54, y - 10, 6) || tally(x - 54, y - 22, 3) ||
      Math.abs(cd - 6) < 0.6 || (Math.abs(x - 104 - (y - 38)) < 0.6 && cd < 7) ||
      (y === 50 && x >= 96 && x < 124) || (x >= 118 && x < 124 && Math.abs(y - 50) === x - 118);
    if (chalk) return 'm';
    return shade(wall(x, y, width, 0.36), x, y);
  }),
  colours: C,
});

/** A burnt-out lamp left on the floor: a scavenger's, a pot of old fat and a wick, dark now. Bottom edge on the floor. */
export const DEAD_LAMP: RowSprite = {
  rows: ['...s...', '...w...', '..mmm..', '.mAAAm.', 'mnnnnnm', '.mmmmm.'],
  colours: C,
};

/** A rolled-up blanket gone stiff with dust, and a cut-down cup beside it. Bottom edge on the floor. */
export const BEDROLL: RowSprite = {
  rows: [
    '..AAAAAAAAAAAAAA...........',
    '.AaAAAaAAAaAAAaAAA.........',
    'AaAAAaAAAaAAAaAAAAA.....mm.',
    'AAAAAAAAAAAAAAAAAAA....m..m',
    '.AnnnnnnnnnnnnnnnA.....m..m',
    '..nnnnnnnnnnnnnnn.......mm.',
  ],
  colours: C,
};

/** A broken digging tool: a flat blade off a bigger machine, tied to a pole. Leaning; bottom edge on the floor. */
export const SHOVEL: RowSprite = {
  rows: fill(9, 20, (x, y) => {
    const px = 7 - Math.floor(y / 4);
    if (y < 13) return x === px ? 'n' : '.';
    if (y === 13) return x >= 2 && x <= 5 ? 'p' : '.'; // the tie
    return x >= 0 && x <= 6 && y >= 14 ? (y === 14 ? 'h' : x === 0 || x === 6 ? 'm' : 'h') : '.';
  }),
  colours: C,
};

// --- The third level: the tunnel and the bright room ---

/**
 * The tunnel: round in section (the top corners curve away into shadow), ribbed every 48 px, a row of
 * tiny lights along the crown, almost all dead, and the earth slumped in at the far end. Fills the opening.
 */
export const tunnel = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const d = drifted(x, y, width, height, 0.9);
    if (d) return d;
    // The curve: darker towards the top, as the wall turns overhead.
    const curve = Math.max(0, 1 - y / 22);
    // The crown lights.
    if (y === 3 && x % 16 === 8) return cellRandom(x, 1, 31) > 0.85 ? 'c' : 'w';
    if (y === 4 && x % 16 === 8 && cellRandom(x, 1, 31) > 0.85) return 'G';
    // Ribs: a raised band with a dark edge.
    const rib = x % 48;
    if (rib === 0) return 'd';
    if (rib < 4) return shade(0.42 - curve * 0.35, x, y);
    // Slumped earth at the far (left) end.
    if (x < 60 && y > height - 10 - (60 - x) * 0.6) return cellRandom(x, y, 4) > 0.8 ? 'n' : 'p';
    // A guide band along the wall at shoulder height, a dead light in it here and there.
    const band = height - 34;
    if (y === band || y === band + 3) return 'd';
    if (y > band && y < band + 3) return x % 40 < 6 && cellRandom(x >> 5, 2, 43) > 0.7 ? 'g' : 'n';
    // Where the wall turns overhead: a pale sheen, then shadow up into the crown.
    if (y === 22) return 'p';
    return shade(0.34 - curve * 0.32 + (y > 22 ? Math.max(0, 0.1 - (y - 22) * 0.01) : 0) + (cellRandom(x, y, 12) - 0.5) * 0.04, x, y);
  }),
  colours: C,
});

/** A rail along the tunnel floor: a smooth bar on low feet. Bottom edge on the floor. */
export const rail = (width: number): RowSprite => ({
  rows: fill(width, 4, (x, y) => (y === 0 ? 'h' : y === 1 ? 'n' : x % 12 < 2 ? 'w' : '.')),
  colours: C,
});

/**
 * A carriage lying where it stopped, tipped against the tunnel wall: a long rounded shell with a row of
 * windows, one door hanging open, a faint cyan line still lit along its side. Bottom edge on the floor.
 */
export const CARRIAGE: RowSprite = {
  rows: fill(128, 36, (x, y) => {
    const lean = Math.round((36 - y) * 0.18);
    const lx = x - lean;
    if (lx < 0 || lx >= 120) return '.';
    // Rounded ends and roof.
    const end = Math.min(lx, 119 - lx);
    const roof = end < 10 ? Math.round(10 - Math.sqrt(Math.max(0, 100 - (10 - end) ** 2))) : 0;
    if (y < roof + 2) return '.';
    if (y === roof + 2) return 'h';
    if (y > 33) return lx % 30 < 6 ? 'd' : '.'; // the runners
    // The open door: a dark gap, the panel hanging out at an angle.
    if (lx >= 52 && lx < 64 && y >= 10 && y < 33) return y === 10 ? 'n' : 's';
    if (lx >= 64 && lx < 67 && y >= 12 && y < 31) return 'm';
    // Windows.
    if (y >= 9 && y < 17 && lx % 14 >= 4 && lx % 14 < 12 && lx > 6 && lx < 114) {
      if (y === 9 || lx % 14 === 4) return 'n';
      return cellRandom(lx, y, 41) > 0.93 ? 'h' : 's';
    }
    // The cyan line along its side, lit in places.
    if (y === 22) return cellRandom(lx >> 3, 0, 42) > 0.6 ? 'G' : 'g';
    if (y === 33) return 'n';
    return y < 8 ? 'm' : lx < 3 || lx > 116 ? 'n' : 'p';
  }),
  colours: C,
};

/**
 * The bright room: tall, and clean (no earth has drifted in here at all). In the middle a glass
 * column from floor to ceiling, full of cyan light, still on; cables spread out from its top across the
 * ceiling; the walls are lit cyan near it and fall into shadow away from it. A slot at its base.
 * Fills the room's opening.
 */
export const brightRoom = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const cx = width / 2;
    const dx = Math.abs(x - cx + 0.5);
    // The column: glass rim, cyan inside, a white core that shimmers.
    if (dx < 10) {
      if (y > height - 8) return dx < 9 ? (y === height - 8 ? 'h' : y === height - 4 && dx < 3 ? 's' : 'm') : 'n'; // the base, with its slot
      if (dx >= 9) return 'G';
      if (dx < 2 + Math.sin(y / 9) * 0.8) return 'W';
      if (dx < 5) return (y + Math.round(dx)) % 5 === 0 ? 'W' : 'c';
      return (y * 3 + Math.round(dx)) % 7 === 0 ? 'c' : 'G';
    }
    // Cables from the column's top across the ceiling, sagging.
    for (let i = 0; i < 4; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const reach = 30 + i * 20;
      const t = (x - cx) * side;
      if (t > 10 && t < reach + 10) {
        const sag = Math.round(4 + i * 2 + Math.sin(((t - 10) / reach) * Math.PI) * (6 + i * 3));
        if (y === sag) return i < 2 ? 'g' : 'w';
      }
    }
    if (y < 3) return 'd';
    // The walls, lit by the column: cyan near it, falling smoothly into shadow.
    const glow = Math.max(0, 1 - dx / 80) ** 1.4 - Math.max(0, 1 - y / 12) * 0.15;
    return lit(glow + (cellRandom(x, y, 13) - 0.5) * 0.05, x, y);
  }),
  colours: C,
});
