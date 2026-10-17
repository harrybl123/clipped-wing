import { SHADES as S, cellRandom, noise } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// Props for the canopy (Chapter 4; docs/chapter-4-world.md): solarpunk treehouses in the leaves. Living
// wood and green, clean bright tech among the leaves (solar sails cut like leaves, small turbines, glass
// lanterns, water funnels, cable baskets), patched with what the tree sends up (carved birds along the
// rails). Never red: red is the carver's alone (your birds, on Grounded's shelves).

/** The canopy's colours, by character. */
export const C: Record<string, number> = {
  k: S.shadow,
  d: S.deep,
  o: S.wood,
  n: S.woodLight,
  p: S.woodPale,
  i: S.dim,
  l: S.light,
  w: S.white,
  q: S.cyanDeep,
  m: S.cyanMid,
  c: S.cyan,
  G: S.greenDeep,
  g: S.greenMid,
  e: S.green,
  A: S.amberDeep,
  M: S.amberMid,
  a: S.amber,
};

type Grid = string[][];
const grid = (w: number, h: number): Grid => Array.from({ length: h }, () => Array<string>(w).fill('.'));
const plot = (g: Grid, x: number, y: number, c: string) => {
  const row = g[Math.round(y)];
  if (row && Math.round(x) >= 0 && Math.round(x) < row.length) row[Math.round(x)] = c;
};
const sprite = (g: Grid): RowSprite => ({ rows: g.map((r) => r.join('')), colours: C });

type Pt = readonly [number, number];

/** A smooth curve through points (Catmull-Rom), as `n` samples. */
export function smooth(points: readonly Pt[], n = 60): Pt[] {
  const out: Pt[] = [];
  const P = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))]!;
  const segs = points.length - 1;
  for (let k = 0; k <= n; k++) {
    const u = (k / n) * segs;
    const i = Math.min(segs - 1, Math.floor(u));
    const t = u - i;
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------
// The tentacles: the tubes out of the top of the tree, like an octopus's (doc). Glass, the tube's light
// inside them, ringed with dark collars; out of a great collar where the trunk ends. One curls over and
// down into a basin: the mouth offerings and the ascended come out of.
// ---------------------------------------------------------------------------------------------------

export const TENTACLES_W = 560;
export const TENTACLES_H = 252;
const HUB_X = 280;
const HUB_Y = TENTACLES_H - 1;

/**
 * Each tentacle's line, from the collar out to its end, in the sprite's own pixels; drawn back to front
 * (designer: bigger, and more of them). `mouth`: it ends in an open mouth, hanging down (the one you come out
 * of). `back`: further back, dimmer.
 */
const TENTACLE_LINES: readonly { points: readonly Pt[]; base: number; tip: number; mouth?: boolean; back?: boolean }[] = [
  // Far back: two out to the sides, low, and two straight up.
  { points: [[HUB_X - 20, HUB_Y], [HUB_X - 60, 200], [HUB_X - 130, 150], [HUB_X - 200, 108], [HUB_X - 250, 60], [HUB_X - 272, 6]], base: 17, tip: 9, back: true },
  { points: [[HUB_X + 20, HUB_Y], [HUB_X + 64, 202], [HUB_X + 136, 156], [HUB_X + 204, 112], [HUB_X + 250, 64], [HUB_X + 270, 8]], base: 17, tip: 9, back: true },
  { points: [[HUB_X - 14, HUB_Y], [HUB_X - 30, 180], [HUB_X - 64, 110], [HUB_X - 86, 40], [HUB_X - 76, -12]], base: 19, tip: 12, back: true },
  { points: [[HUB_X + 14, HUB_Y], [HUB_X + 32, 176], [HUB_X + 60, 104], [HUB_X + 70, 34], [HUB_X + 58, -12]], base: 19, tip: 12, back: true },
  // In front: up the middle, the great one; one up and over to the right; one curling up on the left.
  { points: [[HUB_X, HUB_Y], [HUB_X + 4, 170], [HUB_X - 10, 90], [HUB_X + 4, 20], [HUB_X - 4, -14]], base: 24, tip: 16 },
  { points: [[HUB_X + 10, HUB_Y], [HUB_X + 26, 190], [HUB_X + 76, 128], [HUB_X + 140, 92], [HUB_X + 186, 52], [HUB_X + 204, 4]], base: 21, tip: 11 },
  { points: [[HUB_X - 14, HUB_Y], [HUB_X - 52, 214], [HUB_X - 116, 186], [HUB_X - 172, 172], [HUB_X - 210, 150], [HUB_X - 222, 118]], base: 20, tip: 10 },
  // The mouth: up and over, down into the basin on the right.
  { points: [[HUB_X + 16, HUB_Y], [HUB_X + 40, 200], [HUB_X + 90, 150], [HUB_X + 150, 132], [HUB_X + 200, 142], [HUB_X + 224, 172], [HUB_X + 228, 194]], base: 22, tip: 16, mouth: true },
];

/** The tentacles' lines in the sprite's pixels, smoothed (for light running up them: `pulse`). */
export const TENTACLE_PATHS: readonly Pt[][] = TENTACLE_LINES.map((t) => smooth(t.points, 24));

export const TENTACLES: RowSprite = (() => {
  const g = grid(TENTACLES_W, TENTACLES_H);
  for (const [k, t] of TENTACLE_LINES.entries()) {
    const line = smooth(t.points, 90);
    const lens: number[] = [0];
    for (let i = 1; i < line.length; i++) lens.push(lens[i - 1]! + Math.hypot(line[i]![0] - line[i - 1]![0], line[i]![1] - line[i - 1]![1]));
    const total = lens[lens.length - 1]!;
    const minX = Math.max(0, Math.floor(Math.min(...line.map((p) => p[0])) - 14));
    const maxX = Math.min(TENTACLES_W - 1, Math.ceil(Math.max(...line.map((p) => p[0])) + 14));
    const minY = Math.max(0, Math.floor(Math.min(...line.map((p) => p[1])) - 14));
    const maxY = Math.min(TENTACLES_H - 1, Math.ceil(Math.max(...line.map((p) => p[1])) + 14));
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // The nearest point on the line: how far along, and which side.
        let best = Infinity;
        let along = 0;
        let side = 0;
        for (let i = 1; i < line.length; i++) {
          const [ax, ay] = line[i - 1]!;
          const [bx, by] = line[i]!;
          const vx = bx - ax;
          const vy = by - ay;
          const l2 = vx * vx + vy * vy || 1;
          const u = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2));
          const px = ax + vx * u;
          const py = ay + vy * u;
          const d = Math.hypot(x - px, y - py);
          if (d < best) {
            best = d;
            along = (lens[i - 1]! + Math.sqrt(l2) * u) / total;
            side = Math.sign(vx * (y - ay) - vy * (x - ax));
          }
        }
        const w = t.base + (t.tip - t.base) * along;
        if (best > w) continue;
        const f = (best / w) * side; // -1 … 1 across the tube
        const dist = along * total;
        let c: string;
        if (best > w - 1) c = 'd'; // its outline
        else if (dist % 46 < 3 && along < 0.97) c = dist % 46 < 1 ? 'l' : 'i'; // a collar of pale metal round it
        else if (f < -0.5 && f > -0.78) c = 'w'; // the glass catching the sky
        else if (f > 0.5 && f < 0.62) c = 'c'; // light through the far side
        else if (Math.abs(f) < 0.22) c = (dist + k * 7) % 11 < 2 ? 'w' : 'c'; // the light inside
        else c = Math.abs(f) > 0.7 ? 'q' : 'm';
        if (t.back && c !== 'd' && c !== 'w') c = c === 'c' ? 'm' : c === 'm' ? 'q' : c; // further back: dimmer
        // A vine wound round some of them.
        if (!t.mouth && Math.abs(Math.sin(dist / 9 + f * 2.2 + k)) < 0.12 && along > 0.1 && along < 0.75 && best < w - 1) c = (x + y) % 3 ? 'g' : 'e';
        plot(g, x, y, c);
      }
    }
    if (t.mouth) {
      // The open mouth at its end: a flared rim of pale metal, dark inside, glowing.
      const [ex, ey] = line[line.length - 1]!;
      for (let dx = -t.tip - 3; dx <= t.tip + 3; dx++) {
        plot(g, ex + dx, ey, Math.abs(dx) > t.tip + 1 ? 'i' : 'l');
        plot(g, ex + dx, ey + 1, Math.abs(dx) > t.tip + 1 ? 'd' : Math.abs(dx) < t.tip - 1 ? 'c' : 'i');
        if (Math.abs(dx) < t.tip) plot(g, ex + dx, ey - 1, Math.abs(dx) < t.tip - 2 ? 'k' : 'q');
      }
    }
  }
  // The great collar where they come out of the tree: a ring of pale metal on top of the trunk's end, the
  // living wood swelling out under it into roots that spread over the deck, moss in its hollows.
  const CH = 44;
  for (let y = HUB_Y - CH; y <= HUB_Y; y++) {
    const top = y - (HUB_Y - CH);
    const t = top / CH;
    const half = 60 + 50 * t ** 1.8;
    for (let dx = -Math.round(half); dx <= half; dx++) {
      const x = HUB_X + dx;
      const ax = Math.abs(dx);
      let c: string;
      if (top < 10) {
        // The ring: pale metal, a riveted band, a dark lip.
        if (ax > half - 2) c = 'd';
        else c = top === 0 ? 'l' : top === 1 ? 'w' : top === 9 ? 'd' : top === 5 ? (dx % 8 === 0 ? 'w' : 'i') : top < 5 ? 'l' : 'i';
      } else {
        // Roots: ridges of wood fanning out from under the ring, dark between them.
        const fan = dx / (half * 0.98);
        const ridge = Math.abs(Math.sin(fan * 9 + noise(top / 6) * 0.6));
        c = ax > half - 1.5 ? 'd' : ridge < 0.18 ? 'o' : ridge < 0.45 ? 'n' : (top + dx) % 9 === 0 ? 'l' : 'p';
        if (top > 18 && noise(dx / 6 + top / 5 + 11) > 0.45) c = (x + y) % 3 ? 'g' : 'G'; // moss in its hollows
        if (top > 30 && ridge < 0.3 && cellRandom(x, y, 9) > 0.7) c = 'e';
      }
      plot(g, x, y, c);
    }
  }
  return sprite(g);
})();

// ---------------------------------------------------------------------------------------------------
// The basin under the mouth, padded with old cloth, where offerings land (and where you land).
// ---------------------------------------------------------------------------------------------------

export const BASIN: RowSprite = (() => {
  const w = 74;
  const top = 4; // room above the rim for what's heaped in it
  const h = top + 18;
  const g = grid(w, h);
  for (let y = top; y < h; y++) {
    const r0 = y - top;
    const inset = r0 < 4 ? 0 : Math.round(((r0 - 4) / 14) ** 2 * 10);
    for (let x = inset; x < w - inset; x++) {
      let c = r0 === 0 ? 'p' : r0 === 1 ? 'n' : x === inset || x === w - inset - 1 ? 'd' : (x + Math.floor(r0 / 3)) % 9 === 0 ? 'o' : 'n';
      if (r0 >= 1 && r0 <= 4 && x > 4 && x < w - 5) {
        // Cushions and old cloth heaped in it.
        const r = cellRandom(Math.floor(x / 7), 0, 401);
        c = r0 === 1 ? (r > 0.5 ? 'l' : 'i') : r > 0.66 ? 'M' : r > 0.33 ? 'i' : 'l';
      }
      plot(g, x, y, c);
    }
  }
  // Today's offerings on the cloth: a comb, a bowl, a cup, a box, a glass thing, a little figure.
  const things: [number, string[]][] = [
    [10, ['.pp.', 'pnnp']],
    [20, ['aMMa', '.MM.']],
    [33, ['.l.', 'lil', '.l.']],
    [44, ['pppp', 'nnnn', 'pnnp']],
    [55, ['.c.', 'mcm']],
    [62, ['p.p', 'ppp']],
  ];
  for (const [x0, rows] of things) rows.forEach((row, dy) => [...row].forEach((c, dx) => c !== '.' && plot(g, x0 + dx, top + 1 - rows.length + dy, c)));
  return sprite(g);
})();

// ---------------------------------------------------------------------------------------------------
// Smaller things.
// ---------------------------------------------------------------------------------------------------

/** A woven basket hanging from the cable, offerings in it (rides along it: `pulse`). */
export const CABLE_BASKET: RowSprite = {
  rows: ['....i....', '...i.i...', '..i...i..', '.p.c.pp..', 'MAMAMAMAM', 'AMAMAMAMA', 'MAMAMAMAM', '.AMAMAMA.'],
  colours: C,
};

/** A post with a pulley on top, where the cable starts. */
export const cablePost = (height: number): RowSprite => {
  const g = grid(9, height);
  for (let y = 0; y < height; y++) {
    if (y < 7) {
      for (let x = 0; x < 9; x++) if (Math.hypot(x - 4, y - 3) < 3.6) plot(g, x, y, Math.hypot(x - 4, y - 3) < 1.2 ? 'd' : Math.hypot(x - 4, y - 3) < 2.6 ? 'l' : 'i');
    } else {
      plot(g, 3, y, 'n');
      plot(g, 4, y, 'p');
      plot(g, 5, y, 'o');
    }
  }
  return sprite(g);
};

/** A solar sail cut like a leaf, on a stalk: pale, catching the light, veined in blue. */
export const solarSail = (stalk: number, seed: number, lean = 0): RowSprite => {
  const w = 22;
  const lh = 28;
  const g = grid(w, lh + stalk);
  for (let y = 0; y < lh; y++) {
    const t = y / (lh - 1);
    const half = Math.sin(t * Math.PI) ** 0.8 * 9;
    const cx = 11 + lean * (1 - t) * 4;
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
      const edge = Math.abs(x - cx) > half - 1;
      const vein = Math.abs(x - cx) < 0.6 || Math.abs((x - cx) - (y % 6) * 0.9 * Math.sign(x - cx)) < 0.5;
      plot(g, x, y, edge ? 'm' : vein ? 'm' : (x + y + seed) % 7 === 0 ? 'w' : x < cx ? 'w' : 'l');
    }
  }
  for (let y = lh; y < lh + stalk; y++) {
    plot(g, 11, y, 'o');
    plot(g, 12, y, 'n');
  }
  return sprite(g);
};

/** A small wind turbine on a pole: three blades, turned to `phase` (0–2) of a third of a turn. */
const turbine = (pole: number, phase: number): RowSprite => {
  const size = 25;
  const g = grid(size, size + pole);
  const cx = 12;
  const cy = 12;
  for (let b = 0; b < 3; b++) {
    const a = (b / 3 + phase / 9) * Math.PI * 2;
    for (let r = 2; r <= 11; r++) {
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      plot(g, x, y, r > 9 ? 'l' : 'w');
      if (r < 9) plot(g, x + Math.cos(a + Math.PI / 2) * 0.8, y + Math.sin(a + Math.PI / 2) * 0.8, 'l');
    }
  }
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]] as const) plot(g, cx + dx, cy + dy, dx || dy ? 'i' : 'd');
  for (let y = cy + 2; y < size + pole; y++) {
    plot(g, cx, y, 'i');
    plot(g, cx + 1, y, 'n');
  }
  return sprite(g);
};
export const turbineFrames = (pole: number): RowSprite[] => [0, 1, 2].map((p) => turbine(pole, p));

/** A planter box of plants: greens, a few flowers (amber, white, blue), a stake or two. */
export const planter = (width: number, seed: number): RowSprite => {
  const h = 24;
  const g = grid(width, h);
  for (let x = 1; x < width - 1; x++) {
    const top = 6 + Math.round(noise(x / 3 + seed) * 4 + cellRandom(x, 0, seed) * 3);
    for (let y = top; y < h - 7; y++) {
      const leaf = cellRandom(x, y, seed + 1);
      plot(g, x, y, y === top && leaf > 0.75 ? (leaf > 0.92 ? 'a' : leaf > 0.85 ? 'w' : 'c') : leaf > 0.6 ? 'e' : leaf > 0.25 ? 'g' : 'G');
    }
    if (x % 9 === 4) for (let y = 2; y < h - 7; y++) plot(g, x, y, 'p'); // a stake
  }
  for (let y = h - 7; y < h; y++) {
    for (let x = 0; x < width; x++) plot(g, x, y, y === h - 7 ? 'd' : x === 0 || x === width - 1 ? 'o' : y === h - 6 ? 'p' : (x + y) % 6 === 0 ? 'o' : 'n');
  }
  return sprite(g);
};

/** A beehive on a post: a straw dome, banded, its little door. */
export const BEEHIVE: RowSprite = {
  rows: [
    '....AMMA....', '..AMaaaaMA..', '.AaaaaaaaaA.', '.AAAAAAAAAA.', 'MaaaaaaaaaaM', 'AAAAAAAAAAAA', 'MaaaaddaaaaM', 'AAAAAddAAAAA', '.nnnnnnnnnn.',
    '.....no.....', '.....no.....', '.....no.....', '.....no.....', '.....no.....', '.....no.....', '.....no.....',
  ],
  colours: C,
};

/** A wide funnel catching the rain, its pipe running down. */
export const waterFunnel = (pipe: number): RowSprite => {
  const g = grid(26, 12 + pipe);
  for (let y = 0; y < 12; y++) {
    const half = 12 - y * 0.85;
    for (let x = Math.round(13 - half); x <= Math.round(13 + half); x++) {
      plot(g, x, y, y === 0 ? 'l' : Math.abs(x - 13) > half - 1.2 ? 'm' : y < 3 ? 'c' : 'q');
    }
  }
  for (let y = 12; y < 12 + pipe; y++) {
    plot(g, 12, y, 'i');
    plot(g, 13, y, 'l');
    plot(g, 14, y, 'n');
    if ((y - 12) % 20 === 19) for (let x = 11; x <= 15; x++) plot(g, x, y, 'd'); // a bracket
  }
  return sprite(g);
};

/** A rail with carved birds along it: offerings that never went on, bare wood, every one different. */
export const birdRail = (width: number, seed: number): RowSprite => {
  const h = 22;
  const g = grid(width, h);
  for (let x = 0; x < width; x++) {
    plot(g, x, 8, 'p');
    plot(g, x, 9, 'n');
    if (x % 22 === 0 || x === width - 1) for (let y = 8; y < h; y++) plot(g, x, y, y === 8 ? 'p' : 'o');
    else if (x % 22 === 11) for (let y = 10; y < h; y++) plot(g, x, y, 'n'); // a thinner upright
  }
  // The birds: small, squat or tall, a beak this way or that, some with a wing up.
  for (let x = 4, i = 0; x < width - 8; i++) {
    const r = cellRandom(i, 0, seed);
    const facing = r > 0.5 ? 1 : -1;
    const tall = cellRandom(i, 1, seed) > 0.6;
    const body = tall ? ['.pp.', 'pnnp', 'pnnp', '.pp.'] : ['.ppp.', 'pnnnp', '.ppp.'];
    const bh = body.length;
    body.forEach((row, dy) => [...row].forEach((c, dx) => c !== '.' && plot(g, x + (facing > 0 ? dx : row.length - 1 - dx), 8 - bh + dy, c)));
    plot(g, facing > 0 ? x + body[0]!.length : x - 1, 8 - bh + 1, 'o'); // the beak
    if (cellRandom(i, 2, seed) > 0.65) plot(g, x + 1, 8 - bh - 1, 'p'); // a wing up
    x += 8 + Math.floor(cellRandom(i, 3, seed) * 10);
  }
  return sprite(g);
};

/** A plain rail along a catwalk's edge. */
export const rail = (width: number): RowSprite => {
  const g = grid(width, 10);
  for (let x = 0; x < width; x++) {
    plot(g, x, 0, 'p');
    plot(g, x, 1, 'n');
    if (x % 14 === 0 || x === width - 1) for (let y = 1; y < 10; y++) plot(g, x, y, 'o');
  }
  return sprite(g);
};

/** An arch of woven boughs over the way through, leaves in it, a lantern hanging from its top. */
export const wovenArch = (width: number, height: number): RowSprite => {
  const g = grid(width, height);
  const cx = (width - 1) / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // The arch: its two sides and the curve over, a band 7 wide.
      const nx = (x - cx) / (cx - 3);
      const top = 18 * (1 - Math.min(1, nx * nx)) ** 0.5;
      const inner = y < 22 ? Math.abs(y - (22 - top)) < 4 : Math.abs(Math.abs(x - cx) - (cx - 4)) < 4;
      if (!inner) continue;
      const weave = (x + 2 * y) % 6 < 3 ? ((((x - 2 * y) % 6) + 6) % 6 < 3 ? 'p' : 'n') : 'o';
      const leaf = cellRandom(x, y, 77);
      plot(g, x, y, leaf > 0.78 ? (leaf > 0.93 ? 'e' : 'g') : weave);
    }
  }
  return sprite(g);
};

/** A glass lantern (it charges by day; lit at dusk: the area's light). */
export const LANTERN: RowSprite = { rows: ['.ii.', 'illi', 'lwal', 'lwal', 'laal', '.ii.'], colours: C };

/** A stencilled crate of offerings going on. */
export const CRATE: RowSprite = {
  rows: ['nnnnnnnnnnnnnn', 'npppppppppppon', 'np.iiii..iiipn', 'nppppppppppppn', 'np.ii.iii.iipn', 'nppppppppppppn', 'nooooooooooooo', 'dddddddddddddd'],
  colours: C,
};

/** A clump of leaves hanging into view from above (framing the scene), `width` × `height`. */
export const leafClump = (width: number, height: number, seed: number): RowSprite => {
  const g = grid(width, height);
  // Two rows of billows: big ones along the top (cut off by the top of the screen), smaller ones hanging
  // below them, so every edge is round (no straight sides).
  const billows: { x: number; y: number; r: number }[] = [];
  for (let i = 0, x = 6; x < width - 6; i++) {
    const r = Math.min(height * 0.55, 14 + cellRandom(i, 0, seed) * 12);
    billows.push({ x, y: r * 0.3, r });
    x += r * 1.1;
  }
  for (let i = 0, x = 12; x < width - 12; i++) {
    const r = 8 + cellRandom(i, 1, seed) * 9;
    billows.push({ x: x + cellRandom(i, 2, seed) * 6, y: height * 0.45 + cellRandom(i, 3, seed) * height * 0.3 - r * 0.4, r });
    x += r * 1.3 + 4;
  }
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let inside = false;
      let under = 0;
      for (const b of billows) {
        const d = Math.hypot(x - b.x, y - b.y) / b.r;
        if (d < 1) {
          inside = true;
          under = Math.max(under, y > b.y ? d : 0);
        }
      }
      if (!inside) continue;
      // Leaves in small clusters, lit where the sun gets in, dark at the bottom of each billow.
      const leaf = noise(x / 2.2 + noise(y / 2.5 + seed) * 2) * 0.5 + noise(y / 1.8 + x / 9) * 0.5;
      plot(g, x, y, under > 0.8 ? 'G' : under > 0.55 ? (leaf > 0.1 ? 'g' : 'G') : leaf > 0.45 ? 'e' : leaf > -0.2 ? 'g' : 'G');
    }
  }
  return sprite(g);
};

// ---------------------------------------------------------------------------------------------------
// The treetop's buildings and growth, for filling every area (designer: more dense, more detail).
// ---------------------------------------------------------------------------------------------------

/** A sprite pushed back into the distance: every colour a shade darker (houses behind houses). */
export const behind = (s: RowSprite): RowSprite => {
  const darker: Record<string, string> = { w: 'l', l: 'i', i: 'n', p: 'n', n: 'o', o: 'd', d: 'k', c: 'm', m: 'q', e: 'g', g: 'G', a: 'M', M: 'A' };
  return { rows: s.rows.map((r) => [...r].map((c) => darker[c] ?? c).join('')), colours: s.colours };
};

export type Roof = 'thatch' | 'leaf' | 'solar' | 'dome';

/** How far down a treehouse's sprite its platform is (put it there to stand it on something). */
export const treehouseTop = (width: number, height: number, roof: Roof = 'thatch'): number => 6 + (roof === 'dome' ? Math.round(width * 0.45) : roof === 'solar' ? 8 : 12) + height;

/**
 * A treehouse: a living-wood platform with its rail, walls of planks or woven panels, an arched door, round
 * or square windows (glass, or lit), flower boxes, a roof of thatch, leaf shingles, solar panels or a woven
 * dome; a lantern by the door, a pipe or a turbine on top. `under`: how far its bough or its stilts reach
 * down below the platform. Width and height are the walls'; the sprite is a little bigger.
 */
export const treehouse = (width: number, height: number, seed: number, roof: Roof = 'thatch', under = 0): RowSprite => {
  const R = (i: number) => cellRandom(seed, i, 501);
  const over = 4;
  const roofH = roof === 'dome' ? Math.round(width * 0.45) : roof === 'solar' ? 8 : 12;
  const W = width + over * 2 + 2;
  const top = 6 + roofH; // where the walls start (room above for a pipe or a turbine)
  const plat = top + height; // the platform's top
  const H = plat + 4 + under;
  const g = grid(W, H);
  const x0 = over + 1;
  const woven = R(0) > 0.5;
  // The walls.
  for (let y = top; y < plat; y++) {
    for (let x = x0; x < x0 + width; x++) {
      const lx = x - x0;
      const ly = y - top;
      let c: string;
      if (lx === 0) c = 'o';
      else if (lx === width - 1) c = 'd';
      else if (woven) c = (lx + 2 * ly) % 6 < 3 ? ((((lx - 2 * ly) % 6) + 6) % 6 < 3 ? 'p' : 'n') : 'o';
      else c = lx % 5 === 0 ? 'n' : (ly + lx * 3) % 11 === 0 ? 'n' : 'p';
      plot(g, x, y, c);
    }
  }
  // The door: arched, dark, a step of light at its foot.
  const dw = 6;
  const dx = x0 + (R(1) > 0.5 ? 3 : width - dw - 3);
  const dh = Math.min(height - 2, 11);
  for (let y = plat - dh; y < plat; y++) for (let x = dx; x < dx + dw; x++) {
    const arch = y < plat - dh + 2 && (x === dx || x === dx + dw - 1);
    if (!arch) plot(g, x, y, x === dx || x === dx + dw - 1 || y === plat - dh ? 'o' : 'd');
  }
  plot(g, dx + dw + 1, plat - dh + 2, 'a'); // a lantern by the door
  plot(g, dx + dw + 1, plat - dh + 1, 'i');
  // Windows: round or square, glass catching the sky, or lit; a flower box under some.
  const round = R(2) > 0.5;
  for (let wx = x0 + 3; wx + 6 < x0 + width - 2; wx += 11) {
    if (wx + 6 > dx - 1 && wx < dx + dw + 2) continue;
    const wy = top + 3;
    const litW = R(wx) > 0.6;
    for (let y = wy; y < wy + 6; y++) for (let x = wx; x < wx + 6; x++) {
      const d = Math.hypot(x - wx - 2.5, y - wy - 2.5);
      if (round && d > 3.1) continue;
      const frame = round ? d > 2.2 : x === wx || x === wx + 5 || y === wy || y === wy + 5;
      plot(g, x, y, frame ? 'o' : litW ? (y < wy + 3 ? 'a' : 'M') : x - wx + (y - wy) < 4 ? 'm' : 'q');
    }
    if (R(wx + 1) > 0.4) for (let x = wx - 1; x < wx + 7; x++) {
      plot(g, x, wy + 7, 'n');
      if (x > wx - 1 && x < wx + 6) plot(g, x, wy + 6, cellRandom(x, seed, 7) > 0.7 ? (cellRandom(x, seed, 8) > 0.5 ? 'a' : 'w') : 'e');
    }
  }
  // The roof.
  for (let y = 6; y < top; y++) {
    const ry = y - 6;
    for (let x = 0; x < W; x++) {
      const cx = (W - 1) / 2;
      if (roof === 'dome') {
        const d = Math.hypot((x - cx) / (width / 2 + 2), (y - top) / roofH);
        if (d > 1) continue;
        plot(g, x, y, d > 0.9 ? 'o' : (x + 2 * y) % 5 < 2 ? 'n' : 'p');
        continue;
      }
      if (roof === 'solar') {
        if (x < 1 || x > W - 2) continue;
        const slope = Math.abs(x - cx) < (ry + 1) * (W / 2) / roofH * 1.4;
        if (!slope && ry < roofH - 2) continue;
        plot(g, x, y, ry === roofH - 1 ? 'o' : ry === roofH - 2 ? 'n' : x % 6 === 0 || ry % 3 === 0 ? 'l' : x % 6 < 3 ? 'm' : 'q');
        continue;
      }
      // A pitched roof: thatch or leaf shingles.
      const half = (ry + 1) / roofH * (W / 2);
      if (Math.abs(x - cx) > half) continue;
      if (roof === 'thatch') plot(g, x, y, Math.abs(x - cx) > half - 1 ? 'A' : ry === roofH - 1 ? 'A' : (x * 3 + ry) % 4 === 0 ? 'A' : (x + ry) % 3 === 0 ? 'a' : 'M');
      else plot(g, x, y, Math.abs(x - cx) > half - 1 || ry === roofH - 1 ? 'G' : (x + (ry % 2) * 2) % 4 === 0 ? 'G' : ry % 2 ? 'g' : 'e');
    }
  }
  // Something on top: a stovepipe, or a little turbine.
  if (R(3) > 0.55) {
    const px = Math.round(W * (R(4) > 0.5 ? 0.7 : 0.3));
    for (let y = 2; y < 8; y++) plot(g, px, y, y === 2 ? 'd' : 'i');
  } else if (R(3) > 0.25) {
    const px = Math.round(W * 0.68);
    for (let y = 0; y < 8; y++) plot(g, px, y + 2, 'i');
    for (const [ax, ay] of [[-3, -1], [-2, -1], [2, 0], [3, 1], [0, 2], [-1, 2]] as const) plot(g, px + ax, 2 + ay, 'l');
  }
  // The platform and its rail; the bough under it, or its stilts.
  for (let x = 0; x < W; x++) {
    plot(g, x, plat, 'l');
    plot(g, x, plat + 1, 'p');
    plot(g, x, plat + 2, 'n');
    plot(g, x, plat + 3, 'd');
  }
  for (let x = 0; x < W; x += 5) for (let y = plat - 6; y < plat; y++) if (x < x0 - 1 || x > x0 + width) plot(g, x, y, y === plat - 6 ? 'p' : 'o');
  if (under > 0) {
    if (R(5) > 0.5) {
      for (const sx of [3, W - 4]) for (let y = plat + 4; y < H; y++) {
        plot(g, sx, y, 'o');
        plot(g, sx + 1, y, 'n');
      }
      for (let y = plat + 6; y < H - 2; y += 9) for (let x = 3; x < W - 3; x++) if (Math.abs(x - 3 - (y - plat - 6) % 18 * (W - 7) / 18) < 1) plot(g, x, y, 'o'); // a brace
    } else {
      // The bough it's built on, running down out of sight, a branch off it to one side.
      const cx = W / 2 + (R(6) - 0.5) * W * 0.3;
      for (let y = plat + 4; y < H; y++) {
        const ry = y - plat - 4;
        const half = 3.5 + Math.max(0, 4 - ry * 0.4);
        const mx = cx + Math.sin(ry / 9 + seed) * 2;
        for (let x = Math.round(mx - half); x <= mx + half; x++) plot(g, x, y, x < mx - half + 1 ? 'p' : x > mx + half - 1.5 ? 'd' : noise(y / 2 + x) > 0.3 ? 'o' : 'n');
        const bx = Math.round(mx + ry * (R(7) > 0.5 ? 1 : -1) * 0.9);
        if (ry > 4 && ry < 24) {
          plot(g, bx, y - 2, 'n');
          plot(g, bx, y - 1, 'o');
        }
      }
    }
  }
  return sprite(g);
};

/**
 * A great bough running across: bark, moss on top, a few leaves; `thick` px through. It grows out of
 * `from` (the edge of the area, or the leaves: thick there, running off it) and tapers to a leafy tip at its
 * other end (designer: nothing floats); `from: 'both'` runs off both edges.
 */
export const bough = (width: number, thick: number, seed: number, rise = 0, from: 'left' | 'right' | 'both' = 'both'): RowSprite => {
  const H = thick + Math.abs(rise) + 20;
  const g = grid(width, H);
  for (let x = 0; x < width; x++) {
    const t = x / (width - 1);
    const out = from === 'left' ? t : from === 'right' ? 1 - t : 0; // how far out from where it grows
    const taper = from === 'both' ? 1 : Math.max(0.12, 1 - out ** 1.6 * 0.9);
    const th = Math.max(2, Math.round(thick * taper));
    const mid = 8 + thick / 2 + Math.abs(rise) / 2 + rise * (t - 0.5) + Math.sin(t * Math.PI * 1.3 + seed) * 2;
    const top = Math.round(mid - th / 2);
    for (let y = top; y < top + th; y++) {
      const r = y - top;
      const moss = r < 2 && noise(x / 5 + seed) > -0.1;
      plot(g, x, y, moss ? (cellRandom(x, y, seed) > 0.5 ? 'e' : 'g') : r === th - 1 ? 'd' : r < 3 ? 'p' : noise(x / 9 + r * 0.7 + seed) > 0.35 ? 'o' : 'n');
    }
    if (cellRandom(x, 0, seed + 3) > 0.9) for (let y = top - 3; y < top; y++) plot(g, x + (y % 2), y, cellRandom(x, y, seed) > 0.5 ? 'e' : 'g'); // a tuft of leaves
    // Its leafy tip.
    if (from !== 'both' && out > 0.86) for (let y = top - 6; y < top + th + 6; y++) if (cellRandom(x, y, seed + 5) > 0.35 + Math.abs(y - top - th / 2) / 12) plot(g, x, y, cellRandom(x, y, seed + 6) > 0.6 ? 'e' : 'g');
  }
  return sprite(g);
};

/** Vines hanging down: a few strands with leaves on them. */
export const vines = (width: number, height: number, seed: number): RowSprite => {
  const g = grid(width, height);
  for (let s = 0; s < Math.max(1, Math.floor(width / 5)); s++) {
    const sx = 2 + Math.floor(cellRandom(s, 0, seed) * (width - 4));
    const len = Math.floor(height * (0.4 + cellRandom(s, 1, seed) * 0.6));
    for (let y = 0; y < len; y++) {
      const x = sx + Math.round(Math.sin(y / 6 + s) * 1.2);
      plot(g, x, y, 'G');
      if (y % 4 === s % 4) {
        plot(g, x + 1, y, 'g');
        plot(g, x - 1, y + 1, 'e');
      }
    }
  }
  return sprite(g);
};

/** A string of little cloth flags, sagging between two points `width` apart. */
export const bunting = (width: number, seed: number): RowSprite => {
  const g = grid(width, 9);
  const flags = ['a', 'c', 'w', 'e', 'M', 'm'];
  for (let x = 0; x < width; x++) {
    const y = Math.round(Math.sin((x / (width - 1)) * Math.PI) * 3);
    plot(g, x, y, 'n');
    if (x % 6 === 2 && x < width - 3) {
      const f = flags[(Math.floor(x / 6) + seed) % flags.length]!;
      for (let dy = 1; dy <= 4; dy++) for (let dx = 0; dx < 5 - dy; dx++) plot(g, x + dx - 1 + Math.floor(dy / 2), y + dy, f);
    }
  }
  return sprite(g);
};

/** A rope bridge (seen from the side), `width` long: planks, hand ropes, the sag. */
export const ropeBridge = (width: number, sag: number): RowSprite => {
  const H = sag + 14;
  const g = grid(width, H);
  for (let x = 0; x < width; x++) {
    const t = x / (width - 1);
    const y = 10 + Math.round(Math.sin(t * Math.PI) * sag);
    const hand = Math.round(Math.sin(t * Math.PI) * sag * 0.6);
    plot(g, x, y, x % 4 === 0 ? 'o' : 'p');
    plot(g, x, y + 1, 'o');
    plot(g, x, hand + 1, 'n');
    if (x % 8 === 0) for (let yy = hand + 1; yy < y; yy++) plot(g, x, yy, 'n');
  }
  return sprite(g);
};

/** A ladder, `height` tall. */
export const ladder = (height: number): RowSprite => {
  const g = grid(7, height);
  for (let y = 0; y < height; y++) {
    plot(g, 0, y, 'o');
    plot(g, 6, y, 'o');
    if (y % 5 === 2) for (let x = 1; x < 6; x++) plot(g, x, y, 'p');
  }
  return sprite(g);
};

/** A water tank: a banded barrel on legs, a tap, a pipe off it. */
export const WATER_TANK: RowSprite = {
  rows: [
    '..llllllll..', '.lmccccccml.', '.immmmmmmmi.', '.iqqqqqqqqi.', '.innnnnnnni.', '.ipppppppnn.', '.ipppppppnn.', '.innnnnnnni.', '.ipppppppnn.',
    '.ipppppppnni', '.innnnnnnnii', '..o......o..', '..o......o..', '..o......o..', '.ooo....ooo.',
  ],
  colours: C,
};

/** Washing on a line between two posts: cloth in canopy greens, creams and amber. */
export const washing = (width: number, seed: number): RowSprite => {
  const g = grid(width, 26);
  const cloth = ['l', 'w', 'e', 'M', 'm', 'p', 'a'];
  for (let y = 0; y < 26; y++) {
    plot(g, 0, y, 'o');
    plot(g, width - 1, y, 'o');
  }
  for (let x = 0; x < width; x++) plot(g, x, 2 + Math.round(Math.sin((x / (width - 1)) * Math.PI) * 2), 'i');
  for (let x = 4, i = 0; x < width - 8; i++) {
    const w = 5 + Math.floor(cellRandom(i, 0, seed) * 5);
    const h = 6 + Math.floor(cellRandom(i, 1, seed) * 8);
    const c = cloth[Math.floor(cellRandom(i, 2, seed) * cloth.length)]!;
    const y0 = 3 + Math.round(Math.sin((x / (width - 1)) * Math.PI) * 2);
    for (let y = y0; y < y0 + h; y++) for (let xx = x; xx < x + w; xx++) plot(g, xx, y, y === y0 ? 'i' : (xx + y) % 5 === 0 ? 'n' : c);
    x += w + 2 + Math.floor(cellRandom(i, 3, seed) * 4);
  }
  return sprite(g);
};

/** A hammock slung between two posts. */
export const hammock = (width: number): RowSprite => {
  const g = grid(width, 18);
  for (let y = 0; y < 18; y++) {
    plot(g, 0, y, 'o');
    plot(g, width - 1, y, 'o');
  }
  for (let x = 1; x < width - 1; x++) {
    const y = 3 + Math.round(Math.sin((x / (width - 1)) * Math.PI) * 8);
    plot(g, x, y, 'M');
    plot(g, x, y + 1, x % 3 ? 'a' : 'M');
    plot(g, x, y + 2, 'A');
  }
  return sprite(g);
};

/** Pots of herbs and flowers, a cluster `width` wide. */
export const pots = (width: number, seed: number): RowSprite => {
  const g = grid(width, 16);
  for (let x = 0, i = 0; x < width - 4; i++) {
    const w = 5 + Math.floor(cellRandom(i, 0, seed) * 4);
    const ph = 4 + Math.floor(cellRandom(i, 1, seed) * 3);
    const leaves = 5 + Math.floor(cellRandom(i, 2, seed) * 6);
    for (let y = 16 - ph; y < 16; y++) for (let xx = x + (y === 15 ? 1 : 0); xx < x + w - (y === 15 ? 1 : 0); xx++) plot(g, xx, y, y === 16 - ph ? 'p' : xx === x + w - 1 ? 'A' : 'M');
    for (let y = 16 - ph - leaves; y < 16 - ph; y++) for (let xx = x; xx < x + w; xx++) {
      const r = cellRandom(xx, y, seed + i);
      if (r > 0.45 + Math.abs(xx - x - w / 2) / w) plot(g, xx, y, y === 16 - ph - leaves && r > 0.8 ? (r > 0.9 ? 'a' : 'w') : r > 0.75 ? 'e' : 'g');
    }
    x += w + 1;
  }
  return sprite(g);
};

/** A bench of planks. */
export const bench = (width: number): RowSprite => {
  const g = grid(width, 6);
  for (let x = 0; x < width; x++) {
    plot(g, x, 0, 'p');
    plot(g, x, 1, 'n');
    if (x === 1 || x === width - 2) for (let y = 2; y < 6; y++) plot(g, x, y, 'o');
  }
  return sprite(g);
};

/** A wind chime of glass and carved wood, hanging. */
export const CHIME: RowSprite = { rows: ['nnnnnnn', 'i.i.i.i', 'i.i.i.i', 'c.p.m.i', 'm.p.c.p', '..p...c'], colours: C };

/** A run of pipe along a branch, a joint now and then (water, piped to every house). */
export const pipeRun = (width: number): RowSprite => {
  const g = grid(width, 3);
  for (let x = 0; x < width; x++) {
    const joint = x % 30 === 0;
    plot(g, x, 0, joint ? 'l' : 'l');
    plot(g, x, 1, joint ? 'd' : 'i');
    plot(g, x, 2, joint ? 'l' : 'n');
  }
  return sprite(g);
};

/** A tall post with a glass lantern on an arm (a street lamp in the trees). */
export const lampPost = (height: number): RowSprite => {
  const g = grid(9, height);
  for (let y = 4; y < height; y++) {
    plot(g, 1, y, 'o');
    plot(g, 2, y, 'n');
  }
  for (let x = 1; x < 7; x++) plot(g, x, 4, 'o');
  for (const [r, row] of ['.ii.', 'illi', 'lwal', 'laal', '.ii.'].entries()) [...row].forEach((c, x) => c !== '.' && plot(g, 5 + x - 1, 5 + r, c));
  return sprite(g);
};

/** A sign on a post: a carved board with a picture on it (the canopy's folk can read; these are for everyone). */
export const signpost = (picture: 'house' | 'tube' | 'leaf' | 'down', height = 26): RowSprite => {
  const g = grid(16, height);
  for (let y = 0; y < height; y++) {
    plot(g, 7, y, 'o');
    plot(g, 8, y, 'n');
  }
  for (let y = 2; y < 11; y++) for (let x = 1; x < 15; x++) plot(g, x, y, x === 1 || x === 14 || y === 2 || y === 10 ? 'o' : 'p');
  const pics: Record<string, string[]> = {
    house: ['...d...', '..ddd..', '.ddddd.', '.d.d.d.', '.ddddd.'],
    tube: ['.d.d.d.', '.d.d.d.', '..ddd..', '...d...', '...d...'],
    leaf: ['...d...', '..ddd..', '.dd.dd.', '..ddd..', '...d...'],
    down: ['...d...', '...d...', '.d.d.d.', '..ddd..', '...d...'],
  };
  pics[picture]!.forEach((row, y) => [...row].forEach((c, x) => c !== '.' && plot(g, 4 + x, 4 + y, c)));
  return sprite(g);
};

/** The leaves below you: a mass of billows with a rounded top, filling down to the bottom (no sky under the walkways). */
export const leafFloor = (width: number, height: number, seed: number): RowSprite => {
  const g = grid(width, height);
  const billows: { x: number; y: number; r: number }[] = [];
  for (let i = 0, x = -10; x < width + 10; i++) {
    const r = 16 + cellRandom(i, 0, seed) * 18;
    billows.push({ x, y: r + cellRandom(i, 1, seed) * 14, r });
    x += r * 1.2;
  }
  for (let x = 0; x < width; x++) {
    let top = height;
    for (const b of billows) {
      const dx = x - b.x;
      if (Math.abs(dx) < b.r) top = Math.min(top, b.y - Math.sqrt(b.r * b.r - dx * dx));
    }
    for (let y = Math.max(0, Math.round(top)); y < height; y++) {
      const depth = y - top;
      // Leaves in small round clumps: lit on top, dark underneath and between them.
      const row = Math.floor(y / 6);
      const cx = Math.floor((x + (row % 2) * 4) / 8) * 8 + 4 - (row % 2) * 4;
      const cy = row * 6 + 3;
      const d = Math.hypot(x - cx, (y - cy) * 1.3);
      const c = depth < 2 ? 'g' : d > 4.2 ? 'G' : y < cy - 1 ? (cellRandom(cx, cy, seed) > 0.6 ? 'e' : 'g') : y > cy + 1 ? 'G' : 'g';
      plot(g, x, y, depth > 40 && c !== 'G' && cellRandom(cx, cy, seed + 1) > 0.5 ? 'G' : c);
    }
  }
  return sprite(g);
};

/** A limb of the tree rising straight up (thick, bark and moss), `width` across, out of the leaves below. */
export const limb = (width: number, height: number, seed: number): RowSprite => {
  const g = grid(width + 8, height);
  for (let y = 0; y < height; y++) {
    const sway = Math.sin(y / 40 + seed) * 2;
    const half = width / 2 + (y > height - 20 ? (y - height + 20) * 0.3 : 0);
    const cx = (width + 8) / 2 + sway;
    for (let x = Math.round(cx - half); x <= cx + half; x++) {
      const lx = (x - (cx - half)) / (half * 2);
      const furrow = Math.abs(Math.sin(lx * 9 + noise(y / 14 + seed) * 1.5));
      const moss = lx < 0.3 && noise(y / 9 + seed) > 0.45;
      plot(g, x, y, lx < 0.06 ? 'p' : lx > 0.92 ? 'd' : moss ? (cellRandom(x, y, seed) > 0.5 ? 'g' : 'G') : furrow < 0.2 ? 'o' : furrow < 0.6 ? 'n' : 'p');
    }
  }
  return sprite(g);
};

// ---------------------------------------------------------------------------------------------------
// The village among the limbs (designer: more treehousey, like the Ewoks' in Return of the Jedi).
// ---------------------------------------------------------------------------------------------------

/**
 * One of the tree's giant limbs, going up out of sight and down into the leaves: deep bark furrows running up
 * it, lit along its left side, moss in its cracks, a burl or two.
 */
export const giantTrunk = (width: number, height: number, seed: number): RowSprite => {
  const g = grid(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = x / (width - 1);
      const furrow = Math.abs(Math.sin(t * width / 6 + noise(y / 40 + seed) * 1.4 + noise(y / 15 + x / 23) * 0.25));
      const moss = noise(x / 9 + seed) * 0.6 + noise(y / 23 + seed * 3) * 0.6 > 0.75 && furrow < 0.5;
      const burl = Math.hypot(x - width * 0.6, (y % 140) - 70) < width * 0.12;
      let c: string;
      if (t < 0.04) c = 'l';
      else if (t > 0.94) c = 'k';
      else if (burl) c = Math.hypot(x - width * 0.6, (y % 140) - 70) < width * 0.07 ? 'o' : 'n';
      else if (moss) c = cellRandom(x, y, seed) > 0.5 ? 'g' : 'G';
      else if (furrow < 0.18) c = 'd';
      else if (furrow < 0.45) c = t < 0.35 ? 'n' : 'o';
      else c = t < 0.3 ? 'p' : t < 0.7 ? 'n' : 'o';
      plot(g, x, y, c);
    }
  }
  return sprite(g);
};

/**
 * The underside of a ring platform round a limb: the platform's thick front lip curving round, and the struts
 * from under it back into the bark. `width` across; the walking surface (a solid) sits on its top row.
 */
export const ringDeck = (width: number, seed: number): RowSprite => {
  const H = 34;
  const g = grid(width, H);
  for (let x = 0; x < width; x++) {
    const t = x / (width - 1);
    // The lip: thicker in the middle (nearer you), its log ends showing.
    const lip = 6 + Math.round(Math.sin(t * Math.PI) * 4);
    for (let y = 0; y < lip; y++) plot(g, x, y, y === 0 ? 'l' : y === 1 ? 'p' : y === lip - 1 ? 'd' : (x + seed) % 7 === 0 ? 'o' : 'n');
    // Struts angling down and in to the limb.
    const sx = Math.abs(t - 0.5) * 2;
    if (Math.round(x) % 18 === 4) for (let y = lip; y < H; y++) {
      const xx = x + (t < 0.5 ? 1 : -1) * (y - lip) * (0.6 + sx * 0.6);
      plot(g, xx, y, 'o');
      plot(g, xx + 1, y, 'd');
    }
  }
  return sprite(g);
};

/**
 * A round hut (the Ewoks' kind): walls of upright logs lashed together, a round doorway, a small window, a
 * tall conical thatched roof with a deep overhang and a smoke hole at its peak, a lantern by the door.
 * `width` is the walls'; the sprite's a little wider for the eaves. It stands on its bottom row.
 */
export const roundHut = (width: number, wallH: number, seed: number, lit = true): RowSprite => {
  const eave = 5;
  const W = width + eave * 2;
  const roofH = Math.round(width * 0.75);
  const H = roofH + wallH + 2;
  const g = grid(W, H);
  const cx = (W - 1) / 2;
  // The walls: logs, rounder at the edges (shaded), lashings.
  for (let y = roofH - 2; y < H; y++) {
    for (let x = eave; x < eave + width; x++) {
      const t = (x - eave) / (width - 1);
      const log = (x - eave) % 4;
      let c = t < 0.12 ? 'p' : t > 0.85 ? 'o' : log === 0 ? 'o' : log === 1 ? 'p' : 'n';
      if ((y - roofH) % 9 === 5) c = 'A'; // a lashing
      plot(g, x, y, c);
    }
  }
  // The doorway: round-topped, dark; a window; a lantern.
  const dx = Math.round(cx + (cellRandom(seed, 0, 3) > 0.5 ? -width * 0.18 : width * 0.08));
  const dh = Math.min(wallH - 1, 13);
  for (let y = H - dh; y < H; y++) for (let x = dx - 3; x <= dx + 3; x++) {
    if (y < H - dh + 3 && Math.hypot(x - dx, y - (H - dh + 3)) > 3.4) continue;
    plot(g, x, y, Math.abs(x - dx) === 3 || y === H - dh ? 'o' : 'd');
  }
  if (wallH > 14) {
    const wx = Math.round(dx > cx ? cx - width * 0.25 : cx + width * 0.22);
    const wy = H - wallH + 4;
    for (let y = wy; y < wy + 4; y++) for (let x = wx - 2; x <= wx + 2; x++) plot(g, x, y, Math.abs(x - wx) === 2 || y === wy || y === wy + 3 ? 'o' : lit ? (y === wy + 1 ? 'a' : 'M') : 'q');
  }
  plot(g, dx + 5, H - dh + 3, 'i');
  plot(g, dx + 5, H - dh + 4, 'a');
  // The roof: a steep cone of thatch, layered, a smoke hole at the top.
  for (let y = 0; y < roofH; y++) {
    const half = ((y + 1) / roofH) * (W / 2);
    for (let x = 0; x < W; x++) {
      const d = Math.abs(x - cx);
      if (d > half) continue;
      const layer = (y + Math.round(d * 0.3)) % 5;
      plot(g, x, y, y < 2 ? 'o' : d > half - 1.2 || y === roofH - 1 ? 'A' : layer === 0 ? 'A' : (x * 3 + y) % 4 === 0 ? 'a' : 'M');
    }
  }
  return sprite(g);
};

/** A ladder of lashed rungs, between two poles (taller and rougher than a plain ladder). */
export const poleLadder = (height: number): RowSprite => {
  const g = grid(9, height);
  for (let y = 0; y < height; y++) {
    plot(g, 0, y, 'n');
    plot(g, 1, y, 'o');
    plot(g, 7, y, 'n');
    plot(g, 8, y, 'o');
    if (y % 6 === 3) for (let x = 2; x < 7; x++) plot(g, x, y, 'p');
  }
  return sprite(g);
};
