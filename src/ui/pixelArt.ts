import { PALETTE } from '../palette';

// Pixel-art colour and lighting helpers. Pure logic (no Phaser) so it can be tested.
// Backdrops are painted per pixel: a scene computes a continuous colour for each pixel
// (base wood, grain, vignette, light sources) and ordered dithering snaps it to the
// fixed backdrop palette, which is how gradients and glows look in pixel art.

/** Shades of the CLAUDE.md palette. Only the six named colours carry meaning; these are their darker/lighter steps. */
export const SHADES = {
  shadow: 0x0e0b08,
  deep: 0x1c1611,
  wood: PALETTE.carvedWood,
  woodLight: 0x3b3027,
  woodPale: 0x54463a,
  dim: 0x7a6a58,
  light: 0xb3a898,
  white: PALETTE.canopyWhite,
  cyanDeep: 0x1f3a3a,
  cyanMid: 0x3d7d7e,
  cyan: PALETTE.tubeCyan,
  greenDeep: 0x1e3b33,
  greenMid: 0x3c8a74,
  green: PALETTE.rootGreen,
  amberDeep: 0x5a3f22,
  /** Between the two: gold cloth in shadow, gold-brown cloth in the light (Chapter 3's people). */
  amberMid: 0x9c6c34,
  amber: PALETTE.lampAmber,
  /** Reserved like offeringRed: birds and the protagonist only. */
  red: PALETTE.offeringRed,
  redDark: 0x8f1f25,
  /** Between amber and red: the scavenger's copper hair (Chapter 2's protagonist). Reserved like red. */
  copper: 0xd2703a,
  /** Copper in shadow. Reserved like red. */
  copperDeep: 0x8a4026,
  /** The prince's own (Chapter 3's protagonist): a deep, royal wine red, on his collar and sash. Reserved like red. */
  wine: 0x8a2a52,
  /** Wine in shadow. Reserved like red. */
  wineDeep: 0x4e1a32,
  /** Warm fair skin, out in the borderland's daylight (the tree's figures are silhouettes), and its shadow. */
  skinFair: 0xe6c9ac,
  skinFairShade: 0xbf9a7c,
  /** Tanned and dark skin, likewise. */
  skinTan: 0xb98763,
  skinTanShade: 0x8a5f43,
  skinDark: 0x6e4a33,
  skinDarkShade: 0x4a3122,
} as const;

/** Colours a dithered backdrop may use. Red is deliberately absent. */
export const BACKDROP_PALETTE: readonly number[] = [
  SHADES.shadow, SHADES.deep, SHADES.wood, SHADES.woodLight, SHADES.woodPale, SHADES.dim, SHADES.light, SHADES.white,
  SHADES.cyanDeep, SHADES.cyanMid, SHADES.cyan,
  SHADES.greenDeep, SHADES.greenMid, SHADES.green,
  SHADES.amberDeep, SHADES.amber,
];

export type RGB = [number, number, number];

export const rgb = (c: number): RGB => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
export const hexString = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;

/** Adds `light` scaled by `k` to a colour. */
export const addLight = (c: RGB, light: RGB, k: number): RGB => [c[0] + light[0] * k, c[1] + light[1] * k, c[2] + light[2] * k];

/** Soft elliptical falloff: 1 at the centre, ~0 a few radii away. */
export function falloff(x: number, y: number, cx: number, cy: number, rx: number, ry = rx): number {
  return Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2));
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

/** A deterministic random number in [0, 1) for a grid cell (scattering junk, glints, windows). */
export function cellRandom(x: number, y: number, seed = 0): number {
  return (hash(x * 57.31 + y * 113.97 + seed * 7.13) + 1) / 2;
}

/** Smooth, deterministic 1D value noise in [-1, 1]. */
export function noise(x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const k = f * f * (3 - 2 * f);
  return hash(i) * (1 - k) + hash(i + 1) * k;
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** How strongly dithering spreads colours (in 0–255 channel units). */
export const DITHER_STRENGTH = 20;

/** Index of the palette colour closest to c (luminance-weighted). */
export function nearestIndex(palette: readonly RGB[], c: RGB): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const p = palette[i]!;
    const d = (p[0] - c[0]) ** 2 * 0.3 + (p[1] - c[1]) ** 2 * 0.59 + (p[2] - c[2]) ** 2 * 0.11;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/**
 * What a backdrop painter returns for a pixel: an exact palette colour (number), a
 * continuous colour to dither (RGB), or null to leave the pixel transparent.
 */
export type PixelColour = number | RGB | null;

/**
 * Paints a width×height RGBA buffer. Continuous colours are ordered-dithered to `palette`.
 */
export function paintPixels(
  width: number,
  height: number,
  colourAt: (x: number, y: number) => PixelColour,
  palette: readonly number[] = BACKDROP_PALETTE,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(width * height * 4);
  const pal = palette.map(rgb);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = colourAt(x, y);
      if (c === null) continue;
      let colour: RGB;
      if (typeof c === 'number') {
        colour = rgb(c);
      } else {
        const d = (BAYER[y % 4]![x % 4]! / 16 - 0.5) * DITHER_STRENGTH;
        colour = pal[nearestIndex(pal, [c[0] + d, c[1] + d, c[2] + d])]!;
      }
      const i = (y * width + x) * 4;
      out[i] = colour[0];
      out[i + 1] = colour[1];
      out[i + 2] = colour[2];
      out[i + 3] = 255;
    }
  }
  return out;
}
