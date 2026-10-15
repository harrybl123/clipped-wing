import type { CityView } from '../data/areas/types';
import type { TimeSlot } from '../systems/Calendar';
import { addLight, cellRandom, falloff, noise, rgb, SHADES, smoothstep, type PixelColour, type Power, type RGB } from './pixelArt';
import { skyFor, treePainter } from './paintOutdoor';

// The capital seen from up in the citadel (Chapter 3; docs/chapter-3-world.md), through a window or off a
// balcony: the sky, the tree small on the far horizon, and the city below, rows of blocks crowding down
// towards you, nearer and bigger the lower they are. By day pale stone in the haze; from dusk the windows
// light up, cyan and amber, with strips of blue light up the towers and signs here and there; the lowest
// rows, the low district, are darker and lit only by amber. Cables sag across the bottom.

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const scale = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];

/** How many rows of blocks between the horizon and the bottom of a view. */
const ROWS = 9;

interface Block {
  x: number;
  w: number;
  top: number;
  seed: number;
  /** A strip of blue light up one edge. */
  strip: boolean;
  /** A sign on its face (from dusk). */
  sign: boolean;
}

/** One row of blocks: `row` 0 is the farthest, just under the horizon. */
function blockRow(row: number, horizon: number, bottom: number, x0: number, x1: number): { base: number; blocks: Block[] } {
  const t = row / (ROWS - 1);
  const base = horizon + 2 + (bottom - horizon) * t ** 1.5;
  const blocks: Block[] = [];
  for (let x = x0 - 30, i = 0; x < x1 + 30; i++) {
    const w = Math.round(4 + t * 22 + cellRandom(i, row, 51) * (4 + t * 14));
    const h = Math.round(3 + t * 26 + cellRandom(i, row + 20, 51) * (4 + t * 22));
    blocks.push({ x, w, top: Math.round(base - h), seed: i * 31 + row, strip: cellRandom(i, row, 52) > 0.72, sign: cellRandom(i, row, 53) > 0.86 && t > 0.2 });
    x += w + (cellRandom(i, row, 54) > 0.8 ? 2 : 0);
  }
  return { base, blocks };
}

/** How much of a district goes dark when only some of its streets are cut (`also`). */
const STREETS_CUT = 0.4;

/** Paints the city through a view, in the area's pixels; null outside the view. */
/**
 * `dark`: a district with its power cut (big choice 1): from dusk its windows, signs and strips stay dark.
 * `also`: the other district, with some of its streets cut too (Day 3): dark in patches.
 */
export function cityViewPainter(view: CityView, slot: TimeSlot, dark?: Power['views'], fade = 1, also?: Power['also']): (x: number, y: number) => PixelColour {
  const sky = skyFor(slot);
  const night = slot === 'night';
  const lit = slot === 'evening' || night;
  const HY = view.horizon;
  const bottom = view.y + view.height;
  const scaleOfTree = view.treeScale ?? 0.2;
  // Far off: small, its canopy low over the horizon.
  const tree = treePainter(view.treeX, HY, scaleOfTree, sky, night, false, 150 * scaleOfTree);
  // (A view of only sky, its horizon below it (the glasshouse's roof), has no city in it.)
  const rows = HY >= bottom ? [] : Array.from({ length: ROWS }, (_, r) => blockRow(r, HY, bottom + 10, view.x, view.x + view.width));
  const [cyan, amber, white, cyanDeep, deep] = [SHADES.cyan, SHADES.amber, SHADES.white, SHADES.cyanDeep, SHADES.deep].map(rgb) as RGB[];

  return (x, y) => {
    if (x < view.x || x >= view.x + view.width || y < view.y || y >= bottom) return null;
    // Mullions across a window.
    if (view.mullions && (x - view.x) % view.mullions === view.mullions - 1) return SHADES.light;

    // Cables sagging across the bottom of the view, in front of everything.
    for (const [k, high] of rows.length ? ([[0, 12], [1, 24]] as const) : []) {
      const span = 64 + k * 26;
      const u = (((x - view.x + k * 37) % span) + span) % span / span;
      if (y === bottom - high + Math.round(Math.sin(u * Math.PI) * 5)) return mix(deep!, cyanDeep!, 0.3);
    }

    // The city, nearest row first: a pixel belongs to the nearest block whose top it's below.
    for (let r = rows.length - 1; r >= 0; r--) {
      const { blocks } = rows[r]!;
      const b = blocks.find((k) => x >= k.x && x < k.x + k.w);
      if (!b || y < b.top) continue;
      const t = r / (ROWS - 1);
      const low = smoothstep(0.6, 1, t); // the low district, at the bottom
      // (A district without power: its rows go dark from dusk.)
      // (Going out block by block: each block's turn comes at its own point in the fade.)
      const district = t > 0.62 ? 'low' : 'middle';
      const out = lit && ((dark === district && cellRandom(b.seed, 3, 57) < fade) || (also === district && cellRandom(b.seed, 5, 58) < STREETS_CUT));
      const lx = x - b.x;
      const ly = y - b.top;
      const haze = (1 - t) * 0.55;
      // The face: pale stone by day, dark from dusk; darker low down; the roof's edge lit.
      const stone = mix(rgb(SHADES.light), rgb(SHADES.dim), 0.3 + low * 0.5);
      let c = ly === 0 ? rgb(lit ? SHADES.dim : SHADES.white) : lx === b.w - 1 ? scale(stone, 0.6) : stone;
      c = scale(c, (lit ? 0.35 : 0.9) * sky.ground * (1 - low * 0.35));
      // Windows: a grid that grows with nearness; lit cyan or amber from dusk (amber only low down).
      const sx = 2 + Math.floor(t * 3);
      const sy = 3 + Math.floor(t * 3);
      if (ly > 1 && lx > 0 && lx < b.w - 1 && ly % sy === 1 && lx % sx === 1) {
        const r2 = cellRandom(b.seed, lx * 7 + ly, 55);
        if (lit && !out && r2 > (night ? 0.4 : 0.6)) return r2 > 0.82 && low < 0.5 ? SHADES.cyan : SHADES.amber;
        if (out && district === 'low' && r2 > 0.97) return SHADES.amberDeep; // a candle, here and there (the upper city has none)
        c = scale(c, 0.6);
      }
      // A strip of blue light up the block's edge; a sign on its face.
      if (b.strip && low < 0.6 && lx === 0) return out ? SHADES.deep : lit ? SHADES.cyan : SHADES.cyanMid;
      if (lit && !out && b.sign && ly > 2 && ly < 2 + Math.max(2, Math.round(t * 6)) && lx > 1 && lx < Math.min(b.w - 1, 2 + Math.round(t * 12))) {
        return cellRandom(b.seed, 0, 56) > 0.5 ? SHADES.cyan : SHADES.amber;
      }
      if (lit && !out) c = addLight(c, b.strip ? cyan! : amber!, 0.12 * (1 - low));
      // Gone dark: the low district warm black; the upper city's glass towers cold, dead blue-grey slabs.
      if (out) c = district === 'middle' ? mix(scale(c, 0.22), rgb(SHADES.cyanDeep), 0.4) : scale(c, 0.3);
      return mix(c, sky.horizon, haze * (lit ? 0.4 : 1));
    }

    // Above the city: the tree on the horizon, and the sky, with the city's glow at night.
    if (y < HY) {
      const t = tree(x, y);
      if (t !== null) return t;
    }
    let c = mix(sky.top, sky.horizon, smoothstep(view.y - 40, HY, y) ** 0.8);
    if (lit) c = addLight(c, mix(cyan!, amber!, 0.4), 0.18 * falloff(x, y, view.x + view.width / 2, HY + 6, view.width, 16));
    c = addLight(c, white!, 0.03 * noise(x / 40));
    return c;
  };
}
