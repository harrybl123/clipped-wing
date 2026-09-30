import { SHADES as S } from '../../ui/pixelArt';
import type { RowSprite } from '../../ui/sprites';

// PLACEHOLDER pixel props for the archive: the Ascension records, high in the branches. Quiet and
// dusty, lamplit, with the Canopy's light through a round window. The records are a wall of
// plaques, one for each of the Ascended, each with the maker's carved mark (a picture anyone can
// recognise, beside writing only high society can read). A scavenged index engine finds them.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

/** Maker's marks, 5×5: simple carved pictographs that tell one maker from another. */
const MARKS: string[][] = [
  ['.xxx.', 'x...x', 'x.x.x', 'x...x', '.xxx.'], // ring with a dot
  ['x...x', '.x.x.', '..x..', '.x.x.', 'x...x'], // cross
  ['..x..', '.xxx.', 'xxxxx', '..x..', '..x..'], // tree
  ['x.x.x', 'x.x.x', 'x.x.x', 'x.x.x', 'x.x.x'], // lines
  ['xxxxx', '....x', 'xxx.x', 'x...x', 'xxxxx'], // spiral
  ['..x..', '.x.x.', 'x...x', '.x.x.', '..x..'], // diamond
  ['x....', 'xx...', 'x.x..', 'x..x.', 'xxxxx'], // triangle
  ['.x.x.', 'xxxxx', '.x.x.', 'xxxxx', '.x.x.'], // lattice
  ['..x..', '..x..', 'xxxxx', '..x..', '..x..'], // plus
  ['x...x', 'xx.xx', 'x.x.x', 'x...x', 'x...x'], // peaks
];

/**
 * The wall of records: plaques in rows, each with writing and a maker's mark. The last plaque is
 * newly cut (paler wood). `cols`×`rows` plaques, 14×12 px each with a 2px gap.
 */
export const recordWall = (cols: number, rows: number): RowSprite => ({
  rows: fill(cols * 16, rows * 14, (x, y) => {
    const col = Math.floor(x / 16);
    const row = Math.floor(y / 14);
    const px = x % 16;
    const py = y % 14;
    if (px >= 14 || py >= 12) return '.';
    const newest = col === cols - 1 && row === rows - 1;
    if (px === 0 || py === 0) return newest ? 'N' : 'e';
    if (px === 13 || py === 11) return 'd';
    const mark = MARKS[(col * 7 + row * 3) % MARKS.length]!;
    if (px >= 2 && px <= 6 && py >= 3 && py <= 7 && mark[py - 3]![px - 2] === 'x') return 'm';
    if (px >= 8 && px <= 11 && (py === 3 || py === 5 || py === 7) && (px + py + col) % 4 !== 0) return 'w'; // writing
    return newest ? 'n' : 'b';
  }),
  colours: { e: S.woodPale, d: S.deep, b: S.woodLight, m: S.light, w: S.dim, N: S.light, n: S.woodPale },
});

/**
 * The index engine: a cabinet of drawers worked by a crank and a big gear, with a glowing lens
 * that lights up the drawer you want. Scavenged tech the archivists barely understand.
 */
export const INDEX_ENGINE: RowSprite = {
  rows: fill(48, 64, (x, y) => {
    // Gear on top.
    const r = Math.hypot(x - 24, y - 11);
    if (y < 22) {
      if (r > 10.5) return '.';
      if (r > 9) return Math.round(Math.atan2(y - 11, x - 24) * 3.2) % 2 === 0 ? 'm' : '.';
      if (r > 8) return 'm';
      if (r < 3) return r < 1.5 ? 'W' : 'c'; // the lens
      if (Math.abs(x - 24) < 1 || Math.abs(y - 11) < 1) return 'm'; // spokes
      return 'k';
    }
    // Crank on the right side.
    if (x >= 44 && y >= 30 && y <= 40) return (x === 45 && y < 40) || (y === 40 && x >= 44) ? 'l' : '.';
    if (x > 43) return '.';
    // Cabinet of little drawers with pale label plates.
    if (y === 22 || x === 4 || x === 43 || y === 63) return 'f';
    if (x < 4) return '.';
    const dx = (x - 5) % 6;
    const dy = (y - 23) % 5;
    if (dx === 5 || dy === 4) return 'd';
    if (dx >= 2 && dx <= 3 && dy === 1) return (Math.floor((x - 5) / 6) === 3 && Math.floor((y - 23) / 5) === 4) ? 'c' : 'p'; // one lit
    return 'w';
  }),
  colours: { m: S.dim, k: S.deep, W: S.white, c: S.cyan, l: S.light, f: S.woodPale, d: S.deep, p: S.light, w: S.woodLight },
};

/** A chest of record drawers, `width`×`height`, each drawer with a pale label and a pull. */
export const drawers = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (y === 0) return 'h';
    if (x === 0 || x === width - 1 || y === height - 1) return 'f';
    const dx = (x - 1) % 10;
    const dy = (y - 1) % 7;
    if (dx === 9 || dy === 6) return 'd';
    if (dy === 2 && dx >= 3 && dx <= 5) return 'p';
    if (dy === 4 && dx === 4) return 'k';
    return 'w';
  }),
  colours: { h: S.woodPale, f: S.woodLight, d: S.deep, p: S.light, k: S.dim, w: S.wood },
});

/** A round window high in the wall, full of the Canopy's glare. */
export const ROUND_WINDOW: RowSprite = {
  rows: fill(34, 34, (x, y) => {
    const r = Math.hypot(x - 16.5, y - 16.5);
    if (r > 17) return '.';
    if (r > 14.5) return x > 17 ? 'p' : 'l';
    if (Math.abs(x - 16.5) < 1 || Math.abs(y - 16.5) < 1) return 'f'; // glazing bars
    return r < 8 ? 'W' : 'w';
  }),
  colours: { p: S.woodPale, l: S.woodLight, f: S.woodLight, W: S.white, w: S.light },
};

/** Scrolls and bound records piled up waiting to be filed. */
export const RECORD_PILE: RowSprite = {
  rows: ['....ww......', '...wLLw..aa.', '..wLLw..aAAa', 'bbbbbbb.aAAa', 'cccccccc.aa.', 'bbbbbbbbbbbb'],
  colours: { w: S.woodPale, L: S.light, a: S.amberDeep, A: S.amber, b: S.woodLight, c: S.cyanDeep },
};

/** The back hatch: a trapdoor in the floor with an iron ring, the trunk climb's ladder below. */
export const TRAPDOOR: RowSprite = {
  rows: fill(24, 3, (x, y) => (y === 0 ? (x === 11 || x === 12 ? 'r' : 'h') : x === 0 || x === 23 || x % 6 === 0 ? 'd' : 'p')),
  colours: { h: S.woodPale, p: S.woodLight, d: S.deep, r: S.light },
};

/** A tall library ladder leaning on the shelves. */
export const libraryLadder = (height: number): RowSprite => ({
  rows: fill(12, height, (x, y) => {
    const lean = Math.round((height - y) * 0.08);
    if (x === lean || x === lean + 7) return x === lean + 7 ? 'l' : 'p';
    if (x > lean && x < lean + 7 && y % 7 === 3) return 'p';
    return '.';
  }),
  colours: { p: S.woodLight, l: S.woodPale },
});
