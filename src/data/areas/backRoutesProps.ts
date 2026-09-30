import { SHADES as S } from '../../ui/pixelArt';
import type { RowSprite } from '../../ui/sprites';

// PLACEHOLDER pixel props for the back routes: hidden crawlways beneath the roots, close to the
// rot. Dark, damp and cramped, lit by fungi, the girl's glowing marks, and light leaking down
// through grates and cracks from the places above.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

/** A grate in the ceiling with light coming through from the room above. */
export const grate = (width: number, glow: number): RowSprite => ({
  rows: fill(width, 5, (x, y) => (y === 0 || y === 4 || x % 4 === 0 ? 'f' : y === 1 ? 'L' : 'l')),
  colours: { f: S.deep, l: glow, L: S.white },
});

/** A crack in the ceiling with warm light and a flicker of colour from the market above. */
export const MARKET_SLIT: RowSprite = {
  rows: ['..aa..........', '.aLaaa...aa...', 'dagaddaacaLa..', '..dd.ddadddaa.'],
  colours: { a: S.amber, L: S.white, g: S.greenMid, c: S.cyanMid, d: S.amberDeep },
};

/** The girl's marks in glowing fungus ink, showing the way: an arrow (up), a spiral, a cross (not this way). */
export const mark = (kind: 'up' | 'spiral' | 'cross'): RowSprite => ({
  rows:
    kind === 'up'
      ? ['...g...', '..ggg..', '.g.g.g.', '...g...', '...g...', '...g...', '...g...']
      : kind === 'spiral'
        ? ['.ggggg.', 'g.....g', 'g.ggg.g', 'g.g.g.g', 'g.g...g', 'g.gggg.', 'g......']
        : ['g.....g', '.g...g.', '..g.g..', '...g...', '..g.g..', '.g...g.', 'g.....g'],
  colours: { g: S.green },
});

/** Where unwanted things end up: broken blessings, a cracked cell, a bent coil, splinters. */
export const BROKEN_BLESSINGS: RowSprite = {
  rows: [
    '..........cc....................',
    '....mm...cCdc.........l.........',
    '...m..m..cddc....ww..lll....dd..',
    '..m....m.cccc...wwww.l.l..dcccd.',
    '.wwpp..ddddd..dwwddwwdd..dcdCcd.',
    'wwppwwdwwwwwwdwwpwwddwwwdddcccdw',
    'dddddddddddddddddddddddddddddddd',
  ],
  colours: { m: S.light, c: S.cyanDeep, C: S.cyanMid, d: S.deep, w: S.woodLight, p: S.woodPale, l: S.dim },
};

