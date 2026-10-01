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

/** A copy of `reasons` with some areas left out (opened). */
const without = (reasons: Record<string, string>, ...ids: string[]) => Object.fromEntries(Object.entries(reasons).filter(([id]) => !ids.includes(id)));

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
  3: {
    ...HELD_BACK,
    'friends-home': 'His family has forbidden you from coming near.',
    'ascension-gate': 'The gate is only opened for an Ascension.',
    'trunk-climb': "There's no reason to climb today.",
  },
  // Day 4: you know the back routes now. The lower roots wait for dark (the girl: "Come after dark"), and
  // at night your house is watched, so the front door is out.
  4: {
    ...without(HELD_BACK, 'back-routes'),
    'lower-roots': 'Not in daylight. She said to come after dark.',
    'friends-home': 'His family has forbidden you from coming near.',
    'ascension-gate': 'The gate is only opened for an Ascension.',
    'trunk-climb': "There's no reason to climb today.",
    'offering-floor': 'Across the way, a man with a lamp is watching your door. Not that way.',
  },
  // Day 5: summoned upward in the afternoon (the archivist's token), and at night the archive's back
  // hatch, through the trunk climb. The lower roots are open now; your front door is still watched at night.
  5: {
    ...without(HELD_BACK, 'back-routes', 'lower-roots'),
    'middle-tiers': 'The way up is guarded. Not without being sent for.',
    'upper-halls': 'The upper halls are no place for someone from the roots.',
    archive: 'The archive is for the upper branches.',
    'friends-home': 'His family has forbidden you from coming near.',
    'ascension-gate': 'The gate is only opened for an Ascension.',
    'trunk-climb': "There's no reason to climb today.",
    'offering-floor': 'Across the way, a man with a lamp is watching your door. Not that way.',
  },
  // Day 6: the lower roots and back routes are yours (in your cloak); the upper branches are shut again.
  6: {
    ...without(HELD_BACK, 'back-routes', 'lower-roots'),
    'friends-home': 'His family has forbidden you from coming near.',
    'ascension-gate': 'The gate is only opened for an Ascension.',
    'trunk-climb': "There's no reason to climb today.",
    'offering-floor': 'Across the way, a man with a lamp is watching your door. Not that way.',
  },
};

/** Areas that open at particular times on a day that otherwise keeps them closed. */
const OPENS_AT: Partial<Record<Day, Record<string, TimeSlot[]>>> = {
  1: { 'trunk-climb': ['night'] },
  // Day 3: the girl shows you the way down after the morning rite.
  3: { 'lower-roots': ['afternoon', 'evening', 'night'], 'back-routes': ['afternoon', 'evening', 'night'] },
  4: { 'lower-roots': ['night'], 'offering-floor': ['morning', 'afternoon', 'evening'] },
  6: { 'offering-floor': ['morning', 'afternoon', 'evening'] },
  5: { 'middle-tiers': ['afternoon'], 'upper-halls': ['afternoon'], 'trunk-climb': ['night'], archive: ['night'], 'offering-floor': ['morning', 'afternoon', 'evening'] },
};

/** Why you can't go to `areaId` right now, or null if you can. */
export function closedReason(areaId: string, day: Day, slot: TimeSlot): string | null {
  const reason = CLOSED[day]?.[areaId];
  if (!reason) return null;
  if (OPENS_AT[day]?.[areaId]?.includes(slot)) return null;
  return reason;
}

export const isAreaOpen = (areaId: string, day: Day, slot: TimeSlot) => closedReason(areaId, day, slot) === null;
