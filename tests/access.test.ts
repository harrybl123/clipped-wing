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

  it('holds the same places back on Day 2, and keeps the climb and the gate shut', () => {
    for (const id of ['home', 'offering-floor', 'roots-market', 'friends-home', 'tenders-shrine']) expect(isAreaOpen(id, 2, 'afternoon'), id).toBe(true);
    for (const id of ['back-routes', 'lower-roots', 'archive', 'trunk-climb', 'ascension-gate']) expect(isAreaOpen(id, 2, 'night'), id).toBe(false);
  });

  it('on Day 4, opens the back routes, keeps the lower roots for after dark, and watches your front door at night', () => {
    expect(isAreaOpen('back-routes', 4, 'morning')).toBe(true);
    expect(isAreaOpen('lower-roots', 4, 'afternoon')).toBe(false);
    expect(isAreaOpen('lower-roots', 4, 'night')).toBe(true);
    expect(isAreaOpen('offering-floor', 4, 'evening')).toBe(true);
    expect(closedReason('offering-floor', 4, 'night')).toMatch(/watching your door/);
    expect(nextHop('home', 'lower-roots', AREAS, (id) => isAreaOpen(id, 4, 'night'))).toBe('back-routes');
  });

  it('on Day 5, takes you up in the afternoon, and up the trunk to the archive at night', () => {
    expect(isAreaOpen('middle-tiers', 5, 'morning')).toBe(false);
    expect(isAreaOpen('upper-halls', 5, 'afternoon')).toBe(true);
    expect(isAreaOpen('archive', 5, 'night')).toBe(true);
    expect(nextHop('home', 'archive', AREAS, (id) => isAreaOpen(id, 5, 'night'))).toBe('back-routes');
    expect(nextHop('home', 'lower-roots', AREAS, (id) => isAreaOpen(id, 5, 'night'))).toBe('back-routes');
  });

  it('on Day 7, keeps you off the floor, opens the back ways for goodbyes, and the chase goes the long way to the top', () => {
    expect(isAreaOpen('offering-floor', 7, 'afternoon')).toBe(false);
    expect(isAreaOpen('archive', 7, 'afternoon')).toBe(true);
    expect(nextHop('home', 'archive', AREAS, (id) => isAreaOpen(id, 7, 'afternoon'))).toBe('back-routes');
    const night = (id: string) => isAreaOpen(id, 7, 'night');
    expect(nextHop('home', 'ascension-gate', AREAS, night)).toBe('back-routes');
    expect(nextHop('tenders-shrine', 'ascension-gate', AREAS, night)).toBe('trunk-climb');
    expect(nextHop('trunk-climb', 'ascension-gate', AREAS, night)).toBe('middle-tiers');
    expect(nextHop('upper-halls', 'ascension-gate', AREAS, night)).toBe('ascension-gate');
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
