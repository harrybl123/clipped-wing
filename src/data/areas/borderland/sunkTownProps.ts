import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the sunk town (Chapter 2): the tops of buildings of the old society
// sticking out of the ground. Smooth walls with no joins, rounded windows, a staircase going down into
// the dirt; inside, rooms half full of earth and the faint cyan of things still powered. Nothing in it is
// explained.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  g: S.cyanDeep, G: S.cyanMid, c: S.cyan, W: S.white, a: S.amber, A: S.amberDeep,
};

/** A rounded window: a pale rim, dark inside, sometimes filled with dirt to halfway. */
const roundWindow = (lx: number, ly: number, r: number, dirt: boolean): string | null => {
  const d = Math.hypot(lx, ly);
  if (d > r) return null;
  if (d > r - 1.2) return 'h';
  if (dirt && ly > 0) return 'p';
  return 's';
};

/** A dome rising out of the ground: smooth, seamless, pale, with a row of rounded windows. Bottom edge on the ground. */
export const dome = (width: number, height: number, seed: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const u = (x - width / 2 + 0.5) / (width / 2);
    const top = Math.round(height * (1 - Math.sqrt(Math.max(0, 1 - u * u))));
    if (y < top) return '.';
    if (y === top) return 'W';
    // A row of windows round it.
    const wy = height - Math.round(height * 0.45);
    for (let i = 1; i < 4; i++) {
      const wx = Math.round((width * i) / 4);
      const w = roundWindow(x - wx, y - wy, 4, (i + seed) % 2 === 0);
      if (w) return w;
    }
    // Smooth: a sheen on the upper left, shade on the lower right, dirt caked at the bottom.
    if (y > height - 4) return (x + y) % 3 === 0 ? 'n' : 'p';
    const light = -u * 0.5 + (1 - y / height) * 0.8;
    return light > 0.6 ? 'h' : light > 0.1 ? 'm' : 'n';
  }),
  colours: C,
});

/** The top of a tower, tipped over at an angle, a rounded window near its top, one faint cyan light. */
export const TOWER_TOP: RowSprite = {
  rows: fill(30, 44, (x, y) => {
    const lean = Math.round((44 - y) * 0.35);
    const lx = x - lean;
    if (lx < 2 || lx > 15) return '.';
    if (y < 3) return lx > 4 && lx < 13 ? (y === 0 ? 'W' : 'h') : '.'; // a rounded cap
    const w = roundWindow(lx - 8.5, y - 12, 3.5, false);
    if (w) return w;
    if (lx === 8 && y === 22) return 'c';
    return lx < 5 ? 'h' : lx > 13 ? 'n' : 'm';
  }),
  colours: C,
};

/** A staircase going down into the dirt: smooth steps, a rail, and earth swallowing it. */
export const STAIRS_DOWN: RowSprite = {
  rows: fill(40, 20, (x, y) => {
    const stepTop = Math.floor(x / 5) * 2;
    if (y < stepTop) return x === 0 || x % 5 === 0 ? (y > stepTop - 10 && y < stepTop ? '.' : '.') : '.';
    if (y === stepTop) return 'h';
    if (y < stepTop + 3) return 'm';
    if (x > 26) return 'p'; // the earth has it
    return '.';
  }),
  colours: C,
};

/** A broken window frame lying in the ground round the way down. */
export const brokenFrame = (width: number): RowSprite => ({
  rows: fill(width + 8, 6, (x, y) => {
    if (y > 3) return x < 4 || x > width + 3 ? 'm' : '.';
    if (x < 4 || x > width + 3) return y === 0 ? 'h' : 'm';
    return y === 0 && x % 5 === 0 ? 'h' : '.'; // jagged glass at the edge
  }),
  colours: C,
});

/**
 * A buried room's wall: smooth pale panels with no joins you can find, rounded windows full of earth,
 * a dead screen still glowing faintly cyan, dirt drifted up in the corners. Fills the room's opening.
 */
export const roomWall = (width: number, height: number, seed: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    // Dirt drifted into the corners and along the floor.
    const drift = Math.max(0, 12 - Math.min(x, width - 1 - x) * 0.3) + 3;
    if (y > height - drift) return (x * 7 + y) % 5 === 0 ? 'n' : 'p';
    // Windows full of earth, high up.
    for (let i = 0; i < Math.floor(width / 70); i++) {
      const w = roundWindow(x - (40 + i * 70 + (seed % 3) * 6), y - 18, 7, true);
      if (w) return w === 'p' ? 'w' : w;
    }
    // A dead screen, faint cyan.
    const sx = 20 + ((seed * 53) % Math.max(1, width - 70));
    if (x >= sx && x < sx + 28 && y >= 34 && y < 52) {
      if (x === sx || x === sx + 27 || y === 34 || y === 51) return 'n';
      return (x + y * 3) % 7 === 0 ? 'G' : 'g';
    }
    // The wall itself: one smooth surface, darker as it goes into the dark.
    const shade = 0.5 + Math.sin((x / width) * Math.PI) * 0.3 - y / height * 0.4;
    if (y === 0) return 'd';
    return shade > 0.55 ? 'm' : shade > 0.25 ? 'n' : 'w';
  }),
  colours: C,
});

/** Earth seen in a shaft's walls (behind the way down): dark, packed. */
export const earth = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => ((x * 13 + y * 7) % 11 === 0 ? 'n' : (Math.floor(y / 6) + Math.floor(x / 9)) % 3 === 0 ? 'd' : 'w')),
  colours: C,
});

/** The door that still opens by itself: one smooth panel, a seam of dead light down it. */
export const AUTODOOR: RowSprite = {
  rows: fill(10, 40, (x, y) => (x === 0 || x === 9 ? 'n' : x === 5 ? (y % 6 === 0 ? 'G' : 'g') : y === 39 ? 'd' : 'h')),
  colours: C,
};

/** A ledge of fallen slab, to climb on. */
export const slab = (width: number): RowSprite => ({
  rows: fill(width, 4, (_x, y) => (y === 0 ? 'h' : y === 3 ? 'd' : 'm')),
  colours: C,
});
