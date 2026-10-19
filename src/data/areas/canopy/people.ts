import { ASCENDED, CANOPY_CAST, CANOPY_FOLK, GIRL_DAY, type CanopyCastId } from '../../../ui/canopyFolk';
import type { TimeSlot } from '../../../systems/Calendar';
import type { RowSprite } from '../../../ui/sprites';
import type { Person } from '../types';

// Placing the canopy's people (Chapter 4) in its areas: the colony's named people, its folk and the
// ascended, standing or strolling. Where the named people are by time of day is Claude's placeholder until
// the chapter's story runs (`c4_story`); then the day's people take over (`inStory`, `guide`, `girl`). The
// folk and the ascended stay, by time of day, so the canopy's never empty.

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

/**
 * One of the colony's named people where the story has them (Chapter 4's days): there while `showIf` holds
 * (usually a day's stage: `c4day1=look`), at any time of day. Their own `id`, so the placeholder's and the
 * story's can share an area.
 */
export const inStory = (id: string, who: CanopyCastId, x: number, y: number, showIf: string, knot: string, extra: Partial<Person> = {}): Person => ({
  ...colonist(id, who, x, y, undefined, { knot }),
  hideIf: undefined,
  showIf,
  ...extra,
});

/** Whoever brought you somewhere (`c4_guide`), standing by: the master up the tube, the hunter out of the rot. */
export const guide = (who: 'master' | 'hunter', x: number, y: number): Person => inStory(`${who}-guide`, who, x, y, `c4_guide=${who}`, `c4day1_${who}_guide`);

/** The master showing you round in the afternoon (each stop's knot puts her beside you). */
export const masterTour = (x: number, y: number): Person => inStory('master-tour', 'master', x, y, 'c4_guide=master', 'c4day1_master_tour');

/** The girl in colour, if she's with you (you fell after framing her): there while `showIf` holds. */
export const girl = (id: string, x: number, y: number, showIf: string, knot: string, extra: Partial<Person> = {}): Person => ({
  id,
  sprite: GIRL_DAY.idle[0]!,
  idleFrames: GIRL_DAY.idle,
  walkFrames: GIRL_DAY.walk,
  x,
  y,
  knot,
  speaker: 'girl',
  turns: true,
  showIf,
  ...extra,
});

/** The girl walking with you. */
export const girlGuide = (x: number, y: number): Person => ({ ...girl('girl-guide', x, y, 'c4_girl=follows', 'c4day1_girl_guide'), follow: true });
