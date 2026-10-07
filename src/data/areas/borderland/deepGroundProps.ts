import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the deep ground (Chapter 2): forbidden and far out. Past the last junk;
// the ground changes, harder and darker. The clan's last marker, which says go no further.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale, a: S.amber, A: S.amberDeep,
  W: S.white, g: S.cyanDeep, G: S.cyanMid, c: S.cyan,
};

/** The last marker: a tall pole, the clan's sign, rags, and a line of stones laid across the ground at its foot. */
export const LAST_MARKER: RowSprite = {
  rows: fill(60, 64, (x, y) => {
    if (x === 29 || x === 30) return y < 2 ? 'h' : y > 60 ? 'd' : 'n';
    // The sign: the clan's ring, and a bar struck through it (no further).
    if (y >= 4 && y < 20 && x >= 21 && x < 39) {
      const d = Math.hypot(x - 29.5, y - 11.5);
      if (Math.abs(d - 6) < 1.1) return 'd';
      if (Math.abs((x - 29.5) + (y - 11.5)) < 1 && d < 7) return 'd';
      return d < 8 ? 'm' : '.';
    }
    // Rags, long and faded.
    if (y >= 22 && y < 40 && x > 30 && x < 30 + (y - 20) / 3) return y % 4 === 0 ? 'A' : 'p';
    // The line of stones across the ground.
    if (y >= 60 && (x % 7 < 4)) return y === 60 ? 'h' : 'm';
    return '.';
  }),
  colours: C,
};

/** The last bits of junk, half sunk in the hard ground, fewer and fewer. */
export const lastJunk = (width: number, seed: number): RowSprite => ({
  rows: fill(width, 8, (x, y) => {
    const top = 8 - Math.round(Math.sin((x / width) * Math.PI) * (4 + (seed % 4)));
    if (y < top) return '.';
    return y === top ? 'm' : (x + seed) % 5 === 0 ? 'd' : 'n';
  }),
  colours: C,
});

/**
 * A scavenger's sled left where it stopped, in a groove: a flat bed of plate on runners, still loaded
 * (bundles of finds tied down with cord), dust drifted against it, its pull rope lying out ahead.
 * Somebody went out and didn't bring it back. Bottom edge on the ground.
 */
export const SLED: RowSprite = {
  rows: fill(64, 16, (x, y) => {
    // The pull rope, lying slack along the ground ahead (to the right).
    if (x >= 44 && y === 15 - (x % 6 === 0 ? 1 : 0)) return 'p';
    if (x >= 44) return '.';
    // The runners, curled up at the front.
    if (y >= 14) return x % 2 === 0 || y === 14 ? 'd' : 'n';
    if (y === 13 && x >= 40) return 'd';
    // The bed.
    if (y === 11) return 'h';
    if (y === 12) return 'm';
    if (y === 13) return 'n';
    // The load: three bundles, tied with cord.
    const bundle = (bx: number, bw: number, bh: number) => {
      if (x < bx || x >= bx + bw || y < 11 - bh) return null;
      if (x === bx + Math.floor(bw / 2) || y === 11 - bh + 2) return 'A'; // the cord
      if (y === 11 - bh) return 'm';
      return (x + y) % 4 === 0 ? 'w' : 'n';
    };
    const b = bundle(2, 14, 8) ?? bundle(17, 12, 6) ?? bundle(30, 9, 9);
    if (b) return b;
    // A gleam of something on top: one pale casing.
    if (y === 1 && x >= 31 && x <= 36) return 'W';
    // Dust drifted against the back.
    if (x < 3 && y > 8) return 'p';
    return '.';
  }),
  colours: C,
};

/** An older marker, further out than the last one, lying flat: the pole, its sign face up, worn almost smooth. Bottom edge on the ground. */
export const FALLEN_MARKER: RowSprite = {
  rows: fill(64, 9, (x, y) => {
    // The pole along the ground.
    if (y >= 6 && x < 48) return y === 6 ? 'h' : y === 7 ? 'm' : 'n';
    // The sign at its end, face up, seen almost edge on: the ring and bar barely there.
    if (x >= 46 && x < 62 && y >= 3) {
      const d = Math.hypot((x - 54) / 1, (y - 6) * 2.4);
      if (d > 8) return '.';
      if (Math.abs(d - 5) < 0.9 && (x + y) % 3 !== 0) return 'n'; // the ring, worn
      return y === 3 || d > 7.2 ? 'h' : 'm';
    }
    // A rag still tied on, flat in the dust.
    if (y >= 4 && y < 6 && x >= 20 && x < 30) return x % 3 === 0 ? 'A' : 'p';
    return '.';
  }),
  colours: C,
};

/**
 * A tall smooth post, dead straight, no joins: one of a row running out beside the grooves, all the same
 * height. Its tip is a small rounded cap that once lit; on one (`lit`), a faint cyan light still shows.
 * Bottom edge on the ground.
 */
export const post = (lit: boolean): RowSprite => ({
  rows: fill(5, 72, (x, y) => {
    if (y < 4) {
      if ((x === 0 || x === 4) && y < 2) return '.';
      return lit ? (y < 2 && x > 0 && x < 4 ? 'c' : 'G') : y === 0 ? 'm' : 'w';
    }
    if (x === 0 || x === 4) return y < 6 ? '.' : x === 0 ? 'h' : 'n';
    if (y === 4 || y === 5) return 'd'; // the collar under the cap
    if (y > 68) return 'p'; // sunk into the ground
    return x === 1 ? 'h' : x === 2 ? 'm' : 'n';
  }),
  colours: C,
});
