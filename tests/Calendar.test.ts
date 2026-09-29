import { describe, expect, it } from 'vitest';
import { AFTERNOON_ACTIONS_PER_DAY, Calendar } from '../src/systems/Calendar';

function at(day: Calendar['day'], slot: Calendar['slot']): Calendar {
  return new Calendar({ day, slot, afternoonActionsUsed: 0 });
}

describe('Calendar', () => {
  it('starts on the prologue morning', () => {
    const c = new Calendar();
    expect([c.day, c.slot]).toEqual(['prologue', 'morning']);
  });

  it('advances through the slots, then to the next morning', () => {
    const c = new Calendar();
    const seen: string[] = [];
    for (let i = 0; i < 5; i++) {
      c.advance();
      seen.push(`${c.day}:${c.slot}`);
    }
    expect(seen).toEqual(['prologue:afternoon', 'prologue:evening', 'prologue:night', '1:morning', '1:afternoon']);
  });

  it('stops at night on day 7', () => {
    const c = at(7, 'evening');
    expect(c.advance()).toBe(true);
    expect(c.isLastSlot).toBe(true);
    expect(c.advance()).toBe(false);
    expect([c.day, c.slot]).toEqual([7, 'night']);
  });

  it('walks the whole week in 31 steps', () => {
    const c = new Calendar();
    let steps = 0;
    while (c.advance()) steps++;
    expect(steps).toBe(8 * 4 - 1);
  });

  it(`allows ${AFTERNOON_ACTIONS_PER_DAY} afternoon actions on normal days`, () => {
    const c = at(2, 'afternoon');
    expect(c.afternoonActionsLeft).toBe(2);
    expect(c.takeAfternoonAction()).toBe(true);
    expect(c.takeAfternoonAction()).toBe(true);
    expect(c.afternoonActionsLeft).toBe(0);
    expect(c.canTakeAfternoonAction()).toBe(false);
    expect(c.takeAfternoonAction()).toBe(false);
  });

  it('allows unlimited afternoon actions on day 1', () => {
    const c = at(1, 'afternoon');
    for (let i = 0; i < 20; i++) expect(c.takeAfternoonAction()).toBe(true);
    expect(c.afternoonActionsLeft).toBe(Infinity);
  });

  it('only allows afternoon actions in the afternoon', () => {
    const c = at(3, 'morning');
    expect(c.canTakeAfternoonAction()).toBe(false);
    expect(c.takeAfternoonAction()).toBe(false);
  });

  it('resets afternoon actions on a new day', () => {
    const c = at(2, 'afternoon');
    c.takeAfternoonAction();
    c.takeAfternoonAction();
    c.advance(); // evening
    c.advance(); // night
    c.advance(); // day 3 morning
    c.advance(); // day 3 afternoon
    expect(c.afternoonActionsLeft).toBe(2);
  });

  it('round-trips through JSON', () => {
    const c = at(4, 'afternoon');
    c.takeAfternoonAction();
    const restored = Calendar.fromJSON(JSON.parse(JSON.stringify(c)));
    expect(restored.toJSON()).toEqual({ day: 4, slot: 'afternoon', afternoonActionsUsed: 1 });
  });

  it.each([null, 'x', {}, { day: 8, slot: 'morning', afternoonActionsUsed: 0 }, { day: 1, slot: 'dawn', afternoonActionsUsed: 0 }, { day: 1, slot: 'night', afternoonActionsUsed: -1 }, { day: 1, slot: 'night', afternoonActionsUsed: 1.5 }])(
    'rejects invalid saved state %j',
    (data) => {
      expect(() => Calendar.fromJSON(data)).toThrow('invalid saved state');
    },
  );
});
