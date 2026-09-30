import { SHADES } from './pixelArt';

// Placeholder pixel sprites as rows of characters: each character maps to a colour in the
// sprite's `colours`, '.' is transparent. Replaced by real art in the art pass.

export interface RowSprite {
  rows: readonly string[];
  colours: Record<string, number>;
}

/** The protagonist: a small dark figure with a red scarf (red: birds and the protagonist only). */
export const PLAYER: RowSprite = {
  rows: [
    '...####...',
    '..#oooo#..',
    '.#oooooo#.',
    '.#oooooo#.',
    '.#oooooo#.',
    '..#oooo#..',
    '..rrrrrr..',
    '.#ooooorr.',
    '.#oooooor.',
    '#oooooooo#',
    '#oooooooo#',
    '#oooooooo#',
    '#oooooooo#',
    '#oooooooo#',
    '.#oooooo#.',
    '.#oooooo#.',
    '.#oo##oo#.',
    '.#o#..#o#.',
    '.#o#..#o#.',
    '.#o#..#o#.',
    '.#o#..#o#.',
    '.##....##.',
  ],
  colours: { '#': SHADES.dim, o: SHADES.shadow, r: SHADES.red },
};

/** A placeholder villager: same build, no red, slightly paler outline. */
export const VILLAGER: RowSprite = {
  rows: PLAYER.rows.map((row) => row.replace(/r/g, 'o')),
  colours: { '#': SHADES.light, o: SHADES.shadow },
};

/** A small red carved bird with one heavy, clipped wing. */
export const BIRD: RowSprite = {
  rows: [
    '......##..',
    '.....#o##.',
    '#...######',
    '##.######.',
    '.#dd####..',
    '..dd......',
  ],
  colours: { '#': SHADES.red, d: SHADES.redDark, o: SHADES.shadow },
};

const fungus = (rows: string[]): RowSprite => ({ rows, colours: { g: SHADES.green, w: SHADES.white, m: SHADES.greenMid, s: SHADES.greenDeep } });

/** Glowing root fungi: irregular stalks and caps, a little eerie. Each stands on its bottom row. */
export const FUNGI = {
  /** A tall, thin one with a lopsided cap. */
  tall: fungus(['.gg..', 'gwggg', 'g.m.g', '..m..', '..m..', '.m...', '.m...', '.s...']),
  /** A cluster of three at different heights. */
  cluster: fungus(['.gg.....', 'gwgg..g.', '.m...ggg', '.m..gw.m', '..m.gm.m', '..m..m.m', '..s..s.s']),
  /** A small, droopy-capped one. */
  droop: fungus(['.ggg.', 'gwggg', 'g.m.g', '..m..', '..s..']),
  /** A bent stalk with a small cap. */
  bent: fungus(['...gg', '..gwg', '..m..', '.m...', '.m...', 'm....', 's....']),
};

/** A hanging lamp, 3 wide. */
export const LAMP: RowSprite = {
  rows: ['.d.', 'aaa', 'awa', 'aaa', '.d.'],
  colours: { a: SHADES.amber, w: SHADES.white, d: SHADES.amberDeep },
};

/** The dialogue box's "more" arrow. */
export const MORE_ARROW: RowSprite = {
  rows: ['#####', '.###.', '..#..'],
  colours: { '#': SHADES.light },
};

/** Flames on logs, three frames cycled for flicker. Amber and white only: fire is never red. */
export const FIRE_FRAMES: readonly RowSprite[] = [
  [
    '.....a......',
    '....aa..a...',
    '...aaa.aa...',
    '..aaawaaa.a.',
    '..aawwwaaaa.',
    '.aawwwwwaa..',
    '.aawwwwwwaa.',
    'aaawwwwwwaaa',
    'llldlllldlll',
    '.dllllllllld',
  ],
  [
    '......a.....',
    '...a..aa....',
    '...aa.aaa...',
    '.a.aaawaaa..',
    '.aaaawwwaa..',
    '..aawwwwwaa.',
    '.aawwwwwwaa.',
    'aaawwwwwwaaa',
    'llldlllldlll',
    '.dllllllllld',
  ],
  [
    '....a.......',
    '....aa...a..',
    '...aaa..aa..',
    '..aawaaaaa..',
    '.aaawwwaaa..',
    '.aawwwwwaaa.',
    '.aawwwwwwaa.',
    'aaawwwwwwaaa',
    'llldlllldlll',
    '.dllllllllld',
  ],
].map((rows) => ({ rows, colours: { a: SHADES.amber, w: SHADES.white, l: SHADES.woodLight, d: SHADES.deep } }));
