import { CAST, DOG, HOSTESSES, RIVALS, STRAGGLERS, TOWNSFOLK, type CastId } from '../../../ui/borderlandFolk';
import type { TimeSlot } from '../../../systems/Calendar';
import type { Person } from '../types';

// Placing the borderland's people (Chapter 2) in its areas: the named cast, background townsfolk standing
// or strolling, the other clan, the dog. Where they are by time of day is Claude's placeholder until
// Chapter 2's calendar decides who is where on which day.

export const DAY: TimeSlot[] = ['morning', 'afternoon'];
export const AWAKE: TimeSlot[] = ['morning', 'afternoon', 'evening'];
export const LATE: TimeSlot[] = ['evening', 'night'];
export const OPEN_LATE: TimeSlot[] = ['afternoon', 'evening', 'night'];
export const ALWAYS: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night'];

/** One of the named cast, standing (`knot` to talk). */
export const cast = (who: CastId, x: number, y: number, extra: Partial<Person> = {}): Person => ({
  id: who,
  sprite: CAST[who].idle[0]!,
  idleFrames: CAST[who].idle,
  x,
  y,
  ...extra,
});

/** A background townsperson standing about (no lines). */
export const local = (id: string, look: number, x: number, y: number, when?: TimeSlot[], extra: Partial<Person> = {}): Person => ({
  id,
  sprite: TOWNSFOLK[look]!.idle[0]!,
  idleFrames: TOWNSFOLK[look]!.idle,
  x,
  y,
  when,
  ...extra,
});

/** A townsperson strolling back and forth. */
export const stroller = (id: string, look: number, from: number, to: number, y: number, when?: TimeSlot[]): Person => ({
  id,
  sprite: TOWNSFOLK[look]!.idle[0]!,
  idleFrames: TOWNSFOLK[look]!.idle,
  walkFrames: TOWNSFOLK[look]!.walk,
  x: from + Math.round((to - from) / 3),
  y,
  wander: { from, to },
  when,
});

/** One of the other clan, across the rival line. */
export const rival = (id: string, look: number, x: number, y: number, when?: TimeSlot[]): Person => ({
  id,
  sprite: RIVALS[look]!.idle[0]!,
  idleFrames: RIVALS[look]!.idle,
  x,
  y,
  when,
  flipX: true, // facing across the line, at us
});

/** The dog. */
export const dog = (x: number, y: number, extra: Partial<Person> = {}): Person => ({
  id: 'dog',
  sprite: DOG.idle[0]!,
  idleFrames: DOG.idle,
  x,
  y,
  ...extra,
});

/** One of the brothel's hostesses. */
export const hostess = (id: string, look: number, x: number, y: number, when?: TimeSlot[], extra: Partial<Person> = {}): Person => ({
  id,
  sprite: HOSTESSES[look]!.idle[0]!,
  idleFrames: HOSTESSES[look]!.idle,
  x,
  y,
  when,
  ...extra,
});

/** A straggler from elsewhere (Chapter 2, Day 1), there only while the story has them (`showIf`). */
export const straggler = (id: string, look: number, x: number, y: number, showIf: string, extra: Partial<Person> = {}): Person => ({
  id,
  sprite: STRAGGLERS[look]!.idle[0]!,
  idleFrames: STRAGGLERS[look]!.idle,
  x,
  y,
  showIf,
  ...extra,
});
