import { SHADES as S } from '../../ui/pixelArt';
import type { RowSprite } from '../../ui/sprites';

// PLACEHOLDER pixel props for the upper halls: wealth and warmth high in the branches. The Canopy's
// white light falls through skylights; the most tech in the tree (a gear-driven fountain, light
// cells in the sconces); a laden table; and writing, which belongs to high society.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

/** A skylight in the ceiling, bright with the Canopy's white glare. */
export const skylight = (width: number): RowSprite => ({
  rows: fill(width, 7, (x, y) => {
    if (y === 6) return x % 2 === 0 ? 'f' : '.';
    if (x === 0 || x === width - 1 || x % 10 === 5) return 'f';
    return y < 3 ? 'W' : 'w';
  }),
  colours: { f: S.woodLight, W: S.white, w: S.light },
});

/** A long feasting table, laden: a roast, bowls of fruit, jugs and candles. `width` px. */
export const feastTable = (width: number): RowSprite => ({
  rows: fill(width, 18, (x, y) => {
    // Food along the top, in the bottom rows of the "food band" (y 0–5).
    if (y <= 5) {
      const slot = x % 22;
      if (slot >= 2 && slot <= 8 && y >= 2) return y === 2 ? (slot === 2 || slot === 8 ? '.' : 'A') : 'a'; // roast
      if (slot >= 11 && slot <= 15 && y >= 3) return y === 3 ? (slot % 2 ? 'G' : 'A') : 'l'; // fruit bowl
      if (slot === 18 && y >= 1) return y === 1 ? 'A' : 'L'; // candle
      if (slot === 19 && y >= 2) return 'c'; // jug
      return '.';
    }
    if (y === 6) return 'h'; // cloth top
    if (y <= 9) return (x + y) % 6 === 0 ? 'C' : 'w'; // tablecloth hanging down
    if (y === 10) return x % 2 === 0 ? 'w' : '.'; // fringe
    return x === 4 || x === 5 || x === width - 5 || x === width - 6 ? 'p' : '.'; // legs
  }),
  colours: { A: S.amber, a: S.amberDeep, G: S.greenMid, l: S.light, L: S.light, c: S.cyanMid, h: S.white, w: S.light, C: S.woodPale, p: S.woodLight },
});

/** A fountain driven by a scavenged gear mechanism: water falls into a carved basin, lit cyan. */
export const GEAR_FOUNTAIN: RowSprite = {
  rows: fill(40, 40, (x, y) => {
    const cx = 19.5;
    // The gear at the top.
    const r = Math.hypot(x - cx, y - 8);
    if (r <= 8) {
      if (r > 6.5) return Math.round(Math.atan2(y - 8, x - cx) * 3) % 2 === 0 ? 'm' : '.';
      if (r > 5.5) return 'm';
      if (r < 1.5) return 'w';
      return 'k';
    }
    // The column holding it up, with a spout.
    if (y > 16 && y < 30 && Math.abs(x - cx) < 2) return x > cx ? 'l' : 'p';
    // The basin.
    if (y >= 30) {
      const half = 19 - (y - 30);
      if (Math.abs(x - cx) > half) return '.';
      if (y === 30) return 'h';
      if (y <= 32 && Math.abs(x - cx) < half - 1) return 'c'; // water
      return (x + y) % 5 === 0 ? 'd' : 'p';
    }
    return '.';
  }),
  colours: { m: S.dim, k: S.deep, w: S.cyan, p: S.woodPale, l: S.light, h: S.light, c: S.cyanMid, d: S.woodLight },
};

/** A bookcase: rows of books (writing: only high society can read). `width`×`height` px. */
export const bookcase = (width: number, height: number): RowSprite => {
  const spines = ['a', 'c', 'g', 'w', 'b', 'A'];
  return {
    rows: fill(width, height, (x, y) => {
      if (x < 2 || x >= width - 2 || y < 2) return x === width - 1 ? 'l' : 'f';
      const shelf = (y - 2) % 14;
      if (shelf === 13 || shelf === 12) return shelf === 12 ? 'h' : 'f';
      const book = Math.floor((x - 2) / 3);
      const tall = 7 + ((book * 7 + Math.floor(y / 14)) % 5);
      if (shelf < 12 - tall) return 'k';
      if ((x - 2) % 3 === 2) return 'k';
      return shelf === 12 - tall + 2 ? 'L' : spines[(book * 5 + Math.floor(y / 14) * 3) % spines.length]!;
    }),
    colours: { f: S.woodLight, l: S.woodPale, h: S.woodPale, k: S.shadow, L: S.light, a: S.amberDeep, A: S.amber, c: S.cyanDeep, g: S.greenDeep, w: S.woodPale, b: S.dim },
  };
};

/** A plaque with writing on it: neat rows of marks. The first writing you've seen up close. */
export const PLAQUE: RowSprite = {
  rows: fill(22, 14, (x, y) => {
    if (y === 0 || y === 13 || x === 0 || x === 21) return 'f';
    if (y % 3 === 2 && x >= 3 && x <= 18 && (x * 7 + y * 3) % 5 !== 0 && !(y === 11 && x > 12)) return 'w';
    return 'b';
  }),
  colours: { f: S.amber, b: S.amberDeep, w: S.light },
};

/** A reading desk with an open book and a lamp. */
export const READING_DESK: RowSprite = {
  rows: fill(30, 20, (x, y) => {
    if (y <= 5) {
      if (x >= 22 && x <= 26) return y === 0 ? 'A' : y <= 2 ? (x === 24 ? 'W' : 'A') : x === 24 ? 'm' : '.'; // lamp
      if (x >= 4 && x <= 16 && y >= 4) return x === 10 ? 'd' : y === 4 ? 'W' : x % 2 ? 'L' : 'W'; // open book
      return '.';
    }
    if (y === 6) return 'h';
    if (y <= 8) return 'p';
    if (y === 9) return 'd';
    return x <= 2 || x >= 27 ? 'l' : '.';
  }),
  colours: { A: S.amber, W: S.white, m: S.dim, L: S.light, d: S.deep, h: S.woodPale, p: S.woodLight, l: S.woodLight },
};

/** A cushioned seat. */
export const CUSHION_SEAT: RowSprite = {
  rows: fill(24, 14, (x, y) => {
    if (y < 6) return x < 2 || x > 21 ? (y === 0 ? 'h' : 'p') : y > 2 ? 'c' : '.';
    if (y < 9) return (x + y) % 5 === 0 ? 'C' : 'c';
    if (y === 9) return 'd';
    return x <= 2 || x >= 21 ? 'p' : '.';
  }),
  colours: { h: S.woodPale, p: S.woodLight, c: S.amberDeep, C: S.amber, d: S.deep },
};

/** A light cell in a brass sconce: up here even the lamps are blessings. */
export const CELL_SCONCE: RowSprite = {
  rows: ['.ccc.', 'cwWwc', 'cWWWc', '.ccc.', '..m..', 'mmmmm'],
  colours: { c: S.cyanMid, w: S.cyan, W: S.white, m: S.amberDeep },
};

/** A woven tapestry: the tube rising to the Canopy, with figures going up it. */
export const TAPESTRY: RowSprite = {
  rows: fill(36, 50, (x, y) => {
    if (y === 0) return 'p';
    if (y > 46 && (x + y) % 2 === 0) return '.';
    if (x === 0 || x === 35) return 'e';
    if (y < 12 && Math.hypot(x - 17.5, y - 5) < 7) return y < 4 ? 'W' : 'w'; // the Canopy
    if (Math.abs(x - 17.5) < 2) return 'c'; // the tube
    if ((x === 14 || x === 21) && y % 9 === 3 && y > 12) return 'd'; // figures rising
    return (x + y) % 8 === 0 ? 'e' : 'a';
  }),
  colours: { p: S.woodPale, e: S.amberDeep, a: S.amber, W: S.white, w: S.light, c: S.cyanMid, d: S.shadow },
};

// --- Masterwork carving: height is skill, and up here it's spectacular. Bare, polished wood. ---

const CARVED = { W: S.white, L: S.light, p: S.woodPale, l: S.woodLight, w: S.wood, d: S.deep, o: S.shadow };

/**
 * The centrepiece: a flock of birds spiralling up around a twisting trunk to one with its wings
 * spread at the top, on a carved plinth. Birds in front are lit; those behind are in shadow.
 */
export const MASTERWORK: RowSprite = (() => {
  const w = 72;
  const h = 128;
  const g = Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
  const put = (x: number, y: number, c: string) => {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px >= 0 && px < w && py >= 0 && py < h) g[py]![px] = c;
  };
  const cx = 35.5;
  const PLINTH = 114;
  // Plinth: moulded top, a carved band of little arches, panelled body, base.
  for (let y = PLINTH; y < h; y++) {
    const row = y - PLINTH;
    const inset = row === 0 ? 6 : row === 1 ? 5 : y === h - 1 ? 2 : y === h - 2 ? 3 : 8;
    for (let x = inset; x < w - inset; x++) {
      let c = x === inset ? 'd' : x === w - inset - 1 ? 'p' : 'l';
      if (row === 0) c = 'L';
      else if (row === 1) c = 'p';
      else if (row === 2) c = 'd';
      else if (row >= 4 && row <= 6) c = (x - inset) % 6 === 0 || (row === 4 && (x - inset) % 6 !== 3) ? 'd' : 'p'; // arches
      else if (y >= h - 2) c = y === h - 1 ? 'd' : 'L';
      put(x, y, c);
    }
  }
  // A bird in flight, gull-shaped: wings lift from the body then droop at the tips. Lit edge on top.
  const wingY = (dx: number, size: number) => {
    const d = Math.abs(dx);
    const knee = size * 0.55;
    return d <= knee ? -d * 0.7 : -knee * 0.7 + (d - knee) * 0.6;
  };
  const drawBird = (bx: number, by: number, size: number, lit: boolean) => {
    for (let dx = -size; dx <= size; dx++) {
      const y = by + wingY(dx, size);
      put(bx + dx, y, lit ? (dx >= 0 ? 'W' : 'L') : 'l');
      if (Math.abs(dx) < size - 1) put(bx + dx, y + 1, lit ? 'p' : 'w'); // wing thickness
      if (Math.abs(dx) < 2) put(bx + dx, y + 2, lit ? 'l' : 'd');
    }
    put(bx, by + 2, lit ? 'l' : 'd'); // body
    put(bx, by + 3, lit ? 'w' : 'd'); // tail
  };
  const birds = Array.from({ length: 12 }, (_, k) => {
    const angle = k * 1.05 + 0.4;
    const radius = 25 - k * 1.2; // the spiral tightens as it rises
    return { x: cx + Math.sin(angle) * radius, y: 104 - k * 7.2, front: Math.cos(angle) > -0.2, size: k < 4 ? 8 : k < 8 ? 7 : 6 };
  });
  for (const bird of birds.filter((b) => !b.front)) drawBird(bird.x, bird.y, bird.size, false);
  // The trunk: two strands braided round each other, narrowing as they rise, lit from the right.
  for (let y = 22; y < PLINTH; y++) {
    const half = 2 + (y - 22) / 30;
    const sway = 3 + (y - 22) / 40;
    const phase = y / 9;
    const strands = [0, Math.PI].map((p) => ({ x: cx + Math.sin(phase + p) * sway, front: Math.cos(phase + p) > 0 }));
    strands.sort((s1, s2) => Number(s1.front) - Number(s2.front)); // back strand first
    for (const st of strands) {
      for (let x = Math.round(st.x - half); x <= Math.round(st.x + half); x++) {
        const u = (x - st.x) / half;
        const edge = Math.abs(u) > 0.85;
        put(x, y, edge ? (u > 0 ? 'p' : 'd') : !st.front ? (u > 0.3 ? 'l' : 'w') : u > 0.35 ? 'L' : u > -0.2 ? 'p' : 'l');
      }
    }
  }
  // Roots spreading over the top of the plinth.
  for (const side of [-1, 1]) for (let i = 0; i < 11; i++) put(cx + side * (6 + i), PLINTH - 1 - (i < 3 ? 1 : 0), i % 3 === 0 ? 'd' : side > 0 ? 'L' : 'l');
  for (const bird of birds.filter((b) => b.front)) drawBird(bird.x, bird.y, bird.size, true);
  // The great bird at the top, wings spread wide, feathers fanned at the tips.
  const top = 16;
  for (let dx = -18; dx <= 18; dx++) {
    const y = top + wingY(dx, 18);
    put(cx + dx, y, dx >= 0 ? 'W' : 'L');
    const thick = Math.abs(dx) < 12 ? 2 : 1;
    for (let t = 1; t <= thick; t++) put(cx + dx, y + t, t === 1 ? 'p' : 'l');
    if (Math.abs(dx) > 10 && Math.abs(dx) % 2 === 0) put(cx + dx, y + thick + 1, 'w'); // fanned feathers
  }
  for (let y = top - 2; y <= top + 5; y++) put(cx, y, y < top ? 'W' : 'p'); // body and head
  put(cx + 1, top - 2, 'L'); // beak
  for (const dx of [-1, 0, 1]) put(cx + dx, top + 6, 'l'); // tail
  return { rows: g.map((r) => r.join('')), colours: CARVED };
})();

/** A carved frieze: a vine running in waves, with leaves and little birds among them. `width` px. */
export const carvedFrieze = (width: number): RowSprite => ({
  rows: fill(width, 12, (x, y) => {
    if (y === 0 || y === 11) return y === 0 ? 'L' : 'd';
    if (y === 1 || y === 10) return 'w';
    const vine = Math.round(5.5 + Math.sin(x / 5) * 2.5);
    if (y === vine) return 'p';
    if (y === vine + 1) return 'd';
    // Leaves off the vine every few px, alternating above and below.
    const lx = x % 10;
    const up = Math.floor(x / 10) % 2 === 0;
    if (lx >= 2 && lx <= 4 && ((up && y === vine - (lx - 1)) || (!up && y === vine + lx))) return lx === 3 ? 'L' : 'l';
    // A little bird every 40px.
    const bx = x % 40;
    if (bx >= 17 && bx <= 23 && y === 3 + Math.abs(bx - 20) - 1) return bx > 20 ? 'W' : 'L';
    return 'w';
  }),
  colours: CARVED,
});

/** An ornate carved column: a vine spiralling up it, leaves, a carved capital and base. */
export const ornateColumn = (height: number): RowSprite => ({
  rows: fill(16, height, (x, y) => {
    if (y < 6 || y >= height - 5) {
      // Capital and base: stepped mouldings.
      const band = y < 6 ? y : height - 1 - y;
      const inset = [0, 1, 0, 2, 1, 2][band]!;
      if (x < inset || x >= 16 - inset) return '.';
      return band % 2 === 0 ? 'L' : x > 10 ? 'p' : 'l';
    }
    if (x < 3 || x > 12) return '.';
    const u = (x - 7.5) / 4.5;
    // The spiralling vine and its leaves.
    const turn = (y * 0.5 + x * 1.2) % 9;
    if (turn < 1.2) return u > 0 ? 'W' : 'L';
    if (turn < 2) return 'd';
    if (turn > 5 && turn < 5.8 && (x === 4 || x === 11)) return 'p';
    return u > 0.4 ? 'p' : u > -0.3 ? 'l' : 'w';
  }),
  colours: CARVED,
});
