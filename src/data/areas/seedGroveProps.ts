import { SHADES as S } from '../../ui/pixelArt';
import type { RowSprite } from '../../ui/sprites';

// PLACEHOLDER pixel props for the seed grove: where healthy seeds grow, out along a branch in the
// upper branches. The only gardens in the tree: raised beds, saplings, glass cloches, irrigation
// fed by scavenged pipes, and a locked vault of seeds. The Canopy's light pours in from above.
// (Leaves are green; the eerie glowing green of fungi stays in the roots.)

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const hash = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

/** A raised bed of dark soil with rows of seedlings, `width` px. */
export const seedBed = (width: number, seed = 0): RowSprite => ({
  rows: fill(width, 14, (x, y) => {
    if (y < 6) {
      // Seedlings every 5px: a stem and two leaves, heights varying.
      const sx = (x - 2) % 5;
      const tall = 3 + Math.floor(hash(Math.floor(x / 5), seed) * 3);
      if (x < 2 || x > width - 3) return '.';
      if (sx === 0 && y >= 6 - tall) return y === 6 - tall ? 'G' : 'g';
      if ((sx === 1 || sx === 4) && y === 6 - tall + 1) return 'G';
      return '.';
    }
    if (y === 6) return x < 1 || x > width - 2 ? 'h' : (x + seed) % 3 === 0 ? 'k' : 's'; // soil
    if (y === 7) return 'h';
    return x % 12 === 0 ? 'd' : y === 13 ? 'd' : 'p'; // planks
  }),
  colours: { g: S.greenMid, G: S.green, s: S.deep, k: S.shadow, h: S.woodPale, p: S.woodLight, d: S.deep },
});

/** A young tree in a tub, reaching up towards the light. */
export const sapling = (height: number, seed = 0): RowSprite => ({
  rows: fill(22, height, (x, y) => {
    const tub = height - 8;
    if (y >= tub) return x >= 4 && x <= 17 ? (y === tub ? 'h' : x % 5 === 0 ? 'd' : 'p') : '.';
    // Trunk, slightly bent.
    const tx = 10 + Math.round(Math.sin(y / 9 + seed) * 1.2);
    if ((x === tx || x === tx + 1) && y > height * 0.35) return x === tx + 1 ? 'l' : 'w';
    // Leafy crown: clumps of leaves.
    const crown = Math.hypot((x - 10.5) / 10, (y - height * 0.28) / (height * 0.3));
    if (crown < 1 && hash(x, y + seed) > 0.22) return crown < 0.5 && x > 11 ? 'L' : hash(y, x) > 0.6 ? 'G' : 'g';
    return '.';
  }),
  colours: { h: S.woodPale, p: S.woodLight, d: S.deep, w: S.wood, l: S.woodPale, g: S.greenMid, G: S.green, L: S.light },
});

/** A glass cloche over a precious seedling, on a little stand. */
export const CLOCHE: RowSprite = {
  rows: [
    '....ww....',
    '..wW..w...',
    '.w......w.',
    '.W..G...w.',
    'w..GgG...w',
    'w...g....w',
    'w...g....w',
    'wwwwwwwwww',
    '.pppppppp.',
    '..d....d..',
    '..d....d..',
  ],
  colours: { w: S.light, W: S.white, G: S.green, g: S.greenMid, p: S.woodPale, d: S.woodLight },
};

/** A trellis arch with vines climbing it. */
export const TRELLIS: RowSprite = {
  rows: fill(40, 56, (x, y) => {
    const cx = 19.5;
    const outer = y < 20 ? ((x - cx) / 19.5) ** 2 + ((y - 20) / 20) ** 2 : Math.abs(x - cx) / 19.5;
    const inner = y < 20 ? ((x - cx) / 15.5) ** 2 + ((y - 20) / 16) ** 2 : Math.abs(x - cx) / 15.5;
    if (outer > 1) return '.';
    if (inner < 1) {
      // Hanging vines inside the arch, only near the top.
      if (y < 24 && hash(x, 3) > 0.7 && y < 8 + hash(x, 9) * 16) return 'g';
      return '.';
    }
    const vine = hash(x, y) > 0.55;
    if (vine) return hash(y, x) > 0.5 ? 'G' : 'g';
    return (x + y) % 4 === 0 ? 'l' : 'p';
  }),
  colours: { p: S.woodPale, l: S.woodLight, g: S.greenMid, G: S.green },
};

/**
 * The seed vault: a locked cabinet of glass jars, each holding seeds that glow a warm amber (living,
 * healthy). An iron band and a lock across the doors.
 */
export const SEED_VAULT: RowSprite = {
  rows: fill(44, 56, (x, y) => {
    if (y <= 3) return y === 0 ? 'L' : x % 4 === (y % 2 ? 1 : 3) ? 'd' : 'p'; // carved top
    if (x === 0 || x === 43 || y === 55) return 'f';
    if (x === 21 || x === 22) return y === 28 || y === 29 ? 'k' : 'f'; // the doors' meeting line, the lock
    if (y === 27 || y === 30) return 'i'; // iron band
    // Jars on shelves.
    const shelfY = (y - 5) % 12;
    if (shelfY === 11) return 'h';
    const jx = (x - 2) % 6;
    if (jx >= 1 && jx <= 4 && shelfY >= 3 && shelfY <= 10) {
      if (shelfY === 3) return 'w';
      if (jx === 1 || jx === 4 || shelfY === 10) return 'g';
      return shelfY >= 6 ? (hash(x, y) > 0.5 ? 'A' : 'a') : 'c'; // seeds glowing amber
    }
    return 'k';
  }),
  colours: { L: S.light, p: S.woodPale, d: S.deep, f: S.woodLight, k: S.shadow, i: S.dim, h: S.woodPale, w: S.light, g: S.dim, c: S.deep, a: S.amberDeep, A: S.amber },
};

/** A scavenged pipe run along the ceiling, with drip nozzles every so often. `width` px. */
export const irrigationPipe = (width: number): RowSprite => ({
  rows: fill(width, 5, (x, y) => {
    if (y <= 2) return x % 40 === 0 ? 'j' : y === 0 ? 'l' : y === 1 ? 'm' : 'd';
    return x % 30 === 15 && y <= 4 ? 'm' : '.'; // nozzles
  }),
  colours: { l: S.light, m: S.dim, d: S.deep, j: S.cyanMid },
});

/** The branch opening to the sky, bright with the Canopy's white glare. `width` px. */
export const canopyOpening = (width: number): RowSprite => ({
  rows: fill(width, 22, (x, y) => {
    const edge = 12 + Math.round(Math.sin(x / 6) * 2 + hash(Math.floor(x / 3), 1) * 2);
    const depth = edge * (1 - ((x - width / 2) / (width / 2)) ** 4);
    if (y > depth) return '.';
    if (y > depth - 1.5) return 'l';
    return y < depth * 0.5 ? 'W' : 'w';
  }),
  colours: { W: S.white, w: S.light, l: S.woodPale },
});

/** Where the floor falls away under the rope bridge: dark, with roots hanging into it. `width` px. */
export const drop = (width: number): RowSprite => ({
  rows: fill(width, 34, (x, y) => {
    if (y === 0) return x === 0 || x === width - 1 ? 'l' : '.';
    if (x < 2 || x > width - 3) return x === 0 || x === width - 1 ? 'l' : 'd';
    if (x % 9 === 4 && y < 8 + hash(x, 2) * 14) return 'r';
    return y > 20 ? 'k' : 'o';
  }),
  colours: { l: S.woodLight, d: S.deep, r: S.woodLight, o: S.shadow, k: S.shadow },
});

/** A watering can left by a bed. */
export const WATERING_CAN: RowSprite = {
  rows: ['..mmm....', '.m...m...', 'mmmmmmm.m', 'mlllllmm.', 'mlllllm..', 'mmmmmmm..'],
  colours: { m: S.dim, l: S.light },
};

/** Vines trailing down from the edge of the opening, leaves along them. `length` px. */
export const trailingVines = (width: number, length: number, seed = 0): RowSprite => ({
  rows: fill(width, length, (x, y) => {
    for (let i = 1; i < width; i += 4) {
      const len = length * (0.35 + 0.65 * hash(i, seed));
      const vx = i + Math.round(Math.sin(y / 5 + i) * 1);
      if (x === vx && y < len) return y % 4 === 0 ? 'G' : 'g';
      if (x === vx + 1 && y < len && y % 4 === 2) return 'G'; // leaf
    }
    return '.';
  }),
  colours: { g: S.greenMid, G: S.green },
});
