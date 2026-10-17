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

export const TENTACLES_W = 320;
export const TENTACLES_H = 252;
const HUB_X = 160;
const HUB_Y = TENTACLES_H - 1;

/**
 * Each tentacle's line, from the collar out to its end, in the sprite's own pixels; drawn back to front.
 * `mouth`: it ends in an open mouth, hanging down (the one you come out of).
 */
const TENTACLE_LINES: readonly { points: readonly Pt[]; base: number; tip: number; mouth?: boolean; back?: boolean }[] = [
  { points: [[HUB_X - 6, HUB_Y], [HUB_X - 12, 190], [HUB_X - 30, 120], [HUB_X - 44, 56], [HUB_X - 38, -6]], base: 11, tip: 6, back: true },
  { points: [[HUB_X + 4, HUB_Y], [HUB_X + 8, 170], [HUB_X + 20, 96], [HUB_X + 16, 30], [HUB_X + 24, -6]], base: 11, tip: 6, back: true },
  { points: [[HUB_X + 10, HUB_Y], [HUB_X + 26, 196], [HUB_X + 64, 138], [HUB_X + 110, 104], [HUB_X + 140, 66], [HUB_X + 156, 30]], base: 11, tip: 5 },
  { points: [[HUB_X - 10, HUB_Y], [HUB_X - 34, 214], [HUB_X - 70, 182], [HUB_X - 104, 166], [HUB_X - 128, 160], [HUB_X - 140, 170]], base: 11, tip: 5 },
  { points: [[HUB_X + 8, HUB_Y], [HUB_X + 18, 206], [HUB_X + 52, 158], [HUB_X + 96, 146], [HUB_X + 130, 162], [HUB_X + 140, 196]], base: 12, tip: 9, mouth: true },
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
        else if (dist % 34 < 2 && along < 0.97) c = dist % 34 < 1 ? 'i' : 'n'; // a collar round it
        else if (f < -0.55 && f > -0.8) c = 'w'; // the glass catching the sky
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
  // The great collar where they come out of the tree: living wood swelling round a ring of pale metal.
  for (let y = HUB_Y - 30; y <= HUB_Y; y++) {
    const half = 26 + (y - (HUB_Y - 30)) * 0.9;
    for (let dx = -half; dx <= half; dx++) {
      const x = HUB_X + dx;
      const top = y - (HUB_Y - 30);
      let c: string;
      if (top < 8) {
        if (Math.abs(dx) > half - 3) c = 'd';
        else c = top === 0 ? 'l' : top === 7 ? 'd' : top < 3 ? 'i' : Math.round(dx) % 9 === 0 ? 'l' : 'n'; // the metal ring, riveted
      } else {
        // Wood, the grain running up into the ring, roots of it spreading on the deck.
        const grain = noise(dx / 3 + top * 0.08) > 0.45;
        c = Math.abs(dx) > half - 2 ? 'd' : grain ? 'n' : (Math.round(dx) + top) % 7 === 0 ? 'l' : 'p';
        if (top > 18 && noise(dx / 4 + 11) > 0.35) c = (x + y) % 2 ? 'g' : 'G'; // moss at its foot
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
      const weave = (x + 2 * y) % 6 < 3 ? ((x - 2 * y) % 6 < 3 ? 'p' : 'n') : 'o';
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
  // Billows hanging down: overlapping rounds along the bottom edge.
  const billows = Array.from({ length: Math.ceil(width / 16) + 1 }, (_, i) => ({ x: i * 16 + cellRandom(i, 0, seed) * 8, r: 9 + cellRandom(i, 1, seed) * 10, y: height * 0.35 + cellRandom(i, 2, seed) * height * 0.3 }));
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let inside = y < height * 0.3;
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
  // A bough through it.
  for (let x = 0; x < width; x++) {
    const y = Math.round(height * 0.18 + Math.sin((x / width) * 3 + seed) * 3);
    plot(g, x, y, 'o');
    plot(g, x, y + 1, 'n');
  }
  return sprite(g);
};
