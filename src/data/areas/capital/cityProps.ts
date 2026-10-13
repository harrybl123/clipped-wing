import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the capital's city (Chapter 3; docs/chapter-3-world.md): below the citadel,
// cyberpunk and earthy at once: shopfronts under striped awnings, signs of cyan and amber light, steam from
// stalls and vents, lamps, screens; lower down, the low district, homes stacked and patched by hand, washing
// strung between them, plants in pots, cables everywhere. Wine is the prince's own colour, so it stays off
// these too, and red.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  W: S.white, h: S.light, m: S.dim, p: S.woodPale, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow,
  a: S.amber, A: S.amberDeep, c: S.cyan, G: S.cyanMid, g: S.cyanDeep, e: S.green, L: S.greenMid, E: S.greenDeep,
};

/** A deterministic 0–1 for a seed and a cell. */
const r = (seed: number, i: number) => {
  const v = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

/**
 * A building's front, storeys of dark stone with windows lit amber (and the odd blue one), a lit edge on
 * the right, a cornice line at each storey; `seed` varies it.
 */
export const facade = (width: number, height: number, seed: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (x === width - 1) return 'd';
    if (y === 0) return 'm';
    if (y % 18 === 0) return 'n'; // each storey's ledge
    const wy = y % 18;
    const wx = x % 8;
    if (wy > 5 && wy < 13 && wx > 2 && wx < 6 && x < width - 3) {
      const k = r(seed, Math.floor(x / 8) * 31 + Math.floor(y / 18));
      return k > 0.7 ? (wy === 6 ? 'A' : 'a') : k > 0.6 ? 'G' : k > 0.4 ? 'A' : 's';
    }
    return (x + y * 3) % 17 === 0 ? 'n' : x > width - 4 ? 'n' : 'w';
  }),
  colours: C,
});

/**
 * A shopfront: a striped awning, a lit window with things in it, a dark door, a sign board above. The kinds
 * vary what's in the window: food, cloth, parts.
 */
export const shopfront = (width: number, seed: number): RowSprite => {
  const kind = Math.floor(r(seed, 1) * 3);
  const stripe = r(seed, 2) > 0.5 ? ['a', 'A'] : ['G', 'g'];
  return {
    rows: fill(width, 50, (x, y) => {
      if (y < 8) return y === 0 || y === 7 ? 'A' : x > 2 && x < width - 3 && y > 1 && y < 6 ? (r(seed, x) > 0.5 ? 'p' : 'h') : 'n'; // the sign board
      if (y < 16) {
        // The awning, striped, its edge scalloped.
        if (y === 15 && x % 4 === 3) return '.';
        return Math.floor(x / 4) % 2 ? stripe[0]! : stripe[1]!;
      }
      if (x < 2 || x > width - 3) return 'n';
      const door = x > width - 14 && x < width - 4;
      if (door) return y < 20 ? 'n' : 's';
      if (y < 20 || y > 42) return y > 42 ? 'w' : 'n';
      // The window: lit, things in it.
      if (x < width - 16) {
        if (y > 34 && y < 42) {
          const item = Math.floor(x / 5) % 2 === 0;
          if (item) return kind === 0 ? (y === 35 ? 'a' : 'A') : kind === 1 ? (x % 3 ? 'G' : 'g') : (x + y) % 3 === 0 ? 'c' : 'm';
        }
        return (x + y) % 9 === 0 ? 'a' : 'A';
      }
      return 'n';
    }),
    colours: C,
  };
};

/** A sign of light: abstract marks in cyan or amber, in a frame; `on` false for its flicker. */
export const neonSign = (width: number, height: number, seed: number, on = true): RowSprite => {
  const col = r(seed, 3) > 0.5 ? ['c', 'G'] : ['a', 'A'];
  return {
    rows: fill(width, height, (x, y) => {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) return 'd';
      // Marks: bars and hooks, like letters nobody here reads the same way.
      const mark = Math.floor((x - 2) / 5);
      const lx = (x - 2) % 5;
      const shape = Math.floor(r(seed, mark) * 4);
      const hit =
        x > 1 && x < width - 2 && y > 1 && y < height - 2 &&
        (shape === 0 ? lx === 1 || y === 2 : shape === 1 ? lx === 1 || y === height - 3 : shape === 2 ? lx === 0 || lx === 2 || y === Math.floor(height / 2) : lx === 1 || (y === 2 && lx < 3));
      if (hit) return on ? col[0]! : col[1]!;
      return 's';
    }),
    colours: C,
  };
};
/** A sign's frames: on, then a flicker off and on. */
export const signFrames = (width: number, height: number, seed: number): RowSprite[] => [
  ...Array<RowSprite>(6).fill(neonSign(width, height, seed, true)),
  neonSign(width, height, seed, false),
  neonSign(width, height, seed, true),
  neonSign(width, height, seed, false),
];

/** A street lamp: a dark post, a blue light in a hood at its top. */
export const streetLamp = (height: number): RowSprite => ({
  rows: fill(9, height, (x, y) => {
    if (y < 2) return x > 0 && x < 8 ? 'd' : '.';
    if (y < 4) return x > 1 && x < 7 ? (y === 2 ? 'W' : 'c') : '.';
    if (y > height - 3) return x > 1 && x < 7 ? 'd' : '.';
    return x === 4 ? 'd' : x === 5 ? 'n' : '.';
  }),
  colours: C,
});

/** A food stall: a counter, a pot steaming on a burner, a striped canopy on poles, a lamp. */
export const FOOD_STALL: RowSprite = {
  rows: fill(40, 40, (x, y) => {
    if (y < 6) return Math.floor(x / 5) % 2 ? 'a' : 'A'; // the canopy
    if (x === 1 || x === 38) return 'n'; // its poles
    if (y === 7 && x === 30) return 'W'; // the lamp
    if (y >= 18 && y < 24 && x > 8 && x < 20) return y === 18 ? 'm' : 'n'; // the pot
    if (y >= 24 && y < 27) return y === 24 ? 'p' : 'a'; // the counter's top, the burner's glow under the pot
    if (y >= 27) return x < 3 || x > 36 ? '.' : (x + y) % 7 === 0 ? 'n' : 'w';
    return '.';
  }),
  colours: C,
};

/** A vent grate set into a wall, low down. */
export const VENT: RowSprite = { rows: ['nnnnnnnnnn', 'nsdsdsdsdn', 'nsdsdsdsdn', 'nsdsdsdsdn', 'nnnnnnnnnn'], colours: C };

/** A metal bench. */
export const STREET_BENCH: RowSprite = { rows: ['mmmmmmmmmmmmmmmmmmmm', 'nnnnnnnnnnnnnnnnnnnn', '.d................d.', '.d................d.', '.d................d.'], colours: C };

/** Homes stacked on each other in the low district, patched by hand: mismatched panels, small lit windows, doors, a ladder. */
export const stackedHomes = (width: number, height: number, seed: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    // Boxes of different sizes, in rows.
    const row = Math.floor(y / 26);
    const ly = y % 26;
    let bx = 0;
    let i = 0;
    while (true) {
      const w = 18 + Math.floor(r(seed + row * 7, i) * 20);
      if (x < bx + w) break;
      bx += w;
      i++;
    }
    const w = 18 + Math.floor(r(seed + row * 7, i) * 20);
    const lx = x - bx;
    if (ly === 0 || lx === 0) return 's';
    const tone = r(seed + row * 3, i * 5);
    // A door or a window in each box; a ladder on some.
    if (lx === w - 3 && tone > 0.6) return ly % 3 === 0 ? 'p' : 'n';
    if (lx > 3 && lx < 9 && ly > 6 && ly < 13) return r(seed, i * 11 + row) > 0.35 ? (ly === 7 ? 'a' : 'A') : 's';
    if (lx > 11 && lx < 17 && ly > 10 && lx < w - 4) return 's';
    const base = tone > 0.75 ? 'g' : tone > 0.55 ? 'A' : tone > 0.3 ? 'n' : 'w';
    return (lx + ly) % 13 === 0 ? 'd' : ly === 1 ? 'p' : base;
  }),
  colours: C,
});

/** Washing hung on a line: shirts and cloths in faded colours. */
export const washing = (width: number): RowSprite => ({
  rows: fill(width, 12, (x, y) => {
    const sag = Math.round(Math.sin((x / width) * Math.PI) * 3);
    if (y === sag) return 'd';
    const item = Math.floor(x / 7);
    if (x % 7 < 5 && y > sag && y < sag + 6 + (item % 3) * 2) return ['h', 'G', 'A', 'p', 'm'][item % 5]!;
    return '.';
  }),
  colours: C,
});

/** Plants in pots and tins on a ledge: the low district's own green. */
export const POTS: RowSprite = {
  rows: fill(30, 14, (x, y) => {
    for (const [px, h] of [[1, 9], [9, 12], [17, 7], [23, 10]] as const) {
      if (x >= px && x < px + 6) {
        if (y >= 14 - 4) return x === px || x === px + 5 ? 'n' : 'A'; // the pot
        if (y >= 14 - h) return (x + y) % 3 === 0 ? 'E' : (x + y) % 2 ? 'L' : 'e';
      }
    }
    return '.';
  }),
  colours: C,
};

/** A dead screen: cracked glass, dark, a sputter of blue in one corner. */
export const DEAD_SCREEN: RowSprite = {
  rows: fill(40, 26, (x, y) => {
    if (x === 0 || y === 0 || x === 39 || y === 25) return 'n';
    if (Math.abs(y - 4 - (x - 6) * 0.6) < 0.5 || Math.abs(y - 18 + (x - 20) * 0.4) < 0.5) return 'm'; // cracks
    if (x > 30 && y > 18 && (x + y) % 2 === 0) return 'G';
    return 's';
  }),
  colours: C,
};

/** A bundle of cables running down a wall, held by brackets. */
export const cableBundle = (height: number): RowSprite => ({
  rows: fill(7, height, (x, y) => {
    if (y % 30 === 0) return 'm';
    if (x === 1 || x === 3 || x === 5) return x === 3 ? 'g' : 'd';
    return x === 2 || x === 4 ? 's' : '.';
  }),
  colours: C,
});

// --- The gate ---

/**
 * The city wall where the gate goes through it: old stone below and gold and marble gone dull above, a
 * passage through it under an arch, the road showing at its far end.
 */
export const gateWall = (width: number, height: number, opening: { x: number; width: number; height: number }): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const ox = x - opening.x;
    const archTop = height - opening.height;
    const inArch = ox >= 0 && ox < opening.width && y > archTop + Math.round(opening.width / 2 - Math.sqrt(Math.max(0, (opening.width / 2) ** 2 - (ox - opening.width / 2) ** 2)));
    if (inArch) return y > height - 3 ? 'd' : 'w';
    if (y < 4) return y === 0 ? 'm' : 'A'; // the dull gold coping
    if (y < 30) return (x + y) % 11 === 0 ? 'n' : y % 10 === 0 ? 'p' : 'm'; // marble, weathered
    // Old stone courses.
    const course = Math.floor(y / 8);
    const sx = x + (course % 2) * 6;
    if (y % 8 === 0 || sx % 14 === 0) return 's';
    return r(Math.floor(sx / 14), course) > 0.6 ? 'p' : r(Math.floor(sx / 14), course + 99) > 0.3 ? 'n' : 'w';
  }),
  colours: C,
});

/** The checkpoint's booth: dark panels, a lit window, a screen on its side. */
export const BOOTH: RowSprite = {
  rows: fill(34, 50, (x, y) => {
    if (y < 4) return y === 0 ? 'a' : 'n';
    if (x === 0 || x === 33) return 'd';
    if (y > 10 && y < 26 && x > 4 && x < 22) return y === 11 ? 'a' : (x + y) % 6 === 0 ? 'W' : 'A'; // the lit window
    if (y > 12 && y < 22 && x > 24 && x < 31) return (x + y) % 3 === 0 ? 'c' : 'G'; // a screen
    return y > 46 ? 'd' : 'w';
  }),
  colours: C,
};

/** The barrier arm across the road, striped. */
export const barrierArm = (width: number): RowSprite => ({
  rows: fill(width, 14, (x, y) => {
    if (x < 4) return y < 3 ? 'n' : 'd'; // its post
    if (y < 3) return Math.floor(x / 6) % 2 ? 'h' : 'a';
    return '.';
  }),
  colours: C,
});

// --- The data centre ---

/** A rack: a tall dark cabinet full of units, each with its row of small blue lights (`phase` moves them). */
export const rack = (height: number, phase: number): RowSprite => ({
  rows: fill(22, height, (x, y) => {
    if (x === 0 || x === 21 || y === 0 || y === height - 1) return 'n';
    if (y % 6 === 0) return 'd';
    if (y % 6 === 3 && x > 2 && x < 19 && x % 2 === 1) {
      const k = r(x * 13 + y, phase);
      return k > 0.75 ? 'c' : k > 0.5 ? 'G' : k > 0.42 ? 'a' : 'g';
    }
    return x > 18 ? 'w' : 's';
  }),
  colours: C,
});
/** A rack's lights blinking. */
export const rackFrames = (height: number): RowSprite[] => [0, 1, 2].map((i) => rack(height, i));

/** The operator's desk: a bank of screens, a chair. */
export const OPERATOR_DESK: RowSprite = {
  rows: fill(56, 36, (x, y) => {
    if (y < 18) {
      const screenAt = Math.floor(x / 14);
      const lx = x % 14;
      if (lx === 0 || lx === 13 || y === 0 || y === 17) return y > 14 ? '.' : 'n';
      if (y < 15) return (lx + y + screenAt) % 4 === 0 ? 'c' : y % 3 === 0 ? 'G' : 'g';
      return '.';
    }
    if (y < 21) return y === 18 ? 'm' : 'n';
    return x === 2 || x === 53 ? 'n' : '.';
  }),
  colours: C,
};

// --- The hideout ---

/** The bar's counter: dark wood, scarred, a brass rail along its foot. */
export const barCounter = (width: number): RowSprite => ({
  rows: fill(width, 24, (x, y) => {
    if (y === 0) return 'p';
    if (y === 1) return 'n';
    if (y === 20) return 'a';
    return (x + y * 5) % 23 === 0 ? 'n' : x % 16 === 0 ? 'd' : 'w';
  }),
  colours: C,
});

/** Shelves of bottles behind the bar, odd shapes, catching the lamplight. */
export const BOTTLES: RowSprite = {
  rows: fill(60, 40, (x, y) => {
    if (y % 13 === 12) return 'n';
    const b = Math.floor(x / 4);
    const h = 5 + Math.floor(r(b, Math.floor(y / 13)) * 6);
    const ly = 12 - (y % 13);
    if (x % 4 === 3 || ly > h) return '.';
    const tone = ['A', 'g', 'n', 'E', 'a'][Math.floor(r(b, 7 + Math.floor(y / 13)) * 5)]!;
    return ly === h ? 'd' : x % 4 === 2 && ly < h - 1 ? 'h' : tone;
  }),
  colours: C,
};

/** A small table and two stools. */
export const BAR_TABLE: RowSprite = {
  rows: ['......pppppppp......', '......nnnnnnnn......', '.........ww.........', 'ppp......ww.....ppp.', '.w.......ww......w..', '.w.......ww......w..', '.w......wwww.....w..'],
  colours: C,
};

/** A lamp hanging from the cellar's ceiling, a warm bulb in a cage. */
export const CAGE_LAMP: RowSprite = { rows: ['.nn.', 'nWWn', 'aWWa', '.aa.'], colours: C };

/** The way down to the hideout: a low dark doorway at street level, rough stone round it, steps going down into the dark. */
export const CELLAR_DOOR: RowSprite = {
  rows: fill(30, 34, (x, y) => {
    if (x < 3 || x > 26 || y < 3) return (x + y) % 5 === 0 ? 's' : (x * 3 + y) % 7 === 0 ? 'p' : 'n';
    // Steps going down into the dark, each fainter.
    const step = Math.floor((y - 3) / 5);
    if ((y - 3) % 5 === 0 && x > 3 + step * 2 && x < 26 - step * 2) return step < 3 ? 'm' : 'n';
    return 's';
  }),
  colours: C,
};

/** A long table with benches either side of it, scarred, cups on it. */
export const LONG_TABLE: RowSprite = {
  rows: fill(60, 16, (x, y) => {
    if (y < 2) return [8, 20, 34, 47].includes(x) || [9, 21, 35, 48].includes(x) ? 'A' : '.'; // cups
    if (y < 4) return y === 2 ? 'p' : 'n';
    if (y < 9) return x === 4 || x === 55 ? 'w' : '.';
    if (y < 11) return y === 9 ? 'p' : 'w'; // the benches
    return x === 2 || x === 20 || x === 39 || x === 57 ? 'w' : '.';
  }),
  colours: C,
};

/** A barrel, hooped. */
export const BARREL: RowSprite = {
  rows: fill(14, 18, (x, y) => {
    const bulge = 5.5 + Math.sin((y / 17) * Math.PI) * 1.5;
    if (Math.abs(x - 6.5) > bulge) return '.';
    if (y === 2 || y === 15) return 'm';
    return x > 9 ? 'p' : x < 3 ? 'w' : 'n';
  }),
  colours: C,
};

/** Crates stacked. */
export const CRATES: RowSprite = {
  rows: fill(30, 30, (x, y) => {
    const inBox = (bx: number, by: number, w: number) => x >= bx && x < bx + w && y >= by && y < by + w;
    for (const [bx, by, w] of [[0, 14, 16], [15, 16, 14], [6, 0, 14]] as const) {
      if (!inBox(bx, by, w)) continue;
      const lx = x - bx;
      const ly = y - by;
      if (lx === 0 || ly === 0 || lx === w - 1 || ly === w - 1 || lx === ly || lx === w - 1 - ly) return 'w';
      return 'p';
    }
    return '.';
  }),
  colours: C,
};

/** Notices pasted on the wall, layered, torn: the movement's, and the capital's over them. */
export const NOTICES: RowSprite = {
  rows: fill(50, 34, (x, y) => {
    for (const [nx, ny, w, h, tone] of [[0, 4, 14, 18, 'h'], [10, 0, 16, 20, 'p'], [24, 6, 12, 16, 'h'], [34, 2, 16, 22, 'm'], [6, 18, 18, 14, 'p'], [26, 20, 20, 13, 'h']] as const) {
      if (x >= nx && x < nx + w && y >= ny && y < ny + h) {
        if ((x - nx + y - ny) % 11 === 0 && y > ny + h - 4) return '.'; // torn
        return (y - ny) % 3 === 2 && x > nx + 1 && x < nx + w - 2 ? 'n' : tone;
      }
    }
    return '.';
  }),
  colours: C,
};
