import { SHADES } from './pixelArt';
import type { RowSprite } from './sprites';

// PLACEHOLDER battle sprites until the art pass: bigger and more detailed than the figures in the areas
// (about 2½ times their height), for the combat stage's 3/4 framing (docs/combat-design.md). You're seen
// from behind, over the shoulder, close to the camera and cropped at the waist; the enemy stands further
// back, facing you. Each is built from a few shapes (discs, thick limbs, polygons) per pose, then lit
// like everyone else, a step richer: the market's lamps catch the top edges in amber, a pale rim runs
// down the right, a soft mid-tone inside it, and a faint edge on the left. Limbs are drawn as their own
// parts, so an arm in front of the body keeps its outline. Red only on your thread.

type Pt = [number, number];
type Grid = string[][];

const grid = (w: number, h: number): Grid => Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));
const put = (g: Grid, x: number, y: number, c: string) => {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (yi >= 0 && yi < g.length && xi >= 0 && xi < g[0]!.length) g[yi]![xi] = c;
};

function disc(g: Grid, cx: number, cy: number, rx: number, ry: number, c: string): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
      if (((x - cx) / (rx + 0.35)) ** 2 + ((y - cy) / (ry + 0.35)) ** 2 <= 1) put(g, x, y, c);
}

/** A thick limb from a through b (and on through c, if given), r pixels round. */
function limb(g: Grid, pts: Pt[], r: number, c: string): void {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]!;
    const [bx, by] = pts[i + 1]!;
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 2));
    for (let s = 0; s <= steps; s++) disc(g, ax + ((bx - ax) * s) / steps, ay + ((by - ay) * s) / steps, r, r, c);
  }
}

function poly(g: Grid, pts: Pt[], c: string): void {
  const ys = pts.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++)
    for (let x = 0; x < g[0]!.length; x++) {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i]!;
        const [xj, yj] = pts[j]!;
        if (yi > y + 0.5 !== yj > y + 0.5 && x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) put(g, x, y, c);
    }
}

/**
 * Lights one part (every pixel marked `part`): amber on its top-right corners where the lamps catch it, a pale
 * rim down its right, a mid-tone just inside the rim, a faint edge on its left and top, and a faint seam
 * where it crosses another part, so a limb in front of the body still reads.
 */
function light(g: Grid, part: string, fill = 'o'): void {
  const at = (x: number, y: number) => g[y]?.[x] ?? '.';
  const empty = (x: number, y: number) => at(x, y) === '.';
  const other = (x: number, y: number) => !empty(x, y) && at(x, y) !== part;
  const marks: [number, number, string][] = [];
  g.forEach((row, y) => row.forEach((c, x) => {
    if (c !== part) return;
    let mark = fill;
    if (empty(x + 1, y) && empty(x, y - 1)) mark = 'A'; // a top-right corner, where the lamps catch
    else if (empty(x + 1, y)) mark = '#';
    else if (empty(x, y - 1)) mark = 'e';
    else if (empty(x - 1, y)) mark = 'e';
    else if (other(x + 1, y)) mark = 'e'; // where a part crosses another: a faint seam
    else if (empty(x + 2, y) && fill === 'o') mark = 'm';
    marks.push([x, y, mark]);
  }));
  for (const [x, y, c] of marks) g[y]![x] = c;
}

const rows = (g: Grid) => g.map((r) => r.join(''));
/** Colours every lit figure shares. */
const FIGURE = { o: SHADES.shadow, m: SHADES.deep, e: SHADES.woodLight, '#': SHADES.dim, A: SHADES.amber };

// --- The carver, from behind ---

export type CarverPose = 'idle' | 'breathe' | 'ready' | 'dodge' | 'attack' | 'slap' | 'shove' | 'grab' | 'guard' | 'hit';
export const CARVER_POSES: CarverPose[] = ['idle', 'breathe', 'ready', 'dodge', 'attack', 'slap', 'shove', 'grab', 'guard', 'hit'];
const CARVER_W = 56;
const CARVER_H = 62;

function carverBack(pose: CarverPose): RowSprite {
  const g = grid(CARVER_W, CARVER_H);
  const cx = 28;
  // How the upper body shifts and where the head sits, by pose.
  const shift = { idle: 0, breathe: 0, ready: 0, dodge: -7, attack: 3, slap: 4, shove: 0, grab: 0, guard: 0, hit: 4 }[pose];
  const bob = { idle: 0, breathe: 1, ready: 2, dodge: 2, attack: -1, slap: 0, shove: -2, grab: 4, guard: 3, hit: 1 }[pose];
  const headDx = { idle: 1, breathe: 1, ready: 1, dodge: -3, attack: 3, slap: 4, shove: 0, grab: 0, guard: 0, hit: 6 }[pose];
  const headDy = { idle: 0, breathe: 0, ready: 1, dodge: 0, attack: -1, slap: 0, shove: 0, grab: 4, guard: 3, hit: -1 }[pose];
  const x = cx + shift;
  const top = 2 + bob;
  const ls: Pt = [x - 18, top + 28];
  const rs: Pt = [x + 18, top + 28];
  // Arms: [left, right]; a hand last. Hands in front of you are hidden by your back.
  const arms: Record<CarverPose, [Pt[], Pt[]]> = {
    idle: [[ls, [x - 21, top + 42], [x - 21, top + 56]], [rs, [x + 21, top + 42], [x + 21, top + 56]]],
    breathe: [[ls, [x - 21, top + 42], [x - 21, top + 56]], [rs, [x + 21, top + 42], [x + 21, top + 56]]],
    ready: [[ls, [x - 24, top + 38], [x - 19, top + 31]], [rs, [x + 24, top + 38], [x + 19, top + 31]]],
    dodge: [[ls, [x - 23, top + 40], [x - 24, top + 52]], [rs, [x + 22, top + 36], [x + 15, top + 29]]],
    attack: [[ls, [x - 22, top + 40], [x - 20, top + 52]], [rs, [x + 22, top + 18], [x + 18, top + 4]]],
    // An open hand swung across: the right arm out wide and up.
    slap: [[ls, [x - 22, top + 40], [x - 21, top + 53]], [rs, [x + 27, top + 22], [x + 30, top + 10]]],
    // Both arms straight out in front, at shoulder height: palms into his chest.
    shove: [[ls, [x - 15, top + 17], [x - 10, top + 8]], [rs, [x + 15, top + 17], [x + 10, top + 8]]],
    // Hunched, both arms reaching low and together for his stole.
    grab: [[ls, [x - 20, top + 22], [x - 6, top + 16]], [rs, [x + 20, top + 22], [x + 6, top + 16]]],
    guard: [[ls, [x - 25, top + 30], [x - 15, top + 20]], [rs, [x + 25, top + 30], [x + 15, top + 20]]],
    hit: [[ls, [x - 25, top + 34], [x - 30, top + 26]], [rs, [x + 24, top + 40], [x + 26, top + 54]]],
  };
  const [left, right] = arms[pose];
  // Arms reaching forward are behind the body from here: draw them first, the body over them.
  const forward = pose === 'shove' || pose === 'grab' || pose === 'guard' || pose === 'ready';
  const drawArms = () => {
    limb(g, left, 3.2, 'a');
    limb(g, right, 3.2, 'a');
  };
  if (forward) drawArms();
  // The torso: broad shoulders close to the camera, cropped at the bottom; then the neck and head.
  poly(g, [[x - 19, top + 25], [x + 19, top + 25], [x + 17, CARVER_H + 2], [x - 17, CARVER_H + 2]], 'b');
  disc(g, x - 16, top + 29, 5, 5, 'b');
  disc(g, x + 16, top + 29, 5, 5, 'b');
  poly(g, [[x - 4 + headDx / 2, top + 17 + headDy], [x + 4 + headDx / 2, top + 17 + headDy], [x + 5, top + 27], [x - 5, top + 27]], 'b');
  if (!forward) drawArms();
  const hx = x + headDx;
  const hy = top + 11 + headDy;
  disc(g, hx, hy, 8, 9.5, 'h');
  disc(g, hx - 8.5, hy + 2, 1.2, 2, 'h');
  disc(g, hx + 8.5, hy + 2, 1.2, 2, 'h');
  light(g, 'b');
  light(g, 'a');
  light(g, 'h');
  // Hair: strands catching the light, and a few darker locks.
  for (let i = 0; i < 4; i++) put(g, hx + 2 + i, hy - 8 + i, '#');
  for (let i = 0; i < 3; i++) put(g, hx - 3 + i * 2, hy + 6, 'm');
  // The collar, and the line of your shoulder blades under the shirt.
  for (let i = -6; i <= 6; i++) put(g, x + i, top + 27 + (Math.abs(i) > 4 ? 1 : 0), 'e');
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) put(g, x + side * (8 + (i > 3 ? 1 : 0)), top + 33 + i, 'm');
  // Shirt folds across the back.
  for (const fy of [42, 50]) for (let i = -10; i <= 10; i += 3) put(g, x + i + (fy === 50 ? 1 : 0), top + fy + (Math.abs(i) > 7 ? 1 : 0), 'm');
  // The bandaged left hand (screen left, seen from behind), where it shows.
  if (!forward) {
    const hand = left[left.length - 1]!;
    disc(g, hand[0], hand[1], 2.4, 2.4, 'w');
    put(g, hand[0] - 1, hand[1] - 1, 'W');
    put(g, hand[0] + 1, hand[1] + 1, 'l');
  }
  // The red thread, knotted at the back of the neck, hanging down your back.
  const knot: Pt = [x + headDx / 3, top + 22 + headDy / 2];
  disc(g, knot[0], knot[1], 1.4, 1.1, 'r');
  const sway = pose === 'dodge' ? 3 : pose === 'hit' || pose === 'slap' ? -3 : pose === 'attack' ? -2 : 0;
  for (let i = 1; i <= 22; i++) put(g, knot[0] + Math.round(Math.sin(i / 4) * 1.2 + (sway * i) / 22), knot[1] + i, i % 7 === 0 ? 'R' : 'r');
  return { rows: rows(g), colours: { ...FIGURE, w: SHADES.light, W: SHADES.white, l: SHADES.dim, r: SHADES.red, R: SHADES.redDark } };
}

export const CARVER_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(CARVER_POSES.map((p) => [p, carverBack(p)])) as Record<CarverPose, RowSprite>;

// --- The young zealot, facing you ---
// A young man like the one in the market (designer: a person, not a creature): bare-headed with short
// dark hair, his face showing, a dark tunic with its folds, the zealot's pale stole and the green band of
// the rite, hands, legs and feet. Lit like the area figures, a pale outline round a dark body.

export type FoePose = 'idle' | 'breathe' | 'squared' | 'shift' | 'windup' | 'attack' | 'cockL' | 'cockR' | 'reach' | 'glance' | 'jeer' | 'hit' | 'wobble' | 'down';
export const FOE_POSES: FoePose[] = ['idle', 'breathe', 'squared', 'shift', 'windup', 'attack', 'cockL', 'cockR', 'reach', 'glance', 'jeer', 'hit', 'wobble', 'down'];
const FOE_W = 48;
const FOE_H = 68;

interface FoeShape {
  lean: number;
  bob: number;
  /** Feet: [screen-left, screen-right] x, relative to the centre. */
  feet: [number, number];
  /** His right arm (screen left) and left arm (screen right): shoulder → elbow → hand; hand sizes. */
  right: [Pt, Pt];
  left: [Pt, Pt];
  hands: [number, number];
  /** The head: offset, and where he's looking (-1 left, 0 at you, 1 right). */
  head: [number, number];
  look: number;
  mouth: 'sneer' | 'open' | 'grit';
}

const FOE: Record<Exclude<FoePose, 'down'>, FoeShape> = {
  idle: { lean: 0, bob: 0, feet: [-5, 5], right: [[-13, 31], [-12, 41]], left: [[13, 31], [12, 41]], hands: [2.2, 2.2], head: [0, 0], look: 0, mouth: 'sneer' },
  breathe: { lean: 0, bob: 1, feet: [-5, 5], right: [[-13, 31], [-12, 41]], left: [[13, 31], [12, 41]], hands: [2.2, 2.2], head: [0, 0], look: 0, mouth: 'sneer' },
  // Fists up in front of his chest, feet apart: a swing (or two) coming.
  squared: { lean: 0, bob: 1, feet: [-8, 8], right: [[-15, 30], [-6, 23]], left: [[15, 30], [6, 24]], hands: [2.6, 2.6], head: [0, 1], look: 0, mouth: 'grit' },
  // Weight back on his heels, one fist low by his hip.
  shift: { lean: 3, bob: -1, feet: [-6, 7], right: [[-15, 30], [-13, 38]], left: [[14, 32], [11, 40]], hands: [2.6, 2.2], head: [2, -1], look: 0, mouth: 'grit' },
  windup: { lean: 3, bob: 1, feet: [-7, 7], right: [[-18, 18], [-15, 7]], left: [[14, 28], [7, 30]], hands: [3, 2.4], head: [1, 0], look: 0, mouth: 'grit' },
  attack: { lean: -4, bob: 2, feet: [-9, 9], right: [[-14, 27], [-17, 36]], left: [[13, 30], [13, 39]], hands: [4.6, 2.4], head: [-2, 1], look: 0, mouth: 'open' },
  // An arm drawn back out wide on one side: the blow will come from there.
  cockL: { lean: -2, bob: 1, feet: [-8, 7], right: [[-19, 23], [-19, 13]], left: [[13, 30], [7, 28]], hands: [3, 2.4], head: [-1, 0], look: -1, mouth: 'grit' },
  cockR: { lean: 2, bob: 1, feet: [-7, 8], right: [[-13, 30], [-7, 28]], left: [[19, 23], [19, 13]], hands: [2.4, 3], head: [1, 0], look: 1, mouth: 'grit' },
  // Leaning in, hands open and reaching for you.
  reach: { lean: 0, bob: 2, feet: [-6, 6], right: [[-14, 30], [-8, 36]], left: [[14, 30], [8, 36]], hands: [3.4, 3.4], head: [0, 2], look: 0, mouth: 'sneer' },
  // Looking round at the crowd, a hand on his hip.
  glance: { lean: 1, bob: 0, feet: [-5, 6], right: [[-13, 31], [-12, 41]], left: [[16, 30], [11, 36]], hands: [2.2, 2.2], head: [3, 0], look: 1, mouth: 'open' },
  jeer: { lean: 0, bob: -1, feet: [-6, 6], right: [[-16, 13], [-15, 3]], left: [[16, 13], [15, 3]], hands: [2.4, 2.4], head: [0, -1], look: 0, mouth: 'open' },
  hit: { lean: 4, bob: -1, feet: [-7, 7], right: [[-17, 24], [-21, 17]], left: [[17, 25], [20, 19]], hands: [2.2, 2.2], head: [2, -2], look: 0, mouth: 'open' },
  // Arms out wide, windmilling for balance, his feet crossing.
  wobble: { lean: 5, bob: 2, feet: [2, 9], right: [[-18, 20], [-22, 12]], left: [[18, 26], [22, 32]], hands: [2.2, 2.2], head: [2, 0], look: -1, mouth: 'open' },
};

function zealot(pose: Exclude<FoePose, 'down'>): RowSprite {
  const f = FOE[pose];
  const g = grid(FOE_W, FOE_H);
  const cx = 24;
  const x = cx + f.lean;
  const top = 2 + f.bob;
  const hip = 42;
  // Legs and feet.
  const [lf, rf] = f.feet;
  limb(g, [[cx - 4, hip], [cx + lf * 0.8, 55], [cx + lf, FOE_H - 3]], 2.6, 'l');
  limb(g, [[cx + 4, hip], [cx + rf * 0.8, 55], [cx + rf, FOE_H - 3]], 2.6, 'l');
  disc(g, cx + lf - 1, FOE_H - 2, 3, 1.4, 'l');
  disc(g, cx + rf + 1, FOE_H - 2, 3, 1.4, 'l');
  // The tunic: shoulders to hips, flaring a little at the hem.
  poly(g, [[x - 10, top + 16], [x + 10, top + 16], [cx + 8, hip + 3], [cx - 8, hip + 3]], 't');
  disc(g, x - 9, top + 19, 3, 3, 't');
  disc(g, x + 9, top + 19, 3, 3, 't');
  // Arms (sleeves) and hands.
  const rs: Pt = [x - 10, top + 19];
  const ls: Pt = [x + 10, top + 19];
  const at = (p: Pt): Pt => [x + p[0], top + p[1]];
  limb(g, [rs, at(f.right[0]), at(f.right[1])], 2.2, 'a');
  limb(g, [ls, at(f.left[0]), at(f.left[1])], 2.2, 'a');
  // The neck and head: short dark hair over a face you can see.
  const hx = x + f.head[0];
  const hy = top + 8 + f.head[1];
  poly(g, [[hx - 2, hy + 5], [hx + 2, hy + 5], [x + 3, top + 17], [x - 3, top + 17]], 'n');
  disc(g, hx, hy, 6, 7, 'h');
  light(g, 'l');
  light(g, 't', 'm');
  light(g, 'a');
  light(g, 'n', 'k');
  light(g, 'h');
  // The face (the hair stays round the top and sides).
  disc(g, hx + f.look * 0.6, hy + 1.6, 4.4, 5, 'K');
  for (let i = -3; i <= 3; i++) put(g, hx + f.look * 0.6 + i, hy + 6.4, 'K');
  // Shading down the face's unlit (left) side, an ear on the lit side.
  for (let y = -2; y <= 5; y++) put(g, hx + f.look * 0.6 - 4, hy + 1.6 + y, 'k');
  put(g, hx + 6, hy + 2, 'K');
  // Brows, eyes (looking where he looks), nose, mouth: simple, dark, not glowing.
  const ex = hx + f.look * 1.2;
  put(g, ex - 2, hy, 'y');
  put(g, ex + 2, hy, 'y');
  put(g, ex - 3, hy - 1, 'y');
  put(g, ex + 3, hy - 1, 'y');
  put(g, ex + 0.5, hy + 2, 'k');
  if (f.mouth === 'open') limb(g, [[ex - 1, hy + 4.5], [ex + 1, hy + 4.5]], 0.6, 'y');
  else if (f.mouth === 'grit') for (let i = -2; i <= 2; i++) put(g, ex + i, hy + 4.5, 'y');
  else {
    put(g, ex - 1, hy + 4.5, 'y');
    put(g, ex, hy + 4.5, 'y');
    put(g, ex + 1, hy + 3.8, 'y');
  }
  // Hands, bare (bigger when coming at you).
  for (const [arm, r] of [[f.right, f.hands[0]], [f.left, f.hands[1]]] as const) {
    const h = at(arm[1]);
    disc(g, h[0], h[1], r, r, 'K');
    put(g, h[0] - r + 0.4, h[1], 'k');
  }
  // Tunic folds, the zealot's stole down his chest, the green band of the rite, a belt.
  for (const [fx, fy, len] of [[-5, 26, 6], [4, 30, 7], [-2, 35, 5]] as const) for (let i = 0; i < len; i++) put(g, x + fx + Math.round(i * 0.2), top + fy + i, 'f');
  for (let y = top + 17; y <= hip + 6; y++) {
    const dx = Math.round(((y - top) * -f.lean) / 60);
    put(g, x - 4 + dx, y, 'S');
    put(g, x + 4 + dx, y, y % 3 ? 'S' : 's');
  }
  for (let i = -8; i <= 8; i++) put(g, x + i, top + 23, i > 5 ? 'C' : 'c');
  for (let i = -7; i <= 7; i++) put(g, cx + i, hip, i > 4 ? 'B' : 'u');
  return { rows: rows(g), colours: { ...FIGURE, K: SHADES.woodPale, k: SHADES.dim, y: SHADES.deep, f: SHADES.woodLight, S: SHADES.woodPale, s: SHADES.dim, c: SHADES.greenDeep, C: SHADES.greenMid, u: SHADES.amberDeep, B: SHADES.amber } };
}

/** Flat on his back on the boards, head to the left, one knee up, an arm flung out. */
function zealotDown(): RowSprite {
  const W = 76;
  const H = 24;
  const g = grid(W, H);
  const floor = H - 2;
  // Legs, one knee bent up.
  limb(g, [[46, floor - 4], [58, floor - 11], [68, floor - 2]], 2.6, 'l');
  limb(g, [[46, floor - 2], [62, floor - 1], [72, floor - 1]], 2.6, 'l');
  // Body, lying along the floor.
  poly(g, [[14, floor - 10], [46, floor - 7], [48, floor + 1], [14, floor + 1]], 't');
  // An arm flung out over his head, the other on the boards.
  limb(g, [[18, floor - 9], [11, floor - 15], [5, floor - 18]], 2.2, 'a');
  limb(g, [[30, floor - 6], [35, floor - 1], [40, floor]], 2.2, 'a');
  // Head.
  disc(g, 9, floor - 5, 6, 5.5, 'h');
  light(g, 'l');
  light(g, 't', 'm');
  light(g, 'a');
  light(g, 'h');
  // His face, turned up and to you; hands.
  disc(g, 9, floor - 6, 3.4, 3.2, 'K');
  put(g, 8, floor - 7, 'y');
  put(g, 11, floor - 7, 'y');
  for (let i = 0; i < 3; i++) put(g, 8 + i, floor - 4, 'y');
  disc(g, 5, floor - 18, 2, 2, 'K');
  disc(g, 40, floor, 2, 1.5, 'K');
  // The stole across his chest, the band.
  for (let x = 16; x <= 44; x++) put(g, x, floor - 5 + (x > 30 ? 1 : 0), 'S');
  for (let y = floor - 9; y <= floor; y++) put(g, 26, y, 'c');
  return { rows: rows(g), colours: { ...FIGURE, K: SHADES.woodPale, y: SHADES.deep, S: SHADES.woodPale, c: SHADES.greenDeep } };
}

export const ZEALOT_BATTLE: Record<FoePose, RowSprite> = {
  ...(Object.fromEntries(FOE_POSES.filter((p) => p !== 'down').map((p) => [p, zealot(p as Exclude<FoePose, 'down'>)])) as Record<Exclude<FoePose, 'down'>, RowSprite>),
  down: zealotDown(),
};

/** A sprite as a silhouette: everything dark, with a pale outline (cut-ins). */
export function silhouette(s: RowSprite): RowSprite {
  const g = s.rows.map((r) => [...r].map((c) => (c === '.' ? '.' : 'o')));
  const empty = (x: number, y: number) => (g[y]?.[x] ?? '.') === '.';
  const out = g.map((row, y) => row.map((c, x) => (c === 'o' && (empty(x - 1, y) || empty(x + 1, y) || empty(x, y - 1) || empty(x, y + 1)) ? '#' : c)));
  return { rows: out.map((r) => r.join('')), colours: { o: SHADES.shadow, '#': SHADES.white } };
}
