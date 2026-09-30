import { SHADES as S } from '../../ui/pixelArt';
import type { RowSprite } from '../../ui/sprites';

// PLACEHOLDER pixel props for the middle tiers: the official way up through the trunk. Better
// homes and more light: neat panelled house fronts with carved trim and window boxes, master
// crafters' workshops, glass lanterns, and more scavenged tech than below (a gear clock, cell
// lanterns, a counterweight lift).

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

/**
 * A neat house front: carved trim along the top, panelled walls, a door, lit windows with shutters
 * and a window box of greenery. `seed` varies door and window placement.
 */
export const townhouse = (width: number, height: number, seed = 0): RowSprite => {
  const doorX = seed % 3 === 0 ? 5 : seed % 3 === 1 ? width - 15 : Math.floor(width / 2) - 5;
  const windows = [6, width - 16, Math.floor(width / 2) - 5].filter((wx) => Math.abs(wx - doorX) > 12);
  return {
    rows: fill(width, height, (x, y) => {
      if (y <= 3) return y === 0 ? 'h' : y === 3 ? 'd' : x % 4 === (y === 1 ? 0 : 2) ? 'd' : 't'; // carved trim
      // Door: panelled, arched top, handle.
      if (x >= doorX && x < doorX + 10 && y >= height - 22) {
        const dy = y - (height - 22);
        if (dy < 3 && (x - doorX === 0 || x - doorX === 9 || (dy === 0 && (x - doorX < 2 || x - doorX > 7)))) return '.';
        if (x === doorX || x === doorX + 9 || dy === 0) return 'd';
        if (x === doorX + 7 && dy === 12) return 'L';
        return (x - doorX) % 4 === 2 || dy % 7 === 3 ? 'f' : 'p';
      }
      // Windows, lit amber, with a box of greenery under each.
      for (const wx of windows) {
        if (x >= wx && x < wx + 10 && y >= 8 && y < 20) {
          if (x === wx || x === wx + 9 || y === 8 || y === 19) return 'd';
          if (x === wx + 5 || y === 13) return 'd';
          return x < wx + 5 && y < 13 ? 'L' : 'a';
        }
        if (x >= wx - 1 && x < wx + 11 && y >= 20 && y < 23) return y === 20 ? (x % 2 ? 'g' : 'G') : 'b';
      }
      // Panelled walls.
      if (y === height - 1) return 'd';
      return x % 12 === 0 ? 'd' : (y - 4) % 14 === 0 ? 'l' : 'w';
    }),
    colours: { h: S.light, t: S.woodPale, d: S.deep, w: S.woodLight, l: S.woodPale, p: S.woodPale, f: S.woodLight, L: S.white, a: S.amber, g: S.greenMid, G: S.green, b: S.wood },
  };
};

/**
 * A master carver's workshop, open at the front: shelves of fine carved figures, tools on a rack,
 * a workbench, and a pictograph sign (a chisel).
 */
export const CARVER_WORKSHOP: RowSprite = {
  rows: fill(84, 62, (x, y) => {
    if (y <= 3) return y === 0 ? 'h' : y === 3 ? 'd' : x % 4 === (y === 1 ? 0 : 2) ? 'd' : 't';
    if (x <= 2 || x >= 81) return x === 1 || x === 82 ? 'l' : 'd'; // posts
    // Sign: a chisel.
    if (y >= 6 && y <= 15 && x >= 36 && x <= 48) {
      if (y === 6 || y === 15 || x === 36 || x === 48) return 'l';
      if (y === 10 && x >= 39 && x <= 42) return 'm';
      if ((y === 10 || y === 11) && x >= 43 && x <= 46) return 'p';
      return 'k';
    }
    // Shelves of carved figures: little upright shapes, finer than anything in the roots.
    for (const sy of [24, 38]) {
      if (y === sy) return 'p';
      if (y === sy + 1) return 'd';
      if (y > sy - 8 && y < sy && x > 4 && x < 79) {
        const slot = (x - 5) % 7;
        const h = 4 + ((Math.floor((x - 5) / 7) * 3) % 4);
        if (slot >= 2 && slot <= 3 && y >= sy - h) return y === sy - h ? 'L' : 'c';
        if (slot === 1 && y >= sy - h + 2) return 'c';
      }
    }
    // Workbench at the bottom with tools hanging above the back wall.
    if (y === 50) return 'p';
    if (y === 51) return 'd';
    if (y > 51) return x === 8 || x === 75 ? 'l' : '.';
    if (y >= 42 && y <= 47 && x % 6 === 3 && x > 50) return y === 42 ? 'm' : 'p';
    return 'k';
  }),
  colours: { h: S.light, t: S.woodPale, d: S.deep, l: S.woodLight, k: S.shadow, p: S.woodPale, c: S.woodLight, L: S.light, m: S.light },
};

/** A glass lantern on a bracket: finer than the roots' lamps. */
export const GLASS_LANTERN: RowSprite = {
  rows: ['dddd..', '...d..', '..ddd.', '.dLad.', '.dLad.', '.daad.', '..ddd.'],
  colours: { d: S.dim, L: S.white, a: S.amber },
};

/** A scavenged gear clock on the wall: a gift from above, running. */
export const GEAR_CLOCK: RowSprite = {
  rows: fill(17, 17, (x, y) => {
    const r = Math.hypot(x - 8, y - 8);
    const a = Math.atan2(y - 8, x - 8);
    if (r > 8.4) return '.';
    if (r > 7) return Math.round((a / Math.PI) * 8) % 2 === 0 ? 'm' : '.'; // teeth
    if (r > 6) return 'm';
    if (x === 8 && y >= 3 && y <= 8) return 'c'; // hands
    if (y === 8 && x >= 8 && x <= 12) return 'c';
    if (r < 1) return 'w';
    return Math.round((a / Math.PI) * 6 + 12) % 2 === 0 && r > 4.5 ? 'l' : 'k';
  }),
  colours: { m: S.dim, l: S.light, k: S.deep, c: S.cyanMid, w: S.white },
};

/** The guard post at the foot of the stair: a booth and a barrier arm, raised. */
export const GUARD_POST: RowSprite = {
  rows: fill(40, 40, (x, y) => {
    // Booth on the left.
    if (x < 18) {
      if (y <= 2) return y === 0 ? 'h' : 't';
      if (x === 0 || x === 17) return 'd';
      if (y >= 10 && y <= 18 && x >= 4 && x <= 13) return x === 4 || x === 13 || y === 10 || y === 18 ? 'd' : 'a';
      return y === 39 ? 'd' : x % 6 === 0 ? 'd' : 'w';
    }
    // Barrier: a post and an arm raised at an angle.
    if (x >= 20 && x <= 22 && y >= 16) return x === 22 ? 'l' : 'p';
    const ay = 16 - Math.round((x - 22) * 0.55);
    if (x > 22 && (y === ay || y === ay + 1)) return Math.floor((x - 22) / 4) % 2 === 0 ? 'A' : 'h';
    return '.';
  }),
  colours: { h: S.light, t: S.woodPale, d: S.deep, w: S.woodLight, a: S.amber, p: S.woodPale, l: S.woodLight, A: S.amberDeep },
};

/** A hanging planter of greenery (they can afford to grow things for show). */
export const PLANTER: RowSprite = {
  rows: ['...d...', '..d.d..', '.d...d.', 'GgGgGgG', 'gGgGgGg', '.ppppp.', '..ppp..', '...g...', '...G...'],
  colours: { d: S.dim, g: S.greenMid, G: S.green, p: S.woodPale },
};

/** A balcony gallery along a wall (decoration only): a floor beam on brackets with a railing. */
export const gallery = (width: number): RowSprite => ({
  rows: fill(width, 20, (x, y) => {
    if (y === 0) return 'h'; // rail
    if (y < 10) return x % 8 === 0 ? 'p' : '.'; // balusters
    if (y === 10) return 'h';
    if (y <= 12) return 'p';
    if (y === 13) return 'd';
    const bx = x % 50;
    return bx === 20 - y || bx === 21 - y ? 'l' : '.'; // brackets
  }),
  colours: { h: S.woodPale, p: S.woodLight, d: S.deep, l: S.woodLight },
});
