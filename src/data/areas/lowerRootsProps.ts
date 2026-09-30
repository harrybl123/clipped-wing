import { SHADES as S } from '../../ui/pixelArt';
import type { RowSprite } from '../../ui/sprites';

// PLACEHOLDER pixel props for the lower roots: the deepest, most crowded part of the roots, home
// to the tree's poorest. Patched shacks packed between huge roots, washing lines, fungi glowing
// everywhere (green, eerie; nobody calls it rot). Almost no tech this far down.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

/** A cheap hash for irregular patterns that stay the same every time. */
const hash = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

/**
 * A patched plank shack: an overhanging roof you can stand on, a doorway with a hanging cloth,
 * and a small window glowing green (fungus light) or amber (a fire inside), or dark.
 * `seed` varies the patches; `curtain` is the doorway cloth's colour.
 */
export const shack = (width: number, height: number, seed = 1, window: 'green' | 'amber' | 'dark' = 'green', curtain: number = S.amberDeep): RowSprite => {
  const doorX = seed % 2 === 0 ? 4 : width - 14;
  const winX = seed % 2 === 0 ? width - 12 : 5;
  return {
    rows: fill(width, height, (x, y) => {
      if (y === 0) return 'h'; // roof edge
      if (y <= 2) return x % 5 === 0 ? 'd' : 'r';
      if (x < 2 || x > width - 3) return y === 3 ? '.' : '.'; // roof overhang
      const wx = x - 2;
      // Doorway with a cloth, frayed at the bottom.
      if (x >= doorX && x < doorX + 10 && y >= height - 20) {
        if (x === doorX || x === doorX + 9 || y === height - 20) return 'f';
        return y > height - 4 && (x + y) % 2 === 0 ? 'k' : (x + Math.floor(y / 3)) % 4 === 0 ? 'C' : 'c';
      }
      // Window.
      if (x >= winX && x < winX + 7 && y >= 7 && y < 13) {
        if (x === winX || x === winX + 6 || y === 7 || y === 12) return 'f';
        if (x === winX + 3) return 'f';
        return window === 'green' ? 'g' : window === 'amber' ? 'a' : 'k';
      }
      // Patched planks: uneven boards of different woods.
      const board = Math.floor((wx + Math.floor(hash(Math.floor(wx / 6), seed) * 3)) / 6);
      if ((wx + Math.floor(hash(board, seed) * 3)) % 6 === 0) return 'k';
      const patch = hash(board, Math.floor(y / 9) + seed);
      if (patch > 0.9 && (x + y) % 5 === 0) return 'n'; // a nail in a patch
      return patch > 0.82 ? 'p' : patch > 0.5 ? 'w' : 'l';
    }),
    colours: { h: S.woodPale, r: S.woodLight, d: S.deep, f: S.deep, k: S.deep, w: S.wood, l: S.deep, p: S.woodLight, n: S.dim, c: curtain, C: S.deep, g: S.green, a: S.amber },
  };
};

/** A great root coming down from the ceiling: bark texture, lit down its right side. */
export const rootPillar = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    // Narrower in the middle, flaring at the top and bottom.
    const flare = Math.min(y, height - 1 - y);
    const inset = Math.min(4, Math.floor(flare / 14));
    if (x < inset || x >= width - inset) return '.';
    if (x === width - inset - 1) return 'l';
    if (x === inset) return 'o';
    const bark = hash(Math.floor(x / 3), Math.floor(y / 7));
    return bark > 0.75 ? 'o' : bark > 0.4 ? 'w' : 'd';
  }),
  colours: { o: S.shadow, d: S.deep, w: S.wood, l: S.woodLight },
});

/** Thin roots hanging from the ceiling in a tangle, `length` px long. */
export const hangingRoots = (width: number, length: number, seed = 0): RowSprite => ({
  rows: fill(width, length, (x, y) => {
    for (let i = 0; i < width; i += 3) {
      const len = length * (0.4 + 0.6 * hash(i, seed));
      const wobble = Math.round(Math.sin(y / 6 + i + seed) * 1.2);
      if (x === i + wobble && y < len) return y > len - 3 ? 'g' : hash(i, seed + 1) > 0.5 ? 'd' : 'w';
    }
    return '.';
  }),
  colours: { d: S.deep, w: S.woodLight, g: S.greenMid },
});

/** A bracket fungus growing out of the wood, glowing. */
export const FUNGUS_SHELF: RowSprite = {
  rows: ['..gggg....', '.gGGGGgg..', 'gGwGGGGgg.', '.dddddddd.'],
  colours: { g: S.greenMid, G: S.green, w: S.white, d: S.greenDeep },
};

/** Soft, dark, damp wood with fungi thick round its edge. (Nobody here calls it rot.) */
export const SOFT_PATCH: RowSprite = {
  rows: fill(22, 14, (x, y) => {
    const d = Math.hypot((x - 10.5) / 11, (y - 6.5) / 7) + hash(Math.floor(x / 3), Math.floor(y / 3)) * 0.35; // ragged edge
    if (d > 1) return '.';
    if (d > 0.82) return hash(x, y) > 0.55 ? (hash(y, x) > 0.5 ? 'g' : 'G') : 'd';
    if (d > 0.6) return hash(x, y) > 0.6 ? 'd' : 'k';
    return hash(x, y) > 0.85 ? 'd' : 'k';
  }),
  colours: { k: S.shadow, d: S.deep, g: S.greenDeep, G: S.greenMid },
};

/** A washing line strung between shacks, with patched cloths hanging off it. `width` px. */
export const washingLine = (width: number, seed: number): RowSprite => {
  const colours = ['c', 'a', 'g', 'w', 'l'];
  return {
    rows: fill(width, 14, (x, y) => {
      const sag = Math.round(Math.sin((x / (width - 1)) * Math.PI) * 3);
      if (y === sag) return 'o';
      const slot = Math.floor(x / 9);
      const inSlot = x % 9;
      const len = 6 + Math.floor(hash(slot, seed) * 6);
      if (hash(slot, seed + 3) > 0.25 && inSlot >= 1 && inSlot <= 6 && y > sag && y <= sag + len) {
        if (y === sag + len && inSlot % 2 === 0) return '.';
        return colours[Math.floor(hash(slot, seed + 7) * colours.length)]!;
      }
      return '.';
    }),
    colours: { o: S.dim, c: S.cyanDeep, a: S.amberDeep, g: S.greenDeep, w: S.woodPale, l: S.woodLight },
  };
};

/** A rope bridge: slatted planks with a handrope sagging above. `width` px. */
export const ropeBridge = (width: number): RowSprite => ({
  rows: fill(width, 16, (x, y) => {
    const ropeY = 2 + Math.round(Math.sin((x / (width - 1)) * Math.PI) * 4);
    if (y === ropeY) return 'o';
    if (y > ropeY && y < 12 && x % 14 === 0) return 'o'; // hangers
    if (y === 12) return x % 5 === 4 ? '.' : 'p';
    if (y === 13) return x % 5 === 4 ? '.' : 'd';
    return '.';
  }),
  colours: { o: S.dim, p: S.woodPale, d: S.deep },
});

/** A round hole in the wall where someone lives: lit green, lit amber, or dark. */
export const burrow = (light: 'green' | 'amber' | 'dark'): RowSprite => ({
  rows: fill(10, 9, (x, y) => {
    const d = Math.hypot((x - 4.5) / 5, (y - 4) / 4.5);
    if (d > 1) return '.';
    if (d > 0.72) return x > 4 ? 'l' : 'o';
    if (light === 'dark') return 'k';
    return y > 5 ? 'k' : light === 'green' ? 'g' : 'a';
  }),
  colours: { o: S.deep, l: S.woodLight, k: S.shadow, g: S.greenMid, a: S.amberDeep },
});

/** A communal cooking pot on a tripod over a fire. */
export const TRIPOD_POT: RowSprite = {
  rows: fill(20, 18, (x, y) => {
    // Tripod legs from the top centre out to the floor.
    if (y <= 16 && (x === 9 - Math.round(y * 0.5) || x === 10 + Math.round(y * 0.5))) return 'l';
    if (y === 0 && (x === 9 || x === 10)) return 'l';
    if (y === 1 || y === 2) return x === 9 || x === 10 ? 'o' : '.'; // chain
    if (y >= 3 && y <= 9) {
      const half = y === 3 ? 5 : y >= 8 ? 4 : 6;
      if (Math.abs(x - 9.5) <= half) return y === 3 ? 'm' : 'd';
    }
    return '.';
  }),
  colours: { l: S.woodLight, o: S.dim, m: S.dim, d: S.deep },
};

// --- The girl's home ---

/** A hammock slung between two pegs, with a patched blanket. */
export const HAMMOCK: RowSprite = {
  rows: fill(40, 10, (x, y) => {
    const sag = Math.round(Math.sin((x / 39) * Math.PI) * 6);
    if ((x === 0 || x === 39) && y <= 1) return 'k';
    if (y === sag + 1 || (x < 6 && y === Math.round((x / 6) * (sag + 1))) || (x > 33 && y === Math.round(((39 - x) / 6) * (sag + 1)))) return 'o';
    if (y > sag + 1 && y <= sag + 3 && x > 4 && x < 35) return (Math.floor(x / 5) + y) % 3 === 0 ? 'g' : (Math.floor(x / 5) % 2 === 0 ? 'w' : 'a');
    return '.';
  }),
  colours: { k: S.light, o: S.woodPale, w: S.light, a: S.amber, g: S.greenMid },
};

/** Found things on strings: shells, shards, a cracked bead that glows. Hers, and nobody else's idea of treasure. */
export const foundStrings = (length: number): RowSprite => ({
  rows: fill(15, length, (x, y) => {
    for (const [sx, n] of [[1, 0], [5, 1], [9, 2], [13, 3]] as const) {
      const len = length - 3 - ((n * 5) % 9);
      if (x === sx && y < len) return (y + n * 4) % 7 === 6 ? (n === 2 ? 'G' : n % 2 ? 'a' : 'p') : 's';
      if (Math.abs(x - sx) <= 1 && y >= len && y <= len + 1) return n === 2 ? 'G' : 'p';
    }
    return '.';
  }),
  colours: { s: S.dim, p: S.light, a: S.amberDeep, G: S.green },
});

/** Lines scratched into the wall: tunnels and turnings, like a map only she can read. */
export const SCRATCHED_MAP: RowSprite = {
  rows: [
    '..s.......s......',
    '..s...ssssss.....',
    '..ssss....s...s..',
    '.....s....s...s..',
    '.....ssssss...s..',
    '..........s.sss..',
    '.ssss.....s.s....',
    '.s..ssssssssss...',
    '.s...........s.x.',
    '.sssss.......sss.',
  ],
  colours: { s: S.light, x: S.green },
};

/** Fungi she grows in broken pots, glowing. */
export const POTTED_FUNGI: RowSprite = {
  rows: ['.G.....g..', 'GwG...gGg.', '.m..G..m..', '.m.GwG.m..', 'ddd.m.ddd.', 'ddddddddd.', '.ddd.ddd..'],
  colours: { G: S.green, g: S.greenMid, w: S.white, m: S.greenDeep, d: S.woodLight },
};

/** A curtain of stitched rags hung across her doorway, pulled to one side. */
export const RAG_CURTAIN: RowSprite = {
  rows: fill(8, 40, (x, y) => {
    if (y === 0) return 'o';
    if (y > 36 && (x + y) % 2 === 0) return '.';
    const w = Math.max(3, 8 - Math.floor(y / 8)); // gathered narrower lower down
    if (x >= w) return '.';
    return ['a', 'g', 'w', 'c'][(Math.floor(y / 6) + x) % 4]!;
  }),
  colours: { o: S.dim, a: S.amberDeep, g: S.greenDeep, w: S.woodLight, c: S.cyanDeep },
};

/** A rough ladder of lashed poles, `height` px tall. */
export const ladder = (height: number): RowSprite => ({
  rows: fill(8, height, (x, y) => (x === 0 || x === 7 ? (x === 7 ? 'l' : 'p') : y % 6 === 3 ? 'p' : '.')),
  colours: { p: S.woodLight, l: S.woodPale },
});

/** Her wall art, painted in glowing fungus ink like her tattoos: handprints, a spiral, marks. */
export const GLOW_PAINT: RowSprite = {
  rows: fill(34, 22, (x, y) => {
    // A spiral.
    const r = Math.hypot(x - 8, y - 9);
    const a = Math.atan2(y - 9, x - 8);
    if (r < 8 && Math.abs(((r - a * 1.1 + 40) % 3.4) - 1.7) < 0.5) return 'g';
    // Two handprints (palm and fingers).
    for (const [hx, hy] of [[22, 5], [28, 12]] as const) {
      if (Math.hypot((x - hx) / 2.2, (y - hy - 3) / 2) < 1) return 'G';
      if (y >= hy - 1 && y <= hy + 1 && (x === hx - 2 || x === hx || x === hx + 2)) return 'G';
      if (y === hy + 2 && x === hx + 3) return 'G'; // thumb
    }
    // Tally marks.
    if (y >= 16 && y <= 20 && x >= 16 && x <= 24 && x % 2 === 0) return 'g';
    if (y === 18 && x >= 15 && x <= 25) return 'g';
    return '.';
  }),
  colours: { g: S.greenMid, G: S.green },
};

/** A heap of her finds: shells, bones, a smooth stone, a glowing bead. */
export const FINDS: RowSprite = {
  rows: ['....p.....', '..pwp..G..', '.wwpwwpGg.', 'pwdwwpwwdp', 'dddddddddd'],
  colours: { p: S.light, w: S.woodPale, d: S.deep, G: S.green, g: S.greenMid },
};
