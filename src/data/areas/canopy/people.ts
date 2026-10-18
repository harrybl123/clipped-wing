import { ASCENDED, CANOPY_CAST, CANOPY_FOLK, type CanopyCastId } from '../../../ui/canopyFolk';
import type { TimeSlot } from '../../../systems/Calendar';
import type { RowSprite } from '../../../ui/sprites';
import type { Person } from '../types';

// Placing the canopy's people (Chapter 4) in its areas: the colony's named people, its folk and the
// ascended, standing or strolling. Where they are by time of day is Claude's placeholder until the
// chapter's story decides who is where on which day; once it runs (`c4_story`), the day's people take over.

export const MORNING: TimeSlot[] = ['morning'];
export const DAY: TimeSlot[] = ['morning', 'afternoon'];
export const AWAKE: TimeSlot[] = ['morning', 'afternoon', 'evening'];
export const LATE: TimeSlot[] = ['evening', 'night'];

type Frames = { idle: RowSprite[]; walk: RowSprite[] };

/** One of the colony's named people, standing (talk: `c4_<who>`), where the placeholder schedule puts them. */
export const colonist = (id: string, who: CanopyCastId, x: number, y: number, when?: TimeSlot[], extra: Partial<Person> = {}): Person => ({
  id,
  sprite: CANOPY_CAST[who].idle[0]!,
  idleFrames: CANOPY_CAST[who].idle,
  walkFrames: CANOPY_CAST[who].walk,
  x,
  y,
  knot: `c4_${who}`,
  speaker: who,
  turns: true,
  when,
  hideIf: 'c4_story',
  ...extra,
});

/** Someone from a background group, standing about; everyone can be talked to (a place's shared `knot`, `#speaker:them`). */
const stander = (group: Frames[], name: string) => (id: string, look: number, x: number, y: number, knot: string, when?: TimeSlot[], extra: Partial<Person> = {}): Person => ({
  id,
  sprite: group[look]!.idle[0]!,
  idleFrames: group[look]!.idle,
  walkFrames: group[look]!.walk,
  x,
  y,
  knot,
  speaker: `c4_${name}_${look}`,
  turns: true,
  when,
  hideIf: 'c4_story',
  ...extra,
});

/** Someone from a background group, strolling back and forth (they stop when you talk to them). */
const stroller = (group: Frames[], name: string) => (id: string, look: number, from: number, to: number, y: number, knot: string, when?: TimeSlot[], extra: Partial<Person> = {}): Person => ({
  ...stander(group, name)(id, look, from + Math.round((to - from) / 3), y, knot, when, extra),
  wander: { from, to },
});

export const folk = stander(CANOPY_FOLK, 'folk');
export const strollingFolk = stroller(CANOPY_FOLK, 'folk');
export const ascended = stander(ASCENDED, 'ascended');
export const strollingAscended = stroller(ASCENDED, 'ascended');
