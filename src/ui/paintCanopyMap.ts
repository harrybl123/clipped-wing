import { CANOPY_PLACES, CANOPY_TUBE_X, CROWN_BOTTOM, CROWN_TOP } from '../data/canopyMap';
import { addLight, cellRandom, falloff, noise, rgb, SHADES as S, smoothstep, type PixelColour, type RGB } from './pixelArt';
import { skyFor } from './paintOutdoor';

// The canopy's map (Chapter 4; docs/chapter-4-world.md), side-on by day: the crown of leaves filling the
// screen against the sky, cut away to show the boughs inside it; the tentacles (the tubes) rising out of its
// middle and curling over the top, glowing; treehouses on the branches, each place's window lit; Grounded's
// house at the top with the lookout's mast above it; the lowering platform out on a long branch on the
// right, its cable running down off the map; the trunk going down at the bottom into the dark, where the
// hatches are; far below at the sides, the plain in the haze.

const W = 480;
const H = 270;

type Put = (x: number, y: number, c: number) => void;
const at = (id: string) => CANOPY_PLACES.find((p) => p.id === id)!;

/** How far the crown reaches either side of the tube at row y (0 above and below it). */
export function crownHalfWidth(y: number): number {
  if (y < CROWN_TOP || y > CROWN_BOTTOM) return 0;
  const t = (y - CROWN_TOP) / (CROWN_BOTTOM - CROWN_TOP);
  // A wide dome: rounded on top, broadest a third of the way down, tucking in towards the trunk.
  const shape = Math.sin(Math.min(1, t * 1.35) * Math.PI * 0.5) * (1 - smoothstep(0.55, 1, t) * 0.75);
  return 220 * shape + noise(y / 5) * 6 + noise(y / 13 + 7) * 8;
}

/** The tentacles: curves from the tube mouth up and out over the crown (each a list of points). */
export const TENTACLES: readonly (readonly [number, number])[][] = [
  [[0, 0], [-6, -30], [-30, -62], [-62, -78], [-82, -74]],
  [[0, 0], [-2, -36], [-14, -72], [-26, -96], [-20, -104]],
  [[0, 0], [2, -40], [6, -78], [2, -100]],
  [[0, 0], [4, -34], [22, -66], [44, -82], [58, -80]],
  [[0, 0], [6, -26], [36, -48], [70, -52], [86, -44]],
];

/** A point along a polyline at fraction t (0–1). */
function along(pts: readonly (readonly [number, number])[], t: number): [number, number] {
  const seg = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
  const f = t * (pts.length - 1) - seg;
  const a = pts[seg]!;
  const b = pts[seg + 1]!;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

/** A small treehouse: a pitched roof, plank walls, the place's window (left for the map's glow). */
function treehouse(put: Put, x: number, y: number, w: number, h: number): void {
  for (let dy = 0; dy < h; dy++) for (let dx = -w; dx <= w; dx++) put(x + dx, y + dy, dx === w ? S.deep : dy % 3 === 2 ? S.woodLight : S.woodPale);
  for (let r = 0; r <= w + 2; r++) for (let dx = -r; dx <= r; dx++) put(x + dx, y - (w + 2 - r) - 1, r === w + 2 ? S.amberDeep : S.greenDeep);
  for (let dx = -w - 3; dx <= w + 3; dx++) put(x + dx, y + h, S.wood); // its platform
}

/** Builds the exact-colour pixels: the landmarks. */
function landmarks(): Map<number, number> {
  const out = new Map<number, number>();
  const put: Put = (x, y, c) => {
    if (x >= 0 && y >= 0 && x < W && y < H) out.set(Math.round(y) * W + Math.round(x), c);
  };

  // The trunk, coming up from the dark into the crown, and boughs spreading from it to the treehouses.
  for (let y = CROWN_BOTTOM - 40; y < H; y++) {
    const half = 26 + Math.max(0, y - CROWN_BOTTOM) * 0.1;
    for (let dx = -half; dx <= half; dx++) {
      const edge = Math.abs(dx) > half - 2;
      put(CANOPY_TUBE_X + dx, y, edge ? S.deep : (Math.round(dx) + Math.round(noise(y / 9) * 3)) % 5 === 0 ? S.wood : S.woodLight);
    }
  }
  const bough = (x0: number, y0: number, x1: number, y1: number, thick: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    for (let t = 0; t <= len; t++) {
      const f = t / len;
      const x = x0 + (x1 - x0) * f;
      const y = y0 + (y1 - y0) * f - Math.sin(f * Math.PI) * len * 0.08;
      const w = thick * (1 - f * 0.6);
      for (let d = -w; d <= w; d++) put(x, y + d, d >= w - 0.5 ? S.deep : d <= -w + 0.5 ? S.woodPale : S.woodLight);
    }
  };
  const base = CROWN_BOTTOM - 30;
  for (const p of CANOPY_PLACES) if (p.id !== 'hatches' && p.id !== 'lookout') bough(CANOPY_TUBE_X, base, p.x, p.y + 6, 3);
  bough(CANOPY_TUBE_X, base, 470, 172, 3.5); // the long branch out to the lowering platform
  bough(CANOPY_TUBE_X, base, 30, 150, 3);
  bough(CANOPY_TUBE_X, base, 90, 70, 2.5);

  // The tentacles: thick tubes of glass, glowing cyan inside, ringed with dark bands, curling over the crown.
  const mouth = at('tube-mouth');
  for (const [i, pts] of TENTACLES.entries()) {
    for (let t = 0; t <= 1; t += 0.004) {
      const [px, py] = along(pts, t);
      const w = 4 - t * 2.2;
      for (let d = -w; d <= w; d += 0.5) {
        const band = Math.round(t * 60 + i * 3) % 14 === 0;
        put(mouth.x + px + d, mouth.y + py, band ? S.cyanMid : Math.abs(d) > w - 1 ? S.cyanMid : Math.abs(d) < 0.8 ? S.white : S.cyan);
      }
    }
  }

  // The treehouses, one at each place (the window itself is left for the glow).
  for (const p of CANOPY_PLACES) {
    if (p.id === 'tube-mouth' || p.id === 'lookout' || p.id === 'hatches') continue;
    const big = p.id === 'great-house' ? 16 : p.id === 'groundeds-house' || p.id === 'ascended-hall' ? 10 : 7;
    treehouse(put, p.x, p.y - 4, big, big === 16 ? 14 : 8);
  }
  // The tube mouth: a round deck at the tentacles' foot.
  for (let dx = -18; dx <= 18; dx++) {
    put(mouth.x + dx, mouth.y + 6, S.woodPale);
    put(mouth.x + dx, mouth.y + 7, S.deep);
  }

  // The lookout: a mast above Grounded's house with a little railed platform on top, a turbine beside it.
  const lo = at('lookout');
  for (let y = lo.y + 4; y < at('groundeds-house').y - 14; y++) put(lo.x, y, S.wood);
  for (let dx = -7; dx <= 7; dx++) {
    put(lo.x + dx, lo.y + 4, S.woodPale);
    if (Math.abs(dx) === 7 || dx % 3 === 0) put(lo.x + dx, lo.y + 2, S.woodLight);
  }
  for (let d = 0; d < 6; d++) {
    put(lo.x + 16 + d, lo.y + 2 - d, S.light);
    put(lo.x + 16 - d, lo.y + 2 - d, S.light);
    put(lo.x + 16, lo.y + 2 + d, S.light);
  }

  // Solar sails cut like leaves on the high branches: pale, catching the light.
  for (const [sx, sy] of [[296, 48], [356, 58], [176, 70], [400, 104], [120, 92], [270, 84]] as const) {
    for (let dy = -4; dy <= 4; dy++) {
      const half = Math.round((1 - (dy / 4) ** 2) * 3);
      for (let dx = -half; dx <= half; dx++) put(sx + dx + Math.round(dy * 0.5), sy + dy, dx === 0 ? S.cyanMid : S.white);
    }
  }

  // The lowering platform: a winch house on the end of its branch, the cable running down off the map.
  const lp = at('lowering-platform');
  for (let dx = -14; dx <= 20; dx++) put(lp.x + dx, lp.y + 6, S.woodPale);
  for (let y = lp.y + 7; y < H; y++) put(lp.x + 18, y, S.deep);
  for (let y = 214; y < 222; y++) for (let dx = 15; dx <= 21; dx++) put(lp.x + dx, y, dx === 15 || dx === 21 || y === 214 ? S.deep : S.amberDeep); // a crate going down

  // The hatches: a small square door in the bark where the trunk begins.
  const ha = at('hatches');
  for (let y = ha.y - 6; y <= ha.y + 6; y++) for (let dx = -6; dx <= 6; dx++) put(ha.x + dx, y, Math.abs(dx) === 6 || Math.abs(y - ha.y) === 6 ? S.amberDeep : S.shadow);
  return out;
}

/**
 * The canopy map's painter, with this map's paths and the glow of built places. Day: a pale sky, the crown
 * in greens, darker inside where it's cut away, the light falling from the top.
 */
export function paintCanopyMap(paths: Map<number, number>, glows: { x: number; y: number; rgb: RGB }[]): (x: number, y: number) => PixelColour {
  // The canopy's sky by day: clearer and bluer than the plain's (as in its areas: paintOutdoor's canopyPainter).
  const mixRGB = (p: RGB, q: RGB, t: number) => p.map((v, i) => v + (q[i]! - v) * t) as RGB;
  const sky = { ...skyFor('afternoon'), top: mixRGB(mixRGB(rgb(S.white), rgb(S.cyan), 0.45), rgb(S.cyanMid), 0.42), horizon: mixRGB(rgb(S.white), rgb(S.cyan), 0.15) };
  const marks = landmarks();
  const [green, greenMid, greenDeep, white, cyan, amber, deep] = [S.green, S.greenMid, S.greenDeep, S.white, S.cyan, S.amber, S.deep].map(rgb) as RGB[];
  const HY = 236; // the far plain's horizon, low under the crown

  return (x, y) => {
    const path = paths.get(y * W + x);
    if (path !== undefined) return path;
    const mark = marks.get(y * W + x);
    if (mark !== undefined) return mark;
    const half = crownHalfWidth(y);
    const d = Math.abs(x - CANOPY_TUBE_X) - half; // < 0 inside the crown
    let c: RGB;
    if (d > 0) {
      if (y < HY) {
        c = sky.top.map((v, i) => v + (sky.horizon[i]! - v) * smoothstep(0, HY, y)) as RGB;
        c = addLight(c, white!, 0.25 * falloff(x, y, CANOPY_TUBE_X, -30, 260, 60));
      } else {
        // The plain, far below in the haze.
        c = rgb(S.greenMid).map((v, i) => v * 0.35 + rgb(S.woodPale)[i]! * 0.25 + sky.horizon[i]! * 0.4) as RGB;
        c = c.map((v) => v * (1 + 0.05 * noise(x / 9 + y))) as RGB;
      }
      return c;
    }
    // Leaves: a lit outer rim of clumps, darker in the cut-away middle where the boughs and houses are.
    const leaf = noise(x / 3.5 + noise(y / 4) * 2) * 0.5 + noise(y / 3 + x / 17) * 0.5;
    const rim = smoothstep(-18, -2, d);
    const height = 1 - smoothstep(CROWN_TOP, CROWN_BOTTOM, y);
    c = greenDeep!.map((v, i) => v + (greenMid![i]! - v) * (0.35 + 0.4 * rim + 0.25 * leaf)) as RGB;
    if (rim > 0.5 && leaf > 0.35 && cellRandom(x, y, 4) > 0.4) c = green!.map((v) => v * (0.75 + 0.25 * height)) as RGB;
    c = c.map((v) => v * (0.7 + 0.35 * height)) as RGB;
    // The tentacles' glow round their foot, the sky's light from the top, the dark down by the trunk.
    c = addLight(c, cyan!, 0.25 * falloff(x, y, CANOPY_TUBE_X, 100, 40, 30));
    c = addLight(c, white!, 0.15 * falloff(x, y, CANOPY_TUBE_X, CROWN_TOP - 20, 200, 50));
    c = c.map((v, i) => v + (deep![i]! - v) * 0.5 * smoothstep(CROWN_BOTTOM - 60, CROWN_BOTTOM, y)) as RGB;
    for (const g of glows) c = addLight(c, g.rgb, 0.35 * falloff(x, y, g.x, g.y, 12, 9));
    if (cellRandom(x, y, 8) > 0.996) c = addLight(c, amber!, 0.5); // a lantern here and there
    return c;
  };
}
