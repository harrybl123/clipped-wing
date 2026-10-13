import { CAPITAL_CAST, CITIZENS, COUNCILLORS, COURTIERS, GUARDS, SERVANTS, WATCH, type CapitalCastId } from '../../../ui/capitalFolk';
import type { TimeSlot } from '../../../systems/Calendar';
import type { RowSprite } from '../../../ui/sprites';
import type { Person } from '../types';

// Placing the capital's people (Chapter 3) in its areas: the named cast, the citadel's guards, courtiers,
// servants and council, the city watch and city folk, standing or strolling. Where they are by time of day
// is Claude's placeholder until Chapter 3's calendar decides who is where on which day.

export const MORNING: TimeSlot[] = ['morning'];
export const DAY: TimeSlot[] = ['morning', 'afternoon'];
export const AWAKE: TimeSlot[] = ['morning', 'afternoon', 'evening'];
export const LATE: TimeSlot[] = ['evening', 'night'];
export const OPEN_LATE: TimeSlot[] = ['afternoon', 'evening', 'night'];

type Frames = { idle: RowSprite[]; walk: RowSprite[] };

/** One of the named cast, standing (`knot` to talk). */
export const cast = (who: CapitalCastId, x: number, y: number, extra: Partial<Person> = {}): Person => ({
  id: who,
  sprite: CAPITAL_CAST[who].idle[0]!,
  idleFrames: CAPITAL_CAST[who].idle,
  walkFrames: CAPITAL_CAST[who].walk,
  x,
  y,
  ...extra,
});

/** Someone from one of the background groups, standing about (no lines). */
const stander = (group: Frames[]) => (id: string, look: number, x: number, y: number, when?: TimeSlot[], extra: Partial<Person> = {}): Person => ({
  id,
  sprite: group[look]!.idle[0]!,
  idleFrames: group[look]!.idle,
  walkFrames: group[look]!.walk,
  x,
  y,
  when,
  ...extra,
});

/** Someone from one of the background groups, strolling back and forth. */
const stroller = (group: Frames[]) => (id: string, look: number, from: number, to: number, y: number, when?: TimeSlot[]): Person => ({
  id,
  sprite: group[look]!.idle[0]!,
  idleFrames: group[look]!.idle,
  walkFrames: group[look]!.walk,
  x: from + Math.round((to - from) / 3),
  y,
  wander: { from, to },
  when,
});

/** The citadel guard (looks 0–1 with pikes, 2 with a baton). */
export const guard = stander(GUARDS);
export const courtier = stander(COURTIERS);
export const strollingCourtier = stroller(COURTIERS);
export const servant = stander(SERVANTS);
export const strollingServant = stroller(SERVANTS);
export const councillor = stander(COUNCILLORS);
/** The city watch. */
export const watch = stander(WATCH);
export const patrol = stroller(WATCH);
export const citizen = stander(CITIZENS);
export const strollingCitizen = stroller(CITIZENS);
