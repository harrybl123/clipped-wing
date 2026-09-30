import { SHADES as S } from '../../ui/pixelArt';
import { BIRD, type RowSprite } from '../../ui/sprites';

// PLACEHOLDER pixel props for the protagonist's home: poor but cosy, mostly natural wood,
// with a few scavenged gifts that came down the tube (they glow cyan, like the tube).
// Geometric pieces come from small generators; characterful ones are drawn by hand.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

/** Arched plank door with iron-ish straps and a latch. */
export const DOOR: RowSprite = {
  rows: fill(20, 34, (x, y) => {
    const cx = 9.5;
    const archTop = y < 8 && (x - cx) ** 2 / 100 + (y - 8) ** 2 / 64 > 1;
    if (archTop) return '.';
    const edge = y < 8 ? (x - cx) ** 2 / 100 + (y - 8) ** 2 / 64 > 0.72 : x === 0 || x === 19;
    if (edge) return 'o';
    if (y === 10 || y === 26) return 's';
    if (x === 15 && y === 18) return 'k';
    return x % 5 === 0 ? 'l' : 'p';
  }),
  colours: { o: S.deep, p: S.woodLight, l: S.wood, s: S.dim, k: S.light },
};

/** Stone-and-clay hearth with a dark opening for the fire. */
export const HEARTH: RowSprite = {
  rows: fill(44, 18, (x, y) => {
    const inOpening = x >= 11 && x <= 32 && y >= 5 && !(y === 5 && (x < 14 || x > 29));
    if (inOpening) return 'd';
    if (y === 0) return 't';
    if (y % 5 === 4) return 'm';
    const offset = Math.floor(y / 5) % 2 === 0 ? 0 : 4;
    return (x + offset) % 8 === 7 ? 'm' : (x * 7 + y * 3) % 11 === 0 ? 't' : 's';
  }),
  colours: { s: S.dim, t: S.woodPale, m: S.deep, d: S.shadow },
};

/** A scavenged metal pipe used as a chimney: a gift from above, riveted together. */
export const pipe = (height: number): RowSprite => ({
  rows: fill(4, height, (x, y) => (y % 24 === 0 || y % 24 === 1 ? (x === 1 ? 'c' : 'j') : ['d', 'l', 'm', 'd'][x]!)),
  colours: { d: S.deep, l: S.light, m: S.dim, j: S.woodPale, c: S.cyanMid },
});

export const POT: RowSprite = {
  rows: ['.dddddddd.', 'dmmmmmmmmd', '.dssssssd.', '.dssssssd.', '.dssssssd.', '..dssssd..', '...dddd...'],
  colours: { d: S.deep, m: S.dim, s: S.shadow },
};

/** Carved wooden gear that turns the spit. */
export const GEAR: RowSprite = {
  rows: ['.#.#.#.', '#######', '.##.##.', '###o###', '.##.##.', '#######', '.#.#.#.'],
  colours: { '#': S.woodPale, o: S.deep },
};

export const TABLE: RowSprite = {
  rows: fill(40, 12, (x, y) => {
    if (y === 0) return 'h';
    if (y <= 2) return 'p';
    if (y === 3) return x > 1 && x < 38 ? 'd' : '.';
    return (x >= 3 && x <= 4) || (x >= 35 && x <= 36) ? 'l' : '.';
  }),
  colours: { h: S.dim, p: S.woodPale, d: S.deep, l: S.woodLight },
};

export const STOOL: RowSprite = {
  rows: ['hhhhhhhh', 'pppppppp', '.l....l.', '.l....l.', '.llllll.', '.l....l.', '.l....l.', '.l....l.'],
  colours: { h: S.dim, p: S.woodPale, l: S.woodLight },
};

export const BOWL: RowSprite = { rows: ['d...d', '.ddd.'], colours: { d: S.light } };

/** A striped rag rug, seen edge-on. */
export const RUG: RowSprite = {
  rows: fill(70, 2, (x) => ['a', 'a', 'c', 'c', 'w', 'w', 'g', 'g'][Math.floor(x / 3) % 8]!),
  colours: { a: S.amberDeep, c: S.cyanDeep, w: S.woodPale, g: S.greenDeep },
};

/** A shelf plank with two brackets. */
export const shelf = (width: number): RowSprite => ({
  rows: fill(width, 5, (x, y) => (y === 0 ? 'h' : y === 1 ? 'p' : y === 2 ? 'd' : x === 2 || x === width - 3 ? 'b' : '.')),
  colours: { h: S.dim, p: S.woodPale, d: S.deep, b: S.woodLight },
});

/** A jar of stored food. */
export const JAR: RowSprite = {
  rows: ['.www.', 'd...d', 'dfffd', 'dfffd', 'dfffd', '.ddd.'],
  colours: { w: S.woodPale, d: S.dim, f: S.amberDeep },
};

/** Straw mattress with a patchwork blanket and a pillow. */
export const BED: RowSprite = {
  rows: fill(48, 10, (x, y) => {
    if (y < 3) return x < 10 ? (y === 0 && (x === 0 || x === 9) ? '.' : 'w') : '.';
    if (y < 7) {
      if (x < 8) return 's';
      return ['c', 'g', 'a', 'l'][(Math.floor((x - 8) / 7) + Math.floor((y - 3) / 2)) % 4]!;
    }
    return y === 9 ? 'd' : 's';
  }),
  colours: { w: S.light, s: S.amberDeep, c: S.cyanDeep, g: S.greenDeep, a: S.woodPale, l: S.woodLight, d: S.deep },
};

/** The carving bench, with shavings. */
export const BENCH: RowSprite = {
  rows: fill(56, 14, (x, y) => {
    if (y === 0) return 'h';
    if (y <= 2) return 'p';
    if (y === 3) return 'd';
    if (y === 13 && x % 7 === 3) return 'v';
    return x <= 2 || x >= 53 || (y === 9 && x > 2 && x < 53) ? 'l' : '.';
  }),
  colours: { h: S.dim, p: S.woodPale, d: S.deep, l: S.woodLight, v: S.dim },
};

export const CHISEL: RowSprite = { rows: ['llllhh', '....hh'], colours: { l: S.light, h: S.woodLight } };

/** A bird still being carved: unpainted wood (only finished birds are red). */
export const UNFINISHED_BIRD: RowSprite = { rows: BIRD.rows, colours: { '#': S.woodPale, d: S.dim, o: S.deep } };

/** A scavenged gift from the tube: a smooth pod that glows faintly. Used as a night light. */
export const LIGHT_CELL: RowSprite = {
  rows: ['.mmm.', 'mcccm', 'mcwcm', 'mcccm', '.mmm.', '..d..'],
  colours: { m: S.cyanMid, c: S.cyan, w: S.white, d: S.dim },
};

/** A scavenged charm by the door: a smooth, unknowable fragment hung on a nail. */
export const CHARM: RowSprite = {
  rows: ['..d..', '.lll.', 'lcccl', '.lll.'],
  colours: { d: S.dim, l: S.light, c: S.cyanMid },
};

/** A jar of glowing fungus hung as a lamp: the cheap light of the roots. */
export const FUNGUS_LAMP: RowSprite = {
  rows: ['.ddddd.', 'd.....d', 'dgggggd', 'dgwgggd', 'dgggggd', 'dggwggd', 'dgggggd', '.ddddd.'],
  colours: { d: S.dim, g: S.green, w: S.white },
};

export const PULLEY: RowSprite = {
  rows: ['.www.', 'w...w', 'w.d.w', 'w...w', '.www.'],
  colours: { w: S.woodPale, d: S.deep },
};

/** Wicker basket for hauling things up to the loft. */
export const BASKET: RowSprite = {
  rows: fill(12, 8, (x, y) => (y === 0 ? (x === 0 || x === 11 ? 'a' : '.') : y === 1 ? 'w' : (x + y) % 2 === 0 ? 'a' : 'w')),
  colours: { a: S.amberDeep, w: S.woodPale },
};

export const BUCKET: RowSprite = {
  rows: ['d......d', 'dlllllld', 'dlwwwwld', 'dlllllld', '.dlllld.', '.dddddd.'],
  colours: { d: S.deep, l: S.woodLight, w: S.cyanMid },
};

/** Bundles of drying herbs. */
export const HERBS: RowSprite = {
  rows: ['..d..', '.gGg.', 'gGgGg', '.gGg.', 'gGgGg', '.gGg.', '..g..'],
  colours: { d: S.dim, g: S.greenDeep, G: S.greenMid },
};

/** Planks nailed over a hole in the wall. */
export const PATCH: RowSprite = {
  rows: fill(12, 8, (x, y) => (y === 3 ? 'd' : (x === 1 || x === 10) && (y === 1 || y === 5) ? 'n' : 'p')),
  colours: { p: S.woodLight, d: S.deep, n: S.dim },
};

/** The crack in the bark on the rot side, with green light leaking through. */
export const CRACK: RowSprite = {
  rows: fill(8, 48, (x, y) => {
    const centre = 4 + Math.round(Math.sin(y / 4) * 1.5);
    const half = y < 4 || y > 43 ? 0 : y < 10 || y > 36 ? 1 : 2;
    const d = Math.abs(x - centre);
    if (d > half + 1) return '.';
    if (d === half + 1) return 's';
    return d === 0 && y % 3 !== 0 ? 'G' : 'g';
  }),
  colours: { s: S.shadow, g: S.greenMid, G: S.green },
};

/** A support post from the floor to the loft. */
export const post = (height: number): RowSprite => ({
  rows: fill(4, height, (x) => ['d', 'l', 'p', 'd'][x]!),
  colours: { d: S.deep, l: S.woodLight, p: S.woodPale },
});

/** A loose board in the loft floor: the hiding place. */
export const LOOSE_BOARD: RowSprite = {
  rows: ['sppppppppppps', 'sddddddddddds'],
  colours: { s: S.shadow, p: S.woodPale, d: S.deep },
};

// --- The living nook under the food shelves ---

/** A low seat carved from a root knot, with a patched cushion. */
export const SEAT: RowSprite = {
  rows: fill(22, 12, (x, y) => {
    if (y === 0) return x >= 2 && x <= 19 ? 'k' : '.';
    if (y <= 2) return x >= 1 && x <= 20 ? ['c', 'a', 'g', 'w'][Math.floor((x - 1) / 5) % 4]! : '.';
    if (y === 3) return 'h';
    if (y <= 9) {
      if (x === 0 || x === 21) return 'd';
      const ring = Math.hypot((x - 10.5) / 2.2, (y - 6.5) / 1.6);
      return ring > 0.8 && ring < 1.4 ? 'd' : 'l';
    }
    if (y === 10) return (x >= 1 && x <= 4) || (x >= 17 && x <= 20) ? 'l' : '.';
    return (x >= 0 && x <= 5) || (x >= 16 && x <= 21) ? 'd' : '.';
  }),
  colours: { k: S.woodPale, c: S.cyanDeep, a: S.amberDeep, g: S.greenDeep, w: S.woodLight, h: S.woodPale, l: S.woodLight, d: S.deep },
};

/** A little side table grown from a root stalk. */
export const SIDE_TABLE: RowSprite = {
  rows: fill(10, 12, (x, y) => {
    if (y === 0) return 'h';
    if (y === 1) return 'p';
    if (y === 2) return x >= 1 && x <= 8 ? 'd' : '.';
    if (y <= 10) return x === 4 || x === 5 ? 'l' : '.';
    return x >= 2 && x <= 7 ? 'l' : '.';
  }),
  colours: { h: S.dim, p: S.woodPale, d: S.deep, l: S.woodLight },
};

/** A cracked, faintly glowing gift from the tube, used as a candle tray. */
export const TRAY: RowSprite = {
  rows: ['cccccdcccc', 'mmmmmmmmmm'],
  colours: { c: S.cyan, d: S.cyanDeep, m: S.cyanMid },
};

export const CANDLE: RowSprite = {
  rows: ['.a.', '.w.', 'lll', 'lll', 'lll'],
  colours: { a: S.amber, w: S.white, l: S.light },
};

/** Mum's mending basket, with yarn and a needle. */
export const MENDING_BASKET: RowSprite = {
  rows: ['......n..', '.yy...n..', 'yyyy..n..', 'awawawawa', 'wawawawaw', '.awawawa.'],
  colours: { n: S.light, y: S.cyanDeep, a: S.amberDeep, w: S.woodPale },
};

// --- The kitchen corner, between the door and the hearth ---

/** A worktop over two cupboards. */
export const COUNTER: RowSprite = {
  rows: fill(32, 14, (x, y) => {
    if (y === 0) return 'h';
    if (y <= 2) return 'p';
    if (y === 3 || y === 13) return 'd';
    if (x === 0 || x === 31 || x === 15 || x === 16) return 'd';
    if ((x === 13 || x === 18) && y === 8) return 'k';
    return x === 1 || x === 17 || y === 4 ? 'l' : 'c';
  }),
  colours: { h: S.dim, p: S.woodPale, d: S.deep, l: S.woodLight, c: S.wood, k: S.dim },
};

/** Chopping board with a knife and a few chopped roots. */
export const BOARD: RowSprite = {
  rows: ['.g.g..llll', 'pppppppp..'],
  colours: { g: S.greenMid, l: S.light, p: S.woodPale },
};

/** Plates stood on edge and cups, for the crockery shelf. */
export const CROCKERY: RowSprite = {
  rows: fill(26, 6, (x, y) => {
    const plate = (cx: number) => Math.hypot(x - cx, y - 2.5) <= 2.6;
    if (plate(3) || plate(8)) return Math.hypot(x - (x < 6 ? 3 : 8), y - 2.5) < 1.2 ? 'm' : 'l';
    const cup = (x >= 13 && x <= 15) || (x >= 18 && x <= 20) || (x >= 23 && x <= 25);
    if (cup && y >= 2) return y === 5 && (x === 13 || x === 18 || x === 23) ? '.' : 'l';
    return '.';
  }),
  colours: { l: S.light, m: S.dim },
};

export const LADLE: RowSprite = { rows: ['.l.', '.l.', '.l.', '.l.', '.l.', 'lll', 'lll', '.l.'], colours: { l: S.light } };

export const PAN: RowSprite = {
  rows: ['..l...', '..l...', '..l...', 'dddddd', 'dmmmmd', 'dmmmmd', '.dddd.'],
  colours: { l: S.light, d: S.deep, m: S.dim },
};

export const SPOON: RowSprite = { rows: ['.w.', '.w.', '.w.', '.w.', 'www', '.w.'], colours: { w: S.woodPale } };

/** Open water barrel. */
export const BARREL: RowSprite = {
  rows: fill(10, 14, (x, y) => {
    if (y === 0) return x === 0 || x === 9 ? 'r' : 'w';
    if (y === 1) return x === 0 || x === 9 ? 'r' : 'c';
    if (y === 3 || y === 11) return 'h';
    return x % 3 === 0 ? 'd' : 'l';
  }),
  colours: { r: S.woodPale, w: S.cyanMid, c: S.cyanDeep, h: S.dim, d: S.wood, l: S.woodLight },
};
