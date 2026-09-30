import { describe, expect, it } from 'vitest';
import { MUM, PROTAGONIST } from '../src/ui/characters';
import { SHADES } from '../src/ui/pixelArt';
import type { RowSprite } from '../src/ui/sprites';

const frames: [string, RowSprite][] = [
  ...PROTAGONIST.idle.map((f, i) => [`idle ${i}`, f] as [string, RowSprite]),
  ...PROTAGONIST.walk.map((f, i) => [`walk ${i}`, f] as [string, RowSprite]),
  ['jump', PROTAGONIST.jump],
  ['fall', PROTAGONIST.fall],
];

describe('character sprites', () => {
  it('gives every protagonist frame the same size, with well-formed rows', () => {
    for (const [name, f] of frames) {
      expect(f.rows.length, name).toBe(26);
      expect(new Set(f.rows.map((r) => r.length)), name).toEqual(new Set([12]));
    }
  });

  it('stands the protagonist on the bottom row in every grounded frame', () => {
    for (const [name, f] of frames.filter(([n]) => n !== 'jump')) expect(f.rows.at(-1), name).toMatch(/[^.]/);
  });

  it('includes the red thread and the bandaged hand in every frame', () => {
    for (const [name, f] of frames) {
      const pixels = f.rows.join('');
      expect(pixels, name).toContain('r');
      expect(pixels, name).toContain('h');
      expect(f.colours.r).toBe(SHADES.red);
    }
  });

  it('keeps red off Mum', () => {
    for (const f of MUM.idle) {
      expect(Object.values(f.colours)).not.toContain(SHADES.red);
      expect(new Set(f.rows.map((r) => r.length)).size).toBe(1);
    }
  });
});
