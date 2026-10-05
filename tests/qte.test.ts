import { describe, expect, it } from 'vitest';
import { BOOST, easeQte, gradeBalance, gradeCarve, gradeDraw, gradeGrip, gradeKey, gradeMash, gradeNote, gradeRing, gradeSide, gradeZone, missReason, pickQte } from '../src/systems/qte';

describe('QTE grading', () => {
  const ring = easeQte({ kind: 'ring', outer: 400, inner: 130, perfect: 60 }, 1, 1000);

  it('ring: only inside the band (the donut) counts; perfect at its inner edge', () => {
    expect(gradeRing(null, ring)).toBe('miss');
    expect(gradeRing(500, ring)).toBe('miss'); // too early
    expect(gradeRing(400, ring)).toBe('good');
    expect(gradeRing(250, ring)).toBe('good');
    expect(gradeRing(180, ring)).toBe('perfect');
    expect(gradeRing(130, ring)).toBe('perfect');
    expect(gradeRing(100, ring)).toBe('miss'); // too late: in the hole
  });

  it('ring: no perfect for those who can’t parry', () => {
    expect(gradeRing(150, easeQte({ kind: 'ring', outer: 400, inner: 130, perfect: 60 }, 1, 1000, false))).toBe('good');
  });

  it('side: away from where the blow comes from, in the band', () => {
    const side = easeQte({ kind: 'side', outer: 400, inner: 130 }, 1, 1000);
    expect(gradeSide(250, 'right', 'left', side)).toBe('good');
    expect(gradeSide(250, 'left', 'left', side)).toBe('miss');
    expect(gradeSide(600, 'right', 'left', side)).toBe('miss');
    expect(gradeSide(250, null, 'left', side)).toBe('miss');
  });

  it('key: the one shown, in time; quick is perfect; the wrong key is a miss', () => {
    const key = easeQte({ kind: 'key', time: 900, quick: 300 }, 1, 1000);
    expect(gradeKey('up', 'up', 200, key)).toBe('perfect');
    expect(gradeKey('up', 'up', 600, key)).toBe('good');
    expect(gradeKey('up', 'up', 950, key)).toBe('miss');
    expect(gradeKey('up', 'left', 200, key)).toBe('miss');
    expect(gradeKey('up', null, null, key)).toBe('miss');
  });

  it('bar and hold: the lit zone is good, the sweet spot perfect', () => {
    const bar = easeQte({ kind: 'bar', time: 1000, zone: [0.6, 0.8], sweet: [0.68, 0.72] }, 1, 1000);
    expect(gradeZone(0.5, bar)).toBe('miss');
    expect(gradeZone(0.62, bar)).toBe('good');
    expect(gradeZone(0.7, bar)).toBe('perfect');
    expect(gradeZone(0.85, bar)).toBe('miss');
    expect(gradeZone(null, bar)).toBe('miss');
  });

  it('notes: the lane’s key, close to the line either side', () => {
    const notes = easeQte({ kind: 'notes', outer: 180, perfect: 70 }, 1, 1000);
    expect(gradeNote('left', 'left', -50, notes)).toBe('perfect');
    expect(gradeNote('left', 'left', 150, notes)).toBe('good');
    expect(gradeNote('left', 'left', -200, notes)).toBe('miss');
    expect(gradeNote('left', 'up', 0, notes)).toBe('miss');
  });

  it('mash: enough presses', () => {
    const mash = easeQte({ kind: 'mash', presses: 8, time: 1500 }, 2, 1000);
    expect(mash.presses).toBe(4);
    expect(gradeMash(4, mash)).toBe('good');
    expect(gradeMash(3, mash)).toBe('miss');
  });

  it('a fight’s ease widens bands and zones, gives longer for keys, never past the lunge', () => {
    expect(easeQte({ kind: 'ring', outer: 250, inner: 50, perfect: 100 }, 2, 1000)).toMatchObject({ outer: 450, inner: 50, perfect: 200, time: 1000 });
    expect(easeQte({ kind: 'ring', outer: 250, inner: 50 }, 3, 300).outer).toBe(300);
    const bar = easeQte({ kind: 'bar', time: 1000, zone: [0.6, 0.8] }, 2, 1000);
    expect(bar.zone[0]).toBeCloseTo(0.5);
    expect(bar.zone[1]).toBeCloseTo(0.9);
    expect(easeQte({ kind: 'key', time: 900 }, 1.5, 1000).time).toBe(1350);
  });

  it('your blow: a miss glances off (60%), good is harder, perfect harder still', () => {
    expect(BOOST).toEqual({ miss: 0.6, good: 1.3, perfect: 1.6 });
  });

  it('a timeout is a miss, never a success', () => {
    const q = easeQte({ kind: 'ring', outer: 400, inner: 130 }, 1, 1000);
    expect(gradeRing(null, q)).toBe('miss');
    expect(gradeZone(null, easeQte({ kind: 'bar', time: 1000, zone: [0.6, 0.8] }, 1, 1000))).toBe('miss');
    expect(gradeKey('up', null, null, easeQte({ kind: 'key', time: 900 }, 1, 1000))).toBe('miss');
    expect(gradeMash(0, easeQte({ kind: 'mash', presses: 6, time: 1500 }, 1, 1000))).toBe('miss');
  });

  it('says why you missed', () => {
    const ring = easeQte({ kind: 'ring', outer: 400, inner: 130 }, 1, 1000);
    expect(missReason(ring, { before: 600 })).toBe('early');
    expect(missReason(ring, { before: 50 })).toBe('late');
    expect(missReason(ring, { before: null })).toBe('slow');
    const bar = easeQte({ kind: 'bar', time: 1000, zone: [0.6, 0.8] }, 1, 1000);
    expect(missReason(bar, { at: 0.3 })).toBe('early');
    expect(missReason(bar, { at: 0.95 })).toBe('late');
    expect(missReason(bar, { at: null })).toBe('slow');
    expect(missReason(bar, { overcharged: true })).toBe('long');
    expect(missReason(easeQte({ kind: 'key', time: 900 }, 1, 1000), { wrongKey: true })).toBe('wrong');
    expect(missReason(easeQte({ kind: 'mash', presses: 6 }, 1, 1000), {})).toBe('weak');
  });

  it('quick draw: after the flash, quickly; any sooner is a miss', () => {
    const draw = easeQte({ kind: 'draw', time: 400, quick: 150 }, 1, 1000);
    expect(gradeDraw(-20, draw)).toBe('miss');
    expect(gradeDraw(100, draw)).toBe('perfect');
    expect(gradeDraw(300, draw)).toBe('good');
    expect(gradeDraw(500, draw)).toBe('miss');
    expect(gradeDraw(null, draw)).toBe('miss');
    expect(missReason(draw, { before: -20 })).toBe('early');
    expect(missReason(draw, { before: null })).toBe('slow');
  });

  it('balance: the share of the time kept in the zone', () => {
    const bal = easeQte({ kind: 'balance', time: 2000, zone: [0.36, 0.64], keep: 0.6, keepPerfect: 0.9 }, 1, 1000);
    expect(gradeBalance(0.95, bal)).toBe('perfect');
    expect(gradeBalance(0.7, bal)).toBe('good');
    expect(gradeBalance(0.4, bal)).toBe('miss');
    expect(gradeBalance(0.95, easeQte({ kind: 'balance', time: 2000, keep: 0.6, keepPerfect: 0.9 }, 1, 1000, false))).toBe('good');
  });

  it('carve: every stroke right, in time; quick is perfect', () => {
    const carve = easeQte({ kind: 'carve', strokes: 3, time: 2400, quick: 1200 }, 1, 1000);
    expect(gradeCarve(3, 3, 900, carve)).toBe('perfect');
    expect(gradeCarve(3, 3, 2000, carve)).toBe('good');
    expect(gradeCarve(2, 3, 900, carve)).toBe('miss');
    expect(gradeCarve(3, 3, 2600, carve)).toBe('miss');
  });

  it('grip: break free in time; quickly is perfect; never is a miss', () => {
    const grip = easeQte({ kind: 'grip', time: 3000, zone: [0.36, 0.64], narrow: 0.16, keep: 0.42, quick: 1800 }, 1, 1000);
    expect(gradeGrip(1500, grip)).toBe('perfect');
    expect(gradeGrip(2500, grip)).toBe('good');
    expect(gradeGrip(null, grip)).toBe('miss');
    expect(missReason(grip, {})).toBe('grip');
    // Eased: the zone ends wider and his tugs are softer.
    const easy = easeQte({ kind: 'grip', time: 3000, narrow: 0.16, tug: 0.5 }, 1.3, 1000);
    expect(easy.narrow).toBeCloseTo(0.208);
    expect(easy.tug).toBeCloseTo(0.5 / 1.3);
  });

  it('never the same kind twice running: a move\u2019s alt stands in', () => {
    const def = { kind: 'ring' as const, alt: { kind: 'bar' as const } };
    expect(pickQte(def, null).kind).toBe('ring');
    expect(pickQte(def, 'key').kind).toBe('ring');
    expect(pickQte(def, 'ring').kind).toBe('bar');
    expect(pickQte({ kind: 'ring' }, 'ring').kind).toBe('ring'); // no alt: it has to repeat
  });
});
