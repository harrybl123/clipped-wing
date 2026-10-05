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
 * Lights one part (every pixel marked `part`): amber where the lamps catch its top-right corners, a pale
 * rim down its right, a mid-tone just inside the rim, a faint edge on its left and top, and a faint seam
 * where it crosses another part, so a limb in front of the body still reads.
 */
function light(g: Grid, part: string): void {
  const at = (x: number, y: number) => g[y]?.[x] ?? '.';
  const empty = (x: number, y: number) => at(x, y) === '.';
  const other = (x: number, y: number) => !empty(x, y) && at(x, y) !== part;
  const marks: [number, number, string][] = [];
  g.forEach((row, y) => row.forEach((c, x) => {
    if (c !== part) return;
    let mark = 'o';
    if (empty(x + 1, y) && empty(x, y - 1)) mark = 'A'; // a top-right corner, where the lamps catch
    else if (empty(x + 1, y)) mark = '#';
    else if (empty(x, y - 1)) mark = empty(x + 2, y - 1) && empty(x + 1, y - 1) ? 'A' : 'e';
    else if (empty(x - 1, y)) mark = 'e';
    else if (other(x + 1, y)) mark = 'e'; // where a part crosses another: a faint seam
    else if (empty(x + 2, y)) mark = 'm';
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

export type FoePose = 'idle' | 'breathe' | 'windup' | 'attack' | 'hit' | 'jeer' | 'wobble' | 'down';
export const FOE_POSES: FoePose[] = ['idle', 'breathe', 'windup', 'attack', 'hit', 'jeer', 'wobble', 'down'];
const FOE_W = 46;
const FOE_H = 68;

function zealot(pose: Exclude<FoePose, 'down'>): RowSprite {
  const g = grid(FOE_W, FOE_H);
  const cx = 23;
  const lean = { idle: 0, breathe: 0, windup: 3, attack: -4, hit: 4, jeer: 0, wobble: 5 }[pose];
  const bob = { idle: 0, breathe: 1, windup: 1, attack: 2, hit: -1, jeer: -1, wobble: 2 }[pose];
  const x = cx + lean;
  const top = 2 + bob;
  const hip = 42;
  // Legs, apart; bent when he lunges or reels; crossed and staggering off balance.
  const stance = pose === 'attack' ? 7 : pose === 'hit' ? 5 : 4;
  const [lFoot, rFoot]: [number, number] = pose === 'wobble' ? [cx + 2, cx + 9] : [cx - stance - 1, cx + stance + 1];
  limb(g, [[cx - 4, hip], [lFoot + 1, 55], [lFoot, FOE_H - 3]], 2.6, 'l');
  limb(g, [[cx + 4, hip], [rFoot - 1, 55], [rFoot, FOE_H - 3]], 2.6, 'l');
  disc(g, lFoot - 1, FOE_H - 2, 3, 1.4, 'l');
  disc(g, rFoot + 1, FOE_H - 2, 3, 1.4, 'l');
  // Torso and hips.
  poly(g, [[x - 10, top + 17], [x + 10, top + 17], [cx + 6, hip + 1], [cx - 6, hip + 1]], 'b');
  disc(g, x - 9, top + 20, 3, 3, 'b');
  disc(g, x + 9, top + 20, 3, 3, 'b');
  // Arms: his right is on the screen's left. Fists are big discs (bigger when coming at you).
  const rs: Pt = [x - 10, top + 20];
  const ls: Pt = [x + 10, top + 20];
  const arms: Record<typeof pose, [Pt[], Pt[], number, number]> = {
    idle: [[rs, [x - 13, top + 31], [x - 12, top + 41]], [ls, [x + 13, top + 31], [x + 12, top + 41]], 2.6, 2.6],
    breathe: [[rs, [x - 13, top + 31], [x - 12, top + 41]], [ls, [x + 13, top + 31], [x + 12, top + 41]], 2.6, 2.6],
    windup: [[rs, [x - 18, top + 18], [x - 15, top + 7]], [ls, [x + 14, top + 28], [x + 7, top + 30]], 3.4, 2.6],
    attack: [[rs, [x - 14, top + 27], [x - 17, top + 36]], [ls, [x + 13, top + 30], [x + 13, top + 39]], 5.2, 2.6],
    hit: [[rs, [x - 17, top + 24], [x - 21, top + 17]], [ls, [x + 17, top + 25], [x + 20, top + 19]], 2.6, 2.6],
    jeer: [[rs, [x - 16, top + 13], [x - 15, top + 3]], [ls, [x + 16, top + 13], [x + 15, top + 3]], 2.6, 2.6],
    // Arms out wide, windmilling for balance.
    wobble: [[rs, [x - 18, top + 20], [x - 22, top + 12]], [ls, [x + 18, top + 26], [x + 22, top + 32]], 2.6, 2.6],
  };
  const [right, left, rFist, lFist] = arms[pose];
  limb(g, right, 2.2, 'a');
  limb(g, left, 2.2, 'a');
  disc(g, right[2]![0], right[2]![1], rFist, rFist, 'a');
  disc(g, left[2]![0], left[2]![1], lFist, lFist, 'a');
  // The hood, and his head inside it (tilted back when hit).
  const hx = x + (pose === 'hit' ? 2 : pose === 'attack' ? -2 : pose === 'wobble' ? 2 : 0);
  const hy = top + (pose === 'hit' ? 7 : 9);
  disc(g, hx, hy, 7.5, 8.5, 'h');
  poly(g, [[hx - 8, hy + 2], [hx + 8, hy + 2], [x + 11, top + 19], [x - 11, top + 19]], 'h');
  for (const part of ['l', 'b', 'a', 'h']) light(g, part);
  // The face in the hood's shadow: pale eyes and a sneer.
  disc(g, hx, hy + 2, 4, 4.8, 'F');
  put(g, hx - 1, hy - 1, 'm');
  const eyes = pose === 'hit' || pose === 'wobble' ? 'k' : 'L';
  put(g, hx - 2, hy + 1, eyes);
  put(g, hx + 2, hy + 1, eyes);
  if (pose === 'jeer' || pose === 'wobble') limb(g, [[hx - 2, hy + 5], [hx + 2, hy + 5]], 0.6, 'k');
  else {
    put(g, hx - 1, hy + 5, 'k');
    put(g, hx, hy + 5, 'k');
    put(g, hx + 1, hy + 4, 'k');
  }
  // The zealot's stole hanging down both sides of his chest, the green band of the rite, a belt.
  for (let y = top + 18; y <= hip + 6; y++) {
    const dx = Math.round(((y - top) * -lean) / 60);
    put(g, x - 4 + dx, y, 'S');
    put(g, x + 4 + dx, y, y % 3 ? 'S' : 's');
  }
  for (let i = -8; i <= 8; i++) put(g, x + i, top + 24, i > 5 ? 'C' : 'c');
  for (let i = -6; i <= 6; i++) put(g, cx + i, hip - 1, i > 3 ? 'B' : 'u');
  return { rows: rows(g), colours: { ...FIGURE, F: SHADES.deep, L: SHADES.light, k: SHADES.woodPale, S: SHADES.woodPale, s: SHADES.dim, c: SHADES.greenDeep, C: SHADES.greenMid, u: SHADES.amberDeep, B: SHADES.amber } };
}

/** Flat on his back on the boards, head (in its hood) to the left, one knee up, an arm flung out. */
function zealotDown(): RowSprite {
  const W = 76;
  const H = 24;
  const g = grid(W, H);
  const floor = H - 2;
  // Legs, one knee bent up.
  limb(g, [[44, floor - 4], [58, floor - 11], [68, floor - 2]], 2.6, 'l');
  limb(g, [[44, floor - 2], [62, floor - 1], [72, floor - 1]], 2.6, 'l');
  // Body, lying along the floor.
  poly(g, [[14, floor - 9], [44, floor - 7], [46, floor + 1], [14, floor + 1]], 'b');
  // An arm flung out over his head, the other on the boards.
  limb(g, [[18, floor - 8], [10, floor - 15], [4, floor - 18]], 2.2, 'a');
  limb(g, [[30, floor - 6], [34, floor - 1], [40, floor]], 2.2, 'a');
  // Head and hood.
  disc(g, 10, floor - 4, 7, 5.5, 'h');
  for (const part of ['l', 'b', 'a', 'h']) light(g, part);
  disc(g, 10, floor - 5, 3.5, 2.6, 'F');
  put(g, 9, floor - 6, 'k');
  put(g, 11, floor - 6, 'k');
  // The stole across his chest, the band.
  for (let x = 16; x <= 42; x++) put(g, x, floor - 5 + (x > 30 ? 1 : 0), 'S');
  for (let y = floor - 8; y <= floor; y++) put(g, 26, y, 'c');
  return { rows: rows(g), colours: { ...FIGURE, F: SHADES.deep, k: SHADES.woodPale, S: SHADES.woodPale, c: SHADES.greenDeep } };
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
