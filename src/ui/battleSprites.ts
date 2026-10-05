import { SHADES } from './pixelArt';
import type { RowSprite } from './sprites';

// PLACEHOLDER battle sprites until the art pass: bigger and more detailed than the figures in the areas
// (about 2½ times their height), for the combat stage's 3/4 framing (docs/combat-design.md). You're seen
// from behind, over the shoulder, close to the camera and cropped at the waist; the enemy stands further
// back, facing you. Each is built from a few shapes (discs, thick limbs, polygons) per pose, then lit
// like everyone else: a pale rim on the right, a faint edge on the left. Red only on your thread.

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

/** Rim light on the right edge of the body, a faint edge on the left and top. Only touches `body` pixels. */
function light(g: Grid, body = 'o'): void {
  const empty = (x: number, y: number) => (g[y]?.[x] ?? '.') === '.';
  const marks: [number, number, string][] = [];
  g.forEach((row, y) => row.forEach((c, x) => {
    if (c !== body) return;
    if (empty(x + 1, y) || (empty(x + 1, y - 1) && empty(x, y - 1))) marks.push([x, y, '#']);
    else if (empty(x - 1, y) || empty(x, y - 1)) marks.push([x, y, 'e']);
  }));
  for (const [x, y, c] of marks) g[y]![x] = c;
}

const rows = (g: Grid) => g.map((r) => r.join(''));

// --- The carver, from behind ---

export type CarverPose = 'idle' | 'breathe' | 'ready' | 'dodge' | 'attack' | 'guard' | 'hit';
const CARVER_W = 52;
const CARVER_H = 62;

function carverBack(pose: CarverPose): RowSprite {
  const g = grid(CARVER_W, CARVER_H);
  const cx = 26;
  // How the upper body shifts and where the head sits, by pose.
  const shift = { idle: 0, breathe: 0, ready: 0, dodge: -7, attack: 3, guard: 0, hit: 4 }[pose];
  const bob = { idle: 0, breathe: 1, ready: 2, dodge: 2, attack: -1, guard: 3, hit: 1 }[pose];
  const headDx = { idle: 1, breathe: 1, ready: 1, dodge: -3, attack: 3, guard: 0, hit: 6 }[pose];
  const x = cx + shift;
  const top = 2 + bob;
  // Arms first (behind the body where they cross it).
  const ls: Pt = [x - 18, top + 28];
  const rs: Pt = [x + 18, top + 28];
  const arms: Record<CarverPose, [Pt[], Pt[]]> = {
    idle: [[ls, [x - 21, top + 42], [x - 21, top + 56]], [rs, [x + 21, top + 42], [x + 21, top + 56]]],
    breathe: [[ls, [x - 21, top + 42], [x - 21, top + 56]], [rs, [x + 21, top + 42], [x + 21, top + 56]]],
    ready: [[ls, [x - 23, top + 38], [x - 17, top + 30]], [rs, [x + 23, top + 38], [x + 17, top + 30]]],
    dodge: [[ls, [x - 23, top + 40], [x - 24, top + 52]], [rs, [x + 22, top + 36], [x + 14, top + 28]]],
    attack: [[ls, [x - 22, top + 40], [x - 20, top + 52]], [rs, [x + 22, top + 18], [x + 18, top + 4]]],
    guard: [[ls, [x - 24, top + 30], [x - 14, top + 20]], [rs, [x + 24, top + 30], [x + 14, top + 20]]],
    hit: [[ls, [x - 25, top + 34], [x - 30, top + 26]], [rs, [x + 24, top + 40], [x + 26, top + 54]]],
  };
  const [left, right] = arms[pose];
  limb(g, left, 3.2, 'o');
  limb(g, right, 3.2, 'o');
  // The torso: broad shoulders close to the camera, cropped at the bottom.
  poly(g, [[x - 19, top + 25], [x + 19, top + 25], [x + 17, CARVER_H + 2], [x - 17, CARVER_H + 2]], 'o');
  disc(g, x - 16, top + 29, 5, 5, 'o');
  disc(g, x + 16, top + 29, 5, 5, 'o');
  // Neck and head (the back of it: dark hair).
  poly(g, [[x - 4 + headDx / 2, top + 17], [x + 4 + headDx / 2, top + 17], [x + 5, top + 27], [x - 5, top + 27]], 'o');
  disc(g, x + headDx, top + 11, 8, 9.5, 'o');
  // The ears.
  disc(g, x + headDx - 8.5, top + 13, 1.2, 2, 'o');
  disc(g, x + headDx + 8.5, top + 13, 1.2, 2, 'o');
  light(g);
  // Hair: a few strands of the rim catch the light.
  for (let i = 0; i < 4; i++) put(g, x + headDx + 2 + i, top + 3 + i, '#');
  // The bandaged left hand (screen left, seen from behind), where it shows: hanging at your side, not
  // raised in front of you.
  const hand = left[left.length - 1]!;
  if (pose !== 'ready' && pose !== 'guard') {
    disc(g, hand[0], hand[1], 2.4, 2.4, 'h');
    put(g, hand[0] - 1, hand[1] - 1, 'H');
  }
  // The red thread, knotted at the back of the neck, hanging down your back.
  const knot: Pt = [x + headDx / 3, top + 22];
  disc(g, knot[0], knot[1], 1.4, 1.1, 'r');
  const sway = pose === 'dodge' ? 3 : pose === 'hit' ? -3 : pose === 'attack' ? -2 : 0;
  for (let i = 1; i <= 22; i++) put(g, knot[0] + Math.round(Math.sin(i / 4) * 1.2 + (sway * i) / 22), knot[1] + i, i % 7 === 0 ? 'R' : 'r');
  // Shirt folds across the back.
  for (const fy of [36, 44]) for (let i = -9; i <= 9; i += 3) put(g, x + i + (fy === 44 ? 1 : 0), top + fy + (Math.abs(i) > 6 ? 1 : 0), 'f');
  return { rows: rows(g), colours: { o: SHADES.shadow, e: SHADES.woodLight, '#': SHADES.dim, f: SHADES.deep, h: SHADES.light, H: SHADES.white, r: SHADES.red, R: SHADES.redDark } };
}

export const CARVER_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(
  (['idle', 'breathe', 'ready', 'dodge', 'attack', 'guard', 'hit'] as const).map((p) => [p, carverBack(p)]),
) as Record<CarverPose, RowSprite>;

// --- The young zealot, facing you ---

export type FoePose = 'idle' | 'breathe' | 'windup' | 'attack' | 'hit' | 'jeer' | 'down';
const FOE_W = 44;
const FOE_H = 68;

function zealot(pose: FoePose): RowSprite {
  const g = grid(FOE_W, FOE_H);
  const cx = 22;
  const lean = { idle: 0, breathe: 0, windup: 3, attack: -4, hit: 4, jeer: 0, down: 0 }[pose];
  const bob = { idle: 0, breathe: 1, windup: 1, attack: 2, hit: -1, jeer: -1, down: 0 }[pose];
  const x = cx + lean;
  const top = 2 + bob;
  const hip = 42;
  // Legs, apart; bent when he lunges or reels.
  const stance = pose === 'attack' ? 7 : pose === 'hit' ? 5 : 4;
  limb(g, [[cx - 4, hip], [cx - stance - 1, 55], [cx - stance - 1, FOE_H - 3]], 2.6, 'o');
  limb(g, [[cx + 4, hip], [cx + stance, 55], [cx + stance + 1, FOE_H - 3]], 2.6, 'o');
  disc(g, cx - stance - 2, FOE_H - 2, 3, 1.4, 'o');
  disc(g, cx + stance + 2, FOE_H - 2, 3, 1.4, 'o');
  // Arms: his right is on the screen's left. Fists are big discs (bigger when coming at you).
  const rs: Pt = [x - 10, top + 20];
  const ls: Pt = [x + 10, top + 20];
  const arms: Record<FoePose, [Pt[], Pt[], number, number]> = {
    idle: [[rs, [x - 13, top + 31], [x - 12, top + 41]], [ls, [x + 13, top + 31], [x + 12, top + 41]], 2.6, 2.6],
    breathe: [[rs, [x - 13, top + 31], [x - 12, top + 41]], [ls, [x + 13, top + 31], [x + 12, top + 41]], 2.6, 2.6],
    windup: [[rs, [x - 18, top + 18], [x - 15, top + 7]], [ls, [x + 14, top + 28], [x + 7, top + 30]], 3.4, 2.6],
    attack: [[rs, [x - 14, top + 27], [x - 17, top + 36]], [ls, [x + 13, top + 30], [x + 13, top + 39]], 5.2, 2.6],
    hit: [[rs, [x - 17, top + 24], [x - 21, top + 17]], [ls, [x + 17, top + 25], [x + 20, top + 19]], 2.6, 2.6],
    jeer: [[rs, [x - 16, top + 13], [x - 15, top + 3]], [ls, [x + 16, top + 13], [x + 15, top + 3]], 2.6, 2.6],
    down: [[rs, [x - 13, top + 31], [x - 12, top + 41]], [ls, [x + 13, top + 31], [x + 12, top + 41]], 2.6, 2.6],
  };
  const [right, left, rFist, lFist] = arms[pose];
  limb(g, right, 2.2, 'o');
  limb(g, left, 2.2, 'o');
  disc(g, right[2]![0], right[2]![1], rFist, rFist, 'o');
  disc(g, left[2]![0], left[2]![1], lFist, lFist, 'o');
  // Torso and hips.
  poly(g, [[x - 10, top + 17], [x + 10, top + 17], [cx + 6, hip + 1], [cx - 6, hip + 1]], 'o');
  disc(g, x - 9, top + 20, 3, 3, 'o');
  disc(g, x + 9, top + 20, 3, 3, 'o');
  // The hood, and his head inside it (tilted back when hit).
  const hx = x + (pose === 'hit' ? 2 : pose === 'attack' ? -2 : 0);
  const hy = top + (pose === 'hit' ? 7 : 9);
  disc(g, hx, hy, 7.5, 8.5, 'o');
  poly(g, [[hx - 8, hy + 2], [hx + 8, hy + 2], [x + 11, top + 19], [x - 11, top + 19]], 'o');
  light(g);
  // The face in the hood's shadow: pale eyes and a sneer.
  disc(g, hx, hy + 2, 4, 4.8, 'F');
  const eyes = pose === 'hit' ? 'k' : 'l';
  put(g, hx - 2, hy + 1, eyes);
  put(g, hx + 2, hy + 1, eyes);
  if (pose === 'jeer') limb(g, [[hx - 2, hy + 5], [hx + 2, hy + 5]], 0.6, 'k');
  else {
    put(g, hx - 1, hy + 5, 'k');
    put(g, hx, hy + 5, 'k');
    put(g, hx + 1, hy + 4, 'k');
  }
  // The zealot's stole hanging down both sides of his chest, and the green band of the rite.
  for (let y = top + 18; y <= hip + 6; y++) {
    put(g, x - 4 + Math.round(((y - top) * -lean) / 60), y, 'S');
    put(g, x + 4 + Math.round(((y - top) * -lean) / 60), y, 'S');
  }
  for (let i = -8; i <= 8; i++) put(g, x + i, top + 24, 'c');
  for (let i = -6; i <= 6; i++) put(g, cx + i, hip - 1, 'b');
  return { rows: rows(g), colours: { o: SHADES.shadow, e: SHADES.woodLight, '#': SHADES.dim, F: SHADES.deep, l: SHADES.light, k: SHADES.woodPale, S: SHADES.woodPale, c: SHADES.greenDeep, b: SHADES.amberDeep } };
}

export const ZEALOT_BATTLE: Record<FoePose, RowSprite> = Object.fromEntries(
  (['idle', 'breathe', 'windup', 'attack', 'hit', 'jeer', 'down'] as const).map((p) => [p, zealot(p)]),
) as Record<FoePose, RowSprite>;

/** A sprite as a silhouette: everything dark, with a pale outline (cut-ins). */
export function silhouette(s: RowSprite): RowSprite {
  const g = s.rows.map((r) => [...r].map((c) => (c === '.' ? '.' : 'o')));
  const empty = (x: number, y: number) => (g[y]?.[x] ?? '.') === '.';
  const out = g.map((row, y) => row.map((c, x) => (c === 'o' && (empty(x - 1, y) || empty(x + 1, y) || empty(x, y - 1) || empty(x, y + 1)) ? '#' : c)));
  return { rows: out.map((r) => r.join('')), colours: { o: SHADES.shadow, '#': SHADES.white } };
}
