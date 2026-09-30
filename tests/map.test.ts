import { describe, expect, it } from 'vitest';
import { PLANNED_AREAS } from '../src/data/areas';
import { MAP_LINKS, MAP_PLACES, MAP_TUBE_X, neighbourInDirection, treeHalfWidth, type MapPlace } from '../src/data/map';

const place = (id: string) => MAP_PLACES.find((p) => p.id === id)!;

describe('map layout', () => {
  it('has every planned area exactly once', () => {
    expect(MAP_PLACES.map((p) => p.id).sort()).toEqual(Object.keys(PLANNED_AREAS).sort());
  });

  it('keeps places on screen and apart from each other', () => {
    for (const p of MAP_PLACES) {
      expect(p.x > 8 && p.x < 472 && p.y > 8 && p.y < 256, p.id).toBe(true);
      for (const q of MAP_PLACES) if (q !== p) expect(Math.hypot(p.x - q.x, p.y - q.y), `${p.id}–${q.id}`).toBeGreaterThan(18);
    }
  });

  it('puts every place inside the tree, clear of its edge', () => {
    for (const p of MAP_PLACES) {
      // The outline wobbles by up to 5px, so leave a margin beyond that.
      expect(Math.abs(p.x - MAP_TUBE_X) + 12, p.id).toBeLessThan(treeHalfWidth(p.y));
    }
  });

  it('links only places that exist', () => {
    const ids = new Set(MAP_PLACES.map((p) => p.id));
    for (const l of MAP_LINKS) expect(ids.has(l.from) && ids.has(l.to), `${l.from}–${l.to}`).toBe(true);
  });

  it('follows the tree from top to bottom: upper branches, trunk, roots, beneath', () => {
    const avg = (level: MapPlace['level']) => {
      const ys = MAP_PLACES.filter((p) => p.level === level).map((p) => p.y);
      return ys.reduce((a, b) => a + b, 0) / ys.length;
    };
    expect(avg('upper branches')).toBeLessThan(avg('trunk'));
    expect(avg('trunk')).toBeLessThan(avg('roots'));
    expect(avg('roots')).toBeLessThan(avg('beneath'));
  });
});

describe('neighbourInDirection', () => {
  it('moves to the nearest place roughly in the pressed direction', () => {
    expect(neighbourInDirection(place('offering-floor'), 0, -1)?.level).not.toBe('beneath');
    expect(neighbourInDirection(place('offering-floor'), 1, 0)?.x).toBeGreaterThan(place('offering-floor').x);
    expect(neighbourInDirection(place('offering-floor'), -1, 0)?.x).toBeLessThan(place('offering-floor').x);
  });

  it('prefers places straight ahead over nearer diagonal ones', () => {
    // From home, right stays in the roots rather than dropping to the lower roots below.
    expect(neighbourInDirection(place('home'), 1, 0)?.level).toBe('roots');
    expect(neighbourInDirection(place('home'), 0, 1)?.id).toBe('lower-roots');
  });

  it('returns null when nothing lies that way', () => {
    const lone: MapPlace = { id: 'a', x: 0, y: 0, level: 'roots', light: 'amber' };
    const other: MapPlace = { id: 'b', x: 10, y: 0, level: 'roots', light: 'amber' };
    expect(neighbourInDirection(lone, -1, 0, [lone, other])).toBeNull();
    expect(neighbourInDirection(lone, 1, 0, [lone, other])).toBe(other);
  });

  it('can reach every place from the offering floor by pressing directions', () => {
    const seen = new Set<string>(['offering-floor']);
    const queue = [place('offering-floor')];
    while (queue.length) {
      const p = queue.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const n = neighbourInDirection(p, dx, dy);
        if (n && !seen.has(n.id)) {
          seen.add(n.id);
          queue.push(n);
        }
      }
    }
    expect([...seen].sort()).toEqual(MAP_PLACES.map((p) => p.id).sort());
  });
});
