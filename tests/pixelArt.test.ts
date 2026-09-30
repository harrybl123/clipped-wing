import { describe, expect, it } from 'vitest';
import { BACKDROP_PALETTE, falloff, nearestIndex, noise, paintPixels, rgb, SHADES } from '../src/ui/pixelArt';

describe('pixel art helpers', () => {
  it('keeps red out of backdrops', () => {
    expect(BACKDROP_PALETTE).not.toContain(SHADES.red);
    expect(BACKDROP_PALETTE).not.toContain(SHADES.redDark);
  });

  it('dithers continuous colours to palette colours only', () => {
    const allowed = new Set(BACKDROP_PALETTE.map((c) => rgb(c).join()));
    const pixels = paintPixels(16, 16, (x, y) => [x * 16, y * 16, (x + y) * 8]);
    for (let i = 0; i < pixels.length; i += 4) {
      expect(allowed.has([pixels[i], pixels[i + 1], pixels[i + 2]].join())).toBe(true);
      expect(pixels[i + 3]).toBe(255);
    }
  });

  it('passes exact colours through and leaves null transparent', () => {
    const pixels = paintPixels(2, 1, (x) => (x === 0 ? SHADES.red : null));
    expect([...pixels]).toEqual([...rgb(SHADES.red), 255, 0, 0, 0, 0]);
  });

  it('dithers a mid-tone into a mix of neighbouring shades', () => {
    const [a, b] = [rgb(SHADES.wood), rgb(SHADES.woodLight)];
    const mid = a.map((v, i) => (v + b[i]!) / 2) as [number, number, number];
    const pixels = paintPixels(4, 4, () => mid);
    const colours = new Set<string>();
    for (let i = 0; i < pixels.length; i += 4) colours.add([pixels[i], pixels[i + 1], pixels[i + 2]].join());
    expect(colours).toEqual(new Set([a.join(), b.join()]));
  });

  it('finds the nearest palette colour', () => {
    const palette = [rgb(0x000000), rgb(0xffffff)];
    expect(nearestIndex(palette, [20, 20, 20])).toBe(0);
    expect(nearestIndex(palette, [230, 230, 230])).toBe(1);
  });

  it('has deterministic noise in [-1, 1] and a unit falloff peak', () => {
    const samples = Array.from({ length: 500 }, (_, i) => noise(i * 0.37));
    expect(samples.every((n) => n >= -1 && n <= 1)).toBe(true);
    expect(noise(12.3)).toBe(noise(12.3));
    expect(falloff(5, 5, 5, 5, 10)).toBe(1);
    expect(falloff(50, 5, 5, 5, 10)).toBeLessThan(0.001);
  });
});
