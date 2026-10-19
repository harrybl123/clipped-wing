import { MAP_CANOPY_Y, MAP_TUBE_X } from '../data/map';
import { SHADES as S, addLight, cellRandom, falloff, rgb, type PixelColour, type RGB } from './pixelArt';
import { BIRD, type RowSprite } from './sprites';
import { PROTAGONIST, PROTAGONIST_CROUCH } from './characters';

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
    // (Nothing wholly off the picture.)
    if (x0 + w0 <= 0 || y0 + h0 <= 0 || x0 >= LORE_W || y0 >= LORE_H) return;
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
    // On the right, far off, what they'll become part of: their city, pale and enormous, lit along its edges.
    const cityTop = x > 330 ? 176 - (40 + cellRandom(Math.floor(x / 12), 2, 6) * 70) * Math.min(1, (x - 330) / 60) : Infinity;
    if (y < 176 && y >= cityTop) c = mix(c, x % 12 === 0 || (y - Math.round(cityTop)) % 7 === 0 ? CYAN : LIGHT, 0.22);
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
        const g = beat === 2 ? ease(s / 5) : 1;
        figure(o, lerp(x0, 40 + i * 9, g), lerp(CHOICE_FLOOR, 176, g), { facing: -1, h: lerp(26, 10, g), walk: g < 1 ? step(s) * 10 : undefined });
        return;
      }
      figure(o, x0, CHOICE_FLOOR, { h: 26 });
    });
    if (beat >= 3) {
      // What they became: threads of light from every head to one point above them. One mind, many bodies;
      // and their city answering, a wave along its edges.
      JOINERS.forEach((_, k) => {
        const hx = 350 + k * 22;
        o.line(hx, CHOICE_FLOOR - 36, 405, 40, S.cyan, 0.25);
        for (let d = 0; d < 6; d++) {
          const q = (step(t) * 0.7 + d / 6 + k * 0.05) % 1;
          o.r(lerp(hx, 405, q), lerp(CHOICE_FLOOR - 36, 40, q), 1, 1, S.cyan);
        }
      });
      o.r(403, 38, 5, 5, S.white, 0.6 + 0.4 * Math.sin(step(t) * 4));
      o.ring(405, 40, 6 + ((step(since) * 8) % 10), S.cyan, 0.5);
      const wave = 330 + ((step(t) * 80) % 170);
      o.r(wave, 60, 10, 116, S.cyan, 0.15);
    }
    return o.rects;
  },
};

// --- The capital between them and us; its king's bargain ---

const CAP_HORIZON = 160;
/** The capital: a city on a sheer crag, towers crowded on its top, the citadel's spire in the middle. */
const CAP = { x0: 186, x1: 306, top: 112, spire: 246 };
/** The crag's cliff faces (steep, not a mound): its outline at x. */
const cliffTop = (x: number) => {
  if (x < CAP.x0 - 10 || x > CAP.x1 + 10) return Infinity;
  const edge = Math.min(x - (CAP.x0 - 10), CAP.x1 + 10 - x);
  return edge < 12 ? CAP.top + (12 - edge) * 4 : CAP.top;
};
/** The city's skyline on top of the crag. */
const skyline = (x: number) => {
  if (x < CAP.x0 || x > CAP.x1) return Infinity;
  if (Math.abs(x - CAP.spire) <= 2) return CAP.top - 64 + Math.abs(x - CAP.spire) * 6;
  if (Math.abs(x - CAP.spire) <= 9) return CAP.top - 40;
  const cell = Math.floor(x / 6);
  return CAP.top - 6 - cellRandom(cell, 9, 2) * 26 * (1 - Math.abs(x - CAP.spire) / 90);
};
const CAP_WINDOWS = (() => {
  const out: { x: number; y: number }[] = [];
  for (let x = CAP.x0; x <= CAP.x1; x += 2) {
    const top = skyline(x);
    for (let y = Math.round(top) + 2; y < CAP.top; y += 3) if (cellRandom(x, y, 4) < 0.35) out.push({ x, y });
  }
  return out;
})();
/** The integrated's towers, far left: their tops. */
const towerTop = (x: number) => (x < 140 ? 16 + ((Math.floor(x / 14) * 37) % 70) + (x % 14 < 3 ? 400 : 0) : Infinity);
/** A small tree on the right, in silhouette. */
const smallTree = (x: number, y: number, cx: number, base: number, size: number) =>
  (Math.abs(x - cx) <= Math.max(1, size / 8) && y > base - size && y <= base) || Math.hypot(x - cx, (y - (base - size * 1.4)) * 1.1) < size * 0.7 + fbm(x / 3, y / 3) * size * 0.25;
const WORKERS = [366, 384, 402, 420];
const capital: LorePanel = {
  paint: (x, y) => {
    if (y >= CAP_HORIZON) {
      // Fields in rows on the right, under the tree; bare ground on the left.
      const field = x > 330 && (y - CAP_HORIZON) % 5 === 0 ? 0.3 : 0;
      return mix(ground(x, y, 0.45), WOOD_PALE, field);
    }
    if (smallTree(x, y, 452, CAP_HORIZON, 28)) return mix(GREEN_DEEP, GREEN_MID, fbm(x / 4, y / 4) * 0.5);
    // The crag: sheer rock, banded, darker at its foot; the lifts' cables of light up its face.
    if (y >= cliffTop(x)) {
      if ((x === 214 || x === 280) && y < CAP_HORIZON - 2) return CYAN_DEEP;
      return mix(WOOD, SHADOW, 0.4 + ((y >> 2) % 3) * 0.08 + (y - CAP.top) / 120);
    }
    // The city on top: walls along the edge, towers behind, the citadel's spire.
    if (y >= CAP.top - 5 && x >= CAP.x0 && x <= CAP.x1) return mix(DIM, WOOD_PALE, 0.4);
    if (y >= skyline(x)) return mix(rgb(S.shadow), WOOD_LIGHT, 0.35 + (Math.abs(x - CAP.spire) < 3 ? 0.35 : 0));
    // The integrated's towers: pale, enormous, hazy with distance, ruled with their light.
    if (y >= towerTop(x)) return mix(duskSky(y, CAP_HORIZON), (y + x * 2) % 11 === 0 ? CYAN : LIGHT, 0.42);
    return addLight(duskSky(y, CAP_HORIZON), AMBER, 0.32 * falloff(x, y, CAP.spire, CAP.top, 150, 70));
  },
  frame: ({ beat, since, t }) => {
    const o = new Out();
    const s = step(t);
    // The city's windows, lit and twinkling.
    CAP_WINDOWS.forEach((p, i) => {
      if (hash(i, Math.floor(s * 2)) < 0.1) return;
      o.r(p.x, p.y, 1, 1, hash(i, 7) < 0.25 ? S.white : S.amber);
    });
    o.r(CAP.spire, CAP.top - 66, 1, 2, S.white, 0.6 + 0.4 * Math.sin(s * 3));
    // Their towers' seams, breathing.
    for (let x = 6; x < 140; x += 14) o.r(x, towerTop(x) + 4, 1, CAP_HORIZON - towerTop(x) - 4, S.cyan, 0.2 + 0.15 * Math.sin(s * 2 + x));
    // Their haze, held back at the capital's edge: a wall of light down through the city (the peace it keeps).
    const held = beat >= 1 ? ease(step(since) / 1.5) : 0;
    for (let i = 0; i < 6; i++) o.r(140 + i * 8, 30, 8, CAP_HORIZON - 30, S.cyan, 0.05 * (6 - i) * (beat >= 1 ? 1 : 0.4));
    if (beat >= 1) {
      o.r(CAP.x0 - 12, 20, 2, (CAP_HORIZON - 20) * held, S.white, 0.55);
      o.r(CAP.x0 - 10, 20, 1, (CAP_HORIZON - 20) * held, S.cyan, 0.7);
    }
    if (beat >= 3) {
      // Without the deal: the wall gives, and their light rolls on over our side, ruling everything into its lines;
      // the people in the fields gone, or one of them.
      const front = CAP.x0 - 12 + ease(step(since) / 5) * (LORE_W - CAP.x0 + 12);
      o.r(CAP.x0 - 12, 0, front - CAP.x0 + 12, LORE_H, S.cyan, 0.2);
      for (let x = CAP.x0 - 12; x < front; x += 8) o.r(x, CAP_HORIZON, 1, LORE_H - CAP_HORIZON, S.cyan, 0.4);
      for (let y = CAP_HORIZON; y < LORE_H; y += 8) o.r(CAP.x0 - 12, y, front - CAP.x0 + 12, 1, S.cyan, 0.4);
      o.r(front - 3, 0, 3, LORE_H, S.white, 0.8);
      WORKERS.forEach((x, i) => {
        if (x > front) figure(o, x, 182, { bent: 0.7, arm: step(t + i * 0.3) % 1 < 0.5 ? 0.2 : 0.55, h: 18 });
        else if (i % 2 === 0) figure(o, x, 182, { kind: 'integrated', h: 24 });
      });
      return o.rects;
    }
    if (beat >= 2) {
      // What passes through it: the tree's work going in from the right, and on out to them.
      for (let i = 0; i < 8; i++) {
        const k = (s * 0.35 + i / 8) % 1;
        if (k < 0.5) o.r(lerp(440, CAP.x1, k * 2), lerp(150, CAP.top + 8, k * 2), 2, 2, S.amber);
        else o.r(lerp(CAP.x0, 120, (k - 0.5) * 2), lerp(CAP.top + 8, 70, (k - 0.5) * 2), 2, 2, S.amber, 1 - (k - 0.5));
      }
      // And people like you, kept at it, bent over the fields.
      WORKERS.forEach((x, i) => figure(o, x, 182, { bent: 0.7, arm: step(t + i * 0.3) % 1 < 0.5 ? 0.2 : 0.55, h: 18 }));
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

// --- A hand, too big to be anyone's, holding your bird ---

/** Distance from (x, y) to a capsule (a rounded stroke from a to b, radius r): negative inside. */
function capsule(x: number, y: number, ax: number, ay: number, bx: number, by: number, r: number): number {
  const px = x - ax;
  const py = y - ay;
  const dx = bx - ax;
  const dy = by - ay;
  const h = clamp01((px * dx + py * dy) / (dx * dx + dy * dy));
  return Math.hypot(px - dx * h, py - dy * h) - r;
}

/** The hand: palm up, fingers curled up on the left, the thumb on the near side, the forearm off to the bottom right. */
const PALM = { x: 250, y: 150, rx: 60, ry: 22 };
const FINGERS = [0, 1, 2, 3].map((i) => ({ ax: 204, ay: 140 + i * 8, bx: 180 - i * 3, by: 112 + i * 10, r: 6.5 - i * 0.6 }));
const THUMB = { ax: 280, ay: 168, bx: 252, by: 128, r: 7.5 };
const FOREARM = { ax: 306, ay: 166, bx: 470, by: 300, r: 30 };
function handParts(x: number, y: number): number[] {
  return [
    capsule(x, y, FOREARM.ax, FOREARM.ay, FOREARM.bx, FOREARM.by, FOREARM.r),
    (Math.hypot((x - PALM.x) / PALM.rx, (y - PALM.y) / PALM.ry) - 1) * PALM.ry,
    ...FINGERS.map((f) => capsule(x, y, f.ax, f.ay, f.bx, f.by, f.r)),
    capsule(x, y, THUMB.ax, THUMB.ay, THUMB.bx, THUMB.by, THUMB.r),
  ];
}
function handPaint(x: number, y: number): PixelColour {
  const bg = addLight(mix(SHADOW, DEEP, fbm(x / 16, y / 16) * 0.6), CYAN, 0.25 * falloff(x, y, 250, 120, 190, 120));
  const parts = handParts(x, y);
  const d = Math.min(...parts);
  if (d > 0) return addLight(bg, CYAN, 0.25 * Math.max(0, 1 - d / 8));
  // Where two parts meet (between the fingers, the thumb's root): a crease.
  const sorted = [...parts].sort((a, b) => a - b);
  if (sorted[1]! < 0.5 && Math.abs(sorted[0]! - sorted[1]!) < 1.2) return DIM;
  // Pale, lit from above and to the left, darker towards its edges and underneath.
  const which = parts.indexOf(d);
  const depth = clamp01(-d / 7);
  let c = mix(DIM, LIGHT, 0.25 + depth * 0.6 - (y - 110) / 320 + (which >= 2 && which <= 5 ? 0.05 : 0));
  if (depth > 0.85 && (x + y) % 2 === 0 && y < 150) c = mix(c, rgb(S.white), 0.35);
  // Seams of light under the skin: along the forearm, round the palm, up each finger.
  const seam = (which === 0 && Math.abs(d + 15) < 0.7) || (which === 1 && Math.abs(d + 9) < 0.6) || (which >= 2 && which <= 5 && Math.abs(d + 3.5) < 0.5 && y < 140);
  if (seam) c = mix(c, CYAN, 0.75);
  return c;
}

const HAND_BIRD = { x: 226, y: 108, scale: 4 };
/** Perfect things falling away: only out to the sides, behind nothing. */
const PERFECT = Array.from({ length: 12 }, (_, i) => ({ x: i < 6 ? 12 + i * 22 : 368 + (i - 6) * 18 }));
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
  paint: handPaint,
  frame: ({ beat, since, t }) => {
    const o = new Out();
    const s = step(since);
    if (beat >= 2) {
      // Perfect things, endlessly, falling away into the dark at the sides: all exactly the same.
      PERFECT.forEach((p, i) => {
        const y = ((step(t) * 40 + i * 37) % 300) - 20;
        o.r(p.x, y, 8, 8, S.light, 0.45);
        o.r(p.x, y, 8, 1, S.white, 0.55);
        o.r(p.x + 7, y + 1, 1, 7, S.dim, 0.45);
      });
    }
    // Your bird in its palm, turning, a drawing at a time.
    const turn = [1, 0.5, 0.15, 0.5][Math.floor(step(t) / 0.4) % 4]!;
    const flip = Math.floor(step(t) / 1.6) % 2 === 1;
    // (What they value, lit warm among the cold perfect things.)
    if (beat >= 2) for (let r = 0; r < 3; r++) o.ring(HAND_BIRD.x + 20, HAND_BIRD.y + 12, 26 + r * 3 + Math.sin(step(t) * 3) * 2, S.amber, 0.35 - r * 0.1);
    o.sprite(BIRD, HAND_BIRD.x, HAND_BIRD.y, HAND_BIRD.scale, flip, turn);
    if (beat >= 1 && turn > 0.4 && step(t) % 0.75 < 0.5) {
      // The slip on its wing: a glint.
      const gx = HAND_BIRD.x + (flip ? 12 : 24);
      const gy = HAND_BIRD.y + 10;
      o.r(gx, gy - 2, 1, 5, S.white);
      o.r(gx - 2, gy, 5, 1, S.white);
    }
    if (beat === 3) {
      // And what everyone else makes: different, every time, one after another.
      DIFFERENT.forEach((d, i) => {
        if (s < i * 0.35) return;
        const ang = (i / DIFFERENT.length) * Math.PI * 2 - Math.PI / 2 + Math.PI / 8;
        o.sprite(d, 240 + Math.cos(ang) * 175, 112 + Math.sin(ang) * 82, 3);
      });
    }
    if (beat >= 4) {
      // They want to learn from it: threads of light out of the hand's seams, feeling over the slip in the wing.
      for (let i = 0; i < 7; i++) {
        const fx = 198 + i * 14;
        const fy = 140 + Math.abs(i - 3) * 3;
        const tx = HAND_BIRD.x + 16 + (i % 3) * 5;
        const ty = HAND_BIRD.y + 8 + (i % 2) * 5;
        const k = ease(s / 1.2 - i * 0.08);
        o.line(fx, fy, lerp(fx, tx, k), lerp(fy, ty, k), S.cyan, 0.7);
        if (k >= 1) o.r(tx, ty, 1, 1, S.white, 0.5 + 0.5 * Math.sin(step(t) * 6 + i));
      }
    }
    return o.rects;
  },
};

// --- What comes back down: the blessings (food, cloth, medicine), and the hands that take from them first ---

const MOUTH = { x: 240, y: 74 };
/** The crowd at the evening ceremony: heads along the foot of the picture. */
const CROWD = Array.from({ length: 22 }, (_, i) => ({ x: 26 + i * 20 + Math.round(cellRandom(i, 1, 3) * 8), y: 190 + Math.round(cellRandom(i, 2, 3) * 10) }));
/** A blessing: a loaf, a vial of medicine, folded cloth. */
const BUNDLES: { w: number; h: number; c: number; top: number }[] = [
  { w: 9, h: 6, c: S.amber, top: S.white },
  { w: 4, h: 9, c: S.green, top: S.white },
  { w: 11, h: 5, c: S.light, top: S.white },
];
const blessings: LorePanel = {
  paint: (x, y) => {
    // The offering floor at the evening ceremony: dark, the tube coming down into its basin, lamps.
    let c: RGB = mix(SHADOW, WOOD, 0.3 + fbm(x / 8, y / 30) * 0.3);
    if (Math.abs(x - MOUTH.x) <= 5 && y < MOUTH.y) c = Math.abs(x - MOUTH.x) <= 1 ? LIGHT : CYAN;
    if (Math.abs(x - MOUTH.x) <= 8 && y >= MOUTH.y - 3 && y < MOUTH.y) c = LIGHT;
    // The basin, and the crowd's heads and shoulders round it.
    if (y >= 120 && y < 128 && Math.abs(x - MOUTH.x) < 44 - (y - 120) * 2) c = y === 120 ? LIGHT : WOOD_PALE;
    for (const h of CROWD) if (Math.hypot(x - h.x, (y - h.y) * 1.1) < 5 || (y > h.y + 4 && Math.abs(x - h.x) < 8)) c = mix(WOOD_LIGHT, DIM, 0.35 - (y - h.y) / 60);
    c = addLight(c, CYAN, 0.45 * Math.exp(-Math.pow((x - MOUTH.x) / 14, 2)) * (y < MOUTH.y ? 1 : 0.2));
    return addLight(c, AMBER, 0.25 * falloff(x, y, MOUTH.x, 130, 160, 70));
  },
  frame: ({ beat, t }) => {
    const o = new Out();
    const s = step(t);
    // The blessings come down the tube and drop into the reaching hands, fewer every beat.
    const every = beat === 0 ? 0.35 : beat === 1 ? 0.35 : 1.6;
    for (let i = 0; i < 8; i++) {
      const born = Math.floor(s / every) - i;
      const age = s - born * every;
      const b = BUNDLES[((born % 3) + 3) % 3]!;
      const toX = CROWD[((born * 7) % CROWD.length + CROWD.length) % CROWD.length]!.x;
      // On the second beat, hands come for them on the way down: the capital's (gold at the wrist) takes most,
      // the canopy's (plain) a share; only what's left reaches the crowd.
      const taken = beat === 1 ? (((born % 5) + 5) % 5 < 2 ? 'capital' : ((born % 5) + 5) % 5 === 2 ? 'canopy' : null) : null;
      if (age < 0 || age > 2.4) continue;
      if (taken && age > 0.5) continue;
      const k = clamp01(age / 1.4);
      o.r(lerp(MOUTH.x, toX, k) - b.w / 2, lerp(MOUTH.y - 40 + age * 40, 186, k * k), b.w, b.h, b.c);
      o.r(lerp(MOUTH.x, toX, k) - b.w / 2, lerp(MOUTH.y - 40 + age * 40, 186, k * k), b.w, 1, b.top, 0.6);
    }
    if (beat >= 1) {
      // The capital's hand, down from the top right; the canopy's, from the top left: each taking from the stream.
      const reach = (from: { x: number; y: number }, gold: boolean, phase: number) => {
        const k = 0.6 + 0.4 * Math.sin(s * 3 + phase);
        const hx = lerp(from.x, MOUTH.x + (gold ? 8 : -8), k);
        const hy = lerp(from.y, MOUTH.y - 34, k);
        o.line(from.x, from.y, hx, hy, S.light, undefined, 5);
        if (gold) o.line(lerp(from.x, hx, 0.75), lerp(from.y, hy, 0.75), lerp(from.x, hx, 0.8), lerp(from.y, hy, 0.8), S.amber, undefined, 6);
        o.r(hx - 4, hy - 3, 8, 6, S.light);
        o.r(hx - 4, hy + 2, 8, 1, S.dim);
      };
      reach({ x: 480, y: 0 }, true, 0);
      reach({ x: 0, y: 10 }, false, 1.7);
    }
    // The crowd's hands, reaching up; on the last beat, mostly empty, reaching anyway.
    CROWD.forEach((h, i) => {
      const up = Math.sin(s * 2.4 + i) > (beat >= 2 ? -0.6 : 0.2);
      if (up) o.r(h.x + (i % 2 ? 2 : -4), h.y - 18, 2, 13, S.light);
    });
    return o.rects;
  },
};

// --- Opening the chapter: halfway up the tube (you flew), or crawling to the light (you fell) ---

/** The floors of the tree going by outside the glass as you rise. */
const LEVEL_GAP = 96;
const rise: LorePanel = {
  paint: (x, y) => {
    // Inside the tube: the glass walls either side, light all round you; outside, the dark of the tree.
    const inside = x > 170 && x < 310;
    if (Math.abs(x - 170) <= 1 || Math.abs(x - 310) <= 1) return x === 170 || x === 310 ? LIGHT : CYAN;
    if (inside) return addLight(mix(CYAN_DEEP, CYAN, 0.35 + 0.25 * Math.exp(-Math.pow((x - 240) / 40, 2))), rgb(S.white), 0.15 * (1 - y / LORE_H));
    return mix(SHADOW, WOOD, 0.35 + fbm(x / 3, y / 40) * 0.35);
  },
  frame: ({ beat, since, t }) => {
    const o = new Out();
    const s = step(t);
    // The tree's floors sliding down past the glass, faster as you go: lit windows, people looking up.
    const speed = beat === 0 ? 50 : 120;
    const scroll = beat === 0 ? s * speed : 50 * 30 + step(since) * speed;
    for (let n = -1; n < 4; n++) {
      const level = Math.floor(scroll / LEVEL_GAP) - n;
      const y = (scroll % LEVEL_GAP) + n * LEVEL_GAP;
      if (y < -20 || y > LORE_H) continue;
      for (const [x0, x1] of [[0, 168], [312, LORE_W]] as const) {
        o.r(x0, y, x1 - x0, 6, S.woodLight);
        o.r(x0, y, x1 - x0, 1, S.woodPale);
        for (let w = x0 + 8; w < x1 - 8; w += 26) if (cellRandom(w, level, 3) < 0.55) o.r(w, y - 22, 6, 9, S.amber, 0.8);
        // The ones you left: faces at the glass, looking up after you (a torch or two, early on).
        for (let p = x0 + 14; p < x1 - 6; p += 34) if (cellRandom(p, level, 5) < 0.4) {
          figure(o, x0 === 0 ? 160 - (p % 60) : 320 + (p % 60), y, { h: 16, facing: x0 === 0 ? 1 : -1, arm: 0.8 });
          if (level < 3 && cellRandom(p, level, 6) < 0.5) o.r(x0 === 0 ? 160 - (p % 60) + 4 : 320 + (p % 60) - 5, y - 20 - (s * 8) % 2, 2, 3, S.amber);
        }
      }
    }
    // Rings of the tube's light passing down over you.
    for (let r = 0; r < 4; r++) o.r(172, ((s * 140 + r * 70) % 300) - 20, 136, 2, S.white, 0.35);
    // You, carried up, arms out, the thread at your neck.
    const bob = Math.round(Math.sin(s * 3) * 2);
    o.sprite(PROTAGONIST.jump, 240 - 24, 70 + bob, 4);
    // The light above, swelling until it's everything.
    const white = beat === 0 ? 0 : beat === 1 ? ease(step(since) / 4) * 0.5 : 0.5 + ease(step(since) / 1.5) * 0.5;
    for (let i = 0; i < 12; i++) o.r(0, i * 18, LORE_W, 18, S.white, white * (1 - i / 14));
    if (beat >= 2) o.r(0, 0, LORE_W, LORE_H, S.white, ease(step(since) / 1.5));
    return o.rects;
  },
};

const crack: LorePanel = {
  paint: (x, y) => {
    // The rot's tunnel narrowing ahead, to a jagged crack of daylight.
    const dx = x - 300;
    const dy = y - 104;
    const open = Math.hypot(dx * 0.5, dy) < 14 + fbm(x / 3, y / 3) * 10 && Math.abs(dy) < 34;
    if (open) return rgb(S.white);
    const tunnel = Math.hypot(dx * 0.6, dy * 1.2) / 160;
    let c = mix(mix(SHADOW, WOOD, 0.4 + fbm(x / 7, y / 7) * 0.4), SHADOW, clamp01(tunnel - 0.2));
    if (y > 196 && fbm(x / 9, y / 5) > 0.62) c = mix(c, GREEN_MID, 0.5);
    return addLight(c, rgb(S.white), 0.7 * falloff(x, y, 300, 104, 150, 90));
  },
  frame: ({ beat, since, t }) => {
    const o = new Out();
    const s = step(since);
    // You, crawling towards it, a drawing at a time.
    // (A silhouette against the light: the frame's 26 rows tall at 3 to a pixel, feet on the tunnel floor.)
    const x = beat === 0 ? lerp(130, 214, ease(s / 8)) : 214;
    o.sprite(PROTAGONIST_CROUCH.walk[Math.floor(step(t) / 0.5) % 2]!, x, 200 - 26 * 3, 3);
    // The light breathing; on the last beat, it takes everything.
    o.r(240, 60, 120, 90, S.white, 0.08 + 0.06 * Math.sin(step(t) * 2));
    if (beat >= 1) for (let r = 0; r < 6; r++) o.ring(300, 104, 20 + ease(s / 2) * 300 - r * 6, S.white, 0.6);
    if (beat >= 1) o.r(0, 0, LORE_W, LORE_H, S.white, ease((s - 0.8) / 1.4));
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
    // The tube's light, going up (until the tree stops).
    if (beat < 3) o.r(TREE.x - 1, TREE.ground - ((s * 70) % 190) - 12, 3, 12, S.white, 0.7);
    if (beat >= 1 && beat !== 3) {
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
      if (k < 0.15 && beat === 2) o.r(TREE.x - 2, 20, 5, TREE.ground - 20, S.white, 0.35);
    }
    if (beat === 3) {
      // The tree stops: the tube dark, nothing going down the cable, the capital's lights failing.
      o.r(TREE.x - 2, 20, 5, TREE.ground - 20, S.deep, 0.75);
      FAR_LIGHTS.forEach((p, i) => o.r(p.x, p.y, 1, 1, S.shadow, hash(i, Math.floor(s * 2)) < 0.7 ? 1 : 0));
    }
    if (beat >= 4) {
      // And someone comes from the capital, to the tree, to talk.
      const k = ease(step(since) / 5);
      figure(o, lerp(452, 300, k), 200, { kind: 'king', h: 14, facing: -1, walk: k < 1 ? step(since) * 8 : undefined });
    }
    return o.rects;
  },
};

export const LORE_PANELS: Record<string, LorePanel> = { rise, crack, lights, makers, choice, capital, belief, tube, hand, blessings, tree: treeNow };
