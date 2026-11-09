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

export type CarverPose = 'idle' | 'breathe' | 'ready' | 'dodge' | 'attack' | 'slap' | 'palm' | 'shove' | 'grab' | 'guard' | 'hit';
export const CARVER_POSES: CarverPose[] = ['idle', 'breathe', 'ready', 'dodge', 'attack', 'slap', 'palm', 'shove', 'grab', 'guard', 'hit'];
const CARVER_W = 56;
const CARVER_H = 62;

function carverBack(pose: CarverPose, who: 'carver' | 'girl' = 'carver'): RowSprite {
  const g = grid(CARVER_W, CARVER_H);
  const cx = 28;
  // How the upper body shifts and where the head sits, by pose.
  const shift = { idle: 0, breathe: 0, ready: 0, dodge: -7, attack: 3, slap: 4, palm: -4, shove: 0, grab: 0, guard: 0, hit: 4 }[pose];
  const bob = { idle: 0, breathe: 1, ready: 2, dodge: 2, attack: -1, slap: 0, palm: 0, shove: -2, grab: 4, guard: 3, hit: 1 }[pose];
  const headDx = { idle: 1, breathe: 1, ready: 1, dodge: -3, attack: 3, slap: 4, palm: -3, shove: 0, grab: 0, guard: 0, hit: 6 }[pose];
  const headDy = { idle: 0, breathe: 0, ready: 1, dodge: 0, attack: -1, slap: 0, palm: 0, shove: 0, grab: 4, guard: 3, hit: -1 }[pose];
  const x = cx + shift;
  const top = 2 + bob;
  // (The girl is slighter: narrower shoulders.)
  const sw = who === 'girl' ? 14 : 18;
  const ls: Pt = [x - sw, top + 28];
  const rs: Pt = [x + sw, top + 28];
  // Arms: [left, right]; a hand last. Hands in front of you are hidden by your back.
  const arms: Record<CarverPose, [Pt[], Pt[]]> = {
    idle: [[ls, [x - 21, top + 42], [x - 21, top + 56]], [rs, [x + 21, top + 42], [x + 21, top + 56]]],
    breathe: [[ls, [x - 21, top + 42], [x - 21, top + 56]], [rs, [x + 21, top + 42], [x + 21, top + 56]]],
    ready: [[ls, [x - 24, top + 38], [x - 19, top + 31]], [rs, [x + 24, top + 38], [x + 19, top + 31]]],
    dodge: [[ls, [x - 23, top + 40], [x - 24, top + 52]], [rs, [x + 22, top + 36], [x + 15, top + 29]]],
    attack: [[ls, [x - 22, top + 40], [x - 20, top + 52]], [rs, [x + 22, top + 18], [x + 18, top + 4]]],
    // An open hand swung across: the right arm out wide and up.
    slap: [[ls, [x - 22, top + 40], [x - 21, top + 53]], [rs, [x + 27, top + 22], [x + 30, top + 10]]],
    // The heel of the (bandaged) left hand swung across from the other side.
    palm: [[ls, [x - 27, top + 22], [x - 30, top + 10]], [rs, [x + 21, top + 42], [x + 21, top + 55]]],
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
  poly(g, [[x - sw - 1, top + 25], [x + sw + 1, top + 25], [x + sw - 1, CARVER_H + 2], [x - sw + 1, CARVER_H + 2]], 'b');
  disc(g, x - sw + 2, top + 29, 5, 5, 'b');
  disc(g, x + sw - 2, top + 29, 5, 5, 'b');
  poly(g, [[x - 4 + headDx / 2, top + 17 + headDy], [x + 4 + headDx / 2, top + 17 + headDy], [x + 5, top + 27], [x - 5, top + 27]], 'b');
  if (!forward) drawArms();
  const hx = x + headDx;
  const hy = top + 11 + headDy;
  disc(g, hx, hy, 8, 9.5, 'h');
  disc(g, hx - 8.5, hy + 2, 1.2, 2, 'h');
  disc(g, hx + 8.5, hy + 2, 1.2, 2, 'h');
  // The girl's hair: a choppy dark mass over the back of her head, with tufts.
  if (who === 'girl') {
    disc(g, hx, hy - 1, 10, 10.5, 'H');
    for (const [dx, dy, r] of [[-9, 6, 2.2], [9, 5, 2.4], [-5, 11, 2], [6, 11, 2.2], [0, 12, 1.8]] as [number, number, number][]) disc(g, hx + dx, hy + dy, r, r + 1, 'H');
    light(g, 'H');
  }
  light(g, 'b');
  light(g, 'a');
  light(g, 'h');
  // Hair: strands catching the light, and a few darker locks.
  for (let i = 0; i < 4; i++) put(g, hx + 2 + i, hy - 8 + i, '#');
  for (let i = 0; i < 3; i++) put(g, hx - 3 + i * 2, hy + 6, 'm');
  if (who === 'girl' && !forward) {
    // The sliver of bone in her right hand (screen right), held point up and in across her (inside the frame),
    // or, with her arm raised to strike, pointing in over her head.
    const [hx2, hy2] = right[right.length - 1]!;
    const [dx, dy] = hy2 < 20 ? [-0.95, -0.15] : [-0.5, -0.87];
    for (let i = 0; i <= 16; i++) {
      put(g, hx2 + dx * i, hy2 + dy * i, i < 3 ? 'B' : 'W');
      // Thicker along its middle, a pale edge beside the white.
      if (i > 1 && i < 13) put(g, hx2 + dx * i + 1, hy2 + dy * i, i < 4 ? 'B' : 'W');
      if (i > 3 && i < 11) put(g, hx2 + dx * i + 2, hy2 + dy * i, 'B');
    }
  }
  if (who === 'girl') {
    // The glowing green strand, and the fungus-ink tattoos on her forearms.
    for (let i = 0; i < 16; i++) put(g, hx - 4 + Math.round(Math.sin(i / 3)), hy - 8 + i, 'G');
    for (const arm of [left, right]) {
      const [a, b] = [arm[1]!, arm[2]!];
      for (let t = 0.2; t < 1; t += 0.28) put(g, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 'G');
    }
  }
  // The collar, and the line of your shoulder blades under the shirt.
  for (let i = -6; i <= 6; i++) put(g, x + i, top + 27 + (Math.abs(i) > 4 ? 1 : 0), 'e');
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) put(g, x + side * (8 + (i > 3 ? 1 : 0)), top + 33 + i, 'm');
  // Shirt folds across the back.
  for (const fy of [42, 50]) for (let i = -10; i <= 10; i += 3) put(g, x + i + (fy === 50 ? 1 : 0), top + fy + (Math.abs(i) > 7 ? 1 : 0), 'm');
  // The bandaged left hand (screen left, seen from behind), where it shows.
  if (!forward && who === 'carver') {
    const hand = left[left.length - 1]!;
    disc(g, hand[0], hand[1], 2.4, 2.4, 'w');
    put(g, hand[0] - 1, hand[1] - 1, 'W');
    put(g, hand[0] + 1, hand[1] + 1, 'l');
  }
  // The red thread, knotted at the back of the neck, hanging down your back.
  if (who === 'girl') return { rows: rows(g), colours: { ...FIGURE, H: SHADES.shadow, G: SHADES.green, W: SHADES.white, B: SHADES.woodPale } };
  const knot: Pt = [x + headDx / 3, top + 22 + headDy / 2];
  disc(g, knot[0], knot[1], 1.4, 1.1, 'r');
  const sway = pose === 'dodge' || pose === 'palm' ? 3 : pose === 'hit' || pose === 'slap' ? -3 : pose === 'attack' ? -2 : 0;
  for (let i = 1; i <= 22; i++) put(g, knot[0] + Math.round(Math.sin(i / 4) * 1.2 + (sway * i) / 22), knot[1] + i, i % 7 === 0 ? 'R' : 'r');
  return { rows: rows(g), colours: { ...FIGURE, w: SHADES.light, W: SHADES.white, l: SHADES.dim, r: SHADES.red, R: SHADES.redDark } };
}

export const CARVER_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(CARVER_POSES.map((p) => [p, carverBack(p)])) as Record<CarverPose, RowSprite>;

/** The girl, from behind like you: slighter, with a glowing green strand in her dark hair and fungus-ink tattoos. */
export const GIRL_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(CARVER_POSES.map((p) => [p, carverBack(p, 'girl')])) as Record<CarverPose, RowSprite>;

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
  idle: { lean: 0, bob: 0, feet: [-5, 5], right: [[-14, 31], [-13, 43]], left: [[14, 31], [13, 43]], hands: [2.4, 2.4], head: [0, 0], look: 0, mouth: 'sneer' },
  breathe: { lean: 0, bob: 1, feet: [-5, 5], right: [[-14, 31], [-13, 43]], left: [[14, 31], [13, 43]], hands: [2.4, 2.4], head: [0, 0], look: 0, mouth: 'sneer' },
  // Fists up in front of his chest, feet apart: a swing (or two) coming.
  squared: { lean: 0, bob: 1, feet: [-7, 7], right: [[-15, 30], [-6, 24]], left: [[15, 30], [6, 24]], hands: [2.8, 2.8], head: [0, 1], look: 0, mouth: 'grit' },
  // Weight back on his heels, one fist low by his hip.
  shift: { lean: 2, bob: 0, feet: [-6, 6], right: [[-15, 31], [-13, 40]], left: [[15, 31], [12, 42]], hands: [2.8, 2.4], head: [1, 0], look: 0, mouth: 'grit' },
  windup: { lean: 2, bob: 1, feet: [-7, 7], right: [[-18, 19], [-15, 9]], left: [[15, 29], [8, 30]], hands: [3, 2.6], head: [0, 0], look: 0, mouth: 'grit' },
  attack: { lean: -2, bob: 2, feet: [-8, 8], right: [[-14, 28], [-15, 36]], left: [[14, 30], [13, 40]], hands: [4.4, 2.6], head: [-1, 1], look: 0, mouth: 'open' },
  // An arm drawn back out wide on one side: the blow will come from there.
  cockL: { lean: -1, bob: 1, feet: [-7, 6], right: [[-20, 24], [-19, 14]], left: [[14, 30], [8, 28]], hands: [3, 2.6], head: [0, 0], look: -1, mouth: 'grit' },
  cockR: { lean: 1, bob: 1, feet: [-6, 7], right: [[-14, 30], [-8, 28]], left: [[20, 24], [19, 14]], hands: [2.6, 3], head: [0, 0], look: 1, mouth: 'grit' },
  // Leaning in, hands open and reaching for you.
  reach: { lean: 0, bob: 2, feet: [-6, 6], right: [[-14, 30], [-8, 37]], left: [[14, 30], [8, 37]], hands: [3.4, 3.4], head: [0, 1], look: 0, mouth: 'sneer' },
  // Looking round at the crowd, a hand on his hip.
  glance: { lean: 0, bob: 0, feet: [-5, 6], right: [[-14, 31], [-13, 43]], left: [[17, 30], [11, 38]], hands: [2.4, 2.4], head: [1, 0], look: 1, mouth: 'open' },
  jeer: { lean: 0, bob: -1, feet: [-6, 6], right: [[-17, 14], [-16, 4]], left: [[17, 14], [16, 4]], hands: [2.6, 2.6], head: [0, -1], look: 0, mouth: 'open' },
  hit: { lean: 2, bob: -1, feet: [-7, 7], right: [[-18, 25], [-21, 18]], left: [[18, 25], [21, 18]], hands: [2.4, 2.4], head: [1, -1], look: 0, mouth: 'open' },
  // Arms out wide for balance, his feet close.
  wobble: { lean: 2, bob: 1, feet: [-2, 6], right: [[-19, 22], [-22, 15]], left: [[19, 27], [22, 33]], hands: [2.4, 2.4], head: [1, 0], look: -1, mouth: 'open' },
};

function zealot(pose: Exclude<FoePose, 'down'>): RowSprite {
  const f = FOE[pose];
  const g = grid(FOE_W, FOE_H);
  const cx = 24;
  const x = cx + f.lean;
  const top = 2 + f.bob;
  // Hips below the leaning chest (half the lean), legs straight down from them to the feet.
  const hip = 41;
  const hx0 = cx + f.lean / 2;
  const [lf, rf] = f.feet;
  limb(g, [[hx0 - 4, hip], [cx + lf * 0.85, 54], [cx + lf, FOE_H - 3]], 3, 'l');
  limb(g, [[hx0 + 4, hip], [cx + rf * 0.85, 54], [cx + rf, FOE_H - 3]], 3, 'l');
  disc(g, cx + lf - 1, FOE_H - 2, 3.2, 1.5, 'l');
  disc(g, cx + rf + 1, FOE_H - 2, 3.2, 1.5, 'l');
  // The tunic: level shoulders to the hips, flaring a little at the hem.
  poly(g, [[x - 11, top + 16], [x + 11, top + 16], [hx0 + 9, hip + 3], [hx0 - 9, hip + 3]], 't');
  disc(g, x - 10, top + 19, 3.2, 3.2, 't');
  disc(g, x + 10, top + 19, 3.2, 3.2, 't');
  // Arms (sleeves) and hands.
  const rs: Pt = [x - 11, top + 19];
  const ls: Pt = [x + 11, top + 19];
  const at = (p: Pt): Pt => [x + p[0], top + p[1]];
  limb(g, [rs, at(f.right[0]), at(f.right[1])], 2.6, 'a');
  limb(g, [ls, at(f.left[0]), at(f.left[1])], 2.6, 'a');
  // The neck and head, upright over the shoulders: short dark hair over a face you can see.
  const hx = x + f.head[0];
  const hy = top + 8 + f.head[1];
  poly(g, [[hx - 2.5, hy + 5], [hx + 2.5, hy + 5], [x + 3, top + 17], [x - 3, top + 17]], 'n');
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

/**
 * Flat on his back on the boards: head to the left, lying with the body (the top of his head towards
 * you on the left, his face turned up, eyes shut), one knee up, an arm flung out. Same build as standing.
 */
function zealotDown(): RowSprite {
  const W = 76;
  const H = 24;
  const g = grid(W, H);
  const floor = H - 2;
  // Legs, one knee bent up.
  limb(g, [[46, floor - 4], [58, floor - 11], [68, floor - 2]], 3, 'l');
  limb(g, [[46, floor - 2], [62, floor - 1], [72, floor - 1]], 3, 'l');
  disc(g, 70, floor - 1, 1.6, 3, 'l');
  // Body, lying along the floor (chest up).
  poly(g, [[15, floor - 11], [46, floor - 8], [48, floor + 1], [15, floor + 1]], 't');
  // An arm flung out over his head, the other on the boards.
  limb(g, [[18, floor - 10], [12, floor - 16], [5, floor - 19]], 2.6, 'a');
  limb(g, [[30, floor - 7], [35, floor - 1], [41, floor]], 2.6, 'a');
  // The head, on its back: an oval lying along the floor, hair at the back (the left and underneath).
  disc(g, 8, floor - 5, 6.5, 5.2, 'h');
  light(g, 'l');
  light(g, 't', 'm');
  light(g, 'a');
  light(g, 'h');
  // His face, turned up: brow to the left, chin to the right towards his neck.
  for (let x = 6; x <= 13; x++) for (let y = floor - 10; y <= floor - 6; y++) if (((x - 9.5) / 4) ** 2 + ((y - (floor - 8)) / 2.6) ** 2 <= 1) put(g, x, y, 'K');
  put(g, 6, floor - 7, 'k');
  put(g, 7, floor - 7, 'k');
  // Eyes shut (a short dark line each), the nose a bump, the mouth slack.
  put(g, 8, floor - 9, 'y');
  put(g, 8, floor - 8, 'y');
  put(g, 10, floor - 11, 'K');
  put(g, 12, floor - 9, 'y');
  put(g, 12, floor - 8, 'y');
  // Hands.
  disc(g, 5, floor - 19, 2.2, 2.2, 'K');
  disc(g, 41, floor, 2.2, 1.5, 'K');
  // The stole across his chest, the band.
  for (let x = 17; x <= 44; x++) put(g, x, floor - 6 + (x > 30 ? 1 : 0), 'S');
  for (let y = floor - 10; y <= floor; y++) put(g, 27, y, 'c');
  return { rows: rows(g), colours: { ...FIGURE, K: SHADES.woodPale, k: SHADES.dim, y: SHADES.deep, S: SHADES.woodPale, c: SHADES.greenDeep } };
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

/** A sprite with some of its colours swapped (another person from the same drawing). */
export function recolour(s: RowSprite, swaps: Record<string, number>): RowSprite {
  return { rows: s.rows, colours: { ...s.colours, ...swaps } };
}

/** The zealot's friend (a test enemy): the same build, an amber band and a plain sash instead of the stole. */
export const LACKEY_BATTLE: Record<FoePose, RowSprite> = Object.fromEntries(
  Object.entries(ZEALOT_BATTLE).map(([pose, s]) => [pose, recolour(s, { c: SHADES.amberDeep, C: SHADES.amber, S: SHADES.woodLight, s: SHADES.deep, K: SHADES.dim })]),
) as Record<FoePose, RowSprite>;

// --- The rot beetle, facing you ---
// A big beetle from the deep rot (draft look): a domed, dark shell with a seam down it and a few green
// glowing patches of the fungus that has got into it, six jointed legs, a small head with two pale eyes and
// a pair of mandibles. Its poses are the same names as the zealot's, so its tells and reactions use the
// same machinery: rearing up for a wind-up, head down and mandibles wide when it squares up, leaning to a
// side to scuttle, and on its back with its legs in the air when it's knocked down.

const BEETLE_W = 80;
const BEETLE_H = 56;

interface BeetleShape {
  /** Sideways lean of the whole body. */
  dx: number;
  /** How far the body is raised off the floor. */
  lift: number;
  /** How wide the mandibles are open. */
  mand: number;
  /** How far the front legs are raised. */
  front: number;
  /** Eyes: green normally, white when hit. */
  eyes?: string;
}

const BEETLE: Record<Exclude<FoePose, 'down' | 'reach' | 'glance' | 'jeer'>, BeetleShape> = {
  idle: { dx: 0, lift: 0, mand: 3, front: 0 },
  breathe: { dx: 0, lift: -1, mand: 4, front: 0 },
  // Head down, mandibles wide: a bite coming.
  squared: { dx: 0, lift: -2, mand: 10, front: 0 },
  // Rearing a little, front legs lifting.
  shift: { dx: 0, lift: 4, mand: 5, front: 5 },
  // Reared right back, front legs high.
  windup: { dx: 0, lift: 9, mand: 7, front: 15 },
  attack: { dx: 0, lift: -4, mand: 1, front: 0 },
  cockL: { dx: -6, lift: 0, mand: 4, front: 2 },
  cockR: { dx: 6, lift: 0, mand: 4, front: 2 },
  hit: { dx: 4, lift: 2, mand: 11, front: 7, eyes: 'W' },
  wobble: { dx: -3, lift: 1, mand: 8, front: 4 },
};

function beetle(pose: keyof typeof BEETLE): RowSprite {
  const b = BEETLE[pose];
  const g = grid(BEETLE_W, BEETLE_H);
  const cx = 40 + b.dx;
  const floor = BEETLE_H - 2;
  const by = 28 - b.lift;
  // Legs: three a side, jointed, behind the body.
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const up = i === 0 ? b.front : 0;
      limb(g, [[cx + s * (20 - i), by + 3 + i * 5], [cx + s * (31 + i), by - 3 + i * 5 - up / 2], [40 + b.dx / 2 + s * (34 + i * 2), floor - up]], 1.6, 'l');
    }
  }
  disc(g, cx, by, 26, 17, 'b');
  disc(g, cx, by + 16, 10, 7, 'h');
  // Mandibles: from the sides of the head, curving in (closed) or out (open) to a point.
  for (const s of [-1, 1]) limb(g, [[cx + s * 7, by + 18], [cx + s * (4 + b.mand * 0.8), by + 25], [cx + s * (2 + b.mand * 0.9), by + 31]], 1.5, 'a');
  for (const part of ['l', 'b', 'h', 'a']) light(g, part);
  // The seam down the shell, and the ridges across it.
  for (let y = by - 16; y <= by + 8; y++) put(g, cx, y, 'm');
  for (const dy of [-9, -1, 7]) for (let i = 4; i <= 20; i += 2) for (const s of [-1, 1]) put(g, cx + s * i, by + dy + Math.round(i / 6), 'm');
  // Glowing patches of rot on the shell.
  for (const [dx, dy] of [[11, -7], [12, -6], [11, -5], [-14, 2], [-13, 3], [-15, 3], [6, 8]] as [number, number][]) put(g, cx + dx, by + dy, 'G');
  // Eyes.
  for (const s of [-1, 1]) put(g, cx + s * 4, by + 14, b.eyes ?? 'G');
  return { rows: rows(g), colours: { ...FIGURE, G: SHADES.green, W: SHADES.white, l: SHADES.shadow } };
}

/** Flat on its back, legs in the air. */
function beetleDown(): RowSprite {
  const g = grid(BEETLE_W, 34);
  const cx = 40;
  const floor = 32;
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) limb(g, [[cx + s * (10 + i * 5), floor - 10], [cx + s * (16 + i * 6), floor - 22 - (i === 1 ? 3 : 0)], [cx + s * (13 + i * 7), floor - 29 + i * 2]], 1.6, 'l');
  disc(g, cx, floor - 6, 26, 8, 'b');
  disc(g, cx, floor - 9, 9, 4, 'h');
  for (const part of ['l', 'b', 'h']) light(g, part);
  for (let i = -18; i <= 18; i += 4) put(g, cx + i, floor - 3, 'm');
  for (const dx of [-8, 0, 8]) put(g, cx + dx, floor - 8, 'G');
  return { rows: rows(g), colours: { ...FIGURE, G: SHADES.green, l: SHADES.shadow } };
}

export const BEETLE_BATTLE: Record<string, RowSprite> = {
  ...(Object.fromEntries((Object.keys(BEETLE) as (keyof typeof BEETLE)[]).map((p) => [p, beetle(p)])) as Record<keyof typeof BEETLE, RowSprite>),
  down: beetleDown(),
};

/**
 * The sunk town's tickers (Chapter 2, Day 7): small things that nest in the old machines down there and
 * click in the dark. Nobody knows what they are. Shelled in pale casing with cyan glints where the rot
 * beetles glow green. (Placeholder: the beetle's shape, recoloured, until the art pass.)
 */
export const TICKER_BATTLE: Record<string, RowSprite> = Object.fromEntries(
  Object.entries(BEETLE_BATTLE).map(([pose, s]) => [pose, recolour(s, { G: SHADES.cyan, l: SHADES.woodLight, o: SHADES.light, m: SHADES.dim, e: SHADES.woodPale, '#': SHADES.white, A: SHADES.white })]),
);

// --- Chapter 2: the borderland, in daylight ---
// Out here figures are drawn in colour (the scavenger and the borderland's people are, in the areas):
// each part its own colour, lighter where the sun catches its top and right, darker down its left, and a
// dark outline round the whole figure so it reads against the bright ground.

/** Lights one part in its own colours: `lit` on its top and right edges, `dark` down its left, `base` inside. */
function lightDay(g: Grid, part: string, [base, lit, dark]: [string, string, string]): void {
  const at = (x: number, y: number) => g[y]?.[x] ?? '.';
  const marks: [number, number, string][] = [];
  g.forEach((row, y) => row.forEach((c, x) => {
    if (c !== part) return;
    const edge = (dx: number, dy: number) => at(x + dx, y + dy) !== part;
    marks.push([x, y, edge(1, 0) || edge(0, -1) ? lit : edge(-1, 0) || edge(-2, 0) ? dark : base]);
  }));
  for (const [x, y, c] of marks) g[y]![x] = c;
}

/** A dark outline round everything drawn. */
function outline(g: Grid, c = 'X'): void {
  const filled = (x: number, y: number) => (g[y]?.[x] ?? '.') !== '.' && g[y]![x] !== c;
  const marks: Pt[] = [];
  g.forEach((row, y) => row.forEach((v, x) => {
    if (v === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) marks.push([x, y]);
  }));
  for (const [x, y] of marks) g[y]![x] = c;
}

/**
 * Her staff (designer: like the one in Tenet, a staff of different-shaped cuboid pieces): mismatched blocks of
 * scrap threaded on a core, each a different length and thickness, one of them old tech with a cyan glint.
 * Drawn from a to b.
 */
function staff(g: Grid, [ax, ay]: Pt, [bx, by]: Pt): void {
  const len = Math.hypot(bx - ax, by - ay);
  const [ux, uy] = [(bx - ax) / len, (by - ay) / len];
  const [nx, ny] = [-uy, ux];
  // [length, thickness, colour] for each block, repeating along the staff.
  const BLOCKS: [number, number, string][] = [[6, 3, '7'], [3, 2, '8'], [5, 4, '7'], [2, 2, '9'], [7, 3, '8'], [4, 4, 'Q'], [3, 2, '7'], [6, 3, '9'], [4, 4, '8']];
  let along = 0;
  for (let i = 0; along < len; i++) {
    const [l, w, c] = BLOCKS[i % BLOCKS.length]!;
    for (let s = along; s < Math.min(len, along + l); s += 0.5) {
      for (let k = -w / 2; k <= w / 2; k += 0.5) {
        // The end of each block and its far side darker, so the pieces read as separate cuboids.
        const shade = s > along + l - 1 || k > w / 2 - 1 ? (c === 'Q' ? 'q' : '0') : c;
        put(g, ax + ux * s + nx * k, ay + uy * s + ny * k, shade);
      }
    }
    along += l;
  }
}

const SCAV_W = 64;
const SCAV_H = 62;

function scavengerBack(pose: CarverPose, who: 'scavenger' | 'old' | 'fists' | AllyId = 'scavenger'): RowSprite {
  const ally = who in ALLY_BACKS ? ALLY_BACKS[who as AllyId] : undefined;
  const old = who === 'old' || !!ally;
  const fists = who === 'fists';
  const g = grid(SCAV_W, SCAV_H);
  const x = 32 + { idle: 0, breathe: 0, ready: 0, dodge: -7, attack: 3, slap: 4, palm: -4, shove: 0, grab: 0, guard: 0, hit: 4 }[pose];
  const top = 2 + { idle: 0, breathe: 1, ready: 2, dodge: 2, attack: -1, slap: 0, palm: 0, shove: 3, grab: 4, guard: 3, hit: 1 }[pose];
  const headDx = { idle: 1, breathe: 1, ready: 1, dodge: -3, attack: 2, slap: 4, palm: -3, shove: 0, grab: 0, guard: 0, hit: 6 }[pose];
  const headDy = { idle: 0, breathe: 0, ready: 1, dodge: 0, attack: -1, slap: 0, palm: 0, shove: 2, grab: 4, guard: 3, hit: -1 }[pose];
  // Slim: narrower shoulders than the carver's. (The old scavenger is broader, stooped a little.)
  const sw = old ? 16 : 14;
  const ls: Pt = [x - sw, top + 28];
  const rs: Pt = [x + sw, top + 28];
  // Arms [left, right], each ending in the hand; and the staff, from one end to the other.
  const poses: Record<CarverPose, { arms: [Pt[], Pt[]]; staff: [Pt, Pt]; behind: boolean }> = {
    // The staff upright in her right hand, its foot on the ground.
    idle: { arms: [[ls, [x - 17, top + 42], [x - 17, top + 55]], [rs, [x + 19, top + 40], [x + 22, top + 50]]], staff: [[x + 24, top + 62], [x + 21, top - 2]], behind: false },
    breathe: { arms: [[ls, [x - 17, top + 42], [x - 17, top + 55]], [rs, [x + 19, top + 40], [x + 22, top + 50]]], staff: [[x + 24, top + 62], [x + 21, top - 2]], behind: false },
    // Held across her in both hands, ready.
    ready: { arms: [[ls, [x - 20, top + 38], [x - 16, top + 32]], [rs, [x + 20, top + 36], [x + 16, top + 28]]], staff: [[x - 30, top + 44], [x + 31, top + 12]], behind: true },
    dodge: { arms: [[ls, [x - 20, top + 40], [x - 21, top + 50]], [rs, [x + 18, top + 36], [x + 12, top + 30]]], staff: [[x - 24, top + 62], [x - 19, top + 6]], behind: false },
    // A jab: the staff driven straight out ahead of her, past her head.
    attack: { arms: [[ls, [x - 14, top + 22], [x - 4, top + 14]], [rs, [x + 15, top + 22], [x + 6, top + 18]]], staff: [[x + 4, top + 40], [x - 2, top - 4]], behind: true },
    // Swung wide to the right, then to the left (Rattle's blows).
    slap: { arms: [[ls, [x - 14, top + 26], [x + 2, top + 22]], [rs, [x + 24, top + 22], [x + 26, top + 14]]], staff: [[x - 6, top + 34], [x + 32, top]], behind: false },
    palm: { arms: [[ls, [x - 24, top + 22], [x - 26, top + 14]], [rs, [x + 14, top + 26], [x - 2, top + 22]]], staff: [[x + 6, top + 34], [x - 32, top]], behind: false },
    // A sweep: low and flat, at the legs.
    shove: { arms: [[ls, [x - 18, top + 38], [x - 12, top + 46]], [rs, [x + 18, top + 38], [x + 12, top + 46]]], staff: [[x - 32, top + 52], [x + 32, top + 46]], behind: true },
    grab: { arms: [[ls, [x - 20, top + 38], [x - 16, top + 32]], [rs, [x + 20, top + 36], [x + 16, top + 28]]], staff: [[x - 30, top + 44], [x + 31, top + 12]], behind: true },
    // Braced: the staff held level over her head in both hands.
    guard: { arms: [[ls, [x - 22, top + 24], [x - 18, top + 10]], [rs, [x + 22, top + 24], [x + 18, top + 10]]], staff: [[x - 31, top + 10], [x + 31, top + 8]], behind: false },
    hit: { arms: [[ls, [x - 22, top + 34], [x - 26, top + 26]], [rs, [x + 20, top + 40], [x + 22, top + 52]]], staff: [[x - 18, top + 60], [x + 30, top + 30]], behind: false },
  };
  const p = poses[pose];
  const [left, right] = p.arms;
  const forward = p.behind;
  const drawArms = () => {
    limb(g, left, 2.6, '1');
    limb(g, right, 2.6, '1');
  };
  // What she holds out in front of her is behind her body from here.
  // His hook: a plain pole with a hook at the end, where her staff would be.
  // (Fists only: her staff's left against the bar's counter.)
  // (The boss's son: a length of pipe.)
  const tool = () => (fists || ally?.tool === 'none' ? undefined : ally?.tool === 'pipe' ? pipe(g, ...p.staff) : ally?.tool === 'blade' ? lightBlade(g, ...p.staff) : ally?.tool === 'staff' ? staff(g, ...p.staff) : old ? hookPole(g, ...p.staff) : staff(g, ...p.staff));
  if (forward) {
    tool();
    drawArms();
  }
  // Her back: bare shoulders, the crop top, bare skin at the waist, then her trousers.
  // (Drawn as 'Z' first, so only her back, not her arms, takes the top and the trousers.)
  poly(g, [[x - sw - 1, top + 25], [x + sw + 1, top + 25], [x + sw - 3, SCAV_H + 2], [x - sw + 3, SCAV_H + 2]], 'Z');
  disc(g, x - sw + 2, top + 29, 4, 4, 'Z');
  disc(g, x + sw - 2, top + 29, 4, 4, 'Z');
  g.forEach((row, y) => row.forEach((c, cx) => {
    if (c !== 'Z') return;
    // His coat covers all of his back.
    row[cx] = old ? (y >= top + 52 ? '3' : '2') : y >= top + 31 && y <= top + 41 ? '2' : y >= top + 49 ? '3' : '1';
  }));
  // The top's straps over her shoulders.
  if (!old) for (const side of [-1, 1]) for (let y = top + 25; y < top + 31; y++) put(g, x + side * 7, y, '2');
  // Neck and head.
  poly(g, [[x - 3 + headDx / 2, top + 17 + headDy], [x + 3 + headDx / 2, top + 17 + headDy], [x + 4, top + 27], [x - 4, top + 27]], '1');
  if (!forward) {
    drawArms();
    tool();
  }
  const hx = x + headDx;
  const hy = top + 11 + headDy;
  disc(g, hx, hy, 7.5, 9, '4');
  if (ally) return allyBack(g, hx, hy, top, ally);
  if (old) return oldBack(g, hx, hy, x, top);
  // The ponytail, tied high, hanging down her back (swinging with her).
  const swing = { dodge: 4, palm: 4, slap: -4, hit: -5, attack: -2 }[pose as string] ?? 0;
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    disc(g, hx + Math.sin(t * 2.4) * 1.5 + swing * t, hy - 2 + i, 2.6 - t * 1.6, 1, '4');
  }
  // The satchel's strap across her back, the satchel at her right hip.
  limb(g, [[x - sw + 3, top + 26], [x + sw - 2, top + 48]], 1, '5');
  poly(g, [[x + sw - 8, top + 46], [x + sw + 4, top + 46], [x + sw + 4, top + 58], [x + sw - 8, top + 58]], '5');
  lightDay(g, '1', ['K', 'K', 'k']);
  lightDay(g, '2', ['C', 'C', 'c']);
  lightDay(g, '3', ['P', 'D', 'p']);
  lightDay(g, '4', ['R', 'A', 'r']);
  lightDay(g, '5', ['S', 'D', 's']);
  // Strands through her hair, and the tie at the top of the ponytail.
  for (let i = -4; i <= 4; i += 2) for (let j = 0; j < 7; j++) put(g, hx + i + Math.round(j * 0.15 * Math.sign(i)), hy - 6 + j, 'r');
  for (let i = -2; i <= 2; i++) put(g, hx + i, hy + 1, 'c');
  // Her spine and shoulder blades, faintly.
  for (let y = top + 42; y < top + 49; y++) put(g, x, y, 'k');
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) put(g, x + side * 6, top + 27 + i, 'k');
  outline(g);
  return {
    rows: rows(g),
    colours: {
      K: SHADES.skinFair, k: SHADES.skinFairShade, C: SHADES.cyanMid, c: SHADES.cyanDeep, P: SHADES.woodPale, D: SHADES.dim, p: SHADES.woodLight,
      R: SHADES.copper, A: SHADES.amber, r: SHADES.copperDeep, S: SHADES.amberDeep, s: SHADES.wood,
      '7': SHADES.dim, '8': SHADES.light, '9': SHADES.woodPale, '0': SHADES.woodLight, Q: SHADES.cyan, q: SHADES.cyanMid, X: SHADES.shadow,
    },
  };
}

/** A scavenging hook: a plain pole, a hook bent at the far end. */
function hookPole(g: Grid, [ax, ay]: Pt, [bx, by]: Pt): void {
  limb(g, [[ax, ay], [bx, by]], 0.8, '9');
  const len = Math.hypot(bx - ax, by - ay);
  const [ux, uy] = [(bx - ax) / len, (by - ay) / len];
  limb(g, [[bx, by], [bx + uy * 4, by - ux * 4], [bx + uy * 4 - ux * 4, by - ux * 4 - uy * 4]], 0.8, '7');
}

/** A light-blade held where a staff would be: a gold hilt in the hand, a line of cyan light from it. */
function lightBlade(g: Grid, [ax, ay]: Pt, [bx, by]: Pt): void {
  const [mx, my] = [(ax + bx) / 2, (ay + by) / 2];
  limb(g, [[mx, my], [mx + (bx - mx) * 0.12, my + (by - my) * 0.12]], 1, 'g');
  limb(g, [[mx + (bx - mx) * 0.12, my + (by - my) * 0.12], [bx, by]], 1, 'q');
  limb(g, [[mx + (bx - mx) * 0.12, my + (by - my) * 0.12], [bx, by]], 0.3, 'N');
}

/** A length of pipe: the near half of the staff's line, thick and dull. */
function pipe(g: Grid, [ax, ay]: Pt, [bx, by]: Pt): void {
  limb(g, [[(ax + bx) / 2, (ay + by) / 2], [bx, by]], 1.3, '7');
}

/** A friend fighting beside you, from behind: their head (hair, a wrap or a hood), a scarf, their coat, what they carry. */
interface AllyBack {
  skin: [number, number];
  coat: [number, number, number];
  /** Hair (or a wrap, or a hood): [base, lit]. */
  head: [number, number];
  /** A hood or a wrap covers the neck; hair is trimmed above it. */
  covered?: boolean;
  scarf?: [number, number];
  tool: 'pipe' | 'staff' | 'blade' | 'none';
}
const ALLY_BACKS = {
  // The boss's son: a mop of dark hair, his bright scarf, a good cyan shirt, a length of pipe (Day 10).
  son: { skin: [SHADES.skinTan, SHADES.skinTanShade], coat: [SHADES.cyanMid, SHADES.cyan, SHADES.cyanDeep], head: [SHADES.deep, SHADES.dim], scarf: [SHADES.amber, SHADES.amberDeep], tool: 'pipe' },
  // The scout: the other clan's pale wrap over the head, a dull vest, a staff (Day 11).
  scout: { skin: [SHADES.skinDark, SHADES.skinDarkShade], coat: [SHADES.dim, SHADES.light, SHADES.deep], head: [SHADES.light, SHADES.white], covered: true, scarf: [SHADES.light, SHADES.dim], tool: 'staff' },
  // The watcher: his hood up, his long coat, empty hands (Day 11).
  watcher: { skin: [SHADES.skinDark, SHADES.skinDarkShade], coat: [SHADES.woodLight, SHADES.woodPale, SHADES.wood], head: [SHADES.wood, SHADES.woodLight], covered: true, tool: 'none' },
  // Your hand (Chapter 3, Day 4): dark hair, his gold-brown coat, a light-blade in the city's cyan, at full.
  hand: { skin: [SHADES.skinDark, SHADES.skinDarkShade], coat: [SHADES.amberDeep, SHADES.amberMid, SHADES.wood], head: [SHADES.deep, SHADES.dim], tool: 'blade' },
  // Your friend (Chapter 3, Day 7, the gate): his swept fair-red hair, his blue-green coat, a light-blade.
  heir: { skin: [SHADES.skinFair, SHADES.skinFairShade], coat: [SHADES.cyanMid, SHADES.cyan, SHADES.cyanDeep], head: [SHADES.amberDeep, SHADES.amber], tool: 'blade' },
} satisfies Record<string, AllyBack>;
type AllyId = keyof typeof ALLY_BACKS;

function allyBack(g: Grid, hx: number, hy: number, top: number, a: AllyBack): RowSprite {
  if (!a.covered) for (let y = Math.round(hy + 6); y < hy + 10; y++) for (let dx = -8; dx <= 8; dx++) if (g[y]?.[Math.round(hx + dx)] === '4') put(g, hx + dx, y, '1');
  if (a.scarf) for (let y = top + 22; y < top + 26; y++) for (let dx = -5; dx <= 5; dx++) if (g[y]?.[Math.round(hx + dx)]) put(g, hx + dx, y, '6');
  lightDay(g, '1', ['K', 'K', 'k']);
  lightDay(g, '2', ['C', 'Q', 'c']);
  lightDay(g, '3', ['P', 'D', 'p']);
  lightDay(g, '4', ['H', 'h', 'H']);
  lightDay(g, '6', ['A', 'A', 'a']);
  outline(g);
  return {
    rows: rows(g),
    colours: {
      K: a.skin[0], k: a.skin[1], C: a.coat[0], Q: a.coat[1], c: a.coat[2], P: SHADES.woodPale, D: SHADES.dim, p: SHADES.woodLight,
      H: a.head[0], h: a.head[1], A: a.scarf?.[0] ?? a.coat[0], a: a.scarf?.[1] ?? a.coat[2], '7': SHADES.dim, X: SHADES.shadow,
      '8': SHADES.light, '9': SHADES.woodPale, '0': SHADES.woodLight, q: SHADES.cyanMid, N: SHADES.cyan, g: SHADES.amber,
    },
  };
}

/** The old scavenger's head from behind (short grey hair, goggles' strap), his coat, the pack frame; lit and outlined. */
function oldBack(g: Grid, hx: number, hy: number, x: number, top: number): RowSprite {
  // Short grey hair: the head's disc is hair; trim it shorter at the neck.
  for (let y = Math.round(hy + 6); y < hy + 10; y++) for (let dx = -8; dx <= 8; dx++) if (g[y]?.[Math.round(hx + dx)] === '4') put(g, hx + dx, y, '1');
  // The pack's frame on his back.
  for (const side of [-1, 1]) limb(g, [[x + side * 9, top + 28], [x + side * 9, top + 52]], 0.8, '7');
  for (const y of [top + 32, top + 46]) limb(g, [[x - 9, y], [x + 9, y]], 0.7, '7');
  lightDay(g, '1', ['K', 'K', 'k']);
  lightDay(g, '2', ['M', 'L', 'm']);
  lightDay(g, '3', ['P', 'D', 'p']);
  lightDay(g, '4', ['H', 'W', 'h']);
  // The goggles' strap round the back of his head.
  for (let i = -7; i <= 7; i++) put(g, hx + i, hy - 1, 'g');
  outline(g);
  return {
    rows: rows(g),
    colours: {
      K: SHADES.skinTan, k: SHADES.skinTanShade, M: SHADES.woodLight, L: SHADES.dim, m: SHADES.wood, P: SHADES.woodPale, D: SHADES.dim, p: SHADES.woodLight,
      H: SHADES.light, W: SHADES.white, h: SHADES.dim, g: SHADES.deep, '7': SHADES.dim, '9': SHADES.woodPale, X: SHADES.shadow,
    },
  };
}

/** The old scavenger, from behind, his hook in hand (Chapter 2, the first raid). */
export const OLD_SCAV_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(CARVER_POSES.map((p) => [p, scavengerBack(p, 'old')])) as Record<CarverPose, RowSprite>;

/** The boss's son, from behind, with a length of pipe: on your side at last (Chapter 2, Day 10). */
export const SON_BACK_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(CARVER_POSES.map((p) => [p, scavengerBack(p, 'son')])) as Record<CarverPose, RowSprite>;
/** The scout, from behind, with a staff: on your side, over their own line (Chapter 2, Day 11). */
export const SCOUT_BACK_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(CARVER_POSES.map((p) => [p, scavengerBack(p, 'scout')])) as Record<CarverPose, RowSprite>;
/** The watcher, from behind, hood up (Chapter 2, Day 11). */
export const WATCHER_BACK_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(CARVER_POSES.map((p) => [p, scavengerBack(p, 'watcher')])) as Record<CarverPose, RowSprite>;

/** The scavenger with her fists up, her staff left on the counter (the sparring at the bar). */
export const SCAVENGER_FISTS_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(CARVER_POSES.map((p) => [p, scavengerBack(p, 'fists')])) as Record<CarverPose, RowSprite>;

/** The scavenger, from behind, her staff of blocks in hand (Chapter 2). */
export const SCAVENGER_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(CARVER_POSES.map((p) => [p, scavengerBack(p)])) as Record<CarverPose, RowSprite>;

/** Skin, lit and shaded, for a daylit figure. */
const SKIN_OF = {
  fair: { K: SHADES.skinFair, k: SHADES.skinFairShade },
  tan: { K: SHADES.skinTan, k: SHADES.skinTanShade },
  dark: { K: SHADES.skinDark, k: SHADES.skinDarkShade },
};

/** A straggler's build: how broad, their skin, and what they wear on their head. */
interface StragglerLook {
  /** Extra width at the shoulders. */
  broad: number;
  skin: 'tan' | 'fair' | 'dark';
  /** A rag wound round the head (the face showing), shaved with a beard, or a mop of hair. */
  head: 'wrap' | 'shaved' | 'hair';
  /** What's in their hand: a shard of something sharp, a lump of scrap, a staff (the other clan), a light-blade (the capital), or nothing (fists). */
  holds: 'shard' | 'lump' | 'staff' | 'blade' | 'none';
  /** The coat's colours [base, lit, shade], if not the stragglers' patched grey; `patched` false for a whole one. */
  coat?: [number, number, number];
  patched?: boolean;
  /** The head wrap's colours [base, shade], if not the stragglers' dull rag (the other clan's are pale). */
  wrap?: [number, number];
  /** Their hair, if not dark. */
  hair?: number;
}

/**
 * A straggler, facing you (Chapter 2): someone from elsewhere, ragged and desperate. A coat patched from
 * whatever was going, rags trailing, bare hands. The same poses as the zealot's, so the tells work alike.
 */
function straggler(pose: Exclude<FoePose, 'down'>, look: StragglerLook): RowSprite {
  const f = FOE[pose];
  const g = grid(FOE_W + 8, FOE_H);
  const cx = 28;
  const x = cx + f.lean;
  const top = 2 + f.bob;
  const b = look.broad;
  const hip = 41;
  const hx0 = cx + f.lean / 2;
  const [lf, rf] = f.feet;
  limb(g, [[hx0 - 4, hip], [cx + lf * 0.85, 54], [cx + lf, FOE_H - 3]], 3, '3');
  limb(g, [[hx0 + 4, hip], [cx + rf * 0.85, 54], [cx + rf, FOE_H - 3]], 3, '3');
  disc(g, cx + lf - 1, FOE_H - 2, 3.2, 1.5, '6');
  disc(g, cx + rf + 1, FOE_H - 2, 3.2, 1.5, '6');
  // The coat: to below the hips, hanging open, its hem ragged.
  poly(g, [[x - 11 - b, top + 16], [x + 11 + b, top + 16], [hx0 + 11 + b / 2, hip + 7], [hx0 - 11 - b / 2, hip + 7]], '2');
  if (look.patched !== false) for (let i = -10 - b / 2; i <= 10 + b / 2; i += 3) limb(g, [[hx0 + i, hip + 6], [hx0 + i + 1, hip + 9 + (Math.abs(i * 7) % 4)]], 0.6, '2');
  disc(g, x - 10 - b, top + 19, 3.2, 3.2, '2');
  disc(g, x + 10 + b, top + 19, 3.2, 3.2, '2');
  const rs: Pt = [x - 11 - b, top + 19];
  const ls: Pt = [x + 11 + b, top + 19];
  const at = (p: Pt): Pt => [x + p[0] * (1 + b / 30), top + p[1]];
  limb(g, [rs, at(f.right[0]), at(f.right[1])], 2.6 + b / 6, '2');
  limb(g, [ls, at(f.left[0]), at(f.left[1])], 2.6 + b / 6, '2');
  const hx = x + f.head[0];
  const hy = top + 8 + f.head[1];
  poly(g, [[hx - 2.5, hy + 5], [hx + 2.5, hy + 5], [x + 3, top + 17], [x - 3, top + 17]], '1');
  disc(g, hx, hy, 6 + b / 6, 7, look.head === 'wrap' ? '5' : look.head === 'hair' ? '4' : '1');
  // The wrap's tail hanging over a shoulder.
  if (look.head === 'wrap') limb(g, [[hx + 5, hy + 2], [hx + 8, hy + 10], [hx + 9, hy + 16]], 1.4, '5');
  lightDay(g, '3', ['P', 'D', 'p']);
  lightDay(g, '2', ['M', 'L', 'm']);
  lightDay(g, '1', ['K', 'K', 'k']);
  lightDay(g, '5', ['W', 'W', 'w']);
  lightDay(g, '6', ['b', 'b', 'b']);
  lightDay(g, '4', ['H', 'H', 'b']);
  // Patches on the coat, in whatever was going.
  if (look.patched !== false) for (const [px, py, c] of [[-6, 24, 'T'], [4, 32, 'U'], [-3, 37, 'T']] as const) for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if (g[top + py + j]?.[x + px + i]?.match(/[MLm]/)) put(g, x + px + i, top + py + j, c);
  // The face.
  const fx = hx + f.look * 0.6;
  disc(g, fx, hy + 1.6, 4.4, look.head === 'wrap' ? 4 : 5, 'K');
  for (let y = -2; y <= 4; y++) put(g, fx - 4, hy + 1.6 + y, 'k');
  if (look.head === 'shaved') {
    // A beard round the jaw, stubble on the scalp.
    for (let i = -4; i <= 4; i++) for (let j = 4; j <= 7 - Math.abs(i) / 3; j++) put(g, fx + i, hy + j, 'h');
    for (let i = -4; i <= 4; i += 2) put(g, hx + i, hy - 5, 'k');
  }
  const ex = hx + f.look * 1.2;
  for (const s of [-1, 1]) {
    put(g, ex + s * 2, hy, 'y');
    put(g, ex + s * 3, hy - 1, 'h');
  }
  put(g, ex + 0.5, hy + 2, 'k');
  if (f.mouth === 'open') limb(g, [[ex - 1, hy + 4.5], [ex + 1, hy + 4.5]], 0.6, 'y');
  else for (let i = -2; i <= 2; i++) put(g, ex + i, hy + 4.5, i === 2 && f.mouth === 'sneer' ? 'k' : 'y');
  // Hands, and what's in them.
  for (const [arm, r] of [[f.right, f.hands[0]], [f.left, f.hands[1]]] as const) {
    const h = at(arm[1]);
    disc(g, h[0], h[1], r + b / 8, r + b / 8, 'K');
    put(g, h[0] - r + 0.4, h[1], 'k');
  }
  const hand = at(f.right[1]);
  if (look.holds === 'shard') limb(g, [[hand[0], hand[1] - 2], [hand[0] - 2, hand[1] - 9]], 0.7, 'G');
  else if (look.holds === 'staff') limb(g, [[hand[0] - 1, hand[1] + 14], [hand[0] + 1, hand[1] - 22]], 0.8, '7');
  else if (look.holds === 'blade') {
    // A practice light-blade: a gold hilt, and the blade a line of the city's cyan, turned down to a dull glow.
    limb(g, [[hand[0] + 1, hand[1] + 2], [hand[0] - 1, hand[1] - 2]], 0.9, 'g');
    limb(g, [[hand[0] - 1, hand[1] - 3], [hand[0] - 6, hand[1] - 24]], 0.9, 'n');
    limb(g, [[hand[0] - 1, hand[1] - 3], [hand[0] - 6, hand[1] - 24]], 0.3, 'N');
  }
  else if (look.holds === 'lump') {
    disc(g, hand[0] - 2, hand[1] - 4, 4, 3.4, '7');
    put(g, hand[0] - 4, hand[1] - 6, '8');
    put(g, hand[0] - 3, hand[1] - 6, '8');
  }
  outline(g);
  const skin = SKIN_OF[look.skin];
  const [M, L, m] = look.coat ?? [SHADES.dim, SHADES.light, SHADES.woodPale];
  const [W, w] = look.wrap ?? [SHADES.dim, SHADES.woodPale];
  return {
    rows: rows(g),
    colours: {
      ...skin, P: SHADES.woodLight, D: SHADES.woodPale, p: SHADES.deep, M, L, m,
      W, w, b: SHADES.deep, T: SHADES.greenDeep, U: SHADES.amberDeep, y: SHADES.deep, h: SHADES.woodLight,
      G: SHADES.white, '7': SHADES.woodPale, '8': SHADES.cyanMid, X: SHADES.shadow, H: look.hair ?? SHADES.deep,
      g: SHADES.amber, n: SHADES.cyanMid, N: SHADES.cyan,
    },
  };
}

/**
 * Flat on their back (a straggler, the son, a raider): the zealot's fall, drawn in their own colours, each
 * part lit in daylight and outlined (designer: the son changed colour when he went down).
 */
function stragglerDown(look: StragglerLook): RowSprite {
  const W = 76;
  const H = 24;
  const g = grid(W, H);
  const floor = H - 2;
  limb(g, [[46, floor - 4], [58, floor - 11], [68, floor - 2]], 3, '3');
  limb(g, [[46, floor - 2], [62, floor - 1], [72, floor - 1]], 3, '3');
  disc(g, 70, floor - 1, 1.6, 3, '6');
  poly(g, [[15, floor - 11], [46, floor - 8], [48, floor + 1], [15, floor + 1]], '2');
  limb(g, [[18, floor - 10], [12, floor - 16], [5, floor - 19]], 2.6, '2');
  limb(g, [[30, floor - 7], [35, floor - 1], [41, floor]], 2.6, '2');
  disc(g, 8, floor - 5, 6.5, 5.2, look.head === 'wrap' ? '5' : look.head === 'hair' ? '4' : '1');
  lightDay(g, '3', ['P', 'D', 'p']);
  lightDay(g, '2', ['M', 'L', 'm']);
  lightDay(g, '1', ['K', 'K', 'k']);
  lightDay(g, '4', ['H', 'H', 'b']);
  lightDay(g, '5', ['W', 'W', 'w']);
  lightDay(g, '6', ['b', 'b', 'b']);
  // The face turned up, eyes shut; hands.
  for (let x = 6; x <= 13; x++) for (let y = floor - 10; y <= floor - 6; y++) if (((x - 9.5) / 4) ** 2 + ((y - (floor - 8)) / 2.6) ** 2 <= 1) put(g, x, y, 'K');
  put(g, 8, floor - 8, 'y');
  put(g, 12, floor - 8, 'y');
  disc(g, 5, floor - 19, 2.2, 2.2, 'K');
  disc(g, 41, floor, 2.2, 1.5, 'K');
  outline(g);
  const [M, L, m] = look.coat ?? [SHADES.dim, SHADES.light, SHADES.woodPale];
  const [Wc, w] = look.wrap ?? [SHADES.dim, SHADES.woodPale];
  return { rows: rows(g), colours: { ...SKIN_OF[look.skin], P: SHADES.woodLight, D: SHADES.woodPale, p: SHADES.deep, M, L, m, W: Wc, w, b: SHADES.deep, H: SHADES.deep, y: SHADES.deep, X: SHADES.shadow } };
}

const stragglerPoses = (look: StragglerLook): Record<FoePose, RowSprite> => ({
  ...(Object.fromEntries(FOE_POSES.filter((p) => p !== 'down').map((p) => [p, straggler(p as Exclude<FoePose, 'down'>, look)])) as Record<Exclude<FoePose, 'down'>, RowSprite>),
  down: stragglerDown(look),
});

/** The thin straggler: quick, a rag round the head, a shard for a knife. */
export const STRAGGLER_THIN_BATTLE = stragglerPoses({ broad: 0, skin: 'tan', head: 'wrap', holds: 'shard' });
/** The big straggler: broad, shaved, bearded, a lump of scrap in his fist. */
export const STRAGGLER_BIG_BATTLE = stragglerPoses({ broad: 4, skin: 'fair', head: 'shaved', holds: 'lump' });
/** The small straggler (the one who cut your strap): slight, a mop of dark hair, a shard. */
export const STRAGGLER_SMALL_BATTLE = stragglerPoses({ broad: -3, skin: 'dark', head: 'hair', holds: 'shard' });

/** The boss's son: your age, a good cyan shirt (whole, matched), a mop of dark hair, his fists. */
export const SON_BATTLE = stragglerPoses({ broad: 0, skin: 'tan', head: 'hair', holds: 'none', coat: [SHADES.cyanMid, SHADES.cyan, SHADES.cyanDeep], patched: false });
/** The other clan's raiders: pale wraps and coats (their look in the areas), staves. */
export const RAIDER_BATTLE = stragglerPoses({ broad: 1, skin: 'tan', head: 'wrap', holds: 'staff', coat: [SHADES.light, SHADES.white, SHADES.dim], patched: false, wrap: [SHADES.white, SHADES.light] });
/** Their leader on the raid: bigger, the same pale. */
export const RAIDER_LEAD_BATTLE = stragglerPoses({ broad: 4, skin: 'dark', head: 'wrap', holds: 'staff', coat: [SHADES.light, SHADES.white, SHADES.dim], patched: false, wrap: [SHADES.white, SHADES.light] });

/** The den's debt collectors: the house's men, in its dark coats. The talker has his hands free for your pockets; the muscle carries a cosh. */
export const COLLECTOR_BATTLE = stragglerPoses({ broad: 1, skin: 'fair', head: 'hair', holds: 'none', coat: [SHADES.woodLight, SHADES.woodPale, SHADES.wood], patched: false });
export const COLLECTOR_BIG_BATTLE = stragglerPoses({ broad: 5, skin: 'tan', head: 'shaved', holds: 'lump', coat: [SHADES.woodLight, SHADES.woodPale, SHADES.wood], patched: false });
/** Angry pickers from the fields: your own people, in their patched picking clothes, with whatever was to hand. */
export const PICKER_BATTLE = stragglerPoses({ broad: 0, skin: 'tan', head: 'wrap', holds: 'none' });
export const PICKER_LOUD_BATTLE = stragglerPoses({ broad: 2, skin: 'dark', head: 'hair', holds: 'shard' });

/** The other clan's scout: small and quick, the same pale wrap, a short blade. */
export const SCOUT_BATTLE = stragglerPoses({ broad: -3, skin: 'fair', head: 'wrap', holds: 'shard', coat: [SHADES.light, SHADES.white, SHADES.dim], patched: false, wrap: [SHADES.white, SHADES.light] });

// --- The dog, from behind (Chapter 2) ---
// Low in the foreground beside you, seen from behind: haunches, a tail, the back running up to the
// shoulders, the head and two ears over them. Scruffy, grey-brown like its sprite in the areas, a pale belly.

function dogBack(pose: CarverPose): RowSprite {
  const W = 52;
  const H = 40;
  const g = grid(W, H);
  const crouch = { idle: 0, breathe: 1, ready: 3, dodge: 2, attack: -3, slap: -2, palm: -2, shove: 1, grab: -3, guard: 4, hit: 1 }[pose];
  const lean = { idle: 0, breathe: 0, ready: 0, dodge: -7, attack: 3, slap: 4, palm: -4, shove: 2, grab: 0, guard: 0, hit: 5 }[pose];
  const cx = 26;
  const top = 6 + crouch;
  // Back legs, then the haunches over them.
  for (const s of [-1, 1]) {
    limb(g, [[cx + s * 8, H - 14], [cx + s * 9, H - 6], [cx + s * 9, H - 1]], 2.6, '1');
    disc(g, cx + s * 9, H - 1, 3.4, 1.4, '1');
  }
  // The body running away from you to the shoulders; the head over them, ears up (back when it lunges).
  poly(g, [[cx - 12, H - 10], [cx + 12, H - 10], [cx + 9 + lean, top + 14], [cx - 9 + lean, top + 14]], '1');
  disc(g, cx, H - 12, 13, 8, '1');
  disc(g, cx + lean, top + 13, 10, 5, '1');
  const hx = cx + lean * 1.4;
  const hy = top + 5;
  disc(g, hx, hy, 6, 5.5, '2');
  const flat = pose === 'attack' || pose === 'grab' || pose === 'slap' || pose === 'palm';
  for (const s of [-1, 1]) poly(g, [[hx + s * 2, hy - 3], [hx + s * 7, hy - 3], [hx + s * (flat ? 10 : 6), hy - (flat ? 4 : 11)]], '2');
  // The tail: up and wagging, or straight out when it's set to fight.
  const wag = { idle: 3, breathe: -3, dodge: 5, hit: -6 }[pose as string] ?? 0;
  const tailUp = pose === 'idle' || pose === 'breathe' || pose === 'dodge';
  limb(g, [[cx, H - 18], [cx + wag / 2, H - 25], [cx + wag, tailUp ? H - 33 : H - 27]], 1.8, '3');
  lightDay(g, '1', ['B', 'P', 'b']);
  lightDay(g, '2', ['B', 'P', 'b']);
  lightDay(g, '3', ['B', 'P', 'b']);
  // Scruff along its back, and the pale of its belly between its legs.
  for (let y = top + 10; y < H - 16; y += 3) put(g, cx + lean * ((H - y) / H), y, 'b');
  for (let x = cx - 4; x <= cx + 4; x++) put(g, x, H - 4, 'p');
  outline(g);
  return { rows: rows(g), colours: { B: SHADES.light, P: SHADES.white, b: SHADES.dim, p: SHADES.white, X: SHADES.shadow } };
}

/** The dog, fighting beside you. */
export const DOG_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(CARVER_POSES.map((p) => [p, dogBack(p)])) as Record<CarverPose, RowSprite>;

/** The enforcer: the boss's muscle, broad, a scrap plate strapped on, bare arms (Chapter 2, Day 10). */
export const ENFORCER_BATTLE = stragglerPoses({ broad: 7, skin: 'tan', head: 'hair', holds: 'none', coat: [SHADES.woodLight, SHADES.amberDeep, SHADES.wood], patched: false });

// --- Chapter 3: the prince, and the capital ---

/** Your hand (Chapter 3), sparring: his gold-brown coat, dark hair, a practice light-blade in the city's cyan. */
export const HAND_BATTLE = stragglerPoses({ broad: 0, skin: 'dark', head: 'hair', holds: 'blade', coat: [SHADES.amberDeep, SHADES.amberMid, SHADES.woodLight], patched: false });

/**
 * The prince, from behind (Chapter 3): his close-cropped dark head, the high wine collar, the dark coat with
 * the wine sash at the waist and gold at its hem, and in his right hand the light-blade (designer: a
 * laser-like fencing sword): a gold hilt, the blade a line of wine, his colour (suggestion), turned down to a
 * dull glow for practice. He fences one-handed, the other hand back for balance.
 */
function princeBack(pose: CarverPose, plain = false): RowSprite {
  const g = grid(SCAV_W, SCAV_H);
  const x = 32 + { idle: 0, breathe: 0, ready: 0, dodge: -7, attack: 3, slap: 4, palm: -2, shove: 2, grab: 0, guard: 0, hit: 4 }[pose];
  const top = 2 + { idle: 0, breathe: 1, ready: 2, dodge: 2, attack: -1, slap: 0, palm: 0, shove: 2, grab: 2, guard: 2, hit: 1 }[pose];
  const headDx = { idle: 1, breathe: 1, ready: 1, dodge: -3, attack: 2, slap: 3, palm: -1, shove: 1, grab: 1, guard: 0, hit: 6 }[pose];
  const headDy = { idle: 0, breathe: 0, ready: 1, dodge: 0, attack: -1, slap: 0, palm: 0, shove: 1, grab: 1, guard: 2, hit: -1 }[pose];
  const sw = 15;
  const ls: Pt = [x - sw, top + 28];
  const rs: Pt = [x + sw, top + 28];
  // [left arm, right arm] each ending in the hand; the blade from the hilt (in his right hand) to its tip;
  // `behind`: held out ahead of him, so his body is in front of it from here.
  const down: Pt[] = [rs, [x + 19, top + 40], [x + 21, top + 50]];
  const back: Pt[] = [ls, [x - 22, top + 26], [x - 25, top + 18]];
  const side: Pt[] = [ls, [x - 17, top + 42], [x - 17, top + 54]];
  const poses: Record<CarverPose, { arms: [Pt[], Pt[]]; blade: [Pt, Pt]; behind: boolean }> = {
    // At rest: the blade down at his side, its point near the floor.
    idle: { arms: [side, down], blade: [[x + 21, top + 50], [x + 29, top + 61]], behind: false },
    breathe: { arms: [side, down], blade: [[x + 21, top + 50], [x + 29, top + 61]], behind: false },
    // En garde: the point up and out at him, the other hand back.
    ready: { arms: [back, [rs, [x + 19, top + 36], [x + 15, top + 30]]], blade: [[x + 15, top + 30], [x + 24, top + 4]], behind: false },
    dodge: { arms: [back, [rs, [x + 18, top + 38], [x + 12, top + 34]]], blade: [[x + 12, top + 34], [x + 26, top + 12]], behind: false },
    // The thrust: arm straight out ahead, the blade gone in towards him.
    attack: { arms: [back, [rs, [x + 12, top + 24], [x + 6, top + 16]]], blade: [[x + 6, top + 16], [x + 2, top - 2]], behind: true },
    // The feint: the blade swung wide, an opening shown.
    slap: { arms: [back, [rs, [x + 24, top + 22], [x + 27, top + 14]]], blade: [[x + 27, top + 14], [x + 40, top - 1]], behind: false },
    // The blade lowered, his other hand raised.
    palm: { arms: [[ls, [x - 22, top + 22], [x - 24, top + 10]], down], blade: [[x + 21, top + 50], [x + 29, top + 61]], behind: false },
    shove: { arms: [back, [rs, [x + 16, top + 30], [x + 10, top + 24]]], blade: [[x + 10, top + 24], [x + 6, top + 4]], behind: true },
    grab: { arms: [back, [rs, [x + 19, top + 36], [x + 15, top + 30]]], blade: [[x + 15, top + 30], [x + 24, top + 4]], behind: false },
    // The parry: the blade across him, high.
    guard: { arms: [back, [rs, [x + 20, top + 26], [x + 15, top + 16]]], blade: [[x + 15, top + 16], [x - 22, top + 4]], behind: false },
    hit: { arms: [[ls, [x - 22, top + 34], [x - 26, top + 26]], [rs, [x + 21, top + 40], [x + 23, top + 51]]], blade: [[x + 23, top + 51], [x + 36, top + 40]], behind: false },
  };
  const p = poses[pose];
  const blade = () => {
    const [[ax, ay], [bx, by]] = p.blade;
    const len = Math.hypot(bx - ax, by - ay);
    const [ux, uy] = [(bx - ax) / len, (by - ay) / len];
    // The hilt and its guard, then the blade: a dull edge round a glowing line.
    limb(g, [[ax - ux * 2, ay - uy * 2], [ax + ux * 3, ay + uy * 3]], 1, '8');
    limb(g, [[ax + ux * 3 - uy * 3, ay + uy * 3 + ux * 3], [ax + ux * 3 + uy * 3, ay + uy * 3 - ux * 3]], 0.7, '8');
    limb(g, [[ax + ux * 4, ay + uy * 4], [bx, by]], 1, '9');
    limb(g, [[ax + ux * 4, ay + uy * 4], [bx - ux, by - uy]], 0.3, '0');
  };
  const arms = () => {
    for (const arm of p.arms) {
      limb(g, arm, 2.8, '2');
      const [hx, hy] = arm[arm.length - 1]!;
      disc(g, hx, hy, 2.2, 2.2, '1');
    }
  };
  if (p.behind) {
    blade();
    arms();
  }
  // His back: the coat to below the frame, broad at the shoulders, narrower at the waist.
  poly(g, [[x - sw - 1, top + 25], [x + sw + 1, top + 25], [x + sw - 4, SCAV_H + 2], [x - sw + 4, SCAV_H + 2]], '2');
  disc(g, x - sw + 2, top + 29, 4, 4, '2');
  disc(g, x + sw - 2, top + 29, 4, 4, '2');
  // The wine sash at his waist, a gold edge on the coat's skirt below it.
  if (!plain) g.forEach((row, y) => row.forEach((c, cx) => {
    if (c !== '2') return;
    if (y >= top + 44 && y <= top + 47 && Math.abs(cx - x) < sw) row[cx] = '6';
    else if (y === top + 48 && Math.abs(cx - x) < sw - 1) row[cx] = '7';
  }));
  // The coat's back seam, from the collar to the sash.
  for (let y = top + 30; y < top + 44; y++) put(g, x, y, '3');
  // His neck, and the high collar round it, wine.
  poly(g, [[x - 3 + headDx / 2, top + 17 + headDy], [x + 3 + headDx / 2, top + 17 + headDy], [x + 4, top + 25], [x - 4, top + 25]], '1');
  poly(g, [[x - 6 + headDx / 3, top + 20 + headDy], [x + 6 + headDx / 3, top + 20 + headDy], [x + 7, top + 27], [x - 7, top + 27]], '6');
  if (!p.behind) {
    arms();
    blade();
  }
  // The head: dark hair cut very close, the skin showing at the back of his neck; his ears.
  const hx = x + headDx;
  const hy = top + 11 + headDy;
  if (plain) {
    // The plain coat's hood, up: over his head and down over his collar (Days 2 to 7, below).
    disc(g, hx, hy, 8.5, 9.5, '6');
    poly(g, [[hx - 8, hy + 2], [hx + 8, hy + 2], [x + 9, top + 28], [x - 9, top + 28]], '6');
  } else {
    disc(g, hx, hy, 7, 8.5, '4');
    for (let y = Math.round(hy + 5); y < hy + 9; y++) for (let dx = -7; dx <= 7; dx++) if (g[y]?.[Math.round(hx + dx)] === '4') put(g, hx + dx, y, '1');
    for (const s of [-1, 1]) for (let dy = 0; dy <= 2; dy++) put(g, hx + s * 7, hy + dy, '1');
  }
  lightDay(g, '1', ['K', 'K', 'k']);
  lightDay(g, '2', ['C', 'M', 'c']);
  lightDay(g, '4', ['H', 'H', 'H']);
  // Where the light catches the crop, up on the crown.
  if (!plain) for (const [dx, dy] of [[2, -7], [3, -7], [4, -6], [3, -6], [5, -5]] as const) put(g, hx + dx, hy + dy, 'h');
  lightDay(g, '6', ['W', 'W', 'w']);
  lightDay(g, '7', ['A', 'A', 'a']);
  outline(g);
  const colours = {
    K: SHADES.skinTan, k: SHADES.skinTanShade, C: SHADES.cyanDeep, M: SHADES.cyanMid, c: SHADES.deep, '3': SHADES.deep,
    H: SHADES.deep, h: SHADES.woodLight, W: SHADES.wine, w: SHADES.wineDeep, A: SHADES.amber, a: SHADES.amberDeep,
    '8': SHADES.amber, '9': SHADES.wineDeep, '0': SHADES.wine, X: SHADES.shadow,
  };
  // The plain coat: worn grey-brown, a pale hood, no gold (as in the areas: `PRINCE_PLAIN`).
  if (plain) Object.assign(colours, { C: SHADES.dim, M: SHADES.light, c: SHADES.woodPale, '3': SHADES.woodPale, W: SHADES.light, w: SHADES.dim, '8': SHADES.woodPale });
  return { rows: rows(g), colours };
}

/** The prince, from behind, his light-blade in hand (Chapter 3). */
export const PRINCE_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(CARVER_POSES.map((p) => [p, princeBack(p)])) as Record<CarverPose, RowSprite>;

/**
 * A figure made of light (Chapter 3, the simulation room): every colour turned to the table's cyan by how
 * bright it is, so the shape and its shading stay readable.
 */
export function hologram(s: RowSprite): RowSprite {
  const steps = [SHADES.cyanDeep, SHADES.cyanMid, SHADES.cyan, SHADES.white];
  const lum = (c: number) => (((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11) / 255;
  return { rows: s.rows, colours: Object.fromEntries(Object.entries(s.colours).map(([k, c]) => [k, steps[Math.min(3, Math.floor(lum(c) * 4.2))]!])) };
}

/** The citadel guard as the simulation shows them: a pike, an armoured coat, all in light (Day 2's lesson). */
export const SIM_GUARD_BATTLE: Record<FoePose, RowSprite> = Object.fromEntries(
  Object.entries(stragglerPoses({ broad: 3, skin: 'tan', head: 'shaved', holds: 'staff', coat: [SHADES.dim, SHADES.light, SHADES.woodPale], patched: false })).map(([pose, sprite]) => [pose, hologram(sprite)]),
) as Record<FoePose, RowSprite>;

// --- Chapter 3, Day 4 ---

/** Your friend (the heir): his blue-green coat with gold, his swept fair-red hair, your hand's practice blade. */
export const HEIR_BATTLE = stragglerPoses({ broad: -1, skin: 'fair', head: 'hair', hair: SHADES.amberDeep, holds: 'blade', coat: [SHADES.cyanMid, SHADES.cyan, SHADES.cyanDeep], patched: false });
/** Your hand, from behind, beside you at the square, his light-blade at full. */
export const HAND_BACK_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(CARVER_POSES.map((p) => [p, scavengerBack(p, 'hand')])) as Record<CarverPose, RowSprite>;
// --- Chapter 3, Day 7: the gate at night ---

/** The prince in the plain coat, hood up (the gate): his light-blade at full. */
export const PRINCE_PLAIN_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(CARVER_POSES.map((p): [string, RowSprite] => {
  const s = princeBack(p, true);
  return [p, { rows: s.rows, colours: { ...s.colours, '9': SHADES.wine, '0': SHADES.white } }];
})) as Record<CarverPose, RowSprite>;
/** Your friend, from behind, beside you at the gate. */
export const HEIR_BACK_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(CARVER_POSES.map((p) => [p, scavengerBack(p, 'heir')])) as Record<CarverPose, RowSprite>;
/** The city watch at the gate: the young one, keen, fair, his baton (and the city's blue coat). */
export const WATCH_YOUNG_BATTLE = stragglerPoses({ broad: 0, skin: 'fair', head: 'hair', hair: SHADES.woodPale, holds: 'staff', coat: [SHADES.cyanDeep, SHADES.cyanMid, SHADES.deep], patched: false });
/** The other, older and broader, shaved. */
export const WATCH_OLD_BATTLE = stragglerPoses({ broad: 4, skin: 'tan', head: 'shaved', holds: 'staff', coat: [SHADES.cyanDeep, SHADES.cyanMid, SHADES.deep], patched: false });

/** A rioter: a low-district coat, a scarf wound over the face, a length of pipe. */
export const RIOTER_BATTLE = stragglerPoses({ broad: 1, skin: 'tan', head: 'wrap', holds: 'staff', coat: [SHADES.woodLight, SHADES.woodPale, SHADES.wood], wrap: [SHADES.amberDeep, SHADES.wood] });
/** The big one: broad, shaved, a lump of the barricade in his fist. */
export const RIOTER_BIG_BATTLE = stragglerPoses({ broad: 5, skin: 'dark', head: 'shaved', holds: 'lump', coat: [SHADES.dim, SHADES.light, SHADES.deep] });
/** The prince with his light-blade at full (the square): the blade's wine bright, not dulled for practice. */
export const PRINCE_FULL_BATTLE: Record<CarverPose, RowSprite> = Object.fromEntries(
  Object.entries(PRINCE_BATTLE).map(([pose, s]): [string, RowSprite] => [pose, { rows: s.rows, colours: { ...s.colours, '9': SHADES.wine, '0': SHADES.white } }]),
) as Record<CarverPose, RowSprite>;
