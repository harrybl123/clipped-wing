import { MAP_CANOPY_Y, MAP_TUBE_X } from '../data/map';
import { SHADES as S, addLight, cellRandom, falloff, rgb, type PixelColour, type RGB } from './pixelArt';
import { BIRD, type RowSprite } from './sprites';

// Grounded's telling (Chapter 4, Day 1, at the lookout): the pictures under his words, staged like the
// prologue's stills but moving, almost frame by frame (designer). Each panel is a still painted once
// (`paint`, dithered like every backdrop) and what moves on it (`frame`: rectangles, drawn every frame).
// A panel moves on in beats, one for each turn in what he's saying (`#beat:<n>` in story/canopy/lore.ink).
// Time is stepped (LORE_FPS) so things move like drawings, not smoothly. Pure, so the panels can be
// checked without the game (and painted to pictures in a test).
//
// `belief` is the prologue's own picture of the tree (the map's, painted by the scene: `paintTree`), taken
// back: the offerings rise up the tube into the Canopy's glare, as the tree believes. Then `tube` shows the
// tree from outside, as it is.
//
// Placeholder art, in the palette: people warm and dark, the integrated pale with cyan seams, the capital
// amber lights. Red only for a bird and for you.

export const LORE_W = 480;
export const LORE_H = 270;
/** The picture's important part is above this; his words go in the band below (the picture runs on under it, dimmed). */
export const LORE_PICTURE_H = 212;

export interface LoreRect {
  x: number;
  y: number;
  w: number;
  h: number;
  c: number;
  a?: number;
}

/** Where a panel is: its beat, seconds since that beat began, and seconds since the panel came up. */
export interface LoreFrame {
  beat: number;
  since: number;
  t: number;
}

export interface LorePanel {
  /** The still (full height: the band dims its foot). For `belief`, the scene paints the prologue's tree instead. */
  paint: (x: number, y: number) => PixelColour;
  frame: (f: LoreFrame) => LoreRect[];
}

/** Drawings a second: everything that moves is stepped to this. */
export const LORE_FPS = 8;
const step = (s: number) => Math.floor(s * LORE_FPS) / LORE_FPS;
const clamp01 = (k: number) => Math.max(0, Math.min(1, k));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (k: number) => {
  const c = clamp01(k);
  return c * c * (3 - 2 * c);
};
const mix = (a: RGB, b: RGB, k: number): RGB => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
/** Something fixed in [0, 1] for a pair of numbers (twinkling, scatter). */
const hash = (a: number, b: number) => cellRandom(a, b, 71);

/** Smooth 2D value noise in [0, 1] (no streaks, unlike adding two 1D noises). */
function noise2(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const sx = ease(x - xi);
  const sy = ease(y - yi);
  const at = (i: number, j: number) => cellRandom(i, j, 13);
  return lerp(lerp(at(xi, yi), at(xi + 1, yi), sx), lerp(at(xi, yi + 1), at(xi + 1, yi + 1), sx), sy);
}
/** Noise with detail: a few octaves. */
const fbm = (x: number, y: number) => noise2(x, y) * 0.55 + noise2(x * 2.1 + 7, y * 2.1) * 0.3 + noise2(x * 4.3, y * 4.3 + 3) * 0.15;

/** Collects rectangles, rounded to whole pixels. */
class Out {
  readonly rects: LoreRect[] = [];
  r(x: number, y: number, w: number, h: number, c: number, a?: number): void {
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const w0 = Math.round(x + w) - x0;
    const h0 = Math.round(y + h) - y0;
    if (w0 <= 0 || h0 <= 0 || (a !== undefined && a <= 0)) return;
    this.rects.push(a === undefined || a >= 1 ? { x: x0, y: y0, w: w0, h: h0, c } : { x: x0, y: y0, w: w0, h: h0, c, a });
  }
  /** A line of pixels (or thicker). */
  line(x0: number, y0: number, x1: number, y1: number, c: number, a?: number, thick = 1): void {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) this.r(lerp(x0, x1, i / n), lerp(y0, y1, i / n), thick, thick, c, a);
  }
  /** A ring of pixels. */
  ring(cx: number, cy: number, r: number, c: number, a?: number): void {
    const n = Math.max(8, Math.round(r * 6));
    for (let i = 0; i < n; i++) this.r(cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r, 1, 1, c, a);
  }
  /** A row sprite, scaled up by whole pixels, flipped, or squeezed to `squeeze` of its width (turning). */
  sprite(s: RowSprite, x: number, y: number, scale = 1, flip = false, squeeze = 1, a?: number): void {
    const w = s.rows[0]!.length;
    const cols = Math.max(1, Math.round(w * squeeze));
    const off = Math.round((w - cols) / 2);
    s.rows.forEach((row, ry) => {
      for (let cx = 0; cx < cols; cx++) {
        const src = Math.min(w - 1, Math.floor((cx / cols) * w));
        const c = s.colours[row[flip ? w - 1 - src : src]!];
        if (c !== undefined) this.r(x + (cx + off) * scale, y + ry * scale, scale, scale, c, a);
      }
    });
  }
}

// --- People ---

type Kind = 'human' | 'integrated' | 'king';

interface Figure {
  /** Height in pixels. */
  h?: number;
  kind?: Kind;
  facing?: 1 | -1;
  /** Walking: the stride's phase (radians). Standing still if left out. */
  walk?: number;
  /** The front arm: 0 hanging, 1 straight up (forwards on the way). */
  arm?: number;
  /** Both arms held out. */
  armsOut?: boolean;
  /** Bent over (0 to 1). */
  bent?: number;
  a?: number;
}

const COLOURS: Record<Kind, { body: number; shade: number; rim: number }> = {
  human: { body: S.woodLight, shade: S.wood, rim: S.dim },
  integrated: { body: S.light, shade: S.dim, rim: S.white },
  king: { body: S.amberDeep, shade: S.wood, rim: S.amber },
};

/**
 * A figure with its feet at (x, feet), side on: a head, shoulders wider than the waist, arms, two legs.
 * Drawn row by row so it reads at any size, from a speck on the horizon to a giant.
 */
function figure(o: Out, x: number, feet: number, f: Figure = {}): void {
  const h = Math.max(6, f.h ?? 24);
  const kind = f.kind ?? 'human';
  const dir = f.facing ?? 1;
  const { body, shade, rim } = COLOURS[kind];
  const a = f.a;
  const px = (n: number) => Math.max(1, Math.round(n));
  const headH = px(h * 0.17);
  const torsoH = px(h * 0.32);
  const legH = h - headH - torsoH;
  const shoulders = px(h * 0.27);
  const waist = px(h * 0.18);
  const lw = px(h * 0.08);
  const top = feet - h;
  const lean = (f.bent ?? 0) * h * 0.25;
  // Legs: the front one forwards, the back one back, as they stride; a robe for the king.
  if (kind === 'king') {
    for (let r = 0; r < legH; r++) {
      const w = lerp(waist, shoulders + 2, r / legH);
      o.r(x - w / 2, top + headH + torsoH + r, w, 1, body, a);
      o.r(dir > 0 ? x + w / 2 - 1 : x - w / 2, top + headH + torsoH + r, 1, 1, rim, a);
    }
  } else {
    const stride = f.walk === undefined ? 0 : Math.sin(f.walk) * h * 0.08;
    const lift = (s: number) => (f.walk === undefined ? 0 : Math.max(0, Math.round(Math.sin(f.walk + s) * h * 0.04)));
    o.r(x - waist / 2 - stride * dir, top + headH + torsoH, lw, legH - lift(Math.PI), shade, a);
    o.r(x + waist / 2 - lw + stride * dir, top + headH + torsoH, lw, legH - lift(0), body, a);
  }
  // The torso, tapering from the shoulders to the waist, leaning forward when bent.
  for (let r = 0; r < torsoH; r++) {
    const w = Math.round(lerp(shoulders, waist, r / torsoH));
    const lx = x - w / 2 + dir * lean * (1 - r / torsoH);
    o.r(lx, top + headH + r, w, 1, body, a);
    o.r(dir > 0 ? lx + w - 1 : lx, top + headH + r, 1, 1, rim, a);
  }
  // The head, a little forward of the shoulders.
  const headW = px(headH * 0.9);
  const hx = x - headW / 2 + dir * (lean + h * 0.02);
  const hy = top + lean * 0.4;
  o.r(hx, hy, headW, headH, body, a);
  o.r(dir > 0 ? hx + headW - 1 : hx, hy + 1, 1, headH - 1, rim, a);
  if (kind === 'integrated') {
    // A seam of light down the body, and the eye.
    o.r(x + dir * lean * 0.5, top + headH + 1, 1, torsoH - 2, S.cyan, a);
    o.r(dir > 0 ? hx + headW - 2 : hx + 1, hy + Math.round(headH / 3), 1, 1, S.cyan, a);
  }
  if (kind === 'king') {
    // A crown of three points.
    const ch = px(h * 0.06);
    o.r(hx, hy - ch, headW, ch, S.amber, a);
    [0, Math.floor(headW / 2), headW - 1].forEach((dx) => o.r(hx + dx, hy - 2 * ch, 1, ch, S.amber, a));
  }
  // Arms.
  const sy = top + headH + 1;
  const len = h * 0.36;
  const back = x - dir * shoulders / 2 + dir * lean - (dir > 0 ? lw : 0);
  const front = x + dir * shoulders / 2 + dir * lean - (dir > 0 ? 0 : lw);
  if (f.armsOut) {
    o.line(x - shoulders / 2, sy, x - shoulders / 2 - len, sy - len * 0.25, rim, a, lw);
    o.line(x + shoulders / 2, sy, x + shoulders / 2 + len, sy - len * 0.25, rim, a, lw);
    return;
  }
  o.r(back, sy, lw, len * 0.9, shade, a);
  const ang = lerp(Math.PI / 2, -Math.PI / 2, f.arm ?? 0);
  o.line(front, sy, front + Math.cos(ang) * len * dir, sy + Math.sin(ang) * len, f.arm ? rim : body, a, lw);
}

// --- Shared scenery ---

const SHADOW = rgb(S.shadow);
const DEEP = rgb(S.deep);
const AMBER_DEEP = rgb(S.amberDeep);
const AMBER = rgb(S.amber);
const CYAN = rgb(S.cyan);
const CYAN_DEEP = rgb(S.cyanDeep);
const GREEN_DEEP = rgb(S.greenDeep);
const GREEN_MID = rgb(S.greenMid);
const WOOD = rgb(S.wood);
const WOOD_LIGHT = rgb(S.woodLight);
const WOOD_PALE = rgb(S.woodPale);
const DIM = rgb(S.dim);
const LIGHT = rgb(S.light);

/** A dusk sky: dark above, warm at the horizon. */
const duskSky = (y: number, horizon: number): RGB => mix(SHADOW, AMBER_DEEP, Math.pow(clamp01(y / horizon), 1.8));

/** A dark ground, with a little texture. */
const ground = (x: number, y: number, k = 0.4): RGB => mix(SHADOW, WOOD, k * (0.5 + fbm(x / 9, y / 4) * 0.8));

/** The capital's crag on the horizon: its top edge at x (Infinity where there's none). */
function cragTop(x: number, cx: number, half: number, height: number, horizon: number): number {
  const d = Math.abs(x - cx) / half;
  if (d >= 1) return Infinity;
  const towers = (Math.floor(x / 3) % 4 === 0 ? height * 0.18 : 0) * (1 - d);
  return horizon - height * (1 - d * d) - towers - noise2(x / 4, 0) * 3;
}

/** The capital's lights on its crag: fixed points, which the frames make twinkle. */
function cragLights(cx: number, half: number, height: number, horizon: number, count: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.round(cx - half * 0.8 + hash(i, 1) * half * 1.6);
    const top = cragTop(x, cx, half, height, horizon);
    if (!Number.isFinite(top)) continue;
    out.push({ x, y: Math.round(top + 2 + hash(i, 2) * (horizon - top - 3)) });
  }
  return out;
}

function twinkle(o: Out, lights: { x: number; y: number }[], t: number): void {
  const s = Math.floor(step(t) * 3);
  lights.forEach((p, i) => {
    if (hash(i, s) < 0.12) return;
    o.r(p.x, p.y, 1, 1, hash(i, 9) < 0.3 ? S.white : S.amber);
  });
}

/** Leaves in billows: a clump's top edge at x (for the canopy below the lookout). */
const billowTop = (x: number, base: number, size: number) => {
  // Clumps of uneven size: a wave whose phase wanders, rounded off at the top.
  const phase = x / size + noise2(x / (size * 4), size) * 4;
  return base - size * 0.75 * Math.sqrt(Math.abs(Math.sin(phase))) - noise2(x / 5, size + 1) * 3;
};

// --- The lights on the horizon, from the lookout ---

const LIGHTS_HORIZON = 140;
const LIGHTS_CRAG = { cx: 330, half: 34, height: 26 };
const lightsPoints = cragLights(LIGHTS_CRAG.cx, LIGHTS_CRAG.half, LIGHTS_CRAG.height, LIGHTS_HORIZON, 40);

const lights: LorePanel = {
  paint: (x, y) => {
    // Banks of leaves below the lookout, nearer and darker as they come down.
    const near = billowTop(x + 40, 210, 26);
    const mid = billowTop(x, 178, 16);
    const far = billowTop(x + 13, 156, 9);
    if (y >= near) return mix(SHADOW, GREEN_DEEP, 0.35 + fbm(x / 7, y / 7) * 0.3 - (y - near) / 80);
    if (y >= mid) return mix(GREEN_DEEP, GREEN_MID, 0.15 + fbm(x / 6, y / 6) * 0.35 - (y - mid) / 40);
    if (y >= far) return mix(GREEN_DEEP, AMBER_DEEP, 0.35 + fbm(x / 5, y / 5) * 0.25 - (y - far) / 50);
    if (y >= LIGHTS_HORIZON) return mix(mix(GREEN_DEEP, AMBER_DEEP, 0.6), SHADOW, 0.2 + (y - LIGHTS_HORIZON) / 40);
    if (y >= cragTop(x, LIGHTS_CRAG.cx, LIGHTS_CRAG.half, LIGHTS_CRAG.height, LIGHTS_HORIZON)) return mix(SHADOW, DEEP, 0.4);
    return addLight(duskSky(y, LIGHTS_HORIZON), AMBER, 0.4 * falloff(x, y, 300, LIGHTS_HORIZON, 220, 36));
  },
  frame: ({ beat, since, t }) => {
    const o = new Out();
    twinkle(o, lightsPoints, t);
    if (beat >= 1) {
      // That glow along the edge of the sky, coming up beyond the capital: them.
      const k = beat > 1 ? 1 : ease(step(since) / 2.5);
      for (let i = 0; i < 8; i++) {
        const y = LIGHTS_HORIZON - 1 - i;
        const a = (0.42 - i * 0.05) * k;
        const left = LIGHTS_CRAG.cx - LIGHTS_CRAG.half;
        const right = LIGHTS_CRAG.cx + LIGHTS_CRAG.half;
        o.r(0, y, left, 1, S.cyan, a);
        o.r(right, y, LORE_W - right, 1, S.cyan, a);
      }
      // Far, pale towers in it, too far to make out, rising a drawing at a time.
      [24, 54, 70, 118, 160, 392, 418, 430, 462].forEach((x, i) => {
        const h = Math.round((10 + hash(i, 5) * 26) * k);
        o.r(x, LIGHTS_HORIZON - h, 2, h, S.light, 0.3 * k);
        o.r(x + (i % 2), LIGHTS_HORIZON - h, 1, h, S.cyan, 0.45 * k);
      });
    }
    return o.rects;
  },
};

// --- Someone, long ago, making something cleverer than themselves ---

const BENCH = { x0: 196, x1: 330, y: 150 };
const ROOM_FLOOR = 204;
const makers: LorePanel = {
  paint: (x, y) => {
    // A workshop wall of boards; the bench; the floor; tools hung up.
    let c = mix(SHADOW, WOOD, 0.35 + fbm(x / 3, y / 40) * 0.4 + (x % 23 === 0 ? -0.25 : 0));
    if (y >= ROOM_FLOOR) c = mix(SHADOW, WOOD_LIGHT, 0.3 + fbm(x / 8, y / 2) * 0.3);
    if (y >= BENCH.y && y < BENCH.y + 7 && x >= BENCH.x0 && x < BENCH.x1) c = y === BENCH.y ? WOOD_PALE : mix(WOOD_LIGHT, WOOD, (y - BENCH.y) / 7);
    if (y >= BENCH.y + 7 && y < ROOM_FLOOR && (Math.abs(x - BENCH.x0 - 8) < 2 || Math.abs(x - BENCH.x1 + 8) < 2)) c = WOOD_LIGHT;
    const tool = (tx: number, len: number) => (x === tx && y > 70 && y < 70 + len) || (Math.abs(x - tx) < 3 && y > 66 && y <= 70);
    if (tool(214, 30) || tool(236, 22) || tool(300, 34) || tool(318, 26)) c = WOOD_PALE;
    // A window, high up, with night outside.
    if (x > 360 && x < 400 && y > 40 && y < 80) c = x === 380 || y === 60 ? WOOD : mix(SHADOW, CYAN_DEEP, 0.4);
    return addLight(c, AMBER, 0.6 * falloff(x, y, 262, BENCH.y - 10, 130, 80));
  },
  frame: ({ beat, since, t }) => {
    const o = new Out();
    const doll = (pose: 0 | 1 | 2, eye: boolean) => {
      const y = BENCH.y;
      if (pose === 0) {
        o.r(240, y - 5, 26, 5, S.dim);
        o.r(266, y - 7, 7, 7, S.dim);
        if (eye) o.r(270, y - 5, 1, 1, S.cyan);
      } else if (pose === 1) {
        o.r(240, y - 5, 16, 5, S.dim);
        o.line(256, y - 5, 264, y - 13, S.dim, undefined, 4);
        o.r(262, y - 20, 7, 7, S.dim);
        o.r(266, y - 18, 1, 1, S.cyan);
      } else {
        o.r(240, y - 4, 16, 4, S.dim);
        o.r(255, y - 16, 6, 12, S.dim);
        o.r(254, y - 23, 7, 7, S.dim);
        o.r(259, y - 21, 1, 1, S.cyan);
      }
    };
    if (beat === 0) {
      // Hammering: the arm comes up, and down on the beat, with sparks.
      const p = (step(t) % 0.75) / 0.75;
      const arm = p < 0.5 ? p * 1.6 : Math.max(0, 0.8 - (p - 0.5) * 6);
      figure(o, 214, ROOM_FLOOR, { h: 60, arm });
      doll(0, false);
      if (p >= 0.62 && p < 0.85) for (let i = 0; i < 5; i++) o.r(236 + hash(i, Math.floor(t * 2)) * 16, BENCH.y - 8 - hash(i, 3) * 14, 1, 1, i % 2 ? S.amber : S.white);
      return o.rects;
    }
    if (beat === 1) {
      // It wakes: an eye, then it sits up, a drawing at a time.
      figure(o, 214, ROOM_FLOOR, { h: 60, arm: 0 });
      const s = step(since);
      const pose = Math.min(2, Math.floor(s / 0.75)) as 0 | 1 | 2;
      doll(pose, pose > 0 || s % 0.5 < 0.3);
      o.r(236, BENCH.y - 30, 40, 30, S.cyan, 0.06 + 0.04 * pose);
      return o.rects;
    }
    // It stands, and grows, past its maker, who backs away; the room's light goes from amber to cyan.
    const s = step(since);
    const h = s < 0.6 ? 24 : lerp(24, 146, ease((s - 0.6) / 3.4));
    figure(o, lerp(214, 150, ease(s / 2)), ROOM_FLOOR, { h: 60, arm: s > 1.2 ? 0.35 : 0, facing: 1 });
    o.r(0, 0, LORE_W, LORE_H, S.cyan, 0.14 * ease((s - 0.6) / 3));
    figure(o, 262, BENCH.y, { kind: 'integrated', h, facing: -1 });
    return o.rects;
  },
};

// --- One choice: join it, or be ruled by it ---

const CHOICE_FLOOR = 190;
const LIGHT_X = 310;
const PEOPLE = Array.from({ length: 9 }, (_, i) => 60 + i * 24);
/** Those who join, nearest the light first. */
const JOINERS = [8, 7, 6, 5, 4, 3];
const choice: LorePanel = {
  paint: (x, y) => {
    let c: RGB = y < 176 ? mix(SHADOW, DEEP, Math.pow(y / 176, 2)) : ground(x, y, 0.3);
    // A tiny tree, far off to the left: the one they walk to.
    const crown = Math.hypot(x - 26, (y - 150) * 1.2) < 11 + fbm(x / 3, y / 3) * 3;
    if (crown || (y >= 156 && y < 176 && Math.abs(x - 26) <= 1)) c = mix(GREEN_DEEP, SHADOW, 0.2);
    // The column of light, and its pool on the ground.
    c = addLight(c, CYAN, 0.6 * Math.exp(-Math.pow((x - LIGHT_X) / 10, 2)) * (y < CHOICE_FLOOR + 2 ? 1 : 0.3));
    return addLight(c, CYAN, 0.4 * falloff(x, y, LIGHT_X, CHOICE_FLOOR, 60, 9));
  },
  frame: ({ beat, since, t }) => {
    const o = new Out();
    const s = step(since);
    o.r(LIGHT_X - 2, 0, 4, CHOICE_FLOOR, S.white, 0.15 + 0.1 * Math.sin(step(t) * 4));
    PEOPLE.forEach((x0, i) => {
      const k = JOINERS.indexOf(i);
      if (k >= 0 && beat >= 1) {
        // Walks into the light; a flash; comes out the other side as one of them.
        const go = beat === 1 ? s - k * 0.8 : 99;
        const walk = (LIGHT_X - x0) / 34;
        const to = 350 + k * 22;
        if (go < 0) figure(o, x0, CHOICE_FLOOR, { h: 26 });
        else if (go < walk) figure(o, lerp(x0, LIGHT_X, go / walk), CHOICE_FLOOR, { h: 26, walk: step(go) * 10 });
        else if (go < walk + 0.25) o.r(LIGHT_X - 6, CHOICE_FLOOR - 36, 12, 36, S.white, 0.9);
        else {
          const g = clamp01((go - walk - 0.25) / 0.9);
          figure(o, lerp(LIGHT_X + 8, to, g), CHOICE_FLOOR, { kind: 'integrated', h: 36, walk: g < 1 ? step(go) * 8 : undefined });
        }
        return;
      }
      if (beat >= 2) {
        // The rest turn their backs on it, and walk off into the dark, towards the tree.
        const g = ease(s / 5);
        figure(o, lerp(x0, 40 + i * 9, g), lerp(CHOICE_FLOOR, 176, g), { facing: -1, h: lerp(26, 10, g), walk: g < 1 ? step(s) * 10 : undefined });
        return;
      }
      figure(o, x0, CHOICE_FLOOR, { h: 26 });
    });
    return o.rects;
  },
};

// --- The capital between them and us; its king's bargain ---

const CAP_HORIZON = 156;
const CAP_CRAG = { cx: 244, half: 50, height: 66 };
const capPoints = cragLights(CAP_CRAG.cx, CAP_CRAG.half, CAP_CRAG.height, CAP_HORIZON, 70);
const KING = { x: 244, feet: 92 };
const WORKERS = [356, 374, 392, 410, 428];
/** The integrated's towers, far left: their tops. */
const towerTop = (x: number) => (x < 150 ? 20 + ((Math.floor(x / 15) * 37) % 64) + (x % 15 < 3 ? 400 : 0) : Infinity);
/** A small tree on the right, in silhouette. */
const smallTree = (x: number, y: number, cx: number, base: number, size: number) =>
  (Math.abs(x - cx) <= Math.max(1, size / 8) && y > base - size && y <= base) || Math.hypot(x - cx, (y - (base - size * 1.4)) * 1.1) < size * 0.7 + fbm(x / 3, y / 3) * size * 0.25;
const capital: LorePanel = {
  paint: (x, y) => {
    if (y >= CAP_HORIZON) {
      // Fields in rows on the right; bare ground.
      const field = x > 330 && (y - CAP_HORIZON) % 5 === 0 ? 0.3 : 0;
      return mix(ground(x, y, 0.45), WOOD_PALE, field);
    }
    if (smallTree(x, y, 452, CAP_HORIZON, 26)) return mix(GREEN_DEEP, GREEN_MID, fbm(x / 4, y / 4) * 0.5);
    if (y >= cragTop(x, CAP_CRAG.cx, CAP_CRAG.half, CAP_CRAG.height, CAP_HORIZON)) return mix(SHADOW, DEEP, 0.5);
    // The integrated's towers: pale, enormous, hazy with distance.
    if (y >= towerTop(x)) return mix(duskSky(y, CAP_HORIZON), (y + x * 2) % 11 === 0 ? CYAN : LIGHT, 0.4);
    return addLight(duskSky(y, CAP_HORIZON), AMBER, 0.3 * falloff(x, y, CAP_CRAG.cx, CAP_HORIZON, 170, 50));
  },
  frame: ({ beat, since, t }) => {
    const o = new Out();
    const s = step(since);
    twinkle(o, capPoints, t);
    // The towers' seams, breathing.
    for (let x = 8; x < 150; x += 15) o.r(x, towerTop(x) + 4, 1, CAP_HORIZON - towerTop(x) - 4, S.cyan, 0.2 + 0.15 * Math.sin(step(t) * 2 + x));
    figure(o, KING.x, KING.feet, { kind: 'king', h: 24, armsOut: beat >= 1 });
    if (beat >= 1) {
      // What passes between: their light one way, the tree's work the other, through his hands.
      for (let i = 0; i < 7; i++) {
        const k = (step(t) * 0.5 + i / 7) % 1;
        o.r(lerp(150, KING.x - 14, k), lerp(64, KING.feet - 18, k), 2, 1, S.cyan);
        o.r(lerp(440, KING.x + 14, k), lerp(130, KING.feet - 18, k) - Math.sin(k * Math.PI) * 10, 2, 1, S.amber);
      }
    }
    if (beat >= 2) {
      // People like you, bent over the fields; and what holds them there, link by link.
      WORKERS.forEach((x, i) => {
        const p = step(t + i * 0.3) % 1;
        figure(o, x, 186, { bent: 0.7, arm: p < 0.5 ? 0.2 : 0.55, h: 20 });
        const n = Math.floor(22 * ease(s / 1.8 - i * 0.12));
        for (let j = 0; j < n; j++) {
          const q = j / 22;
          const cx = lerp(KING.x + 8, x, q);
          const cy = lerp(KING.feet - 12, 172, q) + Math.sin(q * Math.PI) * 18;
          o.r(cx, cy, j % 2 ? 2 : 1, j % 2 ? 1 : 2, S.light);
        }
      });
    }
    return o.rects;
  },
};

// --- The tree as the tree believes it (the prologue's picture): offerings up the tube, into the glare ---

/** On the map's tree: where the offering floor is, and the glare at the top. */
const BELIEF_FLOOR = 192;
const RISING = [S.amber, S.light, S.red, S.white, S.woodPale, S.amber];
const belief: LorePanel = {
  paint: () => SHADOW,
  frame: ({ t }) => {
    const o = new Out();
    RISING.forEach((c, i) => {
      const y = BELIEF_FLOOR - ((step(t) * 30 + i * 30) % (BELIEF_FLOOR - MAP_CANOPY_Y));
      o.r(MAP_TUBE_X - 1, y, c === S.red ? 3 : 2, 2, c, clamp01((y - MAP_CANOPY_Y) / 24));
    });
    return o.rects;
  },
};

// --- The tree as it is, from outside: the tube up the middle, out of the crown, the cable down the far side ---

const TREE = { x: 240, ground: 200, top: 96 };
/** The crown: billows of leaves. */
const CROWN = [[240, 66, 46], [190, 80, 34], [292, 80, 34], [212, 46, 30], [268, 46, 30], [156, 96, 22], [326, 96, 22], [240, 34, 26]] as const;
const CABLE = { x0: 338, y0: 100, x1: 400, y1: 198 };
const FAR_LIGHTS = Array.from({ length: 10 }, (_, i) => ({ x: 450 + (i % 5) * 4 + Math.round(hash(i, 4) * 3), y: 190 + Math.floor(i / 5) * 3 }));
/** The tentacles out of the top of the tube: arms that rise and curl over, thick at the root, thin at the tip. */
const TENTACLE_POINTS = [-1, -0.6, -0.2, 0.2, 0.6, 1].flatMap((spread, i) =>
  Array.from({ length: 40 }, (_, j) => {
    const k = j / 39;
    return { x: TREE.x + spread * 46 * k + Math.sin(k * 4 + i) * 2, y: 24 - Math.sin(k * Math.PI * 0.75) * 22 + k * k * 16, w: lerp(2.2, 0.8, k) };
  }),
);

function crownAt(x: number, y: number): number {
  let best = 0;
  for (const [cx, cy, r] of CROWN) {
    const d = Math.hypot(x - cx, (y - cy) * 1.15) / (r * (0.88 + fbm(x / 5, y / 5) * 0.25));
    if (d < 1) best = Math.max(best, 1 - d + (cy - y) / (r * 4));
  }
  return best;
}

function treePaint(x: number, y: number): PixelColour {
  let c: RGB = mix(SHADOW, DEEP, fbm(x / 30, y / 30) * 0.7);
  if (y >= TREE.ground) c = ground(x, y, 0.45);
  // The trunk, flaring into roots at its foot, bark running up it.
  const half = 34 + Math.pow(Math.max(0, y - 150) / 50, 2) * 34;
  if (y > TREE.top && y < TREE.ground + 4 && Math.abs(x - TREE.x) < half) {
    const edge = 1 - Math.abs(x - TREE.x) / half;
    c = mix(WOOD, WOOD_PALE, (0.2 + fbm(x / 2, y / 22) * 0.5) * (0.4 + edge * 0.8));
  }
  // The crown.
  const leaf = crownAt(x, y);
  if (leaf > 0) c = mix(mix(GREEN_DEEP, SHADOW, 0.25), GREEN_MID, clamp01(leaf * 1.2 + fbm(x / 4, y / 4) * 0.35 - 0.2));
  // The cable, down the far side.
  if (x >= CABLE.x0 && x <= CABLE.x1 && Math.abs(y - lerp(CABLE.y0, CABLE.y1, (x - CABLE.x0) / (CABLE.x1 - CABLE.x0))) < 0.8) c = DIM;
  if (FAR_LIGHTS.some((p) => p.x === x && p.y === y)) c = AMBER;
  // The tube, up through it all and out of the top, in arms that curl over.
  if (Math.abs(x - TREE.x) <= 1 && y > 20 && y < TREE.ground) c = x === TREE.x ? LIGHT : CYAN;
  if (TENTACLE_POINTS.some((p) => Math.abs(p.x - x) < p.w && Math.abs(p.y - y) < p.w)) c = CYAN;
  return addLight(c, CYAN, 0.28 * Math.exp(-Math.pow((x - TREE.x) / 9, 2)) * (y > 20 && y < TREE.ground ? 1 : 0));
}

/** Where the canopy's people stand along the top of the crown. */
const CROWN_FOLK = [176, 198, 220, 262, 284, 304];
const crownTopAt = (x: number) => {
  for (let y = 0; y < TREE.ground; y++) if (crownAt(x, y) > 0) return y + 1;
  return TREE.top;
};
const CROWN_TOPS = CROWN_FOLK.map(crownTopAt);

const tube: LorePanel = {
  paint: treePaint,
  frame: ({ beat, since, t }) => {
    const o = new Out();
    const s = step(t);
    RISING.forEach((c, i) => {
      const y = TREE.ground - ((s * 34 + i * 30) % 190);
      if (y > 22) o.r(TREE.x - 1, y, c === S.red ? 3 : 2, 2, c);
      else if (beat >= 3) {
        // Taken by the people up top as soon as it comes out.
        const k = clamp01((22 - y) / 20);
        const j = i % CROWN_FOLK.length;
        o.r(lerp(TREE.x, CROWN_FOLK[j]!, k), lerp(20, CROWN_TOPS[j]! - 14, k) - Math.sin(k * Math.PI) * 10, 2, 2, c);
      }
    });
    if (beat >= 1) {
      // Crates, down the cable.
      for (let i = 0; i < 4; i++) {
        const k = (s * 0.2 + i / 4) % 1;
        const x = lerp(CABLE.x0, CABLE.x1, k);
        const y = lerp(CABLE.y0, CABLE.y1, k);
        o.r(x - 3, y + 1, 6, 5, S.woodPale);
        o.r(x - 3, y + 1, 6, 1, S.light);
      }
    }
    if (beat === 2) {
      // And on, across the plain, to the capital's lights.
      for (let i = 0; i < 4; i++) {
        const k = (s * 0.16 + i / 4) % 1;
        o.r(lerp(CABLE.x1 + 2, 448, k), TREE.ground - 5, 6, 5, S.woodPale, 1 - k * 0.6);
      }
      FAR_LIGHTS.forEach((p, i) => o.r(p.x, p.y, 1, 1, hash(i, Math.floor(s * 3)) < 0.5 ? S.white : S.amber));
    }
    if (beat >= 3) {
      // Us, up here: the canopy's people, along the top, living off what comes up.
      CROWN_FOLK.forEach((x, i) => {
        const p = step(since + i * 0.4);
        figure(o, x + Math.sin(p * 1.3 + i) * 3, CROWN_TOPS[i]!, { h: 14, facing: i % 2 ? 1 : -1, arm: Math.sin(p * 2 + i) > 0.6 ? 1 : 0 });
      });
    }
    return o.rects;
  },
};

// --- A hand, too big to be anyone's, turning a bird ---

const HAND = { x: 230, y: 70, w: 70, h: 32 };
const HAND_BIRD = { x: 242, y: 112, scale: 3 };
const PERFECT = Array.from({ length: 18 }, (_, i) => ({ x: 14 + (i % 9) * 54 + (Math.floor(i / 9) % 2) * 27 }));
/** Things everyone else sends up: all different. */
const DIFFERENT: RowSprite[] = [
  { rows: ['pppppp', 'p.p.p.', 'p.p.p.'], colours: { p: S.woodPale } }, // a comb
  { rows: ['l....l', '.llll.'], colours: { l: S.light } }, // a bowl
  { rows: ['aaa', 'a.a', 'aaa', '.a.'], colours: { a: S.amber } }, // a cup
  { rows: ['..ww', '.www', 'www.', '.w..'], colours: { w: S.woodPale } }, // a bird, in plain wood
  { rows: ['g', 'g', 'gg', 'gg'], colours: { g: S.green } }, // a vial
  { rows: ['.cc.', 'cccc', '.cc.'], colours: { c: S.cyan } }, // a bead
  { rows: ['dddd', 'd..d', 'dddd'], colours: { d: S.dim } }, // a box
  { rows: ['l..', '.l.', '..l', '..l'], colours: { l: S.light } }, // a spoon
];
const hand: LorePanel = {
  paint: (x, y) => addLight(mix(SHADOW, DEEP, fbm(x / 16, y / 16) * 0.6), CYAN, 0.25 * falloff(x, y, 264, 104, 180, 110)),
  frame: ({ beat, since, t }) => {
    const o = new Out();
    const s = step(since);
    if (beat >= 2) {
      // Perfect things, endlessly, falling away into the dark: all the same.
      PERFECT.forEach((p, i) => {
        const y = ((step(t) * 40 + i * 23) % 290) - 20;
        o.r(p.x, y, 8, 8, S.light, 0.45);
        o.r(p.x, y, 8, 1, S.white, 0.55);
        o.r(p.x + 7, y + 1, 1, 7, S.dim, 0.45);
      });
    }
    // The forearm, down from above, its seams lit; the palm; the fingers curled under the bird; the thumb.
    const { x, y, w, h } = HAND;
    o.r(x + 30, 0, 34, y + 4, S.light);
    o.r(x + 30, 0, 2, y + 4, S.white);
    o.r(x + 62, 0, 2, y + 4, S.dim);
    o.r(x + 46, 0, 1, y, S.cyan, 0.8);
    o.r(x, y, w, h, S.light);
    o.r(x, y + h - 2, w, 2, S.dim);
    o.r(x + 22, y + 6, 1, h - 10, S.cyan, 0.7);
    for (let f = 0; f < 4; f++) {
      const fx = x + 3 + f * 17;
      const fh = 36 - f * 4;
      o.r(fx, y + h, 13, fh, S.light);
      o.r(fx + 12, y + h, 1, fh, S.dim);
      o.r(fx, y + h + Math.round(fh / 2), 13, 1, S.dim);
      o.r(fx + 1, y + h + fh, 11, 1, S.light);
    }
    o.r(x - 14, y + 8, 16, 10, S.light);
    o.r(x - 14, y + 17, 16, 1, S.dim);
    // The bird against its fingers, turning, a drawing at a time.
    const turn = [1, 0.5, 0.15, 0.5][Math.floor(step(t) / 0.4) % 4]!;
    const flip = Math.floor(step(t) / 1.6) % 2 === 1;
    if (beat >= 2) o.r(HAND_BIRD.x - 8, HAND_BIRD.y - 8, 46, 34, S.amber, 0.14 + 0.06 * Math.sin(step(t) * 3));
    o.sprite(BIRD, HAND_BIRD.x, HAND_BIRD.y, HAND_BIRD.scale, flip, turn);
    if (beat >= 1 && turn > 0.4 && step(t) % 0.75 < 0.5) {
      // The slip on its wing: a glint.
      const gx = HAND_BIRD.x + (flip ? 9 : 18);
      const gy = HAND_BIRD.y + 7;
      o.r(gx, gy - 2, 1, 5, S.white);
      o.r(gx - 2, gy, 5, 1, S.white);
    }
    if (beat >= 3) {
      // And what everyone else makes: different, every time, one after another.
      DIFFERENT.forEach((d, i) => {
        if (s < i * 0.35) return;
        const ang = (i / DIFFERENT.length) * Math.PI * 2 - Math.PI / 2 + Math.PI / 8;
        o.sprite(d, 264 + Math.cos(ang) * 160, 112 + Math.sin(ang) * 80, 3);
      });
    }
    return o.rects;
  },
};

// --- The balance: the tree's work on one side, what comes back on the other ---

const PIVOT = { x: 240, y: 70 };
const ARM = 96;
const scales: LorePanel = {
  paint: (x, y) => {
    let c: RGB = mix(SHADOW, DEEP, fbm(x / 14, y / 14) * 0.6);
    if (y >= 198) c = ground(x, y, 0.4);
    if (x >= 238 && x < 243 && y > PIVOT.y && y < 192) c = x === 238 ? LIGHT : WOOD_PALE;
    if (x >= 222 && x < 259 && y >= 192 && y < 198) c = WOOD_LIGHT;
    return addLight(c, AMBER, 0.32 * falloff(x, y, PIVOT.x, PIVOT.y + 30, 170, 100));
  },
  frame: ({ beat, since, t }) => {
    const o = new Out();
    const s = step(since);
    // The years going by, one mark at a time; with each, what comes back is a little less.
    const marks = beat === 0 ? 0 : beat === 1 ? Math.min(12, Math.floor(s / 0.45)) : 12;
    for (let m = 0; m < marks; m++) {
      const group = Math.floor(m / 5);
      const mx = 34 + group * 30 + (m % 5) * 5;
      if (m % 5 === 4) o.line(mx - 21, 33, mx + 1, 25, S.light);
      else o.r(mx, 24, 1, 10, S.light);
    }
    const size = 1 - marks * 0.06;
    const tilt = 0.06 + marks * 0.012 + Math.sin(step(t) * 1.5) * 0.02;
    const lx = PIVOT.x - Math.cos(tilt) * ARM;
    const ly = PIVOT.y + Math.sin(tilt) * ARM;
    const rx = PIVOT.x + Math.cos(tilt) * ARM;
    const ry = PIVOT.y - Math.sin(tilt) * ARM;
    o.line(lx, ly, rx, ry, S.woodPale, undefined, 2);
    o.r(PIVOT.x - 3, PIVOT.y - 3, 6, 6, S.light);
    // The pans on their strings.
    const pan = (px: number, py: number) => {
      o.line(px, py, px - 20, py + 42, S.dim);
      o.line(px, py, px + 20, py + 42, S.dim);
      o.r(px - 24, py + 42, 48, 3, S.woodPale);
      o.r(px - 24, py + 42, 48, 1, S.light);
      return py + 42;
    };
    const lFloor = pan(lx, ly);
    const rFloor = pan(rx, ry);
    // The tree's work: crates, the same every year.
    for (const [dx, dy] of [[-17, 0], [1, 0], [-8, -10]] as const) {
      o.r(lx + dx, lFloor + dy - 10, 15, 10, S.woodPale);
      o.r(lx + dx, lFloor + dy - 10, 15, 1, S.light);
      o.r(lx + dx + 14, lFloor + dy - 9, 1, 9, S.wood);
    }
    // What comes back: a jar of light, smaller each mark.
    const jw = Math.max(4, Math.round(18 * size));
    const jh = Math.max(5, Math.round(24 * size));
    o.r(rx - jw / 2 - 5, rFloor - jh - 5, jw + 10, jh + 5, S.amber, 0.14 * size);
    o.r(rx - jw / 2 - 1, rFloor - jh - 1, jw + 2, jh + 1, S.light);
    o.r(rx - jw / 2, rFloor - jh + 1, jw, jh - 1, S.amber);
    o.r(rx - jw / 2 + 1, rFloor - jh + 2, 1, jh - 3, S.white, 0.7);
    if (beat >= 2) {
      // Down below, someone reaching up for it; a drop of light falls, now and then.
      const k = (step(t) % 2) / 2;
      figure(o, rx, 198, { arm: 1, h: 30 });
      if (k < 0.6) o.r(rx + 3, lerp(rFloor + 4, 168, k / 0.6), 1, 2, S.amber);
    }
    return o.rects;
  },
};

// --- The tree again: worth more to the king than any city, and you in it ---

const YOU = { x: 226, y: 186 };
const treeNow: LorePanel = {
  paint: treePaint,
  frame: ({ beat, since, t }) => {
    const o = new Out();
    const s = step(t);
    // The tube's light, going up.
    o.r(TREE.x - 1, TREE.ground - ((s * 70) % 190) - 12, 3, 12, S.white, 0.7);
    if (beat >= 1) {
      // A thread from the tree to the capital's lights: what it's worth to him.
      for (let i = 0; i < 14; i++) {
        const k = (s * 0.25 + i / 14) % 1;
        o.r(lerp(TREE.x + 40, 452, k), lerp(150, 188, k) - Math.sin(k * Math.PI) * 34, 1, 1, S.amber);
      }
      FAR_LIGHTS.forEach((p, i) => o.r(p.x, p.y, 1, 1, hash(i, Math.floor(s * 3)) < 0.5 ? S.white : S.amber));
    }
    if (beat >= 2) {
      // You, in the roots. Rings going out from you; the tube answering.
      const k = (step(since) % 1.2) / 1.2;
      o.r(YOU.x - 1, YOU.y - 1, 3, 3, S.red);
      o.ring(YOU.x, YOU.y, 3 + k * 28, S.red, 1 - k);
      o.ring(YOU.x, YOU.y, 3 + ((k + 0.5) % 1) * 28, S.redDark, 1 - ((k + 0.5) % 1));
      if (k < 0.15) o.r(TREE.x - 2, 20, 5, TREE.ground - 20, S.white, 0.35);
    }
    return o.rects;
  },
};

export const LORE_PANELS: Record<string, LorePanel> = { lights, makers, choice, capital, belief, tube, hand, scales, tree: treeNow };
