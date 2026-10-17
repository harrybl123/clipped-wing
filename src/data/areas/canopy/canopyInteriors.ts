import { SHADES as S, cellRandom, noise } from '../../../ui/pixelArt';
import { BIRD, type RowSprite } from '../../../ui/sprites';
import { C } from './canopyProps';

// The canopy's rooms and their things (Chapter 4; docs/chapter-4-world.md): cutaway walls you see into (the
// leaves showing through their windows), the great house's sorting tables, the blessing workshop, the mess;
// Grounded's shelves of your birds (the only red up here); the seed bed's glass; the lookout's spyglass; the
// lowering platform's winch; the Tender's hut on the outside of the trunk; the quartermaster's family's
// homestead on the ground. Draft looks, for the designer to change.

type Grid = string[][];
const grid = (w: number, h: number): Grid => Array.from({ length: h }, () => Array<string>(w).fill('.'));
const plot = (g: Grid, x: number, y: number, c: string) => {
  const row = g[Math.round(y)];
  if (row && Math.round(x) >= 0 && Math.round(x) < row.length) row[Math.round(x)] = c;
};
const box = (g: Grid, x: number, y: number, w: number, h: number, c: string) => {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) plot(g, xx, yy, c);
};
const stamp = (g: Grid, rows: readonly string[], x: number, y: number) => rows.forEach((row, dy) => [...row].forEach((c, dx) => c !== '.' && plot(g, x + dx, y + dy, c)));
const sprite = (g: Grid): RowSprite => ({ rows: g.map((r) => r.join('')), colours: C });

/**
 * A cutaway wall of living wood and woven panels, `width` × `height`, with window openings left clear (the
 * leaves and sky show through) where `windows` says (x, y, w, h, each within the wall), round-topped; beams
 * across it every `beam` px.
 */
export const wovenWall = (width: number, height: number, seed: number, windows: readonly (readonly [number, number, number, number])[] = [], beam = 0): RowSprite => {
  const g = grid(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inWindow = windows.some(([wx, wy, ww, wh]) => {
        if (x < wx || x >= wx + ww || y < wy || y >= wy + wh) return false;
        const r = ww / 2;
        return y - wy >= r || Math.hypot(x - wx - r + 0.5, y - wy - r) < r;
      });
      const frame = !inWindow && windows.some(([wx, wy, ww, wh]) => x >= wx - 2 && x < wx + ww + 2 && y >= wy - 2 && y < wy + wh + 2 && (y - wy >= ww / 2 || Math.hypot(x - wx - ww / 2 + 0.5, y - wy - ww / 2) < ww / 2 + 2));
      if (inWindow) continue;
      if (frame) {
        plot(g, x, y, 'n');
        continue;
      }
      // Uprights of living wood every so often, warm woven panels between (lamplit: it's somebody's home),
      // a darker skirting low down.
      const up = (x + Math.round(noise(y / 20 + seed) * 2)) % 48;
      if (up < 5) {
        plot(g, x, y, up === 0 ? 'l' : up === 4 ? 'd' : up === 1 ? 'p' : 'n');
        continue;
      }
      if (beam && y % beam < 3) {
        plot(g, x, y, y % beam === 0 ? 'l' : y % beam === 2 ? 'd' : 'p');
        continue;
      }
      if (y > height - 14) {
        plot(g, x, y, y === height - 14 ? 'l' : (x % 12 === 0 ? 'o' : 'n'));
        continue;
      }
      const over = (x + 2 * y) % 8 < 4;
      const under = (((x - 2 * y) % 8) + 8) % 8 < 4;
      const weave = over ? (under ? 'p' : 'M') : under ? 'n' : 'p';
      plot(g, x, y, cellRandom(x, y, seed) > 0.985 ? 'l' : weave);
    }
  }
  return sprite(g);
};

/** A roof seen from inside and over: leaf shingles, overhanging, solar sails along its ridge. */
export const bigRoof = (width: number, height: number, seed: number): RowSprite => {
  const g = grid(width, height);
  const cx = (width - 1) / 2;
  for (let y = 0; y < height; y++) {
    const half = ((y + 1) / height) * (width / 2);
    for (let x = 0; x < width; x++) {
      if (Math.abs(x - cx) > half) continue;
      const edge = Math.abs(x - cx) > half - 2 || y >= height - 2;
      // Rows of leaf shingles, each row's lower edge dark, lit along the top; a ridge of pale wood.
      const row = y % 5;
      const shingle = (x + Math.floor(y / 5) * 3) % 6 === 0;
      // Thatch, layered like the huts' (designer: like the Ewoks').
      plot(g, x, y, y < 2 ? 'o' : edge ? 'A' : row === 4 ? 'A' : shingle ? 'A' : (x * 3 + y) % 4 === 0 ? 'a' : cellRandom(x, y, seed) > 0.9 ? 'a' : 'M');
    }
  }
  return sprite(g);
};

/** A floor of planks seen edge-on, for a storey in a cutaway (drawn over a one-way platform). */
export const floorBeam = (width: number): RowSprite => {
  const g = grid(width, 6);
  for (let x = 0; x < width; x++) {
    plot(g, x, 0, 'l');
    plot(g, x, 1, 'p');
    plot(g, x, 2, x % 16 === 0 ? 'n' : 'p');
    plot(g, x, 3, 'n');
    plot(g, x, 4, x % 24 < 4 ? 'p' : 'o');
    plot(g, x, 5, 'd');
  }
  return sprite(g);
};

// --- The sorting deck -------------------------------------------------------------------------------

/** A long sorting table, offerings spread on it (combs, bowls, little figures, a glass thing). */
export const sortingTable = (width: number, seed: number): RowSprite => {
  const g = grid(width, 16);
  for (let x = 0; x < width; x++) {
    plot(g, x, 6, 'l');
    plot(g, x, 7, 'p');
    plot(g, x, 8, 'p');
    plot(g, x, 9, 'd');
    if (x <= 3 || x >= width - 4) for (let y = 10; y < 16; y++) plot(g, x, y, x === 0 || x === width - 1 ? 'd' : 'o');
  }
  for (let x = 3, i = 0; x < width - 6; i++) {
    const r = cellRandom(i, 0, seed);
    const things = [['.pp.', 'pnnp'], ['aMMa', '.MM.'], ['.l.', 'lil'], ['pp', 'nn'], ['.c.', 'mcm'], ['p.p', 'ppp'], ['.a.', 'aMa']];
    const t = things[Math.floor(r * things.length)]!;
    stamp(g, t, x, 6 - t.length);
    x += t[0]!.length + 1 + Math.floor(cellRandom(i, 1, seed) * 4);
  }
  return sprite(g);
};

/** A deep basket: what's kept (for the colony). */
export const KEEP_BASKET: RowSprite = {
  rows: ['.p.a..l.c.', 'MAMAMAMAMA', 'AMAMAMAMAM', 'MAMAMAMAMA', 'AMAMAMAMAM', '.MAMAMAMA.'],
  colours: C,
};

/** A chute down through the floor (what goes on, to the lowering platform). */
export const chute = (height: number): RowSprite => {
  const g = grid(14, height);
  for (let y = 0; y < height; y++) {
    const half = y < 8 ? 7 - y * 0.4 : 4;
    for (let x = Math.round(7 - half); x <= 7 + half; x++) plot(g, x, y, Math.abs(x - 7) > half - 1 ? 'i' : y < 8 ? 'd' : 'n');
  }
  return sprite(g);
};

// --- The blessing workshop --------------------------------------------------------------------------

/** A workbench: a vice, tools on the wall over it, shavings, something half made. */
export const workbench = (width: number, seed: number): RowSprite => {
  const g = grid(width, 30);
  // Tools hanging on a rack above it.
  for (let x = 2; x < width - 2; x++) plot(g, x, 2, 'o');
  for (let x = 4, i = 0; x < width - 4; i++, x += 5) {
    const len = 4 + Math.floor(cellRandom(i, 0, seed) * 5);
    for (let y = 3; y < 3 + len; y++) plot(g, x, y, y === 3 + len - 1 ? (cellRandom(i, 1, seed) > 0.5 ? 'l' : 'i') : 'n');
  }
  // The bench: a thick top, a dark apron, stout legs, a shelf under it.
  for (let x = 0; x < width; x++) {
    plot(g, x, 18, 'l');
    plot(g, x, 19, 'p');
    plot(g, x, 20, 'p');
    plot(g, x, 21, 'd');
    if (x <= 2 || x >= width - 3) for (let y = 22; y < 30; y++) plot(g, x, y, x === 0 || x === width - 1 ? 'd' : 'o');
    if (x > 2 && x < width - 3) {
      plot(g, x, 26, 'p');
      plot(g, x, 27, 'o');
    }
  }
  stamp(g, ['ii.', 'iii', '.i.'], width - 6, 15); // a vice
  // Something half made: a blessing, roughed out.
  stamp(g, cellRandom(seed, 3, 1) > 0.5 ? ['..pp..', '.pnnp.', 'pnnnnp'] : ['.c.', 'mcm', 'mcm'], 5, 15);
  for (let x = 3; x < width - 3; x += 3) if (cellRandom(x, seed, 4) > 0.6) plot(g, x, 26, 'p'); // shavings under it
  return sprite(g);
};

/** Shelves of finished blessings: jars of light, bundles, carved things, ready to go down. */
export const blessingShelves = (width: number, height: number, seed: number): RowSprite => {
  const g = grid(width, height);
  for (let y = 0; y < height; y++) {
    plot(g, 0, y, 'o');
    plot(g, width - 1, y, 'o');
  }
  for (let y = 0; y < height; y++) for (let x = 1; x < width - 1; x++) plot(g, x, y, 'o'); // its dark back
  for (let sy = 10; sy < height; sy += 12) {
    for (let x = 0; x < width; x++) {
      plot(g, x, sy, 'l');
      plot(g, x, sy + 1, 'd');
    }
    for (let x = 2, i = 0; x < width - 5; i++) {
      const r = cellRandom(i, sy, seed);
      const thing = r > 0.6 ? ['.ii.', 'mccm', 'mcwm', 'mccm'] : r > 0.35 ? ['MAM', 'AaA', 'MAM'] : r > 0.15 ? ['.p.', 'pnp', 'pnp'] : ['ll', 'il'];
      stamp(g, thing, x, sy - thing.length);
      x += thing[0]!.length + 1;
    }
  }
  return sprite(g);
};

/** A bottle, and a cup. */
export const BOTTLE: RowSprite = { rows: ['.i.', '.i.', 'MAM', 'MaM', 'MAM', 'MMM'], colours: C };

// --- The mess ---------------------------------------------------------------------------------------

/** A long table with benches either side (seen side-on: one bench in front), bowls along it. */
export const messTable = (width: number, seed: number): RowSprite => {
  const g = grid(width, 14);
  for (let x = 0; x < width; x++) {
    plot(g, x, 3, 'l');
    plot(g, x, 4, 'p');
    plot(g, x, 5, 'd');
    if (x === 3 || x === 4 || x === width - 4 || x === width - 5 || x === Math.floor(width / 2)) for (let y = 6; y < 14; y++) plot(g, x, y, 'o');
    // The bench in front.
    if (x > 0 && x < width - 1) {
      plot(g, x, 9, 'p');
      plot(g, x, 10, 'd');
    }
    if (x === 2 || x === width - 3) for (let y = 11; y < 14; y++) plot(g, x, y, 'd');
    if (x % 9 === 4 && cellRandom(x, 0, seed) > 0.25) {
      stamp(g, ['MaaM', '.MM.'], x - 1, 1); // a bowl
    }
  }
  return sprite(g);
};

/** The kitchen: a stove with a pot, a counter, hanging herbs, a shelf of jars. */
export const KITCHEN: RowSprite = (() => {
  const g = grid(70, 52);
  // A shelf of jars and the herbs hanging under it.
  box(g, 0, 8, 70, 2, 'p');
  for (let x = 2; x < 68; x += 5) stamp(g, cellRandom(x, 1, 3) > 0.5 ? ['.i.', 'MAM', 'MaM'] : ['ll', 'mc'], x, 5);
  for (let x = 4; x < 66; x += 7) for (let y = 10; y < 16 + (x % 3); y++) plot(g, x + (y % 2), y, y > 13 ? 'e' : 'g');
  // The stove: a stone box, its mouth glowing, a pot on top, a pipe up.
  box(g, 6, 30, 26, 22, 'i');
  box(g, 7, 31, 24, 20, 'n');
  box(g, 12, 40, 14, 8, 'd');
  box(g, 14, 42, 10, 5, 'a');
  box(g, 10, 22, 16, 8, 'd');
  box(g, 11, 23, 14, 6, 'o');
  for (let y = 0; y < 22; y++) plot(g, 18, y, y < 8 ? '.' : 'i');
  // The counter: a board on legs, things on it.
  box(g, 36, 34, 34, 3, 'p');
  box(g, 36, 37, 34, 1, 'o');
  for (const x of [37, 68]) box(g, x, 38, 1, 14, 'o');
  stamp(g, ['.ee.', 'eGge', 'nnnn'], 42, 30);
  stamp(g, ['aMa', 'MMM'], 52, 32);
  stamp(g, ['ppppp'], 60, 33);
  return sprite(g);
})();

/** A door into somebody's home along the gallery: arched, a curtain or a plank door, a lantern beside it. */
export const homeDoor = (seed: number): RowSprite => {
  const g = grid(18, 30);
  for (let y = 4; y < 30; y++) for (let x = 2; x < 14; x++) {
    const arch = Math.hypot(x - 7.5, y - 10) > 6 && y < 10;
    if (arch) continue;
    const frame = x === 2 || x === 13 || (y < 11 && Math.hypot(x - 7.5, y - 10) > 4.8);
    const curtain = cellRandom(seed, 0, 5) > 0.5;
    plot(g, x, y, frame ? 'p' : curtain ? ((x + Math.floor(y / 3)) % 3 === 0 ? 'M' : 'a') : x % 3 === 0 ? 'o' : 'n');
  }
  stamp(g, ['.i.', 'lal', 'lal', '.i.'], 15, 12);
  return sprite(g);
};

// --- The message loft -------------------------------------------------------------------------------

/** A metal plate with pictures scratched into it, like the ones Grounded sent you. */
export const plate = (kind: 'eye' | 'wing' | 'seed' | 'cage' | 'tree' | 'up'): RowSprite => {
  const g = grid(22, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 22; x++) plot(g, x, y, x === 0 || y === 0 ? 'i' : x === 21 || y === 15 ? 'd' : (x + y) % 7 === 0 ? 'n' : 'o');
  const pics: Record<string, string[]> = {
    eye: ['.....lll.....', '...ll...ll...', '..l..lll..l..', '...ll...ll...', '.....lll.....'],
    wing: ['......l......', '....lll......', '..lllll.l....', 'llllll.lll...', '...ll........'],
    seed: ['......l......', '.....l.l.....', '......l......', '....lllll....', '.....lll.....'],
    cage: ['....lllll....', '...l.l.l.l...', '...l.lll.l...', '...l.l.l.l...', '...lllllll...'],
    tree: ['.....lll.....', '...lllllll...', '.....lll.....', '......l......', '....lllll....'],
    up: ['......l......', '.....lll.....', '....l.l.l....', '......l......', '......l......'],
  };
  stamp(g, pics[kind]!, 4, 5);
  return sprite(g);
};

/** A carver's bench under a skylight: a plate on it, a scratching tool, a lamp. */
export const CARVER_BENCH: RowSprite = (() => {
  const g = grid(48, 26);
  box(g, 0, 12, 48, 2, 'p');
  box(g, 0, 14, 48, 1, 'n');
  box(g, 0, 15, 48, 1, 'o');
  for (const x of [2, 45]) box(g, x, 16, 1, 10, 'o');
  box(g, 12, 9, 18, 3, 'o');
  box(g, 13, 9, 16, 1, 'i');
  stamp(g, ['l', 'i', 'i', 'i'], 34, 8);
  stamp(g, ['.ii.', 'illi', 'lwal', 'laal', '.ii.'], 40, 7);
  return sprite(g);
})();

// --- Grounded's house -------------------------------------------------------------------------------

/** Shelves of your birds, every one you sent up, in order: the only red in the canopy (palette: birds). */
export const birdShelves = (width: number, rows: number): RowSprite => {
  const H = rows * 12 + 2;
  const colours = { ...C, '#': S.red, r: S.redDark, '0': S.shadow };
  const g = grid(width, H);
  for (let y = 0; y < H; y++) {
    plot(g, 0, y, 'o');
    plot(g, width - 1, y, 'o');
  }
  const bird = BIRD.rows.map((r) => r.replace(/d/g, 'r').replace(/o/g, '0'));
  for (let r = 0; r < rows; r++) {
    const sy = 10 + r * 12;
    for (let x = 0; x < width; x++) {
      plot(g, x, sy, 'p');
      plot(g, x, sy + 1, 'o');
    }
    for (let x = 2; x + 10 < width - 1; x += 12) stamp(g, bird, x, sy - 6);
  }
  return { rows: g.map((row) => row.join('')), colours };
};

/** A radio: a box with dials, a speaker grille, a light, an aerial. */
export const RADIO: RowSprite = {
  rows: [
    '..........l..', '..........i..', '..........i..', '.........i...', 'nnnnnnnnnnnnn', 'nooooooooooon', 'nodddoiiiicon', 'nodddolilimon', 'nodddoiiiiaon', 'nooooooooooon', 'nnnnnnnnnnnnn',
  ],
  colours: C,
};

/** A map of the canopy pinned to the wall: the crown, the tentacles, marks where things are. */
export const CANOPY_CHART: RowSprite = (() => {
  const g = grid(44, 30);
  box(g, 0, 0, 44, 30, 'p');
  for (let x = 0; x < 44; x++) {
    plot(g, x, 0, 'n');
    plot(g, x, 29, 'n');
  }
  for (let y = 4; y < 26; y++) {
    const half = Math.sin(((y - 4) / 22) * Math.PI) * 18;
    for (let x = Math.round(22 - half); x <= 22 + half; x++) if (x === Math.round(22 - half) || x === Math.round(22 + half)) plot(g, x, y, 'G');
  }
  for (let y = 2; y < 12; y++) {
    plot(g, 22, y, 'm');
    plot(g, 22 - Math.round((12 - y) * 0.8), y, 'm');
    plot(g, 22 + Math.round((12 - y) * 0.8), y, 'm');
  }
  for (const [x, y] of [[12, 14], [30, 12], [26, 20], [16, 22], [34, 18]] as const) {
    plot(g, x, y, 'A');
    plot(g, x + 1, y, 'A');
  }
  return sprite(g);
})();

// --- The seed bed -----------------------------------------------------------------------------------

/** A glasshouse frame: thin pale ribs and glazing bars, the panes clear (the sky shows through). */
export const glassFrame = (width: number, height: number): RowSprite => {
  const g = grid(width, height);
  const cx = (width - 1) / 2;
  const roof = Math.round(height * 0.32);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inRoof = y < roof;
      const half = inRoof ? ((y + 1) / roof) * (width / 2) : width / 2;
      if (Math.abs(x - cx) > half) continue;
      const edge = Math.abs(x - cx) > half - 1.5;
      const bar = x % 22 === 0 || (!inRoof && y % 30 === roof % 30) || y === roof;
      if (edge || bar) plot(g, x, y, edge ? 'l' : 'i');
      else if ((x + y) % 23 === 0 && (x - y) % 9 === 0) plot(g, x, y, 'w'); // a glint on the glass
    }
  }
  return sprite(g);
};

/** A raised bed of seedlings, glowing amber where they're healthy (Act 1: healthy seeds glow amber). */
export const seedlingBed = (width: number, seed: number, sick = false): RowSprite => {
  const g = grid(width, 18);
  for (let x = 0; x < width; x++) {
    for (let y = 10; y < 18; y++) plot(g, x, y, y === 10 ? 'p' : x === 0 || x === width - 1 ? 'o' : y === 11 ? 'd' : 'n');
    if (x % 5 === 2 && x < width - 2) {
      const h = 3 + Math.floor(cellRandom(x, 0, seed) * 6);
      for (let y = 10 - h; y < 10; y++) plot(g, x, y, sick ? 'G' : 'g');
      plot(g, x - 1, 10 - h + 1, sick ? 'g' : 'e');
      plot(g, x + 1, 10 - h, sick ? 'g' : 'e');
      plot(g, x, 10 - h - 1, sick ? 'e' : 'a'); // the glow at its tip
    }
  }
  return sprite(g);
};

/** Your seed, in its own bed under a glass bell: sprouting amber and living, or the roots seed, green and sick. */
export const yourSeed = (healthy: boolean): RowSprite => {
  const g = grid(20, 24);
  for (let y = 2; y < 18; y++) for (let x = 2; x < 18; x++) {
    const d = Math.hypot((x - 9.5) / 8, (y - 17) / 15);
    if (d > 1) continue;
    if (d > 0.88) plot(g, x, y, 'l');
  }
  box(g, 0, 18, 20, 2, 'p');
  box(g, 0, 20, 20, 4, 'n');
  const leaf = healthy ? 'e' : 'G';
  const glow = healthy ? 'a' : 'e';
  for (let y = 9; y < 18; y++) plot(g, 10, y, healthy ? 'g' : 'G');
  stamp(g, healthy ? ['ee...', '.e...', '..e..'] : ['G....', 'gG...', '..g..'], 6, 10);
  stamp(g, healthy ? ['...ee', '...e.', '..e..'] : ['....G', '...Gg', '..g..'], 10, 12);
  plot(g, 10, 8, glow);
  plot(g, 9, 9, glow);
  plot(g, 11, 9, glow);
  plot(g, 10, 7, leaf);
  return sprite(g);
};

// --- The lookout ------------------------------------------------------------------------------------

/** A spyglass on a stand, pointing out over the leaves. */
export const SPYGLASS: RowSprite = {
  rows: [
    '..........ll', '........llil', '......lliil.', '....lliil...', '..iiil......', '.dii........', '..dd........', '...o........', '...o........', '...o........', '..ooo.......', '.o.o.o......', 'o..o..o.....',
  ],
  colours: C,
};

/** A flag on a pole, the canopy's: green and cream, a leaf on it. */
export const flag = (pole: number): RowSprite => {
  const g = grid(22, pole);
  for (let y = 0; y < pole; y++) plot(g, 0, y, y === 0 ? 'l' : 'i');
  for (let y = 2; y < 14; y++) for (let x = 1; x < 20 - Math.abs(y - 8) * 0.5; x++) plot(g, x, y + Math.round(Math.sin(x / 4) * 1), (x + y) % 9 === 0 ? 'w' : y < 8 ? 'g' : 'e');
  stamp(g, ['..l..', '.lll.', 'll.ll', '.lll.'], 7, 5);
  return sprite(g);
};

// --- The lowering platform --------------------------------------------------------------------------

/** The winch: a great drum of cable in a wooden frame, a crank wheel, gears. */
export const WINCH: RowSprite = (() => {
  const g = grid(70, 56);
  for (const x of [4, 62]) box(g, x, 6, 4, 50, 'o');
  box(g, 0, 4, 70, 4, 'n');
  box(g, 0, 4, 70, 1, 'p');
  // The drum, wound with cable.
  for (let y = 18; y < 42; y++) for (let x = 8; x < 62; x++) plot(g, x, y, y === 18 || y === 41 ? 'd' : (x + y) % 3 === 0 ? 'i' : y % 2 ? 'n' : 'i');
  for (let y = 16; y < 44; y++) {
    plot(g, 8, y, 'p');
    plot(g, 61, y, 'p');
  }
  // The crank wheel and a gear.
  for (let a = 0; a < 64; a++) {
    const t = (a / 64) * Math.PI * 2;
    plot(g, 66 + Math.cos(t) * 0, 30, 'l');
    plot(g, 35 + Math.cos(t) * 13, 30 + Math.sin(t) * 13, 'n');
  }
  for (let r = 0; r < 13; r++) for (const t of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) plot(g, 35 + Math.cos(t) * r, 30 + Math.sin(t) * r, 'n');
  box(g, 0, 50, 70, 6, 'n');
  box(g, 0, 50, 70, 1, 'p');
  return sprite(g);
})();

/** The cage that rides the cable down: bars, a floor, a gate. */
export const CAGE: RowSprite = (() => {
  const g = grid(30, 40);
  box(g, 0, 0, 30, 3, 'i');
  box(g, 0, 37, 30, 3, 'n');
  for (let x = 0; x < 30; x += 4) for (let y = 3; y < 37; y++) plot(g, x, y, 'i');
  for (let y = 3; y < 37; y += 11) for (let x = 0; x < 30; x++) plot(g, x, y, 'i');
  for (let y = -0; y < 3; y++) plot(g, 15, y, 'd');
  return sprite(g);
})();

/** A board of tallies: crates counted in notches, chalked. */
export const TALLY_BOARD: RowSprite = (() => {
  const g = grid(30, 34);
  box(g, 0, 0, 30, 22, 'o');
  box(g, 1, 1, 28, 20, 'd');
  for (let r = 0; r < 4; r++) for (let x = 3; x < 26; x += 2) if (cellRandom(x, r, 21) > 0.25) for (let y = 3 + r * 5; y < 6 + r * 5; y++) plot(g, x, y, (x - 3) % 10 === 8 ? 'l' : 'i');
  for (const x of [6, 23]) box(g, x, 22, 2, 12, 'o');
  return sprite(g);
})();

// --- The outside deck -------------------------------------------------------------------------------

/** The trunk's bark, a vast wall: deep furrows running up it, moss, a door cut in it where `door` says. */
export const barkWall = (width: number, height: number, seed: number, door?: { x: number; y: number }): RowSprite => {
  const g = grid(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (door && x >= door.x && x < door.x + 18 && y >= door.y && y < door.y + 30) {
        const arch = y < door.y + 9 && Math.hypot(x - door.x - 8.5, y - door.y - 9) > 9;
        if (arch) {
          plot(g, x, y, 'o');
          continue;
        }
        const edge = x === door.x || x === door.x + 17 || Math.hypot(x - door.x - 8.5, y - door.y - 9) > 7.8 && y < door.y + 9;
        plot(g, x, y, edge ? 'p' : x % 5 === 0 ? 'n' : 'o');
        continue;
      }
      const furrow = Math.abs(Math.sin(x / 7 + noise(y / 30 + seed) * 2.2));
      const moss = noise(x / 9 + y / 14 + seed) > 0.55;
      plot(g, x, y, moss ? (cellRandom(x, y, seed) > 0.5 ? 'g' : 'G') : furrow < 0.15 ? 'k' : furrow < 0.4 ? 'd' : furrow < 0.75 ? 'o' : 'n');
    }
  }
  if (door) for (let x = door.x - 2; x < door.x + 20; x++) plot(g, x, door.y + 30, 'p');
  return sprite(g);
};

/** The Tender's hut: the capital's make, metal panels riveted, a glowing window, an aerial with a light. */
export const RADIO_HUT: RowSprite = (() => {
  const g = grid(56, 62);
  // The aerial.
  for (let y = 0; y < 20; y++) plot(g, 40, y, 'i');
  for (const y of [4, 9, 14]) for (let x = 36; x <= 44; x++) plot(g, x, y, 'i');
  plot(g, 40, 0, 'c');
  // The roof and the walls: dark panels, rivets, pale seams.
  box(g, 0, 20, 56, 4, 'l');
  box(g, 2, 24, 52, 38, 'q');
  for (let x = 2; x < 54; x += 13) for (let y = 24; y < 62; y++) plot(g, x, y, 'i');
  for (let y = 24; y < 62; y += 4) for (let x = 4; x < 54; x += 13) plot(g, x, y, 'l');
  // A window glowing cyan, the radio's lights inside; the door ajar, light spilling out.
  box(g, 8, 32, 16, 10, 'i');
  box(g, 9, 33, 14, 8, 'c');
  box(g, 12, 37, 8, 4, 'm');
  plot(g, 14, 36, 'a');
  plot(g, 17, 36, 'w');
  box(g, 32, 34, 14, 28, 'i');
  box(g, 33, 35, 12, 27, 'd');
  box(g, 33, 35, 3, 27, 'm');
  return sprite(g);
})();

/** A rope ladder hanging down the bark. */
export const ropeLadder = (height: number): RowSprite => {
  const g = grid(9, height);
  for (let y = 0; y < height; y++) {
    const sway = Math.round(Math.sin(y / 20) * 1);
    plot(g, 1 + sway, y, 'p');
    plot(g, 7 + sway, y, 'p');
    if (y % 6 === 3) for (let x = 2; x < 7; x++) plot(g, x + sway, y, 'n');
  }
  return sprite(g);
};

// --- The homestead ----------------------------------------------------------------------------------

/** A house of scrap and timber on the ground: patched walls, a tin roof, a window, a door. */
export const SCRAP_HOUSE: RowSprite = (() => {
  const g = grid(96, 64);
  for (let y = 0; y < 20; y++) {
    const half = 30 + y * 1.6;
    for (let x = 0; x < 96; x++) if (Math.abs(x - 48) <= half) plot(g, x, y, (x % 6 === 0) ? 'n' : y === 19 ? 'd' : (x + y) % 5 === 0 ? 'i' : 'l');
  }
  for (let y = 20; y < 64; y++) {
    for (let x = 6; x < 90; x++) {
      const panel = Math.floor((x - 6) / 14) + Math.floor((y - 20) / 15) * 3;
      const kind = cellRandom(panel, 0, 31);
      plot(g, x, y, (x - 6) % 14 === 0 || (y - 20) % 15 === 0 ? 'd' : kind > 0.7 ? 'i' : kind > 0.4 ? 'n' : kind > 0.2 ? 'p' : 'q');
    }
  }
  box(g, 16, 30, 16, 12, 'n');
  box(g, 18, 32, 12, 8, 'a');
  box(g, 23, 32, 1, 8, 'n');
  box(g, 56, 34, 16, 30, 'o');
  box(g, 58, 36, 12, 28, 'd');
  plot(g, 68, 50, 'l');
  return sprite(g);
})();

/** A rough fence of stakes and wire. */
export const fence = (width: number, seed: number): RowSprite => {
  const g = grid(width, 20);
  for (let x = 0; x < width; x++) {
    if (x % 12 === 0) for (let y = Math.floor(cellRandom(x, 0, seed) * 4); y < 20; y++) plot(g, x, y, 'o');
    plot(g, x, 6 + Math.round(Math.sin(x / 12) * 1), 'i');
    plot(g, x, 13, 'i');
  }
  return sprite(g);
};

/** Rows of a garden: green rows on dark earth. */
export const gardenRows = (width: number, seed: number): RowSprite => {
  const g = grid(width, 14);
  for (let x = 0; x < width; x++) {
    for (let y = 10; y < 14; y++) plot(g, x, y, (x + y) % 4 === 0 ? 'd' : 'o');
    if (x % 3 !== 0) {
      const h = 3 + Math.floor(cellRandom(x, 0, seed) * 7);
      for (let y = 10 - h; y < 10; y++) plot(g, x, y, cellRandom(x, y, seed) > 0.5 ? 'g' : 'e');
    }
  }
  return sprite(g);
};

/** A well: a stone ring, a frame, a bucket. */
export const WELL: RowSprite = {
  rows: [
    'oooooooooooooooo', '.o............o.', '.o.....n......o.', '.o.....n......o.', '.o....MAM.....o.', '.o....MMM.....o.',
    'iiiiiiiiiiiiiiii', 'linlinlinlinlinl', 'nilnilnilnilnili', 'linlinlinlinlinl', 'iiiiiiiiiiiiiiii',
  ],
  colours: C,
};

/** A store shed, its door open: the canopy's crates stacked inside (the quartermaster's hoard). */
export const STORE_SHED: RowSprite = (() => {
  const g = grid(54, 46);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 54; x++) if (x >= 10 - y && x < 44 + y) plot(g, x, y, y === 9 ? 'd' : x % 5 === 0 ? 'n' : 'i');
  box(g, 2, 10, 50, 36, 'n');
  for (let x = 2; x < 52; x += 6) box(g, x, 10, 1, 36, 'o');
  box(g, 14, 18, 28, 28, 'd');
  // Crates inside: the canopy's, stencilled.
  for (const [x, y] of [[16, 34], [28, 34], [22, 24]] as const) {
    box(g, x, y, 12, 10, 'p');
    box(g, x, y, 12, 1, 'l');
    box(g, x + 2, y + 4, 8, 1, 'i');
  }
  return sprite(g);
})();

/** Offerings hung on a wall on pegs: carved masks, birds, combs, little figures, a glass thing (never red). */
export const wallOfferings = (width: number, seed: number): RowSprite => {
  const g = grid(width, 26);
  for (let x = 0; x < width; x++) plot(g, x, 1, 'o');
  const shapes = [
    ['.lll.', 'l.l.l', 'lllll', '.lpl.', '..l..'],
    ['..pp.', '.pppp', 'pppp.', '.p...'],
    ['ppppp', 'p.p.p', 'p.p.p'],
    ['.a.', 'aMa', 'MaM', '.M.'],
    ['.c.', 'mcm', 'mcm', '.m.'],
    ['.p.', 'ppp', '.p.', 'p.p'],
    ['lllll', 'l...l', 'l.i.l', 'l...l', 'lllll'],
  ];
  for (let x = 3, i = 0; x < width - 6; i++) {
    const sh = shapes[Math.floor(cellRandom(i, 0, seed) * shapes.length)]!;
    const y = 4 + Math.floor(cellRandom(i, 1, seed) * 12);
    for (let yy = 2; yy < y; yy++) plot(g, x + 2, yy, 'n'); // its string
    stamp(g, sh, x, y);
    x += sh[0]!.length + 3 + Math.floor(cellRandom(i, 2, seed) * 4);
  }
  return sprite(g);
};

/** Sacks of grain, slumped. */
export const SACKS: RowSprite = { rows: ['..ll....ll..', '.lppl..lppl.', 'lppppllppppl', 'lpppplppppnl', 'lppnpppppnnl', '.nnnnnnnnnn.'], colours: C };

/** A barrel. */
export const BARREL: RowSprite = { rows: ['.nnnnnn.', 'nppppppn', 'iiiiiiii', 'nppppppn', 'npppppnn', 'iiiiiiii', 'nppppppn', 'npppppnn', 'iiiiiiii', 'nppppppn', 'nppppnnn', 'iiiiiiii', 'nppppppn', '.nnnnnn.'], colours: C };

// --- The ascended's hall ----------------------------------------------------------------------------

/** A tiny spiral: every master's mark, cut into their last piece (Act 1). */
const SPIRAL = ['lll', 'l.l', 'll.'];

/** Niches of masters' last pieces, each with the spiral: the ones they carried up the tube. */
export const lastPieces = (width: number, height: number, seed: number): RowSprite => {
  const g = grid(width, height);
  box(g, 0, 0, width, height, 'o');
  for (let ny = 4; ny + 26 <= height; ny += 30) {
    for (let nx = 4, i = 0; nx + 20 <= width; nx += 24, i++) {
      // The niche: dark, arched, a lit sill.
      for (let y = ny; y < ny + 24; y++) for (let x = nx; x < nx + 20; x++) {
        const arch = y < ny + 10 && Math.hypot(x - nx - 9.5, y - ny - 10) > 10;
        if (!arch) plot(g, x, y, y === ny + 23 ? 'l' : 'd');
      }
      // The piece: a bird, a figure, a bowl, a tall vessel, a mask (bare wood, pale), and its spiral.
      const pieces = [
        ['...pp...', '..pppp..', '.pppppp.', 'pppnpp..', '..pp....'],
        ['..pp..', '.pppp.', '..pp..', '.pppp.', '.p..p.', '.p..p.'],
        ['pppppppp', '.pppppp.', '..pppp..'],
        ['..pp..', '.pnnp.', '.pnnp.', 'pnnnnp', 'pnnnnp', '.pppp.'],
        ['.pppppp.', 'pp.pp.pp', 'pppppppp', '.pp..pp.', '..pppp..'],
      ];
      const pc = pieces[Math.floor(cellRandom(i, ny, seed) * pieces.length)]!;
      stamp(g, pc, nx + 10 - Math.floor(pc[0]!.length / 2), ny + 23 - pc.length);
      stamp(g, SPIRAL, nx + 16, ny + 12);
    }
  }
  return sprite(g);
};

/** A curtained alcove: somebody's room off the hall. */
export const alcove = (seed: number): RowSprite => {
  const g = grid(30, 44);
  for (let y = 0; y < 44; y++) for (let x = 0; x < 30; x++) {
    const arch = y < 14 && Math.hypot(x - 14.5, y - 14) > 14.5;
    if (arch) continue;
    const frame = x < 2 || x > 27 || (y < 16 && Math.hypot(x - 14.5, y - 14) > 12.5);
    const open = cellRandom(seed, 0, 9) > 0.5 && x > 16; // the curtain drawn back on one side
    plot(g, x, y, frame ? 'p' : open ? (y > 34 ? 'n' : 'd') : (x + Math.floor(y / 4)) % 4 === 0 ? 'G' : 'g');
  }
  return sprite(g);
};

/** A column of living wood: a trunk growing straight up through the floor to the roof, a little twisted. */
export const livingColumn = (height: number, seed: number): RowSprite => {
  const g = grid(14, height);
  for (let y = 0; y < height; y++) {
    const sway = Math.sin(y / 30 + seed) * 1.5;
    const flare = y > height - 10 ? (y - (height - 10)) * 0.5 : y < 8 ? (8 - y) * 0.4 : 0;
    const half = 4 + flare;
    for (let x = Math.round(7 + sway - half); x <= 7 + sway + half; x++) {
      const lx = x - (7 + sway - half);
      plot(g, x, y, lx < 1.5 ? 'l' : lx > half * 2 - 1.5 ? 'd' : noise(y / 6 + lx + seed) > 0.3 ? 'n' : 'p');
    }
  }
  return sprite(g);
};

/** A door cut into the bark: arched, planks, a ring handle, a step. */
export const barkDoor: RowSprite = (() => {
  const g = grid(18, 31);
  for (let y = 0; y < 30; y++) for (let x = 0; x < 18; x++) {
    if (y < 9 && Math.hypot(x - 8.5, y - 9) > 9) continue;
    const edge = x === 0 || x === 17 || (y < 9 && Math.hypot(x - 8.5, y - 9) > 7.8);
    plot(g, x, y, edge ? 'p' : x % 4 === 0 ? 'o' : 'n');
  }
  plot(g, 13, 17, 'l');
  for (let x = -1; x < 19; x++) plot(g, x, 30, 'p');
  return sprite(g);
})();
