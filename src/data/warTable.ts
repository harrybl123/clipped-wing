import type { Squad, WarBoard, WarSide } from '../systems/WarTable';

// The war table's boards and scenarios (Chapter 3; docs/sequences/chapter-3/plan.md, "The war table"). The
// rules are src/systems/WarTable.ts; WarTableScene runs them. Numbers are a first pass, to playtest.

/**
 * The capital as the board (designer): the city side-on, as on the map (src/data/capitalMap.ts), its places
 * where the map has them. The citadel at the top, held at +1; the lifts down the city's face at three
 * levels (any station to any other in one move); the promenade and the data centre in the middle; the low
 * district at the bottom in two halves; the gate.
 */
export const CAPITAL_BOARD: WarBoard = {
  places: [
    { id: 'citadel', name: 'The citadel', x: 240, y: 70, level: 4, stronghold: true },
    { id: 'lift_top', name: 'The top lifts', x: 262, y: 106, level: 3, lift: true },
    { id: 'promenade', name: 'The promenade', x: 184, y: 160, level: 2 },
    { id: 'lift_mid', name: 'The middle lifts', x: 262, y: 146, level: 2, lift: true },
    { id: 'data', name: 'The data centre', x: 330, y: 156, level: 2 },
    { id: 'gate', name: 'The gate', x: 84, y: 214, level: 1 },
    { id: 'low_west', name: 'The low district (west)', x: 196, y: 222, level: 1 },
    { id: 'lift_low', name: 'The bottom lifts', x: 262, y: 196, level: 1, lift: true },
    { id: 'low_east', name: 'The low district (east)', x: 324, y: 222, level: 1 },
  ],
  ways: [
    { a: 'citadel', b: 'lift_top', kind: 'hall' },
    { a: 'citadel', b: 'promenade', kind: 'stair' },
    { a: 'promenade', b: 'lift_mid', kind: 'street' },
    { a: 'lift_mid', b: 'data', kind: 'street' },
    { a: 'promenade', b: 'gate', kind: 'stair' },
    { a: 'promenade', b: 'low_west', kind: 'stair' },
    { a: 'data', b: 'low_east', kind: 'stair' },
    { a: 'gate', b: 'low_west', kind: 'street' },
    { a: 'low_west', b: 'lift_low', kind: 'street' },
    { a: 'lift_low', b: 'low_east', kind: 'street' },
  ],
};

export interface WarScenario {
  id: string;
  board: WarBoard;
  /** The lesson: where everyone starts. */
  squads: Squad[];
  owner: Record<string, WarSide>;
  /**
   * The lesson's goals, one after another (designer: make it longer): take this place; his line before it
   * (what to do, and what it teaches) and after it, if any.
   */
  goals: { place: string; start: string; done?: string }[];
  /** Places he never leaves in the lesson (the ones you're meant to take). */
  keep: string[];
  /** Fights you can go down to yourself: the place, and the fight (src/data/combat.ts). */
  dropIn: Record<string, string>;
  /** After this many turns of the lesson, he moves on anyway. */
  lessonTurns: number;
  /**
   * When he turns it on (designer: obvious, and you can only lose, but a fair fight you're out-thought in, not
   * a flood of troops): the table set up again as the city really is, the same rules, one move each, no
   * arrows; you're told to take the citadel, which the numbers never allow; he plays to win.
   */
  now: { squads: Squad[]; owner: Record<string, WarSide>; goal: string; turns: number };
  /** The story's lines (ink knots) as it goes, and the knot played back in the area afterwards. */
  knots: { intro: string; dropIn: string; good: string; now: string; end: string; after: string };
}

/**
 * Day 2, the simulation room: "A district rises." (plan). He gives you the rising (the low district's people,
 * many and weak) and takes the guard himself. The lesson, his orders shown as arrows: take the middle lifts
 * (and read his arrow: he's going for them too; a tie, the defenders hold), then the data centre (two of his:
 * join yours up first), then the promenade (three: he marks it for you to go down to yourself). Then "Now.":
 * the city as it is, the guard holding the lifts and the citadel, and you told to take the citadel.
 */
export const LESSON: WarScenario = {
  id: 'lesson',
  board: CAPITAL_BOARD,
  squads: [
    { id: 'r1', side: 'you', place: 'low_west', strength: 2 },
    { id: 'r2', side: 'you', place: 'low_east', strength: 2 },
    { id: 'r3', side: 'you', place: 'gate', strength: 2 },
    { id: 'r4', side: 'you', place: 'lift_low', strength: 2 },
    { id: 'g1', side: 'him', place: 'citadel', strength: 4 },
    { id: 'g2', side: 'him', place: 'promenade', strength: 3 },
    { id: 'g3', side: 'him', place: 'data', strength: 2 },
    { id: 'g4', side: 'him', place: 'lift_top', strength: 2 },
  ],
  owner: { low_west: 'you', low_east: 'you', gate: 'you', lift_low: 'you', citadel: 'him', promenade: 'him', data: 'him', lift_top: 'him' },
  goals: [
    { place: 'lift_mid', start: 'c3day2_lesson_lifts', done: 'c3day2_lesson_lifts_done' },
    { place: 'data', start: 'c3day2_lesson_data', done: 'c3day2_lesson_data_done' },
    { place: 'promenade', start: 'c3day2_lesson_promenade' },
  ],
  keep: ['citadel', 'promenade', 'data'],
  dropIn: { promenade: 'sim_guards' },
  lessonTurns: 16,
  now: {
    squads: [
      { id: 'n1', side: 'you', place: 'low_west', strength: 2 },
      { id: 'n2', side: 'you', place: 'low_east', strength: 2 },
      { id: 'n3', side: 'you', place: 'gate', strength: 2 },
      { id: 'n4', side: 'you', place: 'lift_low', strength: 2 },
      { id: 'h1', side: 'him', place: 'citadel', strength: 7 },
      { id: 'h2', side: 'him', place: 'promenade', strength: 3 },
      { id: 'h3', side: 'him', place: 'data', strength: 3 },
      { id: 'h4', side: 'him', place: 'lift_top', strength: 2 },
      { id: 'h5', side: 'him', place: 'lift_mid', strength: 2 },
    ],
    owner: { low_west: 'you', low_east: 'you', gate: 'you', lift_low: 'you', citadel: 'him', promenade: 'him', data: 'him', lift_top: 'him', lift_mid: 'him' },
    goal: 'citadel',
    turns: 8,
  },
  knots: { intro: 'c3day2_table_intro', dropIn: 'c3day2_table_dropin', good: 'c3day2_table_good', now: 'c3day2_table_now', end: 'c3day2_table_end', after: 'c3day2_after_table' },
};

export const SCENARIOS: Record<string, WarScenario> = { [LESSON.id]: LESSON };
