import { SHADES as S } from '../../ui/pixelArt';
import type { RowSprite } from '../../ui/sprites';

// PLACEHOLDER pixel props for the offering floor: the base of the tube, where the roots gather.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

/** The tube coming down through the ceiling: white-hot core, cyan body, darker edges. */
export const tubeColumn = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x) => {
    const edge = Math.abs(x - (width - 1) / 2) / (width / 2);
    return edge < 0.2 ? 'w' : edge < 0.7 ? 'c' : 'm';
  }),
  colours: { w: S.white, c: S.cyan, m: S.cyanMid },
});

/** A carved ring in the ceiling where the tube comes through. */
export const CEILING_RING: RowSprite = {
  rows: fill(32, 6, (x, y) => {
    const dx = Math.abs(x - 15.5);
    if (y === 5) return dx < 12 ? 'l' : '.';
    if (dx < 9) return '.';
    return y === 0 || dx > 14 ? 'd' : y % 2 === 0 ? 'p' : 'l';
  }),
  colours: { d: S.deep, p: S.woodPale, l: S.woodLight },
};

/** The carved basin the tube stands in, on top of the landing. Leaves a gap for the tube. */
export const BASIN: RowSprite = {
  rows: fill(40, 8, (x, y) => {
    const dx = Math.abs(x - 19.5);
    const outline = 20 - Math.floor(y / 2);
    if (dx > outline) return '.';
    if (dx < 8 && y < 6) return '.'; // the tube passes here
    if (y === 0) return 'h';
    if (dx >= outline - 1) return 'd';
    return y > 5 ? 'd' : (x + y) % 5 === 0 ? 'c' : 'p';
  }),
  colours: { h: S.light, p: S.woodPale, d: S.deep, c: S.cyanMid },
};

/** A doorway arch in the wall, leading off to another area. */
export const ARCHWAY: RowSprite = {
  rows: fill(22, 38, (x, y) => {
    const cx = 10.5;
    const top = y < 11 ? (x - cx) ** 2 / 110 + (y - 11) ** 2 / 121 : x < 0 || x > 21 ? 2 : 0;
    if (y < 11 && top > 1) return '.';
    const rim = y < 11 ? top > 0.7 : x <= 1 || x >= 20;
    if (rim) return x > cx ? 'r' : 'l';
    return y > 34 ? 'f' : 'd';
  }),
  colours: { r: S.woodPale, l: S.woodLight, d: S.shadow, f: S.deep },
};

/** A hanging cloth banner with the tube's symbol (roots-dwellers can't read, so no writing). */
export const BANNER: RowSprite = {
  rows: fill(12, 40, (x, y) => {
    if (y === 0) return 'p';
    if (y > 36 && (x + y) % 2 === 0) return '.'; // frayed bottom
    if (x === 0 || x === 11) return 'e';
    const symbol = (x === 5 || x === 6) && y >= 8 && y <= 30;
    const ring = Math.abs(Math.hypot(x - 5.5, y - 13) - 4) < 0.8;
    if (symbol) return y < 12 ? 'w' : 'c';
    if (ring) return 'c';
    return y % 9 === 0 ? 'e' : 'a';
  }),
  colours: { p: S.woodPale, a: S.amberDeep, e: S.woodLight, c: S.cyanMid, w: S.cyan },
};

/** A low basket for the blessings that come down. */
export const BLESSING_BASKET: RowSprite = {
  rows: fill(14, 8, (x, y) => {
    if (y === 0) return x === 0 || x === 13 ? 'w' : x > 2 && x < 11 && x % 3 === 0 ? 'g' : '.';
    if (y === 1) return 'w';
    if (y === 7) return x > 0 && x < 13 ? 'a' : '.';
    return (x + y) % 2 === 0 ? 'a' : 'w';
  }),
  colours: { a: S.amberDeep, w: S.woodPale, g: S.light },
};

/** A worn kneeling mat, seen edge-on. */
export const MAT: RowSprite = {
  rows: fill(24, 2, (x, y) => (y === 0 ? (x % 4 === 0 ? 'l' : 'a') : 'd')),
  colours: { a: S.amberDeep, l: S.woodPale, d: S.deep },
};
