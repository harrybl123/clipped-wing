import type { AreaDefinition, Solid } from '../data/areas/types';
import { addLight, falloff, noise, rgb, SHADES, smoothstep, type PixelColour, type RGB } from './pixelArt';
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

export function paintArea(area: AreaDefinition): (x: number, y: number) => PixelColour {
  const { width } = area;
  const overlay = new Map<number, number>();
  const put = (x: number, y: number, c: number) => {
    if (x >= 0 && y >= 0 && x < width && y < area.height) overlay.set(y * width + x, c);
  };

  for (const s of area.solids) {
    if (s.invisible) continue;
    for (let y = s.y; y < s.y + s.height; y++) for (let x = s.x; x < s.x + s.width; x++) put(x, y, solidColour(s, x, y));
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
  const centreX = cavity.x + cavity.width / 2;
  const centreY = cavity.y + cavity.height / 2;

  return (x, y) => {
    const exact = overlay.get(y * width + x);
    if (exact !== undefined) return exact;

    const d = roundedRectDistance(x, y, cavity);
    if (d >= 0) {
      // Heartwood around the hollow: a carved lip, then growth rings.
      if (d < 1.5) return SHADES.woodLight;
      return Math.floor(d / 5) % 3 === 0 ? SHADES.deep : SHADES.shadow;
    }

    const grain = noise(x / 5 + noise(y / 90) * 0.5) * 0.6 + noise(x / 1.8 + 90) * 0.4;
    const vignette = smoothstep(0.45, 1.1, Math.hypot((x - centreX) / (cavity.width / 2), (y - centreY) / (cavity.height / 2)));
    const edgeShadow = smoothstep(-10, 0, d) * 0.4; // darker right against the walls
    let c = wood.map((v) => v * area.ambient * (1 + 0.28 * grain) * (1 - 0.55 * vignette - edgeShadow)) as RGB;
    for (const l of lights) c = addLight(c, l.rgb, l.strength * falloff(x, y, l.x, l.y, l.radius, l.radiusY ?? l.radius));
    return c;
  };
}
