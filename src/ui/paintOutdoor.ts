import type { AreaDefinition, Outdoor, Solid } from '../data/areas/types';
import type { TimeSlot } from '../systems/Calendar';
import { addLight, cellRandom, falloff, noise, poweredLights, rgb, SHADES, smoothstep, type PixelColour, type Power, type RGB } from './pixelArt';
import { stampRows } from './pixelTextures';

// Areas out in the open (the borderland, Chapter 2; docs/chapter-2-world.md). Two layers:
// - the far layer: the sky, the tree vast on the horizon with its top lost in white, and the plain
//   receding beneath it with distant junk; it scrolls at FAR_SCROLL of the camera, so the tree stays put;
// - the near layer: the area's solids as packed dirt (lit by its lights), its lines and props, and
//   nothing else (transparent), so the far layer shows through.
// Both are painted for the time of day: a pale haze in the morning, a flat glare in the afternoon,
// amber dusk in the evening, and at night a dark sky with the tree black against it.

/** How fast the far layer moves with the camera (0 = fixed, 1 = with the ground). */
export const FAR_SCROLL = 0.2;

/** The far layer's size for an area: a screen, plus the little it moves as you cross the area. */
export function farSize(area: AreaDefinition, screenW: number, screenH: number): { width: number; height: number } {
  return {
    width: screenW + Math.ceil(Math.max(0, area.width - screenW) * FAR_SCROLL),
    height: screenH + Math.ceil(Math.max(0, area.height - screenH) * FAR_SCROLL),
  };
}

export interface Sky {
  top: RGB;
  horizon: RGB;
  /** The white glare round the tree's top. */
  glare: number;
  /** How bright the ground and the tree are. */
  ground: number;
  /** A warm wash over everything (dusk). */
  warm: number;
}

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const scale = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];

/** The sky and light for each time of day. */
export function skyFor(slot: TimeSlot): Sky {
  const [light, white, dim, amber, amberDeep, deep, shadow, cyanMid] = [SHADES.light, SHADES.white, SHADES.dim, SHADES.amber, SHADES.amberDeep, SHADES.deep, SHADES.shadow, SHADES.cyanMid].map(rgb) as RGB[];
  switch (slot) {
    case 'morning':
      return { top: mix(mix(dim!, light!, 0.5), cyanMid!, 0.35), horizon: mix(mix(light!, white!, 0.6), amber!, 0.18), glare: 0.7, ground: 0.95, warm: 0.04 };
    case 'afternoon':
      return { top: mix(mix(light!, white!, 0.2), cyanMid!, 0.3), horizon: mix(white!, amber!, 0.12), glare: 0.9, ground: 1.05, warm: 0.03 };
    case 'evening':
      return { top: mix(amberDeep!, deep!, 0.35), horizon: mix(amber!, light!, 0.25), glare: 0.45, ground: 0.72, warm: 0.12 };
    case 'night':
      return { top: shadow!, horizon: mix(deep!, dim!, 0.25), glare: 0.3, ground: 0.38, warm: 0 };
  }
}

/** The far layer: sky, the tree on the horizon, the plain receding with junk on it. */
export function paintFar(outdoor: Outdoor, slot: TimeSlot, height: number): (x: number, y: number) => PixelColour {
  const sky = skyFor(slot);
  const [white, dust, near] = [SHADES.white, SHADES.woodPale, SHADES.woodLight].map(rgb) as RGB[];
  const HY = outdoor.horizon;
  const TX = outdoor.treeX;
  const s = outdoor.treeScale ?? 1;
  const night = slot === 'night';
  const tree = treePainter(TX, HY, s, sky, night, outdoor.atRoots);
  // Distant junk heaps along the horizon.
  const heapTop = (x: number) => HY - Math.max(0, noise(x / 23) * 7 + noise(x / 7) * 2 - 2);
  const town = outdoor.backdrop === 'settlement' ? skyline(HY, sky, slot) : null;
  const city = outdoor.backdrop === 'city' ? cityPainter(outdoor, sky, slot) : null;
  const cityFrom = outdoor.cityFrom ?? -Infinity;

  return (x, y) => {
    if (town) {
      const t = town(x, y);
      if (t !== null) return t;
    }
    if (city) {
      const t = city(x, y);
      if (t !== null) return t;
      // Below the towers, the city's street level: dark, a glow coming up off it from dusk.
      if (y >= HY && x >= cityFrom) {
        const c = scale(rgb(SHADES.deep), sky.ground);
        return slot === 'evening' || slot === 'night' ? addLight(c, rgb(SHADES.amber), 0.12) : c;
      }
    }
    if (y < HY) {
      const t = tree(x, y);
      if (t !== null) return t;
      if (y >= heapTop(x) && Math.abs(x - TX) > 150 * s) return mix(scale(near!, sky.ground * 0.8), sky.horizon, 0.45);
      let c = mix(sky.top, sky.horizon, smoothstep(0, HY, y) ** 0.8);
      c = addLight(c, white!, sky.glare * 0.6 * falloff(x, y, TX - 160 * s, -20, 160, 70));
      return c.map((v) => Math.min(255, v)) as RGB;
    }

    // The plain: hazy at the horizon, darker and coarser nearer.
    const depth = smoothstep(HY, height, y);
    if (outdoor.ground === 'deep') {
      // Hard, dark, bare: straight grooves running away to a point on the horizon, far ahead.
      const vx = 900;
      const slope = (x - vx) / (y - HY + 0.001);
      for (const g of [-14, -9, -6, -4, -2.6, -1.6, -0.8]) if (Math.abs(slope - g) < 0.04 + 0.012 * Math.abs(g)) return scale(rgb(SHADES.shadow), sky.ground);
      let c = mix(rgb(SHADES.wood), rgb(SHADES.deep), depth * 0.6);
      c = mix(c, sky.horizon, 0.45 * (1 - smoothstep(HY, HY + 20, y)));
      return scale(c, sky.ground * (1 + 0.05 * noise(x / 15 + y / 4)));
    }
    let c = mix(mix(dust!, rgb(SHADES.amberDeep), 0.3), near!, depth);
    c = mix(c, sky.horizon, 0.4 * (1 - smoothstep(HY, HY + 26, y)));
    c = scale(c, sky.ground * (1 + 0.12 * noise(x / 7 + noise(y / 3) * 2)));
    c = addLight(c, rgb(SHADES.amber), sky.warm);

    // Junk scattered over it, bigger nearer, each piece a low lump at a jittered spot; now and then a
    // part still glinting cyan.
    const cell = 6 + depth * 14;
    const cx = Math.floor(x / cell);
    const cy = Math.floor((y - HY) / (cell * 0.5));
    for (const [ox, oy] of [[0, 0], [-1, 0], [0, -1], [-1, -1]] as const) {
      const r = cellRandom(cx + ox, cy + oy, 11);
      if (r < 0.62) continue;
      const px = (cx + ox + cellRandom(cx + ox, cy + oy, 12)) * cell;
      const py = HY + (cy + oy + cellRandom(cx + ox, cy + oy, 13)) * cell * 0.5;
      const size = (1 + depth * 4) * (0.6 + r);
      const dx = (x - px) / size;
      const dy = (py - y) / (size * 0.5);
      if (dy < 0 || dy > 1 - dx * dx * 0.8 || Math.abs(dx) > 1) continue;
      if (r > 0.992 && dy > 0.7) return SHADES.cyan;
      // Mostly dark metal; some pale casings, amber paint, cyan glass.
      const kind = cellRandom(cx + ox, cy + oy, 14);
      const [lit, body] = kind > 0.86 ? [SHADES.white, SHADES.light] : kind > 0.74 ? [SHADES.amber, SHADES.amberDeep] : kind > 0.64 ? [SHADES.cyan, SHADES.cyanMid] : [SHADES.dim, SHADES.deep];
      return scale(rgb(dy > 0.75 ? lit : body), sky.ground * (night ? 0.6 : 1));
    }
    return c;
  };
}

/**
 * The settlement's rooftops seen from inside its walls: shacks of every height crowding the horizon,
 * hazed by distance, sloped and flat roofs, a pole or a mast here and there, windows lit from dusk.
 */
function skyline(HY: number, sky: Sky, slot: TimeSlot): (x: number, y: number) => PixelColour {
  const lit = slot === 'evening' || slot === 'night';
  // Blocks of varying width along the horizon, two rows (the far one paler).
  const blocks = (row: number) => {
    const out: { x: number; w: number; h: number; slope: number; seed: number }[] = [];
    for (let x = -20, i = 0; x < 1400; i++) {
      const w = 14 + Math.floor(cellRandom(i, row, 101) * 22);
      out.push({ x, w, h: (row ? 14 : 8) + Math.floor(cellRandom(i, row + 2, 101) * (row ? 26 : 16)), slope: cellRandom(i, row + 4, 101) - 0.5, seed: i * 7 + row });
      x += w - 1;
    }
    return out;
  };
  const rows = [blocks(1), blocks(0)]; // near row last, so it's drawn over the far one
  const base = HY + 10;
  return (x, y) => {
    for (let r = rows.length - 1; r >= 0; r--) {
      const near = r === 1;
      const b = rows[r]!.find((k) => x >= k.x && x < k.x + k.w);
      if (!b) continue;
      const lx = x - b.x;
      const top = base - (near ? 0 : 6) - b.h - Math.round(b.slope * lx * 0.5);
      if (y < top || y > base) {
        // A pole or mast above some roofs.
        if (near && b.seed % 5 === 0 && lx === Math.floor(b.w / 2) && y >= top - 10 && y < top) return mix(scale(rgb(SHADES.deep), sky.ground), sky.horizon, 0.3);
        continue;
      }
      const haze = near ? 0.32 : 0.5;
      const c = rgb(y === top ? SHADES.dim : lx === 0 ? SHADES.shadow : cellRandom(b.seed, 0, 103) > 0.7 ? SHADES.wood : SHADES.woodLight);
      // Windows: dark by day, lit from dusk.
      const wy = (y - top - 4) % 7;
      const wx = (lx - 3) % 6;
      if (y > top + 3 && wy === 0 && wx >= 0 && wx < 2 && cellRandom(b.seed, Math.floor((lx - 3) / 6) + Math.floor((y - top) / 7) * 9, 104) > 0.6) {
        return lit ? (cellRandom(b.seed, lx, 105) > 0.25 ? SHADES.amber : SHADES.cyanMid) : mix(rgb(SHADES.shadow), sky.horizon, haze * 0.5);
      }
      return mix(scale(c, sky.ground), sky.horizon, haze);
    }
    return null;
  };
}

/**
 * The capital's towers (Chapter 3; docs/chapter-3-world.md), seen from its streets: two rows of them, the far
 * row taller and hazier, rising towards the citadel, which stands above them all in marble and gold, its
 * sealed wing the tallest tower, dark, a line of blue light up it. By day pale stone in the haze; from dusk
 * dark, their windows lit cyan and amber, strips of blue light up their edges, signs here and there, cables
 * slung between the near ones. Null where there's only sky.
 */
function cityPainter(outdoor: Outdoor, sky: Sky, slot: TimeSlot): (x: number, y: number) => PixelColour {
  const HY = outdoor.horizon;
  const lit = slot === 'evening' || slot === 'night';
  const night = slot === 'night';
  const CX = outdoor.citadelX ?? 240;
  const from = outdoor.cityFrom ?? -Infinity;
  /** 1 under the citadel, falling away from it: the city climbs its hill. */
  const near = (x: number) => Math.exp(-(((x - CX) / 170) ** 2));
  const BASE = HY - 132; // the citadel's base, on top of the city
  const rows = [0, 1].map((r) => {
    const out: { x: number; w: number; top: number; seed: number; strip: boolean; sign: boolean }[] = [];
    for (let x = -24, i = 0; x < 2400; i++) {
      const w = r ? 10 + Math.floor(cellRandom(i, 1, 71) * 14) : 6 + Math.floor(cellRandom(i, 0, 71) * 10);
      const h = r ? 22 + cellRandom(i, 3, 71) * 46 + near(x) * 40 : 50 + cellRandom(i, 2, 71) * 70 + near(x) * 60;
      out.push({ x, w, top: Math.max(BASE + 8, Math.round(HY - h)), seed: i * 13 + r, strip: cellRandom(i, 4, 71) > 0.7, sign: r === 1 && cellRandom(i, 5, 71) > 0.8 });
      x += w + (cellRandom(i, 6, 71) > 0.8 ? 2 : 0);
    }
    return out;
  });
  const citadel = (x: number, y: number): PixelColour => {
    const dx = x - CX;
    if (Math.abs(dx) > 78 || y > BASE + 14) return null;
    // The base: a wide marble wedge, gold along its top.
    if (y >= BASE) {
      const half = 60 + (y - BASE) * 1.3;
      if (Math.abs(dx) > half) return null;
      const c = y === BASE ? SHADES.amber : dx > half - 2 ? SHADES.white : SHADES.light;
      return lit ? scale(rgb(c), y === BASE ? 1 : 0.7) : mix(rgb(c), sky.horizon, 0.25);
    }
    // The sealed wing: the tallest, dark, blue light up its middle.
    if (Math.abs(dx + 12) <= 4 && y > BASE - 120) return dx + 12 === 0 ? (y % 4 === 0 ? SHADES.white : SHADES.cyan) : SHADES.deep;
    if (Math.abs(dx + 12) === 0 && y > BASE - 128) return SHADES.dim;
    // Marble towers with gold caps.
    const towers = [[-52, 10, 46], [-34, 12, 70], [6, 14, 84], [26, 10, 62], [44, 14, 54], [-4, 30, 40]] as const;
    for (const [ox, w, h] of towers) {
      const lx = dx - ox;
      const top = BASE - h;
      if (lx < 0 || lx >= w || y < top - (lx === Math.floor(w / 2) ? 6 : 0)) continue;
      if (y < top) return SHADES.amber; // a spire
      if (y < top + 2) return y === top ? SHADES.amber : SHADES.amberDeep;
      if (lit && (y - top) % 5 === 3 && lx % 3 === 1 && lx < w - 1) return cellRandom(lx + ox, y, 75) > 0.4 ? SHADES.amber : SHADES.cyan;
      const c = rgb(lx === 0 ? SHADES.dim : lx === w - 1 ? SHADES.white : SHADES.light);
      return lit ? scale(c, 0.75) : mix(c, sky.horizon, 0.2);
    }
    return null;
  };

  return (x, y) => {
    if (x < from) return null;
    const c = citadel(x, y);
    if (c !== null) return c;
    if (y >= HY) return null;
    for (let r = 1; r >= 0; r--) {
      const b = rows[r]!.find((k) => x >= k.x && x < k.x + k.w);
      if (!b || y < b.top) continue;
      const lx = x - b.x;
      const ly = y - b.top;
      const haze = r ? 0.15 : 0.4;
      // Windows, lit from dusk; a strip of blue light up an edge; a sign on the near ones.
      if (lit && b.sign && ly > 3 && ly < 9 && lx > 1 && lx < b.w - 2) return cellRandom(b.seed, 0, 74) > 0.5 ? SHADES.cyan : SHADES.amber;
      if (b.strip && lx === 0) return lit ? SHADES.cyan : SHADES.cyanMid;
      if (ly > 1 && lx > 0 && lx < b.w - 1 && ly % 4 === 2 && lx % 2 === 1) {
        const w = cellRandom(b.seed, lx * 5 + ly, 73);
        if (lit && w > (night ? 0.35 : 0.55)) return w > 0.85 ? SHADES.cyan : SHADES.amber;
      }
      const stone = rgb(ly === 0 ? SHADES.light : lx === b.w - 1 ? SHADES.woodLight : r ? SHADES.dim : SHADES.light);
      const c2 = lit ? scale(rgb(ly === 0 ? SHADES.dim : lx === b.w - 1 ? SHADES.shadow : SHADES.deep), r ? 1 : 1.3) : scale(stone, sky.ground * (r ? 0.75 : 0.95));
      return mix(c2, sky.horizon, haze * (lit ? 0.3 : 1));
    }
    // Cables slung between the near towers.
    const span = 46;
    const u = ((((x + 13) % span) + span) % span) / span;
    const cy = HY - 58 + Math.round(Math.sin(u * Math.PI) * 6) + Math.round(noise(Math.floor((x + 13) / span)) * 10);
    if (y === cy) return scale(rgb(SHADES.deep), 0.9);
    return null;
  };
}

/** Distance from a point to a polyline. */
function toPolyline(x: number, y: number, pts: readonly (readonly [number, number])[]): { d: number; side: number } {
  let best = { d: Infinity, side: 0 };
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i]!;
    const [bx, by] = pts[i + 1]!;
    const vx = bx - ax;
    const vy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
    const px = ax + vx * t;
    const py = ay + vy * t;
    const d = Math.hypot(x - px, y - py);
    if (d < best.d) best = { d, side: Math.sign((x - px) * -vy + (y - py) * vx) };
  }
  return best;
}

/**
 * The tree as seen from the borderland (designer: vast, green at the top, with tubing and pipes out of the
 * top): flared roots arching out of the ground, a trunk wider than anything out here, great branches up
 * into a canopy of green clumps that runs off the top of the view, and out of the canopy pipes and tubing,
 * a dense bundle out of the middle, bent and drooping (no glowing tube: that's only seen from inside). Hazed by distance (`s` is how near:
 * 1 from the settlement; `rise` is how far its canopy sits above the horizon, by default as far as the horizon is
 * from the top, so it fills the sky). Returns null where the tree isn't.
 */
export function treePainter(TX: number, HY: number, s: number, sky: Sky, night: boolean, atRoots = false, rise = HY): (x: number, y: number) => PixelColour {
  const [bark, greenDeep, greenMid, green, dim, deep, light, cyanMid, amberDeep, amber] = [
    SHADES.wood, SHADES.greenDeep, SHADES.greenMid, SHADES.green, SHADES.dim, SHADES.deep, SHADES.light, SHADES.cyanMid, SHADES.amberDeep, SHADES.amber,
  ].map(rgb) as RGB[];
  const haze = night ? 0.05 : Math.min(0.5, 0.16 / s); // (capped, so a tree far off doesn't vanish into the sky)
  const finish = (c: RGB): RGB => mix(scale(c, sky.ground), sky.horizon, haze);

  const trunkHalf = (y: number) => {
    const up = HY - y;
    return 50 * s + 34 * s * Math.exp(-up / (12 * s)) + noise(y / 9) * 2.5 + noise(y / 3.1) * 0.8;
  };
  const rootSpan = 230 * s;
  const rootTop = (x: number) => {
    const d = Math.abs(x - TX) / rootSpan;
    if (d > 1) return HY;
    const arch = Math.max(0, Math.sin((x - TX) / (15 * s)) * 0.5 + 0.55);
    return HY - (1 - d) ** 1.5 * 28 * s * arch - noise(x / 4) * 2 * (1 - d);
  };
  const branches = [
    { side: -1, at: 0.42, slope: 0.6, len: 140, thick: 9 },
    { side: 1, at: 0.48, slope: 0.7, len: 150, thick: 10 },
    { side: 1, at: 0.66, slope: 1.0, len: 90, thick: 6 },
    { side: -1, at: 0.62, slope: 1.1, len: 80, thick: 6 },
  ].map((b) => ({ ...b, y0: HY - rise * b.at }));
  const inBranch = (x: number, y: number) =>
    branches.some((b) => {
      const out = (x - TX) * b.side - trunkHalf(b.y0) + 6;
      if (out < 0 || out > b.len * s) return false;
      const centre = b.y0 - out / b.slope + noise(out / 9 + b.at * 10) * 3;
      return Math.abs(y - centre) < b.thick * s * (1 - (out / (b.len * s)) * 0.6);
    });

  // The canopy: overlapping clumps of green, the biggest highest, running off the top.
  const canopyBase = HY - rise * 0.32;
  const clumps = Array.from({ length: 15 }, (_, i) => {
    const u = i / 14 - 0.5; // -0.5..0.5 across
    const crown = 1 - Math.abs(u) * 2; // 1 in the middle, 0 at the ends
    const r = (19 + crown * 8 + cellRandom(i, 1, 31) * 5) * s;
    return {
      x: TX + u * 2 * 130 * s + (cellRandom(i, 2, 31) - 0.5) * 18 * s,
      y: canopyBase - r * 0.6 - crown ** 0.7 * 26 * s - cellRandom(i, 3, 31) * 8 * s,
      r,
    };
  });
  // The top of the canopy (its highest clump), where the pipes come out of it.
  const top = Math.min(...clumps.map((c) => c.y - c.r));
  const canopy = (x: number, y: number) => {
    let best = 0;
    let clump = clumps[0]!;
    for (const c of clumps) {
      if (Math.abs(x - c.x) > c.r * 1.2 || Math.abs(y - c.y) > c.r * 1.2) continue;
      const a = Math.atan2(y - c.y, x - c.x);
      const edge = c.r * (1 + 0.1 * noise(a * 3 + c.x) + 0.05 * noise(a * 9 + c.y));
      const k = 1 - Math.hypot(x - c.x, y - c.y) / edge;
      if (k > best) {
        best = k;
        clump = c;
      }
    }
    return best > 0 ? clump : null;
  };

  // Points relative to the canopy's top (dy up is negative).
  const P = (dx: number, dy: number) => [TX + dx * s, top + dy * s] as const;
  // A dense bundle of tubes and pipes rising out of the middle of the canopy (designer), leaning out a
  // little, some bent over at the top. No glowing tube: the tube is only seen from inside (designer).
  const BUNDLE = 15;
  const pipes = Array.from({ length: BUNDLE }, (_, i) => {
    const off = (i - (BUNDLE - 1) / 2) * 3.4 + (cellRandom(i, 4, 41) - 0.5) * 2; // across the bundle
    const rise = 20 + cellRandom(i, 5, 41) ** 0.8 * 80 * (1 - Math.abs(off) / 45);
    const lean = off * 0.7 + (cellRandom(i, 8, 41) - 0.5) * 8;
    const pts: (readonly [number, number])[] = [P(off, 22), P(off + lean * 0.4, -rise * 0.6), P(off + lean, -rise)];
    const bend = cellRandom(i, 6, 41);
    if (bend > 0.55) pts.push(P(off + lean + Math.sign(off || 1) * (6 + bend * 14), -rise + (bend - 0.5) * 16)); // bent over
    const look = cellRandom(i, 9, 41);
    return { pts, w: 1.2 + cellRandom(i, 7, 41) * 1.8, look, seed: i * 5 };
  });
  // A few heavier pipes drooping out of the canopy's sides.
  pipes.push(
    { pts: [P(-60, 30), P(-80, 14), P(-96, 20)], w: 2.5, look: 0.3, seed: 1 },
    { pts: [P(66, 30), P(86, 18), P(100, 28), P(102, 38)], w: 2.5, look: 0.7, seed: 2 },
  );

  const pipeAt = (x: number, y: number): PixelColour => {
    for (const p of pipes) {
      const { d, side } = toPolyline(x, y, p.pts);
      if (d > p.w * s) continue;
      if (d > p.w * s - 1 && p.w > 1.5) return finish(deep!);
      if ((Math.round(y) + p.seed) % 13 === 0) return finish(deep!); // a joint
      // Bare metal mostly; some dark, some still painted amber, some cyan-glazed.
      const [hi, lo] = p.look > 0.85 ? [amber!, amberDeep!] : p.look > 0.72 ? [cyanMid!, deep!] : p.look > 0.4 ? [light!, dim!] : [dim!, deep!];
      return finish(side > 0 ? hi : lo);
    }
    return null;
  };

  return (x, y) => {
    // At the roots, there's only the trunk going up out of sight: no canopy, no pipes.
    if (atRoots) {
      if (Math.abs(x - TX) < trunkHalf(y) * 1.4 || y >= rootTop(x)) {
        const grain = noise(x / 2.2 + noise(y / 24) * 3) * 0.5 + noise(y / 2 + x / 30) * 0.15;
        const edge = 1 - Math.min(1, (trunkHalf(y) * 1.4 - Math.abs(x - TX)) / 9);
        let col = scale(bark!, 1 + 0.35 * grain + 0.3 * Math.max(0, edge) - 0.25 * (1 - smoothstep(0, HY, y)));
        col = addLight(col, green!, 0.3 * falloff(x, y, TX, HY - 2, rootSpan * 0.4, 8 * s) * (0.6 + 0.4 * noise(x / 4)));
        return finish(col);
      }
      return null;
    }
    // The pipes come out from behind the leaves.
    const c = canopy(x, y);
    if (c) {
      // Lit from above: bright green crowns, deep green underneath, leafy texture.
      const lit = (c.y - y) / c.r * 0.5 + 0.5 - (x - c.x) / c.r * 0.15;
      const k = Math.max(1, s * 0.7); // leaves stay leaf-sized however near the tree is
      const leaf = noise(x / (2.3 * k) + noise(y / (3 * k)) * 2) * 0.5 + noise(y / (1.7 * k) + x / (5 * k)) * 0.3;
      const t = Math.max(0, Math.min(1, lit + leaf * 0.35));
      const col = t > 0.78 ? mix(greenMid!, green!, (t - 0.78) / 0.5) : mix(scale(greenDeep!, 0.8), greenMid!, t / 0.78);
      return finish(mix(col, amberDeep!, 0.08));
    }
    const pipe = pipeAt(x, y);
    if (pipe !== null) return pipe;
    if (y < top + 20 * s) return null; // above the leaves: only sky and pipes
    if (Math.abs(x - TX) < trunkHalf(y) || y >= rootTop(x) || inBranch(x, y)) {
      const inTrunk = Math.abs(x - TX) < trunkHalf(y);
      const edge = inTrunk ? 1 - Math.min(1, (trunkHalf(y) - Math.abs(x - TX)) / 7) : 0;
      const grain = noise(x / 2.2 + noise(y / 24) * 3) * 0.5 + noise(y / 2 + x / 30) * 0.15;
      const shadeUnder = smoothstep(canopyBase + 30, canopyBase - 10, y) * 0.35; // in the canopy's shadow
      let col = scale(bark!, 1 + 0.35 * grain + 0.25 * edge - shadeUnder);
      col = addLight(col, green!, 0.3 * falloff(x, y, TX, HY - 2, rootSpan * 0.4, 8 * s) * (0.6 + 0.4 * noise(x / 4)));
      return finish(col);
    }
    return null;
  };
}

/** Packed dirt: a sunlit crust on top, grit and buried bits of junk below. */
function dirt(s: Solid, x: number, y: number, sky: Sky, hard = false, groundY?: number): RGB | number {
  const row = y - s.y;
  // Underground (below `groundY`): depth is measured from the ground, and the sky doesn't reach it.
  const under = groundY === undefined ? row : y - groundY;
  const buried = groundY !== undefined && s.y > groundY + 4;
  const ground = groundY === undefined ? sky.ground : sky.ground + (0.62 - sky.ground) * smoothstep(8, 60, under);
  if (hard) {
    // The deep ground: hard and dark, no junk in it; the grooves cross your path as notches.
    if (x % 64 < 3 && row < 3) return SHADES.shadow;
    if (row === 0) return scale(rgb(SHADES.woodLight), sky.ground);
    return scale(mix(rgb(SHADES.wood), rgb(SHADES.deep), smoothstep(0, 20, row)), sky.ground * (1 + 0.05 * noise(x / 6 + row)));
  }
  if (row === 0 && !buried) return scale(rgb(SHADES.dim), ground);
  const r = cellRandom(Math.floor(x / 3), Math.floor(y / 2), 21);
  // Deep down (a buried room's earth), fewer bright chips and darker soil, in layers.
  const deep = smoothstep(14, 60, under);
  if (row > 2 && r > 0.93 + deep * 0.05) {
    const kind = cellRandom(Math.floor(x / 3), Math.floor(y / 2), 22);
    const chip = r > 0.985 && deep < 0.5 ? (kind > 0.66 ? SHADES.cyanMid : kind > 0.33 ? SHADES.amber : SHADES.light) : r > 0.965 ? SHADES.dim : SHADES.deep;
    return scale(rgb(chip), ground * (1 - deep * 0.3));
  }
  const grit = noise(x / 2.5 + row * 0.9) * 0.5 + noise(x / 11 + 40) * 0.3;
  const strata = deep * (Math.floor((under + noise(x / 25) * 4) / 10) % 2 ? 0.12 : 0);
  const base = mix(mix(mix(rgb(SHADES.woodPale), rgb(SHADES.amberDeep), 0.25), rgb(SHADES.woodLight), smoothstep(1, 14, under)), rgb(SHADES.wood), deep * 0.7);
  return addLight(scale(base, ground * (1 + 0.2 * grit - strata)), rgb(SHADES.amber), sky.warm * (1 - deep));
}

/** A paved street (the capital): a worn kerb on top, a line of blue light set into it, dark slabs below with seams. */
function paving(s: Solid, x: number, y: number, sky: Sky, lit: boolean): RGB | number {
  const row = y - s.y;
  if (row === 0) return scale(rgb(SHADES.light), sky.ground);
  if (row === 1) return scale(rgb(SHADES.dim), sky.ground);
  if (row === 2) return lit && (x - s.x) % 6 < 4 ? SHADES.cyan : scale(rgb(SHADES.cyanDeep), sky.ground);
  if ((x - s.x + Math.floor(row / 8) * 9) % 22 === 0 || row % 8 === 0) return SHADES.shadow;
  const base = rgb(row < 12 ? SHADES.woodLight : SHADES.wood);
  return scale(base, (lit ? 0.8 : sky.ground) * (1 + 0.06 * noise(x / 5 + row)));
}

/** The near layer: dirt solids, lines and props; transparent elsewhere so the far layer shows. */
export function paintOutdoorNear(area: AreaDefinition, slot: TimeSlot, power: Power = {}): (x: number, y: number) => PixelColour {
  const sky = skyFor(slot);
  const { width } = area;
  const overlay = new Map<number, number>();
  const put = (x: number, y: number, c: number) => {
    if (x >= 0 && y >= 0 && x < width && y < area.height) overlay.set(y * width + x, c);
  };
  for (const { from, to, colour } of area.lines) {
    const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), 1);
    for (let i = 0; i <= steps; i++) put(Math.round(from.x + ((to.x - from.x) * i) / steps), Math.round(from.y + ((to.y - from.y) * i) / steps), colour);
  }
  for (const prop of area.props) stampRows(put, prop.sprite.rows, prop.sprite.colours, prop.x, prop.y);
  const solids = area.solids.filter((s) => !s.invisible);
  const lights = poweredLights(area, power);

  return (x, y) => {
    const exact = overlay.get(y * width + x);
    if (exact !== undefined) return exact;
    const s = solids.find((o) => x >= o.x && x < o.x + o.width && y >= o.y && y < o.y + o.height);
    if (!s) return null;
    const c = area.outdoor?.ground === 'street'
      ? paving(s, x, y, sky, slot === 'evening' || slot === 'night')
      : dirt(s, x, y, sky, area.outdoor?.ground === 'deep', area.outdoor?.groundY);
    if (typeof c === 'number') return c;
    let lit = c;
    for (const l of lights) lit = addLight(lit, l.rgb, l.strength * falloff(x, y, l.x, l.y, l.radius, l.radiusY ?? l.radius));
    return lit;
  };
}
