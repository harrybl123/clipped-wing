import { MAP_CANOPY_Y, MAP_TUBE_X } from '../data/map';
import { SHADES as S, addLight, cellRandom, falloff, rgb, type PixelColour, type RGB } from './pixelArt';
import { BIRD, type RowSprite } from './sprites';
import { PROTAGONIST_CROUCH } from './characters';

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
  /** A filled disc (an ellipse, `squash` its height to width), a row at a time. */
  disc(cx: number, cy: number, r: number, c: number, a?: number, squash = 1): void {
    const rows = Math.ceil(r * squash);
    for (let dy = -rows; dy <= rows; dy++) {
      const w = Math.sqrt(Math.max(0, 1 - (dy / (r * squash)) ** 2)) * r;
      if (w >= 0.5) this.r(cx - w, cy + dy, w * 2, 1, c, a);
    }
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

/**
 * The capital: a city on a sheer crag (designer: not a mound of dirt). Steep cliffs, banded and streaked, with
 * ledges, windows carved into the rock near the top and the glass lifts up its face; a wall along the top;
 * crowded towers behind it, taller towards the middle, roofs flat, peaked and domed, windows lit; the
 * citadel in the middle with its spire. Drawn at any size (`scale`): close up, or far off on the horizon.
 */
interface City {
  cx: number;
  /** Half the plateau's width, at full size. */
  half: number;
  /** The plateau's height above the base, at full size. */
  rise: number;
  /** Where the crag meets the ground. */
  base: number;
  scale: number;
}
interface CityParts {
  paint: (x: number, y: number) => RGB | null;
  /** Its lit windows (for twinkling). */
  windows: { x: number; y: number }[];
  /** The plateau's top, and its edges. */
  top: number;
  left: number;
  right: number;
  /** The citadel's spire's tip. */
  spire: { x: number; y: number };
  /** The lifts up the cliff (x). */
  lifts: number[];
}
function makeCity(c: City): CityParts {
  const k = c.scale;
  const top = c.base - c.rise * k;
  const half = c.half * k;
  const left = c.cx - half;
  const right = c.cx + half;
  // The crag widens a little towards its foot, its edges ragged.
  const edgeAt = (y: number) => half + (y - top) * 0.22 + (noise2(y / (6 * k + 1), c.cx) - 0.5) * 6 * k;
  // Buildings along the plateau, left to right.
  const buildings: { x0: number; x1: number; top: number; roof: 'flat' | 'peak' | 'dome' }[] = [];
  let bx = left + 3 * k;
  let n = 0;
  while (bx < right - 3 * k) {
    const w = Math.max(2, Math.round((4 + cellRandom(n, 1, 21) * 7) * k));
    const near = 1 - Math.abs(bx + w / 2 - c.cx) / half;
    const h = Math.max(2, (6 + cellRandom(n, 2, 21) * 22 + near * 26) * k);
    buildings.push({ x0: bx, x1: bx + w, top: top - 4 * k - h, roof: (['flat', 'peak', 'dome'] as const)[Math.floor(cellRandom(n, 3, 21) * 3)]! });
    bx += w + (cellRandom(n, 4, 21) < 0.3 ? Math.round(k) : 0);
    n++;
  }
  const citadel = { x0: c.cx - 8 * k, x1: c.cx + 8 * k, top: top - 4 * k - 66 * k };
  const spire = { x: c.cx, y: citadel.top - 34 * k };
  const lifts = [Math.round(c.cx - half * 0.55), Math.round(c.cx + half * 0.5)];
  const windows: { x: number; y: number }[] = [];
  const isWindow = (x: number, y: number, b: { x0: number; x1: number; top: number }) => {
    const gx = Math.round(x - b.x0);
    const gy = Math.round(y - b.top);
    const step = Math.max(2, Math.round(3 * k));
    return gx > 0 && x < b.x1 - 1 && gy > 2 && gx % step === 1 && gy % step === 1 && cellRandom(x, y, 22) < 0.45;
  };
  const paint = (x: number, y: number): RGB | null => {
    if (y > c.base) return null;
    // The citadel and its spire.
    if (x >= citadel.x0 && x < citadel.x1 && y >= citadel.top && y < top) {
      if (isWindow(x, y, citadel)) return AMBER;
      return mix(SHADOW, WOOD_LIGHT, x < c.cx - 4 * k ? 0.55 : 0.3);
    }
    if (y >= spire.y && y < citadel.top && Math.abs(x - c.cx) <= Math.max(0.5, (y - spire.y) / (34 * k) * 4 * k)) return mix(SHADOW, WOOD_PALE, 0.5);
    // The buildings.
    for (const b of buildings) {
      if (x < b.x0 || x >= b.x1) continue;
      const w = b.x1 - b.x0;
      const roofH = b.roof === 'flat' ? 0 : Math.min(w * 0.6, 6 * k);
      const across = Math.abs(x - (b.x0 + w / 2)) / (w / 2);
      const roofTop = b.roof === 'peak' ? b.top - roofH * (1 - across) : b.roof === 'dome' ? b.top - roofH * Math.sqrt(Math.max(0, 1 - across * across)) : b.top;
      if (y >= roofTop && y < top) {
        if (y >= b.top && isWindow(x, y, b)) return AMBER;
        // Lit from the sunset on their left faces.
        return mix(SHADOW, WOOD_LIGHT, (x - b.x0 < Math.max(1, k) ? 0.6 : 0.25) + (y < b.top ? 0.15 : 0));
      }
    }
    // The wall along the top, with its battlements.
    if (y >= top - 4 * k && y < top && x >= left && x <= right) {
      if (y < top - 2.5 * k && Math.floor((x - left) / Math.max(2, 2 * k)) % 2 === 1) return null;
      return mix(DIM, WOOD_PALE, 0.5);
    }
    // The crag: sheer rock, streaked down its face, ledges across it; the lifts' glass up it; windows in the rock.
    if (y >= top && Math.abs(x - c.cx) <= edgeAt(y)) {
      if (lifts.some((lx) => Math.abs(x - lx) < Math.max(0.6, k)) && y < c.base - 2) return CYAN_DEEP;
      const ledge = (Math.round(y - top) % Math.max(4, Math.round(13 * k)) === 0) && noise2(x / 5, y) > 0.35;
      if (ledge) return mix(WOOD, WOOD_PALE, 0.4);
      if (y < top + 18 * k && cellRandom(Math.round(x), Math.round(y), 23) < 0.04) return AMBER;
      const streak = noise2(x / (1.5 + k), y / (18 * k + 1));
      const lit = x < c.cx - edgeAt(y) * 0.6 ? 0.18 : 0;
      return mix(SHADOW, WOOD, 0.35 + streak * 0.35 + lit - (y - top) / (c.rise * k * 3));
    }
    return null;
  };
  // Every lit window, for twinkling.
  for (let y = Math.floor(spire.y); y < c.base; y++) for (let x = Math.floor(left - half); x < right + half; x++) {
    const colour = paint(x, y);
    if (colour === AMBER) windows.push({ x, y });
  }
  return { paint, windows, top, left, right, spire, lifts };
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
/** The capital far off on the horizon: the same city as close up, small. */
const FAR_CITY = makeCity({ cx: 330, half: 60, rise: 34, base: LIGHTS_HORIZON, scale: 0.42 });
const LIGHTS_CRAG = { cx: 330, half: 34 };

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
    const city = FAR_CITY.paint(x, y);
    if (city) return mix(city, duskSky(y, LIGHTS_HORIZON), 0.25);
    return addLight(duskSky(y, LIGHTS_HORIZON), AMBER, 0.4 * falloff(x, y, 300, LIGHTS_HORIZON, 220, 36));
  },
  frame: ({ beat, since, t }) => {
    const o = new Out();
    twinkle(o, FAR_CITY.windows, t);
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
const CAPITAL = makeCity({ cx: 252, half: 64, rise: 50, base: CAP_HORIZON, scale: 1 });
/** The integrated's towers, far left: their tops. */
const towerTop = (x: number) => (x < 132 ? 16 + ((Math.floor(x / 14) * 37) % 70) + (x % 14 < 3 ? 400 : 0) : Infinity);
/** A small tree on the right, in silhouette. */
const smallTree = (x: number, y: number, cx: number, base: number, size: number) =>
  (Math.abs(x - cx) <= Math.max(1, size / 8) && y > base - size && y <= base) || Math.hypot(x - cx, (y - (base - size * 1.4)) * 1.1) < size * 0.7 + fbm(x / 3, y / 3) * size * 0.25;
const WORKERS = [372, 390, 408, 426];
/** The road from the tree to the foot of the crag, and the bridge from the city's far side out to them. */
const ROAD_Y = 168;
const BRIDGE = { x0: CAPITAL.left - 4, y0: CAPITAL.top + 6, x1: 120, y1: 92 };
const capital: LorePanel = {
  paint: (x, y) => {
    if (y >= CAP_HORIZON) {
      // The road along the ground; fields in rows on the right, under the tree; bare ground elsewhere.
      if (Math.abs(y - ROAD_Y) <= 1 && x > CAPITAL.right && x < 446) return mix(WOOD, WOOD_PALE, 0.5);
      const field = x > 346 && (y - CAP_HORIZON) % 5 === 0 ? 0.3 : 0;
      return mix(ground(x, y, 0.45), WOOD_PALE, field);
    }
    if (smallTree(x, y, 456, CAP_HORIZON, 28)) return mix(GREEN_DEEP, GREEN_MID, fbm(x / 4, y / 4) * 0.5);
    const city = CAPITAL.paint(x, y);
    if (city) return city;
    // The integrated's towers: pale, enormous, hazy with distance, ruled with their light.
    if (y >= towerTop(x)) return mix(duskSky(y, CAP_HORIZON), (y + x * 2) % 11 === 0 ? CYAN : LIGHT, 0.42);
    return addLight(duskSky(y, CAP_HORIZON), AMBER, 0.32 * falloff(x, y, 252, CAPITAL.top, 160, 70));
  },
  frame: ({ beat, since, t }) => {
    const o = new Out();
    const s = step(t);
    // The city's windows, lit and twinkling; the spire's light.
    twinkle(o, CAPITAL.windows, t);
    o.r(CAPITAL.spire.x, CAPITAL.spire.y - 1, 1, 2, S.white, 0.6 + 0.4 * Math.sin(s * 3));
    // Their towers' seams, breathing; their haze, pressing towards us.
    for (let x = 6; x < 132; x += 14) o.r(x, towerTop(x) + 4, 1, CAP_HORIZON - towerTop(x) - 4, S.cyan, 0.2 + 0.15 * Math.sin(s * 2 + x));
    for (let i = 0; i < 6; i++) o.r(132 + i * 8, 30, 8, CAP_HORIZON - 30, S.cyan, 0.05 * (6 - i) * (beat >= 1 ? 1 : 0.4));
    if (beat === 1 || beat === 2) {
      // The peace it keeps: a wall of light at the city's edge, holding them back.
      const held = beat === 1 ? ease(step(since) / 1.5) : 1;
      const wx = CAPITAL.left - 16;
      o.r(wx, 20, 2, (CAP_HORIZON - 20) * held, S.white, 0.55);
      o.r(wx + 2, 20, 1, (CAP_HORIZON - 20) * held, S.cyan, 0.7);
    }
    if (beat === 2) {
      // The bargain, as it works: carts of the tree's work along the road to the foot of the crag; up its lift;
      // and out the other side, along a bridge of light, to them.
      for (let i = 0; i < 4; i++) {
        const k = (s * 0.12 + i / 4) % 1;
        const cx = lerp(440, CAPITAL.right + 6, k);
        o.r(cx - 3, ROAD_Y - 6, 7, 5, S.woodPale);
        o.r(cx - 3, ROAD_Y - 6, 7, 1, S.light);
        o.r(cx - 2, ROAD_Y - 1, 2, 2, S.shadow);
        o.r(cx + 2, ROAD_Y - 1, 2, 2, S.shadow);
      }
      const lift = CAPITAL.lifts[1]!;
      const ly = lerp(CAP_HORIZON - 4, CAPITAL.top + 2, (s * 0.25) % 1);
      o.r(lift - 2, ly - 4, 5, 5, S.cyan);
      o.line(BRIDGE.x0, BRIDGE.y0, BRIDGE.x1, BRIDGE.y1, S.light, 0.6);
      o.line(BRIDGE.x0, BRIDGE.y0 + 1, BRIDGE.x1, BRIDGE.y1 + 1, S.cyan, 0.5);
      for (let i = 0; i < 3; i++) {
        const k = (s * 0.18 + i / 3) % 1;
        o.r(lerp(BRIDGE.x0, BRIDGE.x1, k) - 2, lerp(BRIDGE.y0, BRIDGE.y1, k) - 4, 5, 4, S.white, 0.9);
      }
      // And people like you, kept at it, bent over the fields.
      WORKERS.forEach((x, i) => figure(o, x, 186, { bent: 0.7, arm: step(t + i * 0.3) % 1 < 0.5 ? 0.2 : 0.55, h: 18 }));
    }
    if (beat >= 3) {
      // Without the deal: the wall gone, their light rolls on over the city and our side, ruling everything into
      // its lines; the people in the fields gone, or one of them.
      const front = 132 + ease(step(since) / 5) * (LORE_W - 132);
      o.r(132, 0, front - 132, LORE_H, S.cyan, 0.2);
      for (let x = 132; x < front; x += 8) o.r(x, CAP_HORIZON, 1, LORE_H - CAP_HORIZON, S.cyan, 0.4);
      for (let y = CAP_HORIZON; y < LORE_H; y += 8) o.r(132, y, front - 132, 1, S.cyan, 0.4);
      for (let x = 136; x < front; x += 12) o.r(x, 20 + (x % 40), 1, CAP_HORIZON - 20 - (x % 40), S.light, 0.25);
      o.r(front - 3, 0, 3, LORE_H, S.white, 0.8);
      WORKERS.forEach((x, i) => {
        if (x > front) figure(o, x, 186, { bent: 0.7, arm: step(t + i * 0.3) % 1 < 0.5 ? 0.2 : 0.55, h: 18 });
        else if (i % 2 === 0) figure(o, x, 186, { kind: 'integrated', h: 24 });
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
/** A perfect bird: the same shape as yours, pale, flawless, made by them in an instant. */
const PERFECT_BIRD: RowSprite = { rows: BIRD.rows, colours: { '#': S.light, d: S.dim, o: S.shadow } };
/** Where their perfect birds stand, in rows at the sides, every one the same. */
const PERFECT = Array.from({ length: 24 }, (_, i) => ({ x: (i % 6 < 3 ? 14 + (i % 3) * 44 : 344 + ((i % 6) - 3) * 44), y: 20 + Math.floor(i / 6) * 42 }));
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
    // Perfect birds, row after row at the sides, appearing one after another, every one exactly the same;
    // once it's said that imperfection's what they value, they dim.
    PERFECT.forEach((p, i) => {
      const shown = beat === 0 ? step(since) > i * 0.12 : true;
      if (shown) o.sprite(PERFECT_BIRD, p.x, p.y, 3, false, 1, beat >= 2 ? 0.25 : 0.8);
    });
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

// --- What comes back down: the blessings (food, cloth, medicine), and who takes from them first ---

/** Where the blessings come in, on the cable, and the table they're shared out on. */
const TABLE = { x: 240, y: 70 };
/** Where each share goes: the capital (its crown), the canopy (a treehouse), down the tube to the crowd. */
const CROWN_AT = { x: 418, y: 40 };
const HUT_AT = { x: 62, y: 40 };
const TUBE_FOOT = { x: 240, y: 150 };
/** The crowd at the evening ceremony: heads along the foot of the picture. */
const CROWD = Array.from({ length: 22 }, (_, i) => ({ x: 26 + i * 20 + Math.round(cellRandom(i, 1, 3) * 8), y: 190 + Math.round(cellRandom(i, 2, 3) * 10) }));
/** A blessing: a loaf, a vial of medicine, folded cloth. */
const BUNDLES: { w: number; h: number; c: number; top: number }[] = [
  { w: 9, h: 6, c: S.amber, top: S.white },
  { w: 4, h: 9, c: S.green, top: S.white },
  { w: 11, h: 5, c: S.light, top: S.white },
];
/** Of every six that come in, who takes them, by beat: as the tree believes (all to you); the capital's cut and ours; and later, less. */
const SHARES: ('capital' | 'canopy' | 'you')[][] = [
  ['you', 'you', 'you', 'you', 'you', 'you'],
  ['capital', 'you', 'capital', 'canopy', 'capital', 'canopy'],
  ['capital', 'capital', 'canopy', 'capital', 'you', 'capital'],
];
const blessings: LorePanel = {
  paint: (x, y) => {
    let c: RGB = mix(SHADOW, WOOD, 0.25 + fbm(x / 8, y / 30) * 0.3);
    // The cable coming in from the top left, to the table.
    if (y < TABLE.y && Math.abs(y - lerp(0, TABLE.y - 4, x / TABLE.x)) < 0.8 && x < TABLE.x) c = DIM;
    // The table.
    if (y >= TABLE.y && y < TABLE.y + 4 && Math.abs(x - TABLE.x) < 30) c = y === TABLE.y ? LIGHT : WOOD_PALE;
    // The tube, down from the table to the offering floor, and its basin.
    if (Math.abs(x - TABLE.x) <= 4 && y >= TABLE.y + 4 && y < TUBE_FOOT.y) c = Math.abs(x - TABLE.x) <= 1 ? LIGHT : CYAN;
    if (y >= TUBE_FOOT.y && y < TUBE_FOOT.y + 6 && Math.abs(x - TABLE.x) < 40 - (y - TUBE_FOOT.y) * 3) c = y === TUBE_FOOT.y ? LIGHT : WOOD_PALE;
    // The crowd's heads and shoulders.
    for (const h of CROWD) if (Math.hypot(x - h.x, (y - h.y) * 1.1) < 5 || (y > h.y + 4 && Math.abs(x - h.x) < 8)) c = mix(WOOD_LIGHT, DIM, 0.35 - (y - h.y) / 60);
    c = addLight(c, CYAN, 0.4 * Math.exp(-Math.pow((x - TABLE.x) / 14, 2)) * (y > TABLE.y && y < TUBE_FOOT.y ? 1 : 0.1));
    return addLight(c, AMBER, 0.25 * falloff(x, y, TABLE.x, 150, 170, 80));
  },
  frame: ({ beat, t }) => {
    const o = new Out();
    const s = step(t);
    const b = Math.min(2, beat);
    // Once he's said it: the crown (the capital) on the right, a treehouse (us, up here) on the left.
    if (beat >= 1) {
      // The capital's crown: a band and five points.
      o.r(CROWN_AT.x - 18, CROWN_AT.y, 36, 10, S.amber);
      for (const dx of [-18, -10, -3, 4, 12]) o.r(CROWN_AT.x + dx, CROWN_AT.y - 9 + (Math.abs(dx + 3) > 10 ? 3 : 0), 6, 9, S.amber);
      o.r(CROWN_AT.x - 18, CROWN_AT.y + 10, 36, 2, S.amberDeep);
      o.r(CROWN_AT.x - 2, CROWN_AT.y + 3, 4, 4, S.white);
      // The canopy: a round hut on a branch, its tall thatched roof, a lit door.
      for (let r = 0; r < 14; r++) o.r(HUT_AT.x - r, HUT_AT.y - 14 + r, r * 2 + 1, 1, r % 3 === 0 ? S.woodPale : S.dim);
      o.r(HUT_AT.x - 10, HUT_AT.y, 20, 12, S.wood);
      o.r(HUT_AT.x - 2, HUT_AT.y + 4, 5, 8, S.amber);
      o.r(HUT_AT.x - 22, HUT_AT.y + 12, 44, 3, S.greenDeep);
    }
    // The blessings: in on the cable, onto the table, then each one away to whoever takes it.
    const every = b === 2 ? 0.9 : 0.55;
    for (let i = 0; i < 10; i++) {
      const born = Math.floor(s / every) - i;
      const age = s - born * every;
      if (age < 0 || age > 3.2) continue;
      const bundle = BUNDLES[((born % 3) + 3) % 3]!;
      const who = SHARES[b]![((born % 6) + 6) % 6]!;
      let x: number;
      let y: number;
      if (age < 1) {
        x = lerp(0, TABLE.x, age);
        y = lerp(0, TABLE.y - 4, age) - bundle.h;
      } else {
        const k = clamp01((age - 1.2) / 1.2);
        if (age < 1.2) [x, y] = [TABLE.x, TABLE.y - bundle.h];
        else if (who === 'capital') [x, y] = [lerp(TABLE.x, CROWN_AT.x, k), lerp(TABLE.y - bundle.h, CROWN_AT.y + 8, k) - Math.sin(k * Math.PI) * 20];
        else if (who === 'canopy') [x, y] = [lerp(TABLE.x, HUT_AT.x, k), lerp(TABLE.y - bundle.h, HUT_AT.y + 8, k) - Math.sin(k * Math.PI) * 20];
        else {
          const to = CROWD[((born * 7) % CROWD.length + CROWD.length) % CROWD.length]!;
          [x, y] = k < 0.5 ? [TABLE.x, lerp(TABLE.y, TUBE_FOOT.y, k * 2)] : [lerp(TABLE.x, to.x, (k - 0.5) * 2), lerp(TUBE_FOOT.y, to.y - 12, (k - 0.5) * 2)];
        }
        if (k >= 1) continue;
      }
      o.r(x - bundle.w / 2, y, bundle.w, bundle.h, bundle.c);
      o.r(x - bundle.w / 2, y, bundle.w, 1, bundle.top, 0.6);
    }
    // The crowd's hands, reaching up; later, mostly empty, reaching anyway.
    CROWD.forEach((h, i) => {
      const up = Math.sin(s * 2.4 + i) > (b >= 2 ? -0.6 : 0.2);
      if (up) o.r(h.x + (i % 2 ? 2 : -4), h.y - 18, 2, 13, S.light);
    });
    return o.rects;
  },
};

// --- Opening the chapter: halfway up the tube (you flew), or crawling to the light (you fell) ---

/**
 * Rising up the tube, through your own eyes (designer: first person, the light rushing past): looking up the
 * tube into the light, its rings and seams flying past you, the tree's lit floors streaking by through the
 * glass, faster and brighter until it's white; then black.
 */
const RISE_C = { x: 240, y: 104 };
const rise: LorePanel = {
  paint: (x, y) => {
    // Looking straight up the tube: dark at the edges, the light far above at its centre.
    const d = Math.hypot(x - RISE_C.x, (y - RISE_C.y) * 1.15);
    return addLight(mix(SHADOW, CYAN_DEEP, clamp01(1 - d / 300) * 0.8), CYAN, 0.6 * Math.exp(-Math.pow(d / 60, 2)));
  },
  frame: ({ beat, since, t }) => {
    const o = new Out();
    if (beat >= 3) {
      o.r(0, 0, LORE_W, LORE_H, S.shadow);
      return o.rects;
    }
    const s = step(t);
    const fast = beat === 0 ? 1 : 1 + ease(step(since) / 3) * 2.5;
    const travel = beat === 0 ? s * 0.6 : 0.6 * 30 + step(since) * 0.6 * fast;
    // The tube's rings, coming at you out of the light and past (nearer, bigger, brighter).
    for (let i = 0; i < 10; i++) {
      const z = 1 - (((travel + i / 10) % 1 + 1) % 1);
      const r = 14 / Math.max(0.05, z);
      if (r > 340) continue;
      o.ring(RISE_C.x, RISE_C.y, r, S.cyan, clamp01(0.25 + (1 - z) * 0.6));
      if (r > 60) o.ring(RISE_C.x, RISE_C.y, r + 1, S.white, clamp01((1 - z) * 0.5));
    }
    // Through the glass, the tree going by: lit windows and the shapes of people streaking outwards.
    for (let i = 0; i < 26; i++) {
      const ang = (i / 26) * Math.PI * 2 + cellRandom(i, 1, 4);
      const z = 1 - (((travel * 1.3 + cellRandom(i, 2, 4)) % 1 + 1) % 1);
      const r = 20 / Math.max(0.05, z);
      if (r > 330 || r < 26) continue;
      const len = Math.min(40, (1 - z) * 30 * fast);
      const x0 = RISE_C.x + Math.cos(ang) * r;
      const y0 = RISE_C.y + Math.sin(ang) * r * 0.87;
      const person = cellRandom(i, 3, 4) < 0.3;
      o.line(x0, y0, x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len * 0.87, person ? S.woodPale : S.amber, clamp01(1 - z + 0.2), person ? 2 : 1);
    }
    // The light above: a white heart that swells until it's everything.
    const swell = beat === 0 ? 0.15 : beat === 1 ? 0.15 + ease(step(since) / 4) * 0.5 : 0.65 + ease(step(since) / 1.4) * 0.35;
    for (let r = 0; r < 6; r++) o.disc(RISE_C.x, RISE_C.y, 10 + swell * 260 * (1 - r / 6), S.white, 0.12 + swell * 0.12, 0.87);
    if (beat >= 2) o.r(0, 0, LORE_W, LORE_H, S.white, ease(step(since) / 1.4));
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
      // What it's worth to him: the crates going down the cable and away across the plain to his lights.
      for (let i = 0; i < 4; i++) {
        const k = (s * 0.2 + i / 4) % 1;
        o.r(lerp(CABLE.x0, CABLE.x1, k) - 3, lerp(CABLE.y0, CABLE.y1, k) + 1, 6, 5, S.woodPale);
        const g = (s * 0.16 + i / 4) % 1;
        o.r(lerp(CABLE.x1 + 2, 448, g), TREE.ground - 5, 6, 5, S.woodPale, 1 - g * 0.6);
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
