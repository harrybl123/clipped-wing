import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the boss's compound (Chapter 2): walled with the best scrap, whole
// panels, matched, cleaned. Wealth by the borderland's standards: real food on a table, rugs, and the
// signature, a working light: a part that still glows a steady cyan, the only one in town. And it's a
// home (designer: more homely): washing on the line, cushions, a stove going, things kept and cared for.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  g: S.cyanDeep, G: S.cyanMid, c: S.cyan, W: S.white, a: S.amber, A: S.amberDeep, e: S.greenMid, E: S.greenDeep,
};

/** The compound's wall: whole matched panels, all the same height, clean, a lit cap along the top. */
export const matchedWall = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (y === 0) return 'W';
    if (y === 1) return 'h';
    if (x % 16 === 0) return 'm';
    if (x % 16 === 1) return 'h';
    if ((x % 16 === 3 || x % 16 === 13) && (y === 5 || y === height - 5)) return 'h'; // bolts
    return y > height - 4 ? 'n' : 'm';
  }),
  colours: C,
});

/** The working light: a casing in the ceiling with a steady cyan glow, and the glow round it. */
export const WORKING_LIGHT: RowSprite = {
  rows: fill(40, 22, (x, y) => {
    const d = Math.hypot((x - 19.5) / 2, y - 3);
    if (y < 3 && Math.abs(x - 19.5) < 8) return y === 0 ? 'm' : 'n';
    if (y < 6 && Math.abs(x - 19.5) < 6) return y === 5 ? 'c' : 'W';
    // The glow, dithered, fading.
    if (y >= 6 && d < 10 && (x + y) % 2 === 0) return d < 5 ? 'c' : 'G';
    if (y >= 6 && d < 14 && (x + y) % 4 === 0) return 'g';
    return '.';
  }),
  colours: C,
};

/** A hanging on the wall: a rug, patterned, with a fringe. */
export const hanging = (width: number, height: number, tone: 'a' | 'G' | 'e'): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (y === 0) return 'm';
    if (y === height - 1) return x % 2 ? tone : '.';
    const d = Math.abs(x - width / 2 + 0.5) + Math.abs(y - height / 2);
    if (Math.round(d) % 5 === 0) return 'h';
    return x === 1 || x === width - 2 || y === 2 || y === height - 3 ? 'A' : tone;
  }),
  colours: C,
});

/** A lamp on a bracket, burning. */
export const WALL_LAMP: RowSprite = { rows: ['.aa.', 'aWWa', '.aa.', '.mm.', 'mmmm'], colours: C };

/** The boss's table: long, laid with real food, chairs along it. */
export const feastTable = (width: number): RowSprite => ({
  rows: fill(width, 22, (x, y) => {
    if (y < 6) {
      // Food: bowls, bread, a jug.
      const slot = Math.floor(x / 10);
      const lx = x % 10;
      if (lx < 2 || lx > 7) return '.';
      const kind = slot % 4;
      if (kind === 0) return y > 2 ? (y === 3 ? 'h' : 'm') : '.'; // a bowl
      if (kind === 1) return y > 3 ? 'a' : '.'; // bread
      if (kind === 2) return y > 0 ? (lx === 4 || lx === 5 ? (y < 2 ? 'h' : 'G') : y > 2 ? 'G' : '.') : '.'; // a jug
      return y > 3 ? 'e' : '.'; // greens
    }
    if (y === 6) return 'W';
    if (y === 7) return 'h';
    if (y === 8) return 'd';
    // A cloth hanging over the front.
    if (y < 12) return x % 6 === 0 ? 'A' : 'a';
    return x < 3 || x > width - 4 ? 'n' : '.';
  }),
  colours: C,
});

export const CHAIR: RowSprite = { rows: ['nn....', 'nn....', 'nn....', 'nn....', 'nnnnnn', 'hhhhhh', 'n....n', 'n....n', 'n....n', 'n....n'], colours: C };

/** A rug, deep and patterned. */
export const rug = (width: number): RowSprite => ({
  rows: fill(width, 3, (x, y) => (y === 1 && x % 8 < 4 ? 'G' : y === 1 ? 'a' : 'A')),
  colours: C,
});

/** The locked door: heavier than the others, a bar and a lock. */
export const LOCKED_DOOR: RowSprite = {
  rows: fill(18, 34, (x, y) => (x === 0 || x === 17 || y === 0 ? 'd' : (y === 14 || y === 20) ? 'h' : x === 13 && y > 15 && y < 19 ? 'a' : 'n')),
  colours: C,
};

/** A bed upstairs: a real frame, a thick mattress, a blanket. */
export const bed = (width: number, blanket: 'a' | 'G' | 'e'): RowSprite => ({
  rows: fill(width, 12, (x, y) => {
    if (x < 3 && y < 12) return 'n'; // the headboard
    if (y < 3) return '.';
    if (y === 3) return x < 12 ? 'W' : blanket;
    if (y < 7) return x < 12 ? 'h' : blanket;
    if (y < 9) return 'n';
    return x === 3 || x === width - 1 ? 'n' : '.';
  }),
  colours: C,
});

/** A water tank in the yard: a whole sealed cylinder, still full. */
export const TANK: RowSprite = {
  rows: fill(30, 34, (x, y) => {
    if (y > 28) return x % 9 === 0 ? 'n' : '.';
    if (y === 0) return x < 2 || x > 27 ? '.' : 'h';
    if (x === 0 || x === 29) return 'd';
    if (y % 9 === 4) return 'd';
    return x < 6 ? 'h' : x > 24 ? 'n' : 'm';
  }),
  colours: C,
};

/** Crates of tribute under a cloth, waiting to be counted. */
export const TRIBUTE: RowSprite = {
  rows: fill(36, 20, (x, y) => {
    if (y < 8) return y < 3 ? (x > 4 && x < 30 && (x + y) % 3 === 0 ? 'c' : x > 6 && x < 28 && y > 0 ? 'a' : '.') : x % 9 === 0 ? 'A' : 'a';
    return x % 12 === 0 || y === 19 || y === 8 ? 'd' : 'p';
  }),
  colours: C,
};

/** A post with a lamp, in the yard. */
export const lampPost = (height: number): RowSprite => ({
  rows: fill(7, height, (x, y) => {
    if (y < 5) return x > 0 && x < 6 ? (y === 0 ? 'm' : y < 4 ? (x > 1 && x < 5 ? 'W' : 'a') : 'A') : '.';
    return x === 3 ? 'n' : y === height - 1 && x > 1 && x < 5 ? 'd' : '.';
  }),
  colours: C,
});

// --- Outside: the gateway, the yard, the house front ---

/**
 * The gateway, seen side-on as you walk through it: the compound wall cut across your path, so its two
 * thick posts (the wall's ends, matched panels, a lamp on each) and the lintel across the top with the
 * clan's ring on it; the two heavy leaves swung open inwards, almost edge-on against the posts. You walk
 * through the middle.
 */
export const GATEWAY: RowSprite = {
  rows: fill(64, 72, (x, y) => {
    const post = x < 10 || x >= 54;
    // The lintel, with the ring.
    if (y < 10) {
      if (y === 0) return 'W';
      const d = Math.hypot(x - 31.5, y - 5);
      if (Math.abs(d - 3.2) < 0.8) return 'A';
      return y === 9 ? 'd' : y === 1 ? 'h' : 'm';
    }
    // Lamps hanging under the lintel, just inside each post.
    if (y >= 10 && y < 15 && (x === 12 || x === 51)) return y < 12 ? 'n' : 'a';
    if (y === 14 && (x === 11 || x === 13 || x === 50 || x === 52)) return 'A';
    if (post) {
      const lx = x < 10 ? x : x - 54;
      if (lx === 0 || lx === 9) return 'd';
      if (lx === 1) return 'h';
      if (y % 22 === 10) return 'n'; // panel seams
      if ((lx === 3 || lx === 7) && y % 22 === 13) return 'h';
      return y > 68 ? 'n' : x < 10 ? 'm' : 'p'; // the far post a shade darker
    }
    // The leaves, swung open against the posts: narrow, banded.
    if ((x >= 10 && x < 15) || (x >= 49 && x < 54)) {
      if (y < 12 || y > 69) return '.';
      if (y % 14 === 12) return 'd';
      return x === 10 || x === 53 ? 'h' : 'n';
    }
    // The track in the ground between them.
    if (y >= 70) return y === 70 ? 'd' : '.';
    return '.';
  }),
  colours: C,
};

/** A washing line between two poles, sagging, with the household's washing pegged out: bright cloths. Bottom edge on the ground. */
export const washingLine = (width: number): RowSprite => {
  const colours = ['a', 'g', 'p', 'A', 'h', 'G'];
  return {
    rows: fill(width, 34, (x, y) => {
      if (x === 1 || x === width - 2) return y === 0 ? 'm' : 'n'; // the poles
      const sag = Math.round(3 + Math.sin((x / (width - 1)) * Math.PI) * 5);
      if (y === sag) return 'h';
      // Cloths hung from the line: a few widths and lengths, with a gap between.
      const slot = Math.floor((x - 5) / 12);
      const lx = (x - 5) % 12;
      if (x < 5 || x > width - 6 || lx > 9) return '.';
      const length = 9 + ((slot * 7) % 5) * 2;
      if (y > sag && y <= sag + length) {
        const c = colours[slot % colours.length]!;
        if (y === sag + 1 && (lx === 1 || lx === 8)) return 'd'; // pegs
        if (y === sag + length) return lx % 2 === 0 ? c : '.'; // a ragged hem
        return lx === 9 ? 'd' : c;
      }
      return '.';
    }),
    colours: C,
  };
};

/** A bench against the wall, with cushions on it. Bottom edge on the ground. */
export const BENCH: RowSprite = {
  rows: [
    '..aaaa....gggg....pppp...',
    '.aAAAAa..gGGGGg..phhhhp..',
    'hhhhhhhhhhhhhhhhhhhhhhhhh',
    'nnnnnnnnnnnnnnnnnnnnnnnnn',
    '.n.....................n.',
    '.n.....................n.',
    '.n.....................n.',
  ],
  colours: C,
};

/** A pot by the door with a bundle of bright cloth strips in it, tied like flowers. Bottom edge on the ground. */
export const CLOTH_POT: RowSprite = {
  rows: ['.a.h.a.', 'a.aga.a', '.AaAaA.', '..aAa..', '.mmmmm.', '.nnnnn.', '.nnnnn.', '..nnn..'],
  colours: C,
};

/**
 * The house front: two storeys of whole matched panels, pale and clean; eaves along the top; a painted
 * band between the storeys; windows with curtains drawn to the sides and lamplight behind them, window
 * boxes of cloth flowers under the lower ones; the front door in a deep frame under a porch with lamps on
 * its posts, standing open, light spilling out; two steps up. `door` is the door's left edge.
 */
export const houseFront = (width: number, height: number, door: number): RowSprite => {
  const upper = [24, 120, 216, 312, 408];
  const lower = [176, 272, 368, 450];
  const curtains = ['A', 'g', 'p', 'A', 'G'];
  const window = (x: number, y: number, wx: number, wy: number, h: number, curtain: string): string | null => {
    const lx = x - wx;
    const ly = y - wy;
    if (lx < -2 || lx > 25 || ly < 0 || ly > h + 2) return null;
    if (ly >= h) return ly === h ? 'W' : ly === h + 1 ? 'h' : 'n'; // the sill
    if (lx < 0 || lx > 23) return null;
    if (lx < 2 || lx > 21 || ly < 2) return lx === 0 || ly === 0 ? 'h' : 'n'; // the frame
    if (lx === 11 || lx === 12) return 'n'; // the mullion
    // Curtains drawn to the sides, gathered, a tie-back.
    const edge = lx < 11 ? lx - 2 : 21 - lx;
    const drape = 3 + Math.round(Math.sin((ly / h) * Math.PI) * 2);
    if (edge < drape) return ly === Math.round(h * 0.55) ? 'a' : (lx + ly) % 3 === 0 ? 'd' : curtain;
    // Lamplight inside, warm, brighter in the middle.
    const glow = Math.abs(ly - h * 0.6) < h * 0.25 && edge > 5;
    return glow ? 'a' : (lx + ly) % 2 === 0 ? 'a' : 'A';
  };
  return {
    rows: fill(width, height, (x, y) => {
      // The eaves.
      if (y < 6) return y === 0 ? 'W' : y < 4 ? 'h' : y === 4 ? 'n' : 'd';
      // A string of small lamps under the eaves, sagging between hooks.
      const sag = Math.round(Math.sin(((x % 48) / 48) * Math.PI) * 4);
      if (y === 7 + sag) return 'n';
      if (x % 12 === 6 && (y === 8 + sag || y === 9 + sag)) return y === 8 + sag ? 'a' : 'A';
      // The porch: a roof over the door, posts down to the ground, lamps on the posts.
      const porchL = door - 10;
      const porchR = door + 38;
      const porchTop = height - 60;
      if (y >= porchTop && y < porchTop + 5 && x >= porchL && x < porchR) return y === porchTop ? 'W' : y === porchTop + 4 ? 'd' : 'h';
      if ((x === porchL + 1 || x === porchR - 2) && y >= porchTop + 5) {
        if (y < porchTop + 10) return y === porchTop + 5 ? 'm' : 'a';
        return y > height - 5 ? 'd' : 'n';
      }
      if ((x === porchL || x === porchR - 1 || x === porchL + 2 || x === porchR - 3) && y >= porchTop + 6 && y < porchTop + 9) return 'A';
      // Two steps up to the door.
      if (y >= height - 4 && x >= door - 6 && x < door + 34) return y === height - 4 ? 'W' : y === height - 2 ? 'h' : 'm';
      // The doorway: a deep frame, the door open against its left side, the hall lit behind.
      if (x >= door - 3 && x < door + 31 && y >= height - 50 && y < height - 4) {
        const lx = x - door;
        const ly = y - (height - 50);
        if (lx < 0 || lx > 27 || ly < 3) return ly === 0 ? 'W' : 'h';
        if (lx < 6) return lx === 5 ? 'd' : ly % 12 === 6 ? 'd' : 'n'; // the door leaf, open
        if (ly > 38) return (lx + ly) % 2 === 0 ? 'a' : 'A'; // light on the floor inside
        if (lx > 18 && ly > 14 && ly < 30) return lx === 19 ? 'd' : 'w'; // a coat on a peg, inside
        return ly > 30 ? 'A' : 'w';
      }
      // The band between the storeys.
      const band = Math.round(height * 0.48);
      if (y >= band && y < band + 6) return y === band || y === band + 5 ? 'n' : y === band + 2 ? 'a' : 'A';
      // Windows.
      for (const [i, wx] of upper.entries()) {
        const w = window(x, y, wx, 18, 30, curtains[i]!);
        if (w) return w;
      }
      for (const [i, wx] of lower.entries()) {
        // A striped awning over each lower window, scalloped along its edge.
        const ax = x - wx + 4;
        const ay = y - (band + 8);
        if (ax >= 0 && ax < 32 && ay >= 0 && ay < 9) {
          if (ay === 0) return 'n';
          if (ay === 8) return ax % 4 < 2 ? (Math.floor(ax / 4) % 2 ? 'h' : 'a') : '.';
          return Math.floor(ax / 4) % 2 ? 'h' : 'a';
        }
        const w = window(x, y, wx, band + 18, 30, curtains[(i + 2) % 5]!);
        if (w) return w;
        // Window boxes of cloth flowers.
        const bx = x - wx;
        const by = y - (band + 18 + 34);
        if (bx >= -1 && bx < 25 && by >= 0 && by < 6) {
          if (by < 2) return (bx * 3) % 5 === 0 ? (bx % 2 ? 'a' : 'h') : bx % 4 === 1 ? 'G' : '.';
          return by === 2 ? 'h' : 'n';
        }
      }
      // A lamp on a bracket by the door.
      if (x >= door + 40 && x < door + 44 && y >= height - 40 && y < height - 34) return y === height - 40 ? 'm' : x === door + 41 || x === door + 42 ? 'W' : 'a';
      // The wall: matched panels, pale, a seam every 24, bolts.
      const lx = x % 24;
      if (y > height - 6) return 'n';
      if (lx === 0) return 'n';
      if (lx === 1) return 'W';
      if ((lx === 3 || lx === 21) && (y % 32 === 10)) return 'n';
      // Warm, not glaring: the upper storey pale, the lower one painted, a little weathering near the ground.
      if (y < band) return y > band - 4 && x % 2 === 0 ? 'm' : 'h';
      if (y > height - 14 && (x * 7 + y * 3) % 5 === 0) return 'p';
      return (x + y) % 2 === 0 ? 'm' : 'A';
    }),
    colours: C,
  };
};

/** A flue pipe up from the roof, a cap on it. Bottom edge on the roof. */
export const FLUE: RowSprite = {
  rows: fill(8, 22, (x, y) => (y < 3 ? (y === 0 ? 'h' : 'm') : x < 1 || x > 6 ? '.' : x === 1 ? 'h' : y % 7 === 0 ? 'd' : 'n')),
  colours: C,
};

// --- Inside the house ---

/** A doorway in the house's wall (the front door from inside, or the walkway door): a frame and the light beyond. */
export const doorway = (outside: 'day' | 'dark'): RowSprite => ({
  rows: fill(22, 40, (x, y) => {
    if (x < 3 || x > 18 || y < 3) return y === 0 || x === 0 || x === 21 ? 'W' : 'h';
    if (y > 37) return 'n';
    return outside === 'day' ? ((x + y) % 2 === 0 ? 'h' : 'p') : 's';
  }),
  colours: C,
});

/** Pegs by the door: cloaks and a bag hung on them, boots underneath. Bottom edge on the floor. */
export const PEGS: RowSprite = {
  rows: fill(30, 34, (x, y) => {
    if (y === 2) return 'h'; // the rail
    if (y === 3 && x % 10 === 4) return 'n'; // the pegs
    // Two cloaks and a bag.
    const cloak = (cx: number, c: string, len: number) => {
      const lx = x - cx;
      const w = 2 + Math.floor((y - 4) / 4);
      if (y >= 4 && y < 4 + len && Math.abs(lx) <= w) return Math.abs(lx) === w ? 'd' : (y + lx) % 5 === 0 ? 'A' : c;
      return null;
    };
    const c = cloak(4, 'A', 20) ?? cloak(14, 'g', 18);
    if (c) return c;
    if (x >= 21 && x < 28 && y >= 4 && y < 12) return y === 4 ? 'n' : x === 21 || x === 27 ? 'n' : 'p';
    // Boots.
    if (y >= 28 && ((x >= 2 && x < 8) || (x >= 11 && x < 17))) return y < 30 && (x === 7 || x === 16) ? '.' : y === 33 ? 'd' : 'w';
    return '.';
  }),
  colours: C,
};

/**
 * The stove: a big casing from something old, made into a stove, with a firebox at the front (the fire
 * itself is a feature) and a pot on top, its flue going up through the ceiling. Bottom edge on the floor.
 */
export const stove = (ceiling: number): RowSprite => ({
  rows: fill(36, ceiling, (x, y) => {
    const body = ceiling - 30;
    // The flue up to the ceiling.
    if (y < body - 8) return x >= 15 && x < 21 ? (x === 15 ? 'h' : y % 9 === 0 ? 'd' : 'n') : '.';
    // The pot on top, steaming a little.
    if (y >= body - 8 && y < body) {
      if (x >= 6 && x < 14) return y === body - 8 ? 'h' : y === body - 1 ? 'd' : 'w';
      return x >= 15 && x < 21 ? 'n' : '.';
    }
    const ly = y - body;
    if (ly === 0) return 'W';
    if (ly === 1) return 'h';
    if (x === 0 || x === 35) return 'd';
    // The firebox mouth.
    if (ly >= 10 && ly < 24 && x >= 10 && x < 26) return ly === 10 || x === 10 || x === 25 ? 'd' : 's';
    if (ly === 26) return 'd';
    return x < 4 ? 'h' : ly % 8 === 4 ? 'n' : 'm';
  }),
  colours: C,
});

/** Shelves of jars and tins, full: food put by. */
export const pantry = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const shelf = y % 14;
    if (shelf === 13) return 'h';
    if (shelf === 0) return 'n';
    if (x === 0 || x === width - 1) return 'n';
    // Jars of different sizes and colours on each shelf.
    const slot = Math.floor(x / 6);
    const lx = x % 6;
    const row = Math.floor(y / 14);
    const r = (slot * 7 + row * 13) % 11;
    const h = 5 + (r % 4) * 2;
    if (lx === 0 || lx === 5 || shelf < 13 - h) return '.';
    if (shelf === 13 - h) return 'h'; // the lid
    return ['a', 'A', 'G', 'p', 'h', 'g'][r % 6]!;
  }),
  colours: C,
});

/** Pots and ladles hanging from a rail. Top edge at the rail. */
export const HANGING_POTS: RowSprite = {
  rows: fill(40, 16, (x, y) => {
    if (y === 0) return 'h';
    const hooks = [4, 14, 24, 34];
    for (const [i, hx] of hooks.entries()) {
      const lx = x - hx;
      if (lx === 0 && y < 4) return 'n';
      if (i % 2 === 0 && y >= 4 && y < 10 + i && Math.abs(lx) < 4) return y === 4 ? 'h' : Math.abs(lx) === 3 ? 'd' : 'm'; // a pot
      if (i % 2 === 1 && lx === 0 && y < 12) return 'n'; // a ladle's handle
      if (i % 2 === 1 && y >= 12 && y < 15 && Math.abs(lx) < 2) return 'h';
    }
    return '.';
  }),
  colours: C,
};

/** A water barrel with a ladle hooked on the rim. Bottom edge on the floor. */
export const BARREL: RowSprite = {
  rows: fill(16, 20, (x, y) => {
    if (y === 0) return x > 1 && x < 14 ? 'g' : '.';
    if (x === 0 || x === 15) return y < 2 ? '.' : 'd';
    if (y % 6 === 2) return 'd';
    if (x === 13 && y < 8) return 'h';
    return x < 4 ? 'p' : 'n';
  }),
  colours: C,
};

/** A low stool. */
export const STOOL: RowSprite = { rows: ['hhhhhh', 'nnnnnn', '.n..n.', '.n..n.', '.n..n.'], colours: C };

/** Cushions heaped on the floor. Bottom edge on the floor. */
export const CUSHIONS: RowSprite = {
  rows: [
    '......aaaa..........',
    '.ggg.aAaaAa..pppp...',
    'gGGGgaAaaAa.phhhhp..',
    'gGGGggaaaaAAphhhhpA.',
    'AAAAAAAAAAAAAAAAAAAA',
  ],
  colours: C,
};

/** A big bed: a carved-panel headboard, a thick mattress, a patchwork quilt, two pillows. Bottom edge on the floor. */
export const BIG_BED: RowSprite = {
  rows: fill(56, 20, (x, y) => {
    if (x < 4) return y === 0 ? 'h' : x === 0 || x === 3 ? 'n' : 'm'; // the headboard
    if (x === 55 && y > 8) return 'n'; // the footboard
    if (y < 8) return '.';
    if (y < 11 && x < 18) return y === 8 ? 'h' : 'W'; // pillows
    if (y < 15) {
      // The quilt: patches.
      if (y === 8) return 'h';
      const patch = (Math.floor(x / 6) + Math.floor(y / 3)) % 4;
      return x < 18 ? 'W' : ['a', 'G', 'A', 'p'][patch]!;
    }
    if (y < 17) return 'n';
    return x === 5 || x === 53 ? 'n' : '.';
  }),
  colours: C,
};

/** A chest at the foot of a bed, bound with metal. Bottom edge on the floor. */
export const CHEST: RowSprite = {
  rows: fill(20, 12, (x, y) => (y === 0 ? 'h' : y === 4 ? 'd' : x === 0 || x === 19 ? 'd' : x === 9 && y > 4 && y < 8 ? 'a' : x % 7 === 3 ? 'm' : 'A')),
  colours: C,
};

/** A wash stand: a bowl on a stand, a jug, a cloth over the rail. Bottom edge on the floor. */
export const WASH_STAND: RowSprite = {
  rows: [
    '...hh.......',
    '..hGGh......',
    '.hhhhhhhhhh.',
    '..mGGGGGGm..',
    '...mmmmmm...',
    '.nnnnnnnnnn.',
    '.n.a.....n..',
    '.n.aa....n..',
    '.n.aa....n..',
    '.n.......n..',
  ],
  colours: C,
};

/** A rail of clothes: tunics and wraps on hangers. Bottom edge on the floor. */
export const CLOTHES_RAIL: RowSprite = {
  rows: fill(34, 36, (x, y) => {
    if (x === 0 || x === 33) return 'n';
    if (y === 2) return 'h';
    const slot = Math.floor((x - 2) / 6);
    const lx = (x - 2) % 6;
    if (x < 2 || x > 31) return '.';
    const len = 16 + (slot % 3) * 4;
    if (y === 3 && lx === 2) return 'm';
    if (y > 3 && y < 4 + len && lx < 5) return lx === 0 ? 'd' : ['A', 'g', 'p', 'a', 'G'][slot % 5]!;
    return '.';
  }),
  colours: C,
};

/**
 * A shelf of prized finds, set out to be seen: pale casings, a ring, a slab of glass, one small thing
 * still glowing cyan. The boss's trophies. Top-left at the shelf's top.
 */
export const TROPHIES: RowSprite = {
  rows: [
    '.....hh.........W.............',
    '..p.hWWh..mmm..hWh.....c......',
    '.ppp.hh..m...m.hWh....cGc..pp.',
    'ppppp.h..m...m.hWh...cGWGc.hh.',
    'ppppp.h...mmm..hWh....cGc..hh.',
    'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
    'nnnnnnnnnnnnnnnnnnnnnnnnnnnnnn',
    '.n..........................n.',
  ],
  colours: C,
};

/** A low table with cups on it. Bottom edge on the floor. */
export const LOW_TABLE: RowSprite = {
  rows: ['..h...hh....h..', '.hGh..aa...hGh.', 'WWWWWWWWWWWWWWW', 'nnnnnnnnnnnnnnn', '.n...........n.', '.n...........n.'],
  colours: C,
};

/** A window in the house wall, looking out over the settlement: hazy sky, rooftops. */
export const windowOut = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (x < 2 || x > width - 3 || y < 2) return x === 0 || y === 0 ? 'W' : 'h';
    if (y > height - 3) return y === height - 1 ? 'n' : 'W'; // the sill
    if (x === Math.floor(width / 2)) return 'n';
    // Rooftops at the bottom, the sky above.
    const roof = height - 6 - Math.round(Math.abs(Math.sin(x * 0.7)) * 4);
    if (y > roof) return (x + y) % 3 === 0 ? 'd' : 'w';
    return y < height / 2 ? 'W' : 'h';
  }),
  colours: C,
});

/** A board on the side room's wall with tallies and marks: the circle's reckoning. */
export const RECKONING: RowSprite = {
  rows: fill(30, 20, (x, y) => {
    if (x === 0 || x === 29 || y === 0 || y === 19) return 'n';
    if (y % 5 === 2 && x > 2 && x < 27) return x % 3 === 0 ? 'h' : x % 7 === 0 ? 'a' : 'w';
    return 'w';
  }),
  colours: C,
};
