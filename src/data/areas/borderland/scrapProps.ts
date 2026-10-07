import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';

// PLACEHOLDER pixel props for the borderland (Chapter 2; docs/chapter-2-world.md): scrap, and the
// futuristic parts lying in the dirt. Smooth curved panels, rings, cables, cracked glass and casings
// with no visible joins, nothing like the tree's carved wood; now and then a part still glowing a
// faint cyan. Shared by every borderland area.

const fill = (w: number, h: number, pick: (x: number, y: number) => string): string[] =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => pick(x, y)).join(''));

/** Dark metal, worn smooth: highlight, body, shade, dark; glass; the glow. */
const METAL = { h: S.light, m: S.dim, n: S.woodLight, d: S.deep, s: S.shadow, p: S.woodPale, g: S.cyanDeep, G: S.cyanMid, c: S.cyan, w: S.white, a: S.amber, A: S.amberDeep, e: S.greenMid };

/** A cheap deterministic scatter for wear marks. */
const speck = (x: number, y: number, seed: number) => ((x * 73 + y * 151 + seed * 37) % 97) / 97;

/** Where the stuck hull's crown is, as a fraction of its width: it rises steeply on the left and slopes away to the right. */
const HULL_CROWN = 0.42;

/** The row of the stuck hull's top surface at column x (0 at its crown), for laying solids along it. */
export function hullTop(width: number, height: number, x: number): number {
  const crown = width * HULL_CROWN;
  const u = x < crown ? (crown - x) / crown : (x - crown) / (width - crown);
  return Math.round(height * (1 - Math.sqrt(Math.max(0, 1 - u * u)) * (x < crown ? 1 : 0.96)));
}

/**
 * The stuck hull: the curved back of something enormous, half buried, picked of every panel that
 * would come off (bare ribs where they were), too big to ever dig out. Low at the right, a crack
 * where something still glows. Bottom edge sits on the ground.
 */
export const stuckHull = (width: number, height: number): RowSprite => {
  const half = width / 2;
  const crown = width * HULL_CROWN;
  const topAt = (x: number) => hullTop(width, height, x);
  const missing = [
    { from: width * 0.18, to: width * 0.3, top: 0.25, bottom: 0.7 },
    { from: width * 0.52, to: width * 0.68, top: 0.15, bottom: 0.55 },
    { from: width * 0.74, to: width * 0.82, top: 0.45, bottom: 0.9 },
  ];
  const crack = { x: Math.round(width * 0.86), w: 7, top: height - 9 };
  return {
    rows: fill(width, height, (x, y) => {
      const top = topAt(x);
      if (y < top) return '.';
      const depthIn = y - top;
      // The glowing crack under the low right end: dark, with something steady in it.
      if (x >= crack.x && x < crack.x + crack.w && y >= crack.top) {
        const cx = x - crack.x;
        if (y >= height - 4 && cx >= 2 && cx <= 4) return y === height - 3 && cx === 3 ? 'w' : cx === 3 || y === height - 3 ? 'c' : 'G';
        return 's';
      }
      // Seams: ribs running round the hull every so often.
      const rib = Math.round(x - half * 0.08 * Math.sin(((y - top) / height) * Math.PI)) % 22 === 0;
      const fy = y / height;
      const ragged = (speck(x, Math.floor(y / 3), 11) - 0.5) * 0.12; // torn edges, not a neat window
      const hole = missing.find((m) => x >= m.from + ragged * 40 && x < m.to - ragged * 30 && fy >= m.top + ragged && fy < m.bottom - ragged * 0.5);
      if (hole) {
        // Where a panel was prised off: dark inside, bare ribs across it.
        if (rib) return 'n';
        if (Math.round(y) % 11 === 0) return 'd';
        return 's';
      }
      if (depthIn === 0) return x < crown + 20 && x > crown - 40 ? 'h' : 'm';
      // What's left of a painted stripe round it, faded and flaking.
      const stripe = y - top - Math.round(height * 0.22);
      if (stripe >= 0 && stripe < 4 && speck(x, y, 7) > 0.25) return stripe === 0 ? 'a' : 'A';
      if (depthIn === 1) return 'm';
      if (rib) return 'd';
      // A soft sheen along the upper curve; scuffed lower down.
      const sheen = depthIn < 6 && x < crown + 30 && x > crown - 50;
      if (sheen) return speck(x, y, 1) > 0.2 ? 'm' : 'n';
      if (fy > 0.82 && speck(x, y, 2) > 0.7) return 'p'; // dirt caked on near the ground
      return speck(x, y, 3) > 0.94 ? 'd' : 'n';
    }),
    colours: METAL,
  };
};

/** A mast (or a pole, or an arm) bent double: up from the ground, then over and down. */
export const bentMast = (height: number): RowSprite => {
  const width = Math.round(height * 0.55);
  const bend = Math.round(height * 0.32); // y of the knee
  return {
    rows: fill(width, height, (x, y) => {
      // The upright, two pixels thick, near the left.
      if (y >= bend && (x === 3 || x === 4)) return x === 3 ? 'm' : 'd';
      // The knee and the arm hanging down to the right.
      const t = (x - 4) / (width - 6);
      if (t >= 0 && t <= 1) {
        const armY = Math.round(bend - Math.sin(t * Math.PI * 0.9) * bend * 0.85 + t * t * bend * 1.6);
        if (y === armY) return 'm';
        if (y === armY + 1) return 'd';
      }
      // Fins along the upright.
      if (y > bend + 8 && (y - bend) % 11 === 0 && x >= 1 && x <= 6) return 'n';
      // A collar at the foot.
      if (y >= height - 3 && x >= 1 && x <= 6) return y === height - 3 ? 'm' : 'd';
      return '.';
    }),
    colours: METAL,
  };
};

/** A slab of dark glass, cracked, leaning on its edge. */
export const glassSlab = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const lean = Math.round((height - y) * 0.45); // leans right
    const lx = x - lean;
    if (lx < 0 || lx >= width - Math.round(height * 0.45)) return '.';
    const w = width - Math.round(height * 0.45);
    if (lx === 0 || lx === w - 1 || y === 0 || y === height - 1) return 'd';
    if (Math.abs(lx - y * 0.9 - 3) < 0.6 || (lx > w / 2 && Math.abs(lx - w / 2 - (height - y) * 0.6) < 0.6)) return 'n'; // cracks
    if (Math.abs(lx + y - w * 0.7) < 1) return 'G'; // a dull reflection
    return 'g';
  }),
  colours: METAL,
});

/** A coil of cable dropped in the dirt. */
export const cableCoil = (width: number): RowSprite => {
  const height = Math.round(width * 0.36);
  return {
    rows: fill(width, height, (x, y) => {
      for (const k of [0, 3, 6]) {
        const rx = width / 2 - 1 - k * 0.6;
        const ry = height / 2 - 0.5 - k * 0.15;
        const d = Math.hypot((x - width / 2 + 0.5 - k * 0.8) / rx, (y - height / 2 + 0.5) / ry);
        if (Math.abs(d - 1) < 0.16) return y < height / 2 ? 'm' : 'd';
      }
      return '.';
    }),
    colours: METAL,
  };
};

/** A big ring, half buried, standing up out of the ground like an arch. */
export const buriedRing = (width: number): RowSprite => {
  const height = Math.round(width * 0.5);
  return {
    rows: fill(width, height, (x, y) => {
      const d = Math.hypot((x - width / 2 + 0.5) / (width / 2), (y - height + 0.5) / height);
      if (d > 1 || d < 0.78) return '.';
      if (d > 0.95) return 'm';
      if (d < 0.82) return 'd';
      return x % 7 === 0 ? 'd' : 'n';
    }),
    colours: METAL,
  };
};

/** A dug hole in the ground with spoil thrown up beside it (bottom edge on the ground; the hole is the last 2 rows). */
export const dugHole = (width: number): RowSprite => {
  const height = 6;
  return {
    rows: fill(width + 8, height, (x, y) => {
      // Spoil heaped to the right.
      const sx = x - width;
      if (sx >= 0) return y >= height - 2 - Math.round(Math.sin((sx / 8) * Math.PI) * 3) && y < height - 2 ? (speck(x, y, 4) > 0.5 ? 'p' : 'n') : '.';
      if (y < height - 2) return '.';
      const d = Math.abs(x - width / 2 + 0.5) / (width / 2);
      if (d > 1) return '.';
      return d > 0.75 || y === height - 2 ? 'n' : 's';
    }),
    colours: METAL,
  };
};

/** A heap of dug-out spoil (draw it on the ground; pair it with an invisible one-way solid on top). */
export const spoilHeap = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const u = (x - width / 2 + 0.5) / (width / 2);
    const top = Math.round(height * (1 - (1 - u * u) ** 0.7)) + Math.round((speck(x, 0, 5) - 0.5) * 2);
    if (y < top) return '.';
    if (y === top) return 'm';
    const r = speck(x, y, 6);
    return r > 0.96 ? 'd' : r > 0.6 ? 'p' : 'n';
  }),
  colours: METAL,
});

/** A track marker: a pole with a rag tied on and a plate scratched with the clan's sign. */
export const trackMarker = (height: number): RowSprite => ({
  rows: fill(9, height, (x, y) => {
    if (x === 4) return y === 0 ? 'm' : 'n';
    if (y >= 4 && y < 9 && x >= 1 && x <= 7) return x === 1 || x === 7 || y === 4 || y === 8 ? 'd' : (x + y) % 3 === 0 ? 'd' : 'm'; // the plate and its sign
    if (y >= 1 && y < 3 && x > 4 && x < 4 + (y === 1 ? 4 : 3)) return 'p'; // the rag
    return '.';
  }),
  colours: METAL,
});

/** A sack and a pick left beside a hole. */
export const toolsLeft: RowSprite = {
  rows: [
    '..........m.',
    '.........mn.',
    '..pp....m.n.',
    '.pppp..m..n.',
    'pppnpp.....n',
    'ppnpppp....n',
    'pppppnp....n',
  ],
  colours: METAL,
};

/** A pale casing, smooth and seamless, cracked open: a round window of cyan glass in its side. */
export const casingPod = (width: number): RowSprite => {
  const height = Math.round(width * 0.55);
  return {
    rows: fill(width, height, (x, y) => {
      const d = Math.hypot((x - width / 2 + 0.5) / (width / 2), (y - height + 0.5) / height);
      if (d > 1) return '.';
      if (x > width * 0.68 && y < height * 0.55 && (x + y) % 5 !== 0) return '.'; // broken open
      const win = Math.hypot(x - width * 0.32, y - height * 0.55);
      if (win < height * 0.22) return win < height * 0.12 ? 'c' : 'G';
      if (win < height * 0.28) return 'm';
      if (d > 0.92) return 'm';
      return y < height * 0.4 ? 'w' : speck(x, y, 8) > 0.85 ? 'p' : 'h';
    }),
    colours: METAL,
  };
};

/** A panel still wearing its paint: amber with dark stencilled marks nobody can read. */
export const paintedPanel = (width: number, height: number): RowSprite => ({
  rows: fill(width, height, (x, y) => {
    const lean = Math.round((height - y) * 0.3);
    const lx = x - lean;
    const w = width - Math.round(height * 0.3);
    if (lx < 0 || lx >= w) return '.';
    if (lx === 0 || y === 0) return 'a';
    if (lx === w - 1 || y === height - 1) return 'd';
    if (y >= 3 && y <= 5 && lx >= 3 && lx < w - 3 && lx % 4 !== 2) return 'd'; // the marks
    if (y > height - 5 && speck(x, y, 9) > 0.5) return 'p'; // caked with dirt
    return speck(x, y, 10) > 0.9 ? 'A' : 'a';
  }),
  colours: METAL,
});

/** A screen face down in the dirt, its cracked glass catching the light. */
export const screenSlab = (width: number): RowSprite => ({
  rows: fill(width, 5, (x, y) => {
    if (y === 0) return x === 0 || x === width - 1 ? '.' : x % 6 === 2 ? 'w' : 'c';
    if (y === 1) return (x * 7) % 11 === 3 ? 'n' : 'G';
    if (y === 2) return 'g';
    return x === 0 || x === width - 1 ? 'd' : 'n';
  }),
  colours: METAL,
});

/** A bundle of wires spilling out of a broken end: amber, cyan, white and green insulation. */
export const wireBundle = (width: number): RowSprite => {
  const height = 9;
  const colours = ['a', 'c', 'w', 'e', 'a', 'G'];
  return {
    rows: fill(width, height, (x, y) => {
      if (x < 6) return y >= 3 && y < 8 ? (y === 3 ? 'm' : x === 5 ? 'd' : 'n') : '.'; // the sheath
      for (let i = 0; i < colours.length; i++) {
        const t = (x - 6) / (width - 6);
        const wy = Math.round(4 + (i - 2.5) * t * 1.4 + Math.sin(t * 6 + i * 1.7) * 1.2 + t * t * 3);
        if (y === Math.min(height - 1, wy) && t < 0.75 + (i % 3) * 0.1) return colours[i]!;
      }
      return '.';
    }),
    colours: METAL,
  };
};
