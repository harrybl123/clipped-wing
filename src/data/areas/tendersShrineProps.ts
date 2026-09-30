import { SHADES as S } from '../../ui/pixelArt';
import type { RowSprite } from '../../ui/sprites';

// PLACEHOLDER pixel props for the Tender's shrine: where the Tender works and meets the elders.
// Official and a little grand for the roots: carved pillars and high chairs, birds carved along the
// beams, amber lamplight, and a blessing enshrined behind the council, glowing like the tube.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

/** The Tender's work desk: a heavy carved top on two legs, with a drawer. */
export const DESK: RowSprite = {
  rows: fill(40, 14, (x, y) => {
    if (y === 0) return 'h';
    if (y <= 2) return 'p';
    if (y === 3) return 'd';
    if (y <= 7 && x >= 14 && x <= 25) return y === 7 ? 'd' : x === 19 || x === 20 ? (y === 5 ? 'k' : 'f') : 'f'; // drawer
    return (x >= 2 && x <= 4) || (x >= 35 && x <= 37) ? 'l' : '.';
  }),
  colours: { h: S.woodPale, p: S.woodLight, d: S.deep, f: S.wood, k: S.light, l: S.woodLight },
};

/**
 * A tally board: a pictograph for each family's kind of ornament, with notches beside each (roots-dwellers can't read, so
 * the records are counted, not written). `seed` varies the counts.
 */
export const tallyBoard = (seed: number): RowSprite => ({
  rows: fill(16, 20, (x, y) => {
    if (y === 0 || y === 19 || x === 0 || x === 15) return 'e';
    const line = Math.floor((y - 2) / 4);
    const ly = (y - 2) % 4;
    if (y < 2 || line > 3 || ly === 3) return 'b';
    if (x >= 2 && x <= 4) return (line % 2 === 0 ? ly === 1 || x === 3 : ly !== 1 || x === 3) ? 'i' : 'b'; // a little pictograph of each family's ornament
    const count = 3 + ((seed * 7 + line * 5) % 8);
    if (x >= 6 && x < 6 + count && x % 2 === 0) return ly === 1 && (x - 6) % 10 === 8 ? 'n' : 'n';
    return 'b';
  }),
  colours: { e: S.woodLight, b: S.wood, i: S.amberDeep, n: S.light },
});

/** A high-backed elder's chair, with a carved finial. */
export const HIGH_CHAIR: RowSprite = {
  rows: fill(14, 34, (x, y) => {
    if (y <= 2) return x >= 5 && x <= 8 ? (y === 0 ? 'h' : 'p') : '.'; // finial
    if (y < 22) {
      if (x === 1 || x === 12) return 'p';
      if (x === 2 || x === 11) return 'd';
      if (x > 2 && x < 11) return y === 3 ? 'h' : (x + y) % 5 === 0 ? 'd' : 'f'; // carved back
      return '.';
    }
    if (y === 22) return 'h'; // seat
    if (y === 23) return 'd';
    return x === 1 || x === 2 || x === 11 || x === 12 ? 'p' : '.';
  }),
  colours: { h: S.woodPale, p: S.woodLight, d: S.deep, f: S.wood },
};

/** A blessing enshrined in a carved frame behind the council: a smooth panel glowing like the tube. */
export const ENSHRINED_BLESSING: RowSprite = {
  rows: fill(40, 30, (x, y) => {
    const frame = x < 3 || x > 36 || y < 3 || y > 26;
    if (frame) return (x + y) % 4 === 0 ? 'd' : x < 3 || y < 3 ? 'l' : 'p';
    const cx = Math.abs(x - 19.5) / 17;
    const cy = Math.abs(y - 14.5) / 12;
    const glow = Math.max(cx, cy);
    return glow < 0.3 ? 'w' : glow < 0.7 ? 'c' : 'm';
  }),
  colours: { l: S.woodLight, p: S.woodPale, d: S.deep, w: S.white, c: S.cyan, m: S.cyanMid },
};

/** A grate set into the floor (the back routes are beneath it). */
export const FLOOR_GRATE: RowSprite = {
  rows: fill(24, 3, (x, y) => (y === 0 ? (x % 3 === 0 ? 'f' : 'k') : x % 3 === 0 ? 'f' : 'k')),
  colours: { f: S.dim, k: S.shadow },
};

/** A ring of lamps hung from a chain: the shrine's chandelier. */
export const CHANDELIER: RowSprite = {
  rows: ['......d......', '.....ddd.....', 'd.....d.....d', 'dddddddddddd.', '.a...a...a...', 'awa.awa.awa..', '.a...a...a...'].map((r) => r.padEnd(13, '.')),
  colours: { d: S.dim, a: S.amber, w: S.white },
};

/** A carved pillar against the wall, with a capital and base. */
export const pillar = (height: number): RowSprite => ({
  rows: fill(12, height, (x, y) => {
    if (y < 4 || y >= height - 4) return y === 0 || y === height - 1 ? 'd' : x === 11 ? 'l' : 'p'; // capital and base
    if (x < 2 || x > 9) return '.';
    return x === 9 ? 'l' : x === 2 ? 'd' : (x + Math.floor(y / 6)) % 3 === 0 ? 'd' : 'f'; // fluted
  }),
  colours: { p: S.woodPale, l: S.woodLight, d: S.deep, f: S.wood },
});
