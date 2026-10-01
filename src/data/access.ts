import type { Day, TimeSlot } from '../systems/Calendar';

// Which areas you can go to, and when. Some are held back so the tree opens up as the story goes
// (the designer: "we don't have to introduce all the areas at once"). Scripted travel (e.g. going up
// to the Ascension) ignores this. Pure data, unit-tested; later days are still to be decided.

/** Held back until the story reaches them (Days 1 and 2). */
const HELD_BACK: Record<string, string> = {
  'back-routes': "You don't know any way into the back routes.",
  'lower-roots': 'Nobody goes down to the lower roots without a reason.',
  'middle-tiers': 'The way up is guarded. Roots folk only go up when they are sent for.',
  'upper-halls': 'The upper halls are no place for someone from the roots.',
  archive: 'The archive is for the upper branches.',
  'seed-grove': 'The seed grove is for the upper branches.',
};

/** Areas that are closed on a given day, with the line shown if you try to go. */
const CLOSED: Partial<Record<Day, Record<string, string>>> = {
  1: {
    ...HELD_BACK,
    'ascension-gate': 'Everyone goes up together, for the Ascension this evening.',
    'trunk-climb': 'Not now. The climb is for tonight, to watch the lights.',
  },
  2: {
    ...HELD_BACK,
    'ascension-gate': 'The gate is only opened for an Ascension.',
    'trunk-climb': "There's no reason to climb today.",
  },
};

/** Areas that open at particular times on a day that otherwise keeps them closed. */
const OPENS_AT: Partial<Record<Day, Record<string, TimeSlot[]>>> = {
  1: { 'trunk-climb': ['night'] },
};

/** Why you can't go to `areaId` right now, or null if you can. */
export function closedReason(areaId: string, day: Day, slot: TimeSlot): string | null {
  const reason = CLOSED[day]?.[areaId];
  if (!reason) return null;
  if (OPENS_AT[day]?.[areaId]?.includes(slot)) return null;
  return reason;
}

export const isAreaOpen = (areaId: string, day: Day, slot: TimeSlot) => closedReason(areaId, day, slot) === null;
