import { describe, expect, it } from 'vitest';
import { closedReason, isAreaOpen } from '../src/data/access';
import { AREAS } from '../src/data/areas';
import { nextHop } from '../src/data/route';

describe('area access', () => {
  it('keeps the roots you know open on Day 1 and holds the rest back', () => {
    for (const id of ['home', 'offering-floor', 'roots-market', 'friends-home', 'tenders-shrine']) expect(isAreaOpen(id, 1, 'morning'), id).toBe(true);
    for (const id of ['back-routes', 'lower-roots', 'archive', 'seed-grove', 'upper-halls']) expect(isAreaOpen(id, 1, 'afternoon'), id).toBe(false);
  });

  it('opens the trunk climb on the first night only', () => {
    expect(isAreaOpen('trunk-climb', 1, 'afternoon')).toBe(false);
    expect(isAreaOpen('trunk-climb', 1, 'night')).toBe(true);
  });

  it('gives a line to show when an area is closed', () => {
    expect(closedReason('back-routes', 1, 'morning')).toMatch(/back routes/);
    expect(closedReason('home', 1, 'morning')).toBeNull();
  });
});

describe('routes between areas', () => {
  it('finds the next door on the way, avoiding areas that are closed', () => {
    const day1 = (id: string) => isAreaOpen(id, 1, 'afternoon');
    expect(nextHop('home', 'friends-home', AREAS, day1)).toBe('offering-floor');
    expect(nextHop('offering-floor', 'friends-home', AREAS, day1)).toBe('roots-market');
    expect(nextHop('tenders-shrine', 'trunk-climb', AREAS, day1)).toBe('trunk-climb');
    expect(nextHop('home', 'friends-home', AREAS)).toBe('back-routes'); // shorter, if the back routes were open
  });

  it('returns null when already there', () => {
    expect(nextHop('home', 'home', AREAS)).toBeNull();
  });
});
