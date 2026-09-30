import { describe, expect, it } from 'vitest';
import { heartwoodSolids } from '../src/data/areas/tunnels';

describe('heartwoodSolids', () => {
  const solids = heartwoodSolids([{ x: 8, y: 8, width: 32, height: 16 }], 48, 32);
  const solidAt = (x: number, y: number) => solids.some((s) => x >= s.x && x < s.x + s.width && y >= s.y && y < s.y + s.height);

  it('fills everything outside the tunnels and nothing inside', () => {
    expect(solidAt(20, 12)).toBe(false);
    expect(solidAt(4, 12)).toBe(true);
    expect(solidAt(20, 28)).toBe(true);
    expect(solidAt(44, 4)).toBe(true);
  });

  it('puts the floor exactly at the bottom of the tunnel', () => {
    expect(solids.some((s) => s.y === 24 && s.x <= 8 && s.x + s.width >= 40)).toBe(true);
  });

  it('merges runs into a few invisible blocks', () => {
    expect(solids.length).toBeLessThanOrEqual(4);
    expect(solids.every((s) => s.invisible)).toBe(true);
  });
});
