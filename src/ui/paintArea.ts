import type { AreaDefinition, Solid } from '../data/areas/types';
import { addLight, cellRandom, falloff, noise, rgb, SHADES, smoothstep, type PixelColour, type RGB } from './pixelArt';
import { stampRows } from './pixelTextures';

// Paints an area's static backdrop from its data (see paintPixels / makePaintedTexture):
// heartwood around the carved hollow, lit wood grain inside it, carved solids, lines and props.
// Structure, lines and props are exact colours drawn on top; the wood between them is dithered.

/** Signed distance from a point to a rounded rectangle (negative inside). */
function roundedRectDistance(x: number, y: number, r: AreaDefinition['cavity']): number {
  const hw = r.width / 2 - r.radius;
  const hh = r.height / 2 - r.radius;
  const dx = Math.abs(x - (r.x + r.width / 2)) - hw;
  const dy = Math.abs(y - (r.y + r.height / 2)) - hh;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r.radius;
}

/** A carved plank: pale top edge, grain body with seams, dark underside. */
function solidColour(s: Solid, x: number, y: number): number {
  const row = y - s.y;
  if (row === 0) return SHADES.woodPale;
  if (row === s.height - 1 && s.height > 3) return SHADES.deep;
  if ((x - s.x) % 26 === 25) return SHADES.deep;
  return noise(x / 3 + row * 0.7) > 0.35 ? SHADES.wood : SHADES.woodLight;
}

/** A riveted metal plate (the settlement's floors and shelves): a worn top edge, rivets along it, seams. */
function plateColour(s: Solid, x: number, y: number): number {
  const row = y - s.y;
  if (row === 0) return SHADES.light;
  if (row === s.height - 1 && s.height > 3) return SHADES.deep;
  if ((x - s.x) % 32 === 31) return SHADES.deep;
  if (row === 2 && (x - s.x) % 16 === 8) return SHADES.dim; // rivets
  if (row === 1) return SHADES.dim;
  return cellRandom(Math.floor(x / 6), row, 93) > 0.85 ? SHADES.wood : SHADES.woodLight;
}

/**
 * A scrap wall: panels of different sizes and materials riveted together. Returns the panel's base
 * colour (to be lit and dithered), or an exact colour for seams and rivets.
 */
function scrapWall(x: number, y: number): RGB | number {
  // Columns of varying width, each split into panels of varying height, offset per column.
  let col = 0;
  let left = 0;
  for (let cx = 0; ; col++) {
    const w = 18 + Math.floor(cellRandom(col, 0, 91) * 26);
    if (x < cx + w) {
      left = cx;
      break;
    }
    cx += w;
  }
  const w = 18 + Math.floor(cellRandom(col, 0, 91) * 26);
  let row = 0;
  let top = -Math.floor(cellRandom(col, 1, 91) * 20);
  for (; ; row++) {
    const h = 14 + Math.floor(cellRandom(col, row + 2, 91) * 24);
    if (y < top + h) break;
    top += h;
  }
  const h = 14 + Math.floor(cellRandom(col, row + 2, 91) * 24);
  const lx = x - left;
  const ly = y - top;
  if (lx === 0 || ly === 0) return SHADES.shadow; // seams
  if ((lx === 3 || lx === w - 3) && (ly === 3 || ly === h - 3) && cellRandom(col, row, 94) > 0.4) return SHADES.dim; // rivets, some missing
  const kind = cellRandom(col, row, 92);
  const wear = noise(x / 3 + y / 7) * 0.08 + noise(y / 2 + x / 13) * 0.05;
  const lift = ly === 1 ? 0.12 : 0; // a lit edge under each seam
  const base: RGB =
    kind > 0.88 ? rgb(SHADES.cyanDeep) // dead glass
      : kind > 0.76 ? rgb(SHADES.amberDeep) // old paint
        : kind > 0.66 ? rgb(SHADES.dim) // pale casing
          : kind > 0.3 ? rgb(SHADES.woodLight) // bare metal
            : rgb(SHADES.wood);
  // Corrugated sheets: ridges on some of the bare ones, running across or down.
  const corrugated = cellRandom(col, row, 95);
  const ridge = kind < 0.66 && corrugated > 0.55 ? ((corrugated > 0.8 ? ly : lx) % 3 === 0 ? -0.18 : 0.04) : 0;
  const wood = rgb(SHADES.wood);
  return base.map((v, i) => (v * 0.6 + wood[i]! * 0.4) * (1 + wear + lift + ridge)) as RGB; // muted, so the room's things stand out
}

/** Inside a hull: smooth plates in long courses, ribs every so often (lit on one side), rivets along them. */
function hullWall(x: number, y: number): RGB | number {
  const rib = x % 72;
  if (rib < 6) {
    if (rib === 0) return SHADES.shadow;
    if (rib === 1) return SHADES.dim;
    if (rib === 5) return SHADES.deep;
    if (rib === 3 && y % 9 === 4) return SHADES.dim; // rivets down the rib
    return rgb(SHADES.woodLight);
  }
  const course = Math.floor((y + Math.floor(x / 72) * 7) / 22);
  if ((y + Math.floor(x / 72) * 7) % 22 === 0) return SHADES.deep; // seam between courses
  const tone = cellRandom(Math.floor(x / 72), course, 96);
  const base = rgb(tone > 0.85 ? SHADES.cyanDeep : tone > 0.7 ? SHADES.amberDeep : SHADES.woodLight);
  const wood = rgb(SHADES.wood);
  const sheen = 0.1 * Math.sin((rib / 72) * Math.PI); // each plate bowed, catching a little light in the middle
  return base.map((v, i) => (v * 0.55 + wood[i]! * 0.45) * (1 + sheen + noise(x / 9 + y / 30) * 0.04)) as RGB;
}

export function paintArea(area: AreaDefinition): (x: number, y: number) => PixelColour {
  const scrap = area.walls === 'scrap' || area.walls === 'hull';
  const hull = area.walls === 'hull';
  const { width } = area;
  const overlay = new Map<number, number>();
  const put = (x: number, y: number, c: number) => {
    if (x >= 0 && y >= 0 && x < width && y < area.height) overlay.set(y * width + x, c);
  };

  for (const s of area.solids) {
    if (s.invisible) continue;
    for (let y = s.y; y < s.y + s.height; y++) for (let x = s.x; x < s.x + s.width; x++) put(x, y, scrap ? plateColour(s, x, y) : solidColour(s, x, y));
  }
  for (const { from, to, colour } of area.lines) {
    const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), 1);
    for (let i = 0; i <= steps; i++) {
      put(Math.round(from.x + ((to.x - from.x) * i) / steps), Math.round(from.y + ((to.y - from.y) * i) / steps), colour);
    }
  }
  for (const prop of area.props) stampRows(put, prop.sprite.rows, prop.sprite.colours, prop.x, prop.y);

  const wood = rgb(SHADES.wood);
  const lights = area.lights.map((l) => ({ ...l, rgb: rgb(l.colour) }));
  const { cavity } = area;
  // The vignette spans everything carved (the cavity plus any nooks), clipped to the area.
  const carved = [cavity, ...(area.nooks ?? [])];
  const left = Math.max(0, Math.min(...carved.map((r) => r.x)));
  const top = Math.max(0, Math.min(...carved.map((r) => r.y)));
  const right = Math.min(width, Math.max(...carved.map((r) => r.x + r.width)));
  const bottom = Math.min(area.height, Math.max(...carved.map((r) => r.y + r.height)));
  const centreX = (left + right) / 2;
  const centreY = (top + bottom) / 2;
  const halfW = (right - left) / 2;
  const halfH = (bottom - top) / 2;

  return (x, y) => {
    const exact = overlay.get(y * width + x);
    if (exact !== undefined) return exact;

    let d = roundedRectDistance(x, y, cavity);
    for (const nook of area.nooks ?? []) d = Math.min(d, roundedRectDistance(x, y, nook));
    if (d >= 0 && scrap) {
      // Outside a scrap room: the dark of the shack's own frame and the night beyond, faint ridges.
      if (d < 1.5) return SHADES.dim;
      if (d < 3) return SHADES.deep;
      return (x + Math.floor(y / 3)) % 5 === 0 ? SHADES.deep : SHADES.shadow;
    }
    if (d >= 0) {
      // Heartwood around the hollow: a carved lip, then growth rings (or, for tunnels, dense packed wood
      // with a dark band along the wall and the odd root fibre running through).
      if (d < 1.5) return SHADES.woodLight;
      if (area.heartwood === 'packed') {
        if (d < 4) return SHADES.deep;
        const fibre = Math.abs(noise(x / 40 + y / 90) * 60 - ((y + x * 0.35) % 60)) < 0.8;
        if (fibre && noise(x / 13 + 7) > 0.55) return SHADES.deep;
        return noise(x / 6 + noise(y / 8) * 3) * 0.7 + noise(y / 3 + x / 17) * 0.3 > 0.6 ? SHADES.deep : SHADES.shadow;
      }
      return Math.floor(d / 5) % 3 === 0 ? SHADES.deep : SHADES.shadow;
    }

    if (scrap) {
      const wall = hull ? hullWall(x, y) : scrapWall(x, y);
      if (typeof wall === 'number') return wall;
      const vignette = smoothstep(0.45, 1.1, Math.hypot((x - centreX) / halfW, (y - centreY) / halfH));
      const edgeShadow = smoothstep(-10, 0, d) * 0.4;
      let c = wall.map((v) => v * area.ambient * (1 - 0.55 * vignette - edgeShadow)) as RGB;
      for (const l of lights) c = addLight(c, l.rgb, l.strength * falloff(x, y, l.x, l.y, l.radius, l.radiusY ?? l.radius));
      return c;
    }
    const grain = noise(x / 5 + noise(y / 90) * 0.5) * 0.6 + noise(x / 1.8 + 90) * 0.4;
    const vignette = smoothstep(0.45, 1.1, Math.hypot((x - centreX) / halfW, (y - centreY) / halfH));
    const edgeShadow = smoothstep(-10, 0, d) * 0.4; // darker right against the walls
    let c = wood.map((v) => v * area.ambient * (1 + 0.28 * grain) * (1 - 0.55 * vignette - edgeShadow)) as RGB;
    for (const l of lights) c = addLight(c, l.rgb, l.strength * falloff(x, y, l.x, l.y, l.radius, l.radiusY ?? l.radius));
    return c;
  };
}
