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

/**
 * One of the named cast, standing (`knot` to talk), where Claude's placeholder schedule puts them, for
 * wandering the capital outside the story (`?area=`). Once Chapter 3's story is running (`c3_story`), the
 * day's own people take over (`inStory`), so the screen matches the text. They turn to face you when you talk.
 */
export const cast = (who: CapitalCastId, x: number, y: number, extra: Partial<Person> = {}): Person => ({
  id: who,
  sprite: CAPITAL_CAST[who].idle[0]!,
  idleFrames: CAPITAL_CAST[who].idle,
  walkFrames: CAPITAL_CAST[who].walk,
  x,
  y,
  speaker: who,
  turns: true,
  hideIf: 'c3_story',
  ...extra,
});

/**
 * One of the named cast where the story has them (Chapter 3's days): there while `showIf` holds (usually
 * a day's stage: `c3day1=audience,after`), at any time of day unless `when` says otherwise. Their own `id`,
 * so the placeholder's and the story's can share an area.
 */
export const inStory = (id: string, who: CapitalCastId, x: number, y: number, showIf: string, extra: Partial<Person> = {}): Person => ({
  ...cast(who, x, y),
  id,
  showIf,
  hideIf: undefined,
  ...extra,
});

/**
 * Someone from one of the background groups, standing about. Everyone in the capital can be talked to
 * (designer): `knot` is usually shared by several people (a place's guards, its courtiers, its folk), and
 * its lines say `#speaker:them`, so each speaks with their own face (`c3_<group>_<look>`).
 */
const stander = (group: Frames[], name: string) => (id: string, look: number, x: number, y: number, knot: string, when?: TimeSlot[], extra: Partial<Person> = {}): Person => ({
  id,
  sprite: group[look]!.idle[0]!,
  idleFrames: group[look]!.idle,
  walkFrames: group[look]!.walk,
  x,
  y,
  knot,
  speaker: `c3_${name}_${look}`,
  turns: true,
  when,
  ...extra,
});

/** Someone from one of the background groups, strolling back and forth (they stop when you talk to them). */
const stroller = (group: Frames[], name: string) => (id: string, look: number, from: number, to: number, y: number, knot: string, when?: TimeSlot[]): Person => ({
  id,
  sprite: group[look]!.idle[0]!,
  idleFrames: group[look]!.idle,
  walkFrames: group[look]!.walk,
  x: from + Math.round((to - from) / 3),
  y,
  wander: { from, to },
  knot,
  speaker: `c3_${name}_${look}`,
  turns: true,
  when,
});

/** The citadel guard (looks 0–1 with pikes, 2 with a baton). */
export const guard = stander(GUARDS, 'guard');
export const courtier = stander(COURTIERS, 'courtier');
export const strollingCourtier = stroller(COURTIERS, 'courtier');
export const servant = stander(SERVANTS, 'servant');
export const strollingServant = stroller(SERVANTS, 'servant');
export const councillor = stander(COUNCILLORS, 'councillor');
/** The city watch. */
export const watch = stander(WATCH, 'watch');
export const patrol = stroller(WATCH, 'watch');
export const citizen = stander(CITIZENS, 'citizen');
export const strollingCitizen = stroller(CITIZENS, 'citizen');
