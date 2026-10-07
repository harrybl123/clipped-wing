import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the scrap stacks (Chapter 2): towers of compacted junk two screens high
// between the shacks, leaning on each other: hull plates, frames, cables, smashed casings. Ledges to
// jump, cable bridges, and at the top the lookout's perch, which somebody has made comfortable.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  g: S.cyanDeep, G: S.cyanMid, c: S.cyan, W: S.white, a: S.amber, A: S.amberDeep, e: S.greenMid, E: S.greenDeep,
};

const rand = (x: number, y: number, seed: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return s - Math.floor(s);
};

/**
 * A tower of compacted junk: a ragged silhouette, layers of crushed things, some bright, darker and
 * denser towards the bottom; a frame or a hull plate sticking out here and there.
 */
export const junkTower = (width: number, height: number, seed: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    // Ragged edges, leaning a little.
    const lean = Math.round((height - y) * 0.04 * (seed % 2 ? 1 : -1));
    const edgeL = 2 + Math.round(rand(Math.floor(y / 5), 0, seed) * 5) + lean;
    const edgeR = width - 3 - Math.round(rand(Math.floor(y / 5), 1, seed) * 5) + lean;
    const top = Math.round(rand(Math.floor(x / 6), 2, seed) * 6);
    if (x < edgeL || x > edgeR || y < top) return '.';
    if (x === edgeL || y === top) return 'm';
    // Layers of crushed things: bands of varying thickness, each split into lengths of one kind.
    const wave = Math.round(Math.sin(x / 13 + seed) * 2);
    let band = 0;
    let bandTop = 0;
    for (let t = 0; ; band++) {
      const h = 5 + Math.floor(rand(band, 3, seed) * 7);
      if (y + wave < t + h) {
        bandTop = t;
        break;
      }
      t += h;
    }
    if (y + wave === bandTop) return 'd'; // the crush between layers
    const offset = Math.floor(rand(band, 4, seed) * 30);
    const seg = Math.floor((x + offset) / (12 + Math.floor(rand(band, 5, seed) * 18)));
    const segStart = (x + offset) % (12 + Math.floor(rand(band, 5, seed) * 18));
    if (segStart === 0) return 'd';
    const kind = rand(band, seg + 9, seed);
    const lr = rand(x, y, seed);
    if (lr > 0.994) return ['c', 'a', 'W'][Math.floor(lr * 1000) % 3]!; // the odd bright bit
    if (x === edgeR || x === edgeR - 1) return 'd';
    const lower = y > height * 0.55;
    if (kind > 0.93) return 'A'; // old paint
    if (kind > 0.86) return 'g'; // dead glass
    if (kind > 0.4) return y + wave === bandTop + 1 ? 'm' : lower ? 'w' : 'n'; // a plate, its edge catching light
    return lr > 0.5 ? 'w' : 'd'; // crushed and dark
  }),
  colours: C,
});

/** A ledge: a plate jammed into the stack, sticking out, lit along its top edge. */
export const ledge = (width: number): RowSprite => ({
  rows: fill(width, 4, (x, y) => (y === 0 ? 'h' : y === 3 ? 'd' : x % 11 === 0 ? 'd' : 'm')),
  colours: C,
});

/** The lookout's perch: a nest at the top, a blanket, a stash of tins, a tube to look through. */
export const PERCH: RowSprite = {
  rows: fill(72, 24, (x, y) => {
    // The tube to look through, on a little stand.
    if (y < 8 && x >= 52 && x < 66 && Math.abs(y - 4 + (x - 52) * 0.15) < 1.5) return y < 4 ? 'h' : 'm';
    if (y >= 6 && y < 16 && (x === 58)) return 'n';
    // The blanket and a cushion.
    if (y >= 12 && y < 16 && x >= 6 && x < 40) return y === 12 ? 'a' : (x % 5 === 0 ? 'A' : 'a');
    if (y >= 9 && y < 13 && x >= 8 && x < 16) return 'G';
    // A stash of tins.
    if (y >= 10 && y < 16 && x >= 42 && x < 50) return x % 3 === 2 ? '.' : y === 10 ? 'h' : 'm';
    // The rim of the nest: bent sheets.
    if (y >= 16) return y === 16 ? 'h' : (x + y) % 7 === 0 ? 'd' : 'm';
    if ((x < 3 || x > 68) && y > 8) return 'm';
    return '.';
  }),
  colours: C,
};

/** A loose sheet hanging off a tower, swinging on one rivet. */
export const HANGING_SHEET: RowSprite = {
  rows: fill(14, 20, (x, y) => (x === 0 || y === 0 ? 'h' : x === 13 || y === 19 ? 'd' : (x + y) % 6 === 0 ? 'n' : 'm')),
  colours: C,
};
