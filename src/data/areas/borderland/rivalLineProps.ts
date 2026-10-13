import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the rival line (Chapter 2): the border with another clan's turf, a line of
// junk fence across the waste, half markers and half wall: poles topped with clan signs, wire, piled
// plates. A watch post on your side. Their side is no different, but you're not allowed on it.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  g: S.cyanDeep, G: S.cyanMid, c: S.cyan, W: S.white, a: S.amber, A: S.amberDeep,
};

/** The watch post: a platform on stilts, a rail, a lean-to roof of plate, crates up its side. */
export const WATCH_POST: RowSprite = {
  rows: fill(56, 90, (x, y) => {
    // The roof.
    if (y < 6) return x > 2 && x < 54 ? (y === 0 ? 'h' : y === 5 ? 'd' : 'm') : '.';
    if (y < 28 && (x === 6 || x === 50)) return 'n'; // roof posts
    if (y >= 18 && y < 20 && x > 4 && x < 52) return 'm'; // the rail
    if (y >= 26 && y < 30 && x > 2 && x < 54) return y === 26 ? 'h' : 'd'; // the platform
    // Stilts, braced.
    if (y >= 30 && (x === 8 || x === 9 || x === 46 || x === 47)) return x % 2 ? 'd' : 'n';
    if (y >= 30 && y < 88 && Math.abs((x - 9) - (y - 30) * 0.64) < 0.8) return 'n';
    return '.';
  }),
  colours: C,
};

/** A clan's sign on a pole: a plate cut into a mark, a rag tied below it. Yours faces left, theirs right. */
export const sign = (theirs: boolean): RowSprite => ({
  rows: fill(16, 50, (x, y) => {
    const fx = theirs ? 15 - x : x;
    if (fx === 7 || fx === 8) return y < 2 ? 'h' : 'n'; // the pole
    if (y >= 3 && y < 16 && fx >= 1 && fx < 15) {
      // The plate, cut into a mark: yours a ring, theirs a bar crossed by two strokes.
      const d = Math.hypot(fx - 7.5, y - 9.5);
      if (!theirs) return Math.abs(d - 4) < 1 ? 'd' : d < 6.5 ? 'm' : '.';
      if (fx >= 2 && fx < 14 && y >= 5 && y < 14) return y === 9 || (fx === 5 || fx === 10) ? 'd' : 'h';
      return '.';
    }
    if (y >= 17 && y < 26 && fx > 8 && fx < 8 + (y - 15)) return theirs ? 'G' : 'a'; // the rag, blowing
    return '.';
  }),
  colours: C,
});

/** The fence: junk piled and wired between posts, tall enough to stop you, with a gap at the bottom over the dip. */
export const fence = (height: number, gapFrom: number): RowSprite => ({
  rows: fill(24, height, (x, y) => {
    if (y >= gapFrom) return x === 3 || x === 20 ? 'n' : '.'; // only the posts reach down past the gap
    if (y < 3 && (x === 3 || x === 20)) return 'h';
    if (y % 6 === 2 && y < 12) return x % 3 === 0 ? 'm' : '.'; // wire across the top
    if (y < 12) return x === 3 || x === 20 ? 'n' : '.';
    // Piled plates and junk.
    const r = ((x * 17 + y * 7) % 23) / 23;
    if ((y + Math.floor(x / 6)) % 7 === 0) return 'd';
    return r > 0.85 ? 'A' : r > 0.7 ? 'm' : r > 0.4 ? 'n' : 'w';
  }),
  colours: C,
});

/** A stretch of wire between posts, running off along the line. */
export const wire = (width: number): RowSprite => ({
  rows: fill(width, 30, (x, y) => {
    if (x % 40 === 0) return y < 2 ? 'h' : 'n';
    if ((y === 6 || y === 14) && (x + y) % 3 !== 0) return 'm';
    return '.';
  }),
  colours: C,
});

/** Footprints in the dirt: someone crossed here. */
export const FOOTPRINTS: RowSprite = { rows: ['d...d....d...d....d', '.d...d....d...d....'], colours: C };

/** A cairn of stacked plates on their side: their marker. */
export const CAIRN: RowSprite = {
  rows: ['....hh....', '...mmmm...', '..nnnnnn..', '.mmmGGmmm.', 'nnnnnnnnnn', 'wwwwwwwwww'],
  colours: C,
};

/** A hut on their side, past the cairn: pale cloth over a frame of poles, a flap for a door. */
export const HUT: RowSprite = (() => {
  const w = 40;
  const h = 30;
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    const half = Math.min(w / 2, 4 + y * 0.8);
    for (let x = 0; x < w; x++) {
      const d = Math.abs(x - w / 2 + 0.5);
      if (d > half) row += '.';
      else if (d > half - 1) row += 'n';
      else if (y > 14 && Math.abs(x - 20) < 4) row += y === 15 ? 'n' : 'X';
      else row += y % 6 === 0 ? 'm' : 'L';
    }
    rows.push(row);
  }
  return { rows, colours: { ...C, L: S.light, X: S.shadow } };
})();
