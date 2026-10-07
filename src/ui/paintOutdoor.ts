import type { AreaDefinition, Outdoor, Solid } from '../data/areas/types';
import type { TimeSlot } from '../systems/Calendar';
import { addLight, cellRandom, falloff, noise, rgb, SHADES, smoothstep, type PixelColour, type RGB } from './pixelArt';
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
  const tree = treePainter(TX, HY, s, sky, night);
  // Distant junk heaps along the horizon.
  const heapTop = (x: number) => HY - Math.max(0, noise(x / 23) * 7 + noise(x / 7) * 2 - 2);

  return (x, y) => {
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
 * 1 from the settlement). Returns null where the tree isn't.
 */
export function treePainter(TX: number, HY: number, s: number, sky: Sky, night: boolean): (x: number, y: number) => PixelColour {
  const [bark, greenDeep, greenMid, green, dim, deep, light, cyanMid, amberDeep, amber] = [
    SHADES.wood, SHADES.greenDeep, SHADES.greenMid, SHADES.green, SHADES.dim, SHADES.deep, SHADES.light, SHADES.cyanMid, SHADES.amberDeep, SHADES.amber,
  ].map(rgb) as RGB[];
  const haze = night ? 0.05 : 0.16 / s;
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
  ].map((b) => ({ ...b, y0: HY - HY * b.at }));
  const inBranch = (x: number, y: number) =>
    branches.some((b) => {
      const out = (x - TX) * b.side - trunkHalf(b.y0) + 6;
      if (out < 0 || out > b.len * s) return false;
      const centre = b.y0 - out / b.slope + noise(out / 9 + b.at * 10) * 3;
      return Math.abs(y - centre) < b.thick * s * (1 - (out / (b.len * s)) * 0.6);
    });

  // The canopy: overlapping clumps of green, the biggest highest, running off the top.
  const canopyBase = HY * 0.68;
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
    // The pipes come out from behind the leaves.
    const c = canopy(x, y);
    if (c) {
      // Lit from above: bright green crowns, deep green underneath, leafy texture.
      const lit = (c.y - y) / c.r * 0.5 + 0.5 - (x - c.x) / c.r * 0.15;
      const leaf = noise(x / 2.3 + noise(y / 3) * 2) * 0.5 + noise(y / 1.7 + x / 5) * 0.3;
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
function dirt(s: Solid, x: number, y: number, sky: Sky): RGB | number {
  const row = y - s.y;
  if (row === 0) return scale(rgb(SHADES.dim), sky.ground);
  const r = cellRandom(Math.floor(x / 3), Math.floor(y / 2), 21);
  if (row > 2 && r > 0.93) {
    const kind = cellRandom(Math.floor(x / 3), Math.floor(y / 2), 22);
    const chip = r > 0.985 ? (kind > 0.66 ? SHADES.cyanMid : kind > 0.33 ? SHADES.amber : SHADES.light) : r > 0.965 ? SHADES.dim : SHADES.deep;
    return scale(rgb(chip), sky.ground);
  }
  const grit = noise(x / 2.5 + row * 0.9) * 0.5 + noise(x / 11 + 40) * 0.3;
  const base = mix(mix(rgb(SHADES.woodPale), rgb(SHADES.amberDeep), 0.25), rgb(SHADES.woodLight), smoothstep(1, 14, row));
  return addLight(scale(base, sky.ground * (1 + 0.25 * grit)), rgb(SHADES.amber), sky.warm);
}

/** The near layer: dirt solids, lines and props; transparent elsewhere so the far layer shows. */
export function paintOutdoorNear(area: AreaDefinition, slot: TimeSlot): (x: number, y: number) => PixelColour {
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
  const lights = area.lights.map((l) => ({ ...l, rgb: rgb(l.colour) }));

  return (x, y) => {
    const exact = overlay.get(y * width + x);
    if (exact !== undefined) return exact;
    const s = solids.find((o) => x >= o.x && x < o.x + o.width && y >= o.y && y < o.y + o.height);
    if (!s) return null;
    const c = dirt(s, x, y, sky);
    if (typeof c === 'number') return c;
    let lit = c;
    for (const l of lights) lit = addLight(lit, l.rgb, l.strength * falloff(x, y, l.x, l.y, l.radius, l.radiusY ?? l.radius));
    return lit;
  };
}
