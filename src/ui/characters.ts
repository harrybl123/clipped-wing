import { SHADES } from './pixelArt';
import type { RowSprite } from './sprites';

// PLACEHOLDER character sprites until the art pass: small dark figures with slightly long,
// carved-figure proportions, lit from one side (a pale rim on the right edge). Frames are
// generated from a few pose parameters so a walk cycle stays consistent; each is still plain
// character rows. All face right; the game flips them.

type Grid = string[][];
const grid = (w: number, h: number): Grid => Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
const put = (g: Grid, x: number, y: number, c: string) => {
  if (y >= 0 && y < g.length && x >= 0 && x < g[0]!.length) g[y]![x] = c;
};
const span = (g: Grid, y: number, x0: number, x1: number, c: string) => {
  for (let x = x0; x <= x1; x++) put(g, x, y, c);
};
const rows = (g: Grid) => g.map((r) => r.join(''));

/**
 * A faint edge on the unlit (left and top) side of the dark body, so the figure still reads
 * against dark backgrounds. Dimmer than the rim light on the lit side.
 */
function edgeShadowSide(g: Grid): void {
  const empty = (x: number, y: number) => (g[y]?.[x] ?? '.') === '.';
  const edges: [number, number][] = [];
  g.forEach((row, y) => row.forEach((c, x) => {
    if (c === 'o' && (empty(x - 1, y) || empty(x, y - 1))) edges.push([x, y]);
  }));
  for (const [x, y] of edges) g[y]![x] = 'e';
}

// --- The protagonist ---

interface Pose {
  /** Horizontal offset of the back and front foot relative to the hips. */
  sway: [number, number];
  /** How many rows each leg is drawn up (bent) from the ground. */
  lift?: [number, number];
  /** Upper body pushed down 1px (breathing, walk bob). */
  bob?: number;
  /** Front arm swing: hand offset forwards (+) or back (−). */
  arm?: number;
  /** The red thread from the knot at the neck, as offsets from the knot. */
  thread: [number, number][];
}

const PROTAGONIST_W = 12;
const PROTAGONIST_H = 26;

function protagonist(pose: Pose): RowSprite {
  const g = grid(PROTAGONIST_W, PROTAGONIST_H);
  const b = pose.bob ?? 0;
  // Head
  span(g, 0 + b, 4, 7, 'o');
  for (let y = 1; y <= 3; y++) {
    span(g, y + b, 3, 7, 'o');
    put(g, 8, y + b, '#');
  }
  span(g, 4 + b, 4, 6, 'o');
  put(g, 7, 4 + b, '#');
  // Neck, shoulders, body
  span(g, 5 + b, 5, 6, 'o');
  span(g, 6 + b, 4, 8, 'o');
  for (let y = 7; y <= 16; y++) span(g, y + b, 4, 8, 'o');
  // Back arm, in shadow, swinging opposite the front one.
  for (let y = 7; y <= 14; y++) {
    const swing = y >= 11 ? -Math.sign(pose.arm ?? 0) * Math.min(Math.abs(pose.arm ?? 0), y - 10) : 0;
    put(g, 3 + swing, y + b, 'o');
  }
  // Front arm with a pale rim, ending in the bandaged hand (the missing thumb).
  const arm = pose.arm ?? 0;
  for (let y = 7; y <= 13; y++) {
    const swing = y >= 11 ? Math.sign(arm) * Math.min(Math.abs(arm), y - 10) : 0;
    put(g, 9 + swing, y + b, 'o');
    put(g, 10 + swing, y + b, '#');
  }
  const handX = 9 + arm;
  for (let y = 14; y <= 15; y++) span(g, y + b, handX, handX + 1, 'h');
  // Legs: back leg in shadow, front leg rim-lit; toes point forwards.
  const [liftBack, liftFront] = pose.lift ?? [0, 0];
  const leg = (hipX: number, sway: number, lift: number, rim: boolean) => {
    const bottom = PROTAGONIST_H - 1 - lift;
    for (let y = 17; y <= bottom; y++) {
      const x = hipX + Math.round((sway * (y - 17)) / Math.max(1, bottom - 17));
      put(g, x, y, 'o');
      put(g, x + 1, y, rim ? '#' : 'o');
      if (y === bottom) put(g, x + 2, y, 'o');
    }
  };
  leg(4, pose.sway[0], liftBack, false);
  leg(6, pose.sway[1], liftFront, true);
  edgeShadowSide(g);
  // The red thread: a knot at the back of the neck, trailing out behind the body
  // (only drawn where it isn't hidden by the figure).
  put(g, 4, 5 + b, 'r');
  for (const [dx, dy] of pose.thread) {
    const x = 3 + dx;
    const y = 6 + b + dy;
    if (g[y]?.[x] === '.') put(g, x, y, 'r');
  }
  return { rows: rows(g), colours: { o: SHADES.shadow, e: SHADES.woodLight, '#': SHADES.dim, h: SHADES.light, r: SHADES.red } };
}

const HANGING: [number, number][] = [[-1, 1], [-1, 2], [-2, 3]];
const TRAILING_A: [number, number][] = [[-1, 0], [-2, 1], [-3, 1], [-4, 2]];
const TRAILING_B: [number, number][] = [[-1, 1], [-2, 1], [-3, 2], [-4, 2]];

export const PROTAGONIST = {
  idle: [protagonist({ sway: [0, 0], thread: HANGING }), protagonist({ sway: [0, 0], bob: 1, thread: HANGING })],
  walk: [
    protagonist({ sway: [-3, 3], arm: -1, thread: TRAILING_A }),
    protagonist({ sway: [-1, 1], lift: [0, 2], bob: 1, arm: 0, thread: TRAILING_B }),
    protagonist({ sway: [3, -3], arm: 1, thread: TRAILING_A }),
    protagonist({ sway: [1, -1], lift: [2, 0], bob: 1, arm: 0, thread: TRAILING_B }),
  ],
  jump: protagonist({ sway: [-1, 2], lift: [3, 2], arm: 1, thread: [[-1, 1], [-1, 2], [-1, 3]] }),
  fall: protagonist({ sway: [-1, 1], arm: -1, thread: [[-1, 0], [-2, -1], [-3, -2]] }),
};

// --- Mum ---

function mum(breathe: boolean): RowSprite {
  const g = grid(13, 25);
  const b = breathe ? 1 : 0;
  // Hair tied up in a bun.
  span(g, 0 + b, 5, 7, 'o');
  // Head
  span(g, 1 + b, 5, 7, 'o');
  for (let y = 2; y <= 4; y++) {
    span(g, y + b, 4, 7, 'o');
    put(g, 8, y + b, '#');
  }
  span(g, 5 + b, 5, 7, 'o');
  // A patterned shawl over her shoulders (placeholder signature detail), fringed at the bottom.
  // Outlined in shadow so her silhouette stays joined up even against mid-brown wood.
  put(g, 5, 6 + b, 'o');
  put(g, 6, 6 + b, 'o');
  put(g, 7, 6 + b, 'o');
  for (let y = 7; y <= 10; y++) {
    const half = Math.min(4, y - 5);
    for (let x = 6 - half; x <= 6 + half; x++) {
      const edge = Math.abs(x - 6) === half;
      put(g, x, y + b, edge ? (x > 6 ? '#' : 'o') : (x + y) % 3 === 0 ? 't' : 's');
    }
  }
  // Body and a long skirt, widening to the floor.
  for (let y = 11; y <= 15; y++) span(g, y + b, 3, 9, 'o');
  for (let x = 2; x <= 10; x += 2) put(g, x, 11 + b, 's');
  for (let y = 16; y <= 24; y++) {
    const w = Math.floor((y - 16) / 3);
    span(g, y, 3 - w, 9 + w, 'o');
    put(g, 10 + w, y, '#');
  }
  edgeShadowSide(g);
  return { rows: rows(g), colours: { o: SHADES.shadow, e: SHADES.woodLight, '#': SHADES.dim, s: SHADES.amberDeep, t: SHADES.woodPale } };
}

export const MUM = { idle: [mum(false), mum(true)] };
