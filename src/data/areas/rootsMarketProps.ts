import { SHADES as S } from '../../ui/pixelArt';
import type { RowSprite } from '../../ui/sprites';

// PLACEHOLDER pixel props for the roots market: working-class and busy, with colour from awnings,
// cloth and bunting against the wood, and a little scavenged tech on the curiosities stall.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

/**
 * A market stall: a striped awning with a scalloped edge on two posts, over a counter.
 * `a` and `b` are the stripe colours. Goods are separate props placed on the counter.
 */
export const stall = (width: number, a: number, b: number): RowSprite => ({
  rows: fill(width, 34, (x, y) => {
    const post = x === 2 || x === width - 3;
    if (y <= 6) {
      // Awning: stripes, sloping front, scalloped bottom edge.
      if (y === 0) return x > 1 && x < width - 2 ? 'd' : '.';
      if (y === 6) return x % 4 === 1 || x % 4 === 2 ? (Math.floor(x / 4) % 2 === 0 ? 'A' : 'B') : '.';
      return Math.floor(x / 4) % 2 === 0 ? 'A' : 'B';
    }
    if (y < 22) return post ? 'p' : '.';
    if (y === 22) return 'h'; // counter top
    if (y <= 24) return 'c';
    if (y === 25) return 'd';
    return post || x === 0 || x === width - 1 ? 'p' : (x + y) % 6 === 0 ? 'k' : 'f'; // counter front
  }),
  colours: { A: a, B: b, d: S.deep, p: S.woodLight, h: S.woodPale, c: S.dim, f: S.wood, k: S.woodLight },
});

/** Produce in a shallow basket: roots and fruit in greens and ambers. */
export const PRODUCE: RowSprite = {
  rows: ['.gAg.aG.', 'AgaGgAga', 'wwwwwwww', '.wwwwww.'],
  colours: { g: S.greenMid, G: S.green, a: S.amberDeep, A: S.amber, w: S.woodPale },
};

/** A cooking pot on the food stall. */
export const COOK_POT: RowSprite = {
  rows: ['.dddddd.', 'dmmmmmmd', 'dssssssd', '.dssssd.', '..dddd..'],
  colours: { d: S.deep, m: S.light, s: S.shadow },
};

/** Jars of glowing fungus for sale. */
export const FUNGUS_JARS: RowSprite = {
  rows: ['.w..w..w.', 'dgddgddgd', 'dGddgddGd', 'dgddGddgd', 'ddddddddd'],
  colours: { w: S.woodPale, d: S.dim, g: S.greenMid, G: S.green },
};

/** Rolled bolts of cloth in the market's brightest colours. */
export const CLOTH_BOLTS: RowSprite = {
  rows: ['ccaaggww', 'CcAaGgWw', 'ccaaggww', 'CcAaGgWw'],
  colours: { c: S.cyanMid, C: S.cyan, a: S.amberDeep, A: S.amber, g: S.greenMid, G: S.green, w: S.woodPale, W: S.light },
};

/** Cloth hanging from the awning to show it off. */
export const HANGING_CLOTH: RowSprite = {
  rows: fill(5, 12, (x, y) => (y > 9 && (x + y) % 2 === 0 ? '.' : x === 0 ? 'e' : y % 4 === 0 ? 'l' : 'c')),
  colours: { c: S.cyanMid, l: S.cyan, e: S.cyanDeep },
};

/** Simple tools for sale. */
export const TOOLS: RowSprite = {
  rows: ['l..l..ll', 'l..l..l.', 'h..hh.h.', 'h..h..h.'],
  colours: { l: S.light, h: S.woodPale },
};

/** A scavenged gift from the tube, sold as a curiosity: a cracked screen that still glows. */
export const CURIO_SCREEN: RowSprite = {
  rows: ['dddddddd', 'dccCcccd', 'dcwccccd', 'dccccdcd', 'dcccdccd', 'dddddddd', '...dd...'],
  colours: { d: S.dim, c: S.cyanMid, C: S.cyan, w: S.white },
};

/** Smaller odd bits beside it: a coil and a smooth shard. */
export const CURIO_BITS: RowSprite = {
  rows: ['.m...cc', 'm.m.cCc', '.m...c.'],
  colours: { m: S.light, c: S.cyanMid, C: S.cyan },
};

/** A lantern made from a scavenged light cell in a wooden cage: a bit of tech in the roots. */
export const CELL_LANTERN: RowSprite = {
  rows: ['.w.', 'wcw', 'cCc', 'wcw', '.w.'],
  colours: { w: S.woodPale, c: S.cyanMid, C: S.white },
};

/** A hatch in the wall where rations are handed out, shutter half open. */
export const RATION_HATCH: RowSprite = {
  rows: fill(30, 22, (x, y) => {
    if (y === 0 || x === 0 || x === 29) return 'f';
    if (y <= 6) return (x + y) % 3 === 0 ? 'l' : 's'; // shutter, half down
    if (y === 7) return 'd';
    if (y >= 18) return y === 18 ? 'h' : 'f'; // ledge
    // Inside, dark, with a sack or two on the shelf.
    if (y >= 13 && ((x >= 5 && x <= 9) || (x >= 20 && x <= 24))) return y === 13 ? 'p' : 'k';
    return 'd';
  }),
  colours: { f: S.woodLight, s: S.woodPale, l: S.dim, d: S.shadow, h: S.woodPale, p: S.light, k: S.dim },
};

/** A sack of grain or roots. */
export const SACK: RowSprite = {
  rows: ['..tt..', '.pppp.', 'pppppp', 'pkpppp', 'pppppp', '.pppp.'],
  colours: { t: S.dim, p: S.woodPale, k: S.dim },
};

/** A crate. */
export const CRATE: RowSprite = {
  rows: fill(10, 8, (x, y) => (y === 0 || y === 7 || x === 0 || x === 9 ? 'e' : x === y + 1 || x === 8 - y ? 'e' : 'p')),
  colours: { e: S.woodLight, p: S.wood },
};

/**
 * Bunting: a sagging cord with little triangular flags in turn: cyan, amber, green, pale.
 * `width` px wide, sagging `sag` px in the middle.
 */
export const bunting = (width: number, sag: number): RowSprite => {
  const cordY = (x: number) => Math.round(Math.sin((x / (width - 1)) * Math.PI) * sag);
  const colours = ['c', 'a', 'g', 'w'];
  return {
    rows: fill(width, sag + 6, (x, y) => {
      const cy = cordY(x);
      if (y === cy) return 'o';
      const flag = Math.floor(x / 8);
      const fx = x % 8;
      if (fx >= 1 && fx <= 5 && y > cy && y <= cy + 4 - Math.abs(fx - 3)) return colours[flag % 4]!;
      return '.';
    }),
    colours: { o: S.dim, c: S.cyanMid, a: S.amber, g: S.greenMid, w: S.light },
  };
};

/** A pictograph sign (no writing: roots-dwellers can't read): a fungus, for the fungus seller. */
export const SIGN_FUNGUS: RowSprite = {
  rows: fill(12, 10, (x, y) => {
    if (y === 0 || y === 9 || x === 0 || x === 11) return 'e';
    if (y >= 2 && y <= 4 && x >= 3 && x <= 8 && !(y === 2 && (x === 3 || x === 8))) return 'g';
    if (y >= 5 && y <= 7 && (x === 5 || x === 6)) return 'm';
    return 'b';
  }),
  colours: { e: S.woodLight, b: S.deep, g: S.green, m: S.greenMid },
};

/** A pictograph sign: a steaming bowl, for the food stall. */
export const SIGN_FOOD: RowSprite = {
  rows: fill(12, 10, (x, y) => {
    if (y === 0 || y === 9 || x === 0 || x === 11) return 'e';
    if (y >= 1 && y <= 3 && (x === 4 || x === 7) && (x + y) % 2 === 0) return 'w';
    if (y >= 5 && y <= 7 && x >= 3 + (y - 5) && x <= 8 - (y - 5)) return y === 5 ? 'l' : 'a';
    return 'b';
  }),
  colours: { e: S.woodLight, b: S.deep, w: S.light, l: S.light, a: S.amberDeep },
};

/** A railing along the balcony edge. */
export const railing = (width: number): RowSprite => ({
  rows: fill(width, 8, (x, y) => (y === 0 ? 'h' : x % 7 === 0 ? 'p' : '.')),
  colours: { h: S.woodPale, p: S.woodLight },
});

/** A string of dried roots hanging for sale. */
export const DRIED_ROOTS: RowSprite = {
  rows: ['.d.', 'aAa', '.a.', 'aAa', '.a.', 'aAa', '.a.'],
  colours: { d: S.dim, a: S.amberDeep, A: S.woodPale },
};

/** A window of a home carved into the market wall: lit (amber) or dark, with little shutters. */
export const wallWindow = (lit: boolean): RowSprite => ({
  rows: fill(10, 11, (x, y) => {
    if (x === 0 || x === 9) return y >= 1 && y <= 8 ? 's' : '.'; // shutters
    if (y === 0) return x >= 2 && x <= 7 ? 'f' : '.';
    if (y === 10) return 'h'; // sill
    if (x === 1 || x === 8 || y === 1) return 'f';
    if (x === 4 || x === 5 || y === 5) return 'f'; // window bars
    return lit ? (y < 5 && x < 4 ? 'L' : 'l') : 'd';
  }),
  colours: { s: S.woodLight, f: S.deep, h: S.woodPale, l: S.amber, L: S.light, d: S.shadow },
});

/** A basket hung on a rope for hauling goods up to the homes above. */
export const HAUL_BASKET: RowSprite = {
  rows: ['a..........a', 'wwwwwwwwwwww', 'awawgGawawaw', 'wawawawawawa', '.awawawawaw.'],
  colours: { a: S.amberDeep, w: S.woodPale, g: S.greenMid, G: S.amber },
};
