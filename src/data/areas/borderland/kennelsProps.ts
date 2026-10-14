import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the kennels (Chapter 2; Jack): a fenced yard of scrap cages, a rabid creature
// in each, and at the far end a pen behind tall bars where three of them keep a nailed-up box. No red anywhere.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

const C = {
  h: S.light, m: S.dim, n: S.woodLight, w: S.wood, d: S.deep, s: S.shadow, p: S.woodPale,
  W: S.white, a: S.amber, A: S.amberDeep, g: S.cyanDeep,
};

/** Inside a cage: a dark back panel of riveted plate, dirty straw on the floor, a dented bowl. */
export const cageBack = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (y >= height - 3) return (x * 7 + y * 3) % 5 === 0 ? 'n' : 'p'; // straw
    if (y >= height - 6 && x > width - 12 && x < width - 4) return y === height - 6 ? 'h' : 'm'; // the bowl
    if (x % 16 === 0 || y % 14 === 0) return 's'; // plate seams
    if (x % 16 === 3 && y % 14 === 3) return 'm'; // a rivet
    return 'd';
  }),
  colours: C,
});

/**
 * A cage's front, drawn over what's in it: a frame of scrap rail and bars. `rattle` bows the middle of
 * the bars, as it hits them (two frames, swapped back and forth).
 */
export const cageFront = (width: number, height: number, rattle: boolean): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    if (y < 3 || y >= height - 2) return y === 0 ? 'h' : 'n'; // top and bottom rails
    if (x < 2 || x >= width - 2) return 'n'; // corner posts
    const bow = rattle && y > height / 3 && y < (height * 2) / 3 ? 1 : 0;
    return (x - 2 - bow + 5) % 5 === 0 ? 'm' : '.';
  }),
  colours: C,
});

/**
 * The pen's fence at the far end: tall bars from the ground up to the wire roof, a gate in it with a chain
 * and a padlock hanging open. Drawn over the creatures when they come up against it.
 */
export const penFence = (height: number, rattle: boolean): RowSprite => ({
  rows: fill(12, height, (x, y) => {
    if (y < 2) return 'n'; // the top rail
    if (x === 0 || x === 11) return 'n'; // the gate's frame
    if (y === Math.round(height / 2) || y === height - 4) return x > 0 && x < 11 ? 'n' : '.'; // cross rails
    if (x >= 9 && y > height / 2 + 3 && y < height / 2 + 9) return y % 2 ? 'h' : 'm'; // the chain
    if (x === 10 && y >= height / 2 + 9 && y < height / 2 + 13) return 'A'; // the padlock, hanging open
    const bow = rattle && y > height / 3 && y < (height * 2) / 3 ? 1 : 0;
    return (x - bow) % 3 === 1 ? 'm' : '.';
  }),
  colours: C,
});

/** The wooden box the creatures keep: battered planks, nailed shut, a rope round it. */
export const BOX: RowSprite = {
  rows: fill(26, 18, (x, y) => {
    if (y === 0 || x === 0 || x === 25 || y === 17) return 's';
    if (x === 6 || x === 19) return 'r'; // the rope
    if (y % 6 === 0) return 'w'; // plank edges
    if ((x === 3 || x === 22) && y % 6 === 3) return 'h'; // nails
    return (x + y * 3) % 11 === 0 ? 'w' : 'n';
  }),
  colours: { ...C, r: S.woodPale },
};

/** Gnawed bones in the dirt. */
export const BONES: RowSprite = { rows: ['h.....h.....', '.hhhhh...h.h', 'h.....h..hh.', '........h..h'], colours: C };

/** Empty feed tins, kicked over, and a chain lying in the dirt. */
export const TINS: RowSprite = { rows: ['.mm.......mm.', 'mggm.....mggm', 'mhhm.mhmhmhhm', '.mm.........m'], colours: C };

/** A burning drum by the way in: the only light. */
export const DRUM: RowSprite = {
  rows: fill(12, 14, (x, y) => (x === 0 || x === 11 ? 's' : y % 5 === 0 ? 'm' : (x + y) % 9 === 0 ? 'A' : 'w')),
  colours: C,
};

/** Where the kennels lane leaves the scrap stacks: a post with a chain and a heavy collar hung on it. */
export const KENNEL_POST: RowSprite = {
  rows: fill(9, 30, (x, y) => {
    if (x >= 3 && x <= 4) return y === 0 ? 'h' : 'n'; // the post
    if (x === 5 && y >= 4 && y <= 10) return y % 2 ? 'h' : 'm'; // the chain
    if (y >= 11 && y <= 16 && x >= 4 && x <= 8 && (x === 4 || x === 8 || y === 11 || y === 16)) return 'w'; // the collar
    if (y === 13 && x === 6) return 'h'; // its buckle
    return '.';
  }),
  colours: C,
};
