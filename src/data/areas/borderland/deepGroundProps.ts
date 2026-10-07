import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the deep ground (Chapter 2): forbidden and far out. Past the last junk;
// the ground changes, harder and darker. The clan's last marker, which says go no further.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale, a: S.amber, A: S.amberDeep,
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
