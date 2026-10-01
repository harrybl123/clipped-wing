import { SHADES as S } from '../../ui/pixelArt';
import type { RowSprite } from '../../ui/sprites';

// PLACEHOLDER pixel props for the girl's home and the rot beneath it (Day 4). Her home is smaller and
// more run-down than yours and crammed with salvage; the rot is sticky, grimy, dying wood, glowing green.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

/** A cheap hash for irregular patterns that stay the same every time. */
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

/** A heap of salvage stacked against the wall: crates, coils, broken cells, rags, a headless carved bird. */
export const junkPile = (width: number, height: number, seed = 1): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    // A lumpy outline, higher in the middle.
    const top = Math.round(height * (0.15 + 0.5 * Math.abs(x / (width - 1) - 0.5)) + hash(Math.floor(x / 4), seed) * 5);
    if (y < top) return '.';
    if (y === top) return 'l';
    const block = hash(Math.floor(x / 6) + seed, Math.floor(y / 5));
    if (block > 0.93) return 'c'; // a cracked cell, still glowing a little
    if (block > 0.86) return 'g';
    if (block > 0.72) return (x + y) % 3 === 0 ? 'k' : 'm'; // metal
    if (block > 0.5) return (x % 6 === 0 || y % 5 === 0) ? 'k' : 'w'; // a crate
    if (block > 0.3) return (x + y) % 2 === 0 ? 'r' : 'a'; // rags
    return 'k';
  }),
  colours: { l: S.woodPale, w: S.woodLight, k: S.deep, m: S.dim, c: S.cyanMid, g: S.greenMid, r: S.amberDeep, a: S.woodPale },
});

/** Salvage hung from the ceiling on cords: pans, a coil, a bird with no head. You'll walk into it. */
export const HANGING_SALVAGE: RowSprite = {
  rows: fill(40, 26, (x, y) => {
    for (const [cx, len] of [[3, 10], [11, 16], [19, 8], [27, 18], [35, 12]] as const) {
      if (x === cx && y < len) return 's';
      if (Math.abs(x - cx) <= 2 && y >= len && y <= len + 3) return cx === 19 ? 'c' : cx === 27 ? (y === len + 3 ? 'k' : 'w') : 'm';
    }
    return '.';
  }),
  colours: { s: S.dim, m: S.light, c: S.cyanMid, w: S.woodPale, k: S.deep },
};

/** A patched curtain hung across the back of the room, where her family sleeps. */
export const BACK_CURTAIN: RowSprite = {
  rows: fill(30, 58, (x, y) => {
    if (y === 0) return 'o';
    if (y > 54 && (x + y) % 2 === 0) return '.';
    const patch = hash(Math.floor(x / 7), Math.floor(y / 9));
    if ((x + Math.floor(y / 3)) % 7 === 0) return 'k'; // folds
    return patch > 0.7 ? 'g' : patch > 0.4 ? 'a' : 'w';
  }),
  colours: { o: S.dim, k: S.deep, g: S.greenDeep, a: S.amberDeep, w: S.woodLight },
};

/** The new board in her floor, the one the rug covers. */
export const FLOOR_BOARD: RowSprite = {
  rows: ['pppppppppppppppppp', 'lllllllllllllllllk', 'kkkkkkkkkkkkkkkkkk'],
  colours: { p: S.light, l: S.woodPale, k: S.deep },
};

/** Where the house next to hers fell into the rot: planks nailed across the hole, rot glowing through the gaps. */
export const BOARDED_HOLE: RowSprite = {
  rows: fill(40, 6, (x, y) => {
    if (y === 0) return x % 9 === 0 ? 'n' : 'p';
    if (y === 5) return 'k';
    if (x % 9 === 4 && y < 4) return 'G'; // gaps between the planks
    return (x + y * 3) % 13 === 0 ? 'n' : y === 4 ? 'k' : 'w';
  }),
  colours: { p: S.light, w: S.woodPale, k: S.deep, n: S.dim, G: S.green },
};

/** Rot creeping over the wood in sticky, glistening patches. */
export const rotSmear = (width: number, height: number, seed = 1): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const d = Math.hypot((x - width / 2) / (width / 2), (y - height / 2) / (height / 2));
    const n = hash(Math.floor(x / 2) + seed, Math.floor(y / 2));
    if (d > 1 - n * 0.35) return '.';
    if (n > 0.92) return 'G'; // a glistening bead
    return n > 0.55 ? 'g' : 'd';
  }),
  colours: { g: S.greenDeep, d: S.shadow, G: S.green },
});

/** Strings of sticky slime hanging from the roof of the rot. */
export const slime = (width: number, seed = 1): RowSprite => ({
  rows: fill(width, 20, (x, y) => {
    const len = Math.floor(hash(x + seed, 3) * 18);
    if (x % 3 !== 0 || y > len) return '.';
    return y === len ? 'G' : 'g';
  }),
  colours: { g: S.greenDeep, G: S.greenMid },
});
