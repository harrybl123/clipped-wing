import type { RiotBoard, RiotPlace, SquadKind } from '../systems/Riot';
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
   * When he turns it on (designer: obvious, and you can only lose, but a fair fight you're out-thought in,
   * not a flood of troops; it mustn't be winnable, and that mustn't be obvious): the table set up again, the
   * same rules, one move each, no arrows; you're told to take the citadel; he plays to win.
   */
  now: { squads: Squad[]; owner: Record<string, WarSide>; goal: string; turns: number; /** For this many turns from the start, he cuts the power under your strongest stack (designer: once is enough). */ cutsPower?: number };
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
    // Your rising has the promenade, and squads all through the low district: ten, against the citadel's
    // eight. It looks winnable. It isn't: all ten together, attacking uphill, only tie with the citadel's
    // walls, and a tie holds; the walls lose nothing; and he spends your squads long before you could gather
    // them (tested). The first turn, he cuts the power under your biggest stack.
    squads: [
      { id: 'n1', side: 'you', place: 'promenade', strength: 2 },
      { id: 'n2', side: 'you', place: 'low_west', strength: 2 },
      { id: 'n3', side: 'you', place: 'gate', strength: 2 },
      { id: 'n4', side: 'you', place: 'low_east', strength: 2 },
      { id: 'n5', side: 'you', place: 'lift_low', strength: 2 },
      { id: 'h1', side: 'him', place: 'citadel', strength: 8 },
      { id: 'h2', side: 'him', place: 'lift_top', strength: 3 },
      { id: 'h3', side: 'him', place: 'lift_mid', strength: 3 },
      { id: 'h4', side: 'him', place: 'data', strength: 3 },
    ],
    owner: { promenade: 'you', low_west: 'you', gate: 'you', low_east: 'you', lift_low: 'you', citadel: 'him', lift_top: 'him', lift_mid: 'him', data: 'him' },
    goal: 'citadel',
    turns: 7,
    cutsPower: 1,
  },
  knots: { intro: 'c3day2_table_intro', dropIn: 'c3day2_table_dropin', good: 'c3day2_table_good', now: 'c3day2_table_now', end: 'c3day2_table_end', after: 'c3day2_after_table' },
};

export const SCENARIOS: Record<string, WarScenario> = { [LESSON.id]: LESSON };

// --- Day 4: the riot (src/systems/Riot.ts; docs/sequences/chapter-3/war-table.md) ---

/**
 * The district that's risen, close up, as a street plan from above (designer: its own map, larger than the
 * lesson's): the way up along the top (the stair to the citadel, the lifts' foot), the square in the middle
 * with five streets into it, the rest of the district round it to the edges, a back stair down the west side
 * and a road round the bottom. The same streets either way; their names are the district's.
 */
function district(names: Record<string, string>): RiotBoard {
  const at = (id: string, x: number, y: number, extra: Partial<RiotPlace> = {}): RiotPlace => ({ id, name: names[id]!, x, y, ...extra });
  return {
    places: [
      at('stair', 240, 44, { up: true }),
      at('lifts', 412, 50, { up: true }),
      at('back', 52, 82),
      at('screens', 150, 92),
      at('arch', 318, 86),
      at('lamp', 432, 112),
      at('weavers', 58, 140),
      at('square', 204, 150, { heart: true }),
      at('market', 330, 140),
      at('yards', 424, 176),
      at('cellar', 104, 192),
      at('well', 272, 196),
      at('wash', 34, 226),
      at('bridge', 184, 230),
      at('tenements', 368, 228),
    ],
    ways: [
      ['stair', 'lifts'], ['stair', 'arch'], ['stair', 'back'], ['stair', 'screens'], ['lifts', 'arch'], ['lifts', 'lamp'],
      ['back', 'screens'], ['back', 'weavers'], ['arch', 'screens'], ['arch', 'market'], ['arch', 'lamp'], ['lamp', 'market'], ['lamp', 'yards'],
      ['screens', 'square'], ['weavers', 'square'], ['market', 'square'], ['cellar', 'square'], ['well', 'square'],
      ['weavers', 'cellar'], ['weavers', 'wash'], ['market', 'well'], ['market', 'yards'], ['cellar', 'wash'], ['cellar', 'bridge'],
      ['well', 'bridge'], ['well', 'tenements'], ['yards', 'tenements'], ['bridge', 'tenements'], ['wash', 'bridge'],
    ],
  };
}

/** The low district (energy high: the district you darkened rises, led by the painter's brother). */
export const LOW_DISTRICT_BOARD = district({
  stair: 'The stair up', lifts: 'The lifts\u2019 foot', back: 'The back stairs', screens: 'The screens\u2019 street', arch: 'The arches',
  lamp: 'The lamp shop', weavers: 'The Weavers\u2019 Row', square: 'The square', market: 'The market street', yards: 'The dye yards',
  cellar: 'The cellar lane', well: 'The old well', wash: 'The wash house', bridge: 'The drain bridge', tenements: 'The tenements',
});
/** The promenade (energy to the people: the promenade, dark since, rises, and the reformer speaks to it). */
export const PROMENADE_BOARD = district({
  stair: 'The citadel stair', lifts: 'The middle lifts', back: 'The servants\u2019 stair', screens: 'The great screen', arch: 'The colonnade',
  lamp: 'The arcade', weavers: 'The watch post', square: 'The square', market: 'The shopfronts', yards: 'The glass terraces',
  cellar: 'The stair down', well: 'The fountain', wash: 'The bathhouse', bridge: 'The footbridge', tenements: 'The apartments',
});

export interface RiotScenario {
  id: string;
  board: RiotBoard;
  /** Which district it is, for how the table's drawn (the low district's warm and crowded, the promenade's glass). */
  district: 'low' | 'promenade';
  /** Where it starts: unrest by place, and the guard. */
  unrest: Record<string, number>;
  squads: { kind: SquadKind; place: string }[];
  /** The fight at the square (src/data/combat.ts), and the area its square is in, where you come out after. */
  square: string;
  squareArea: { areaId: string; start: { x: number; y: number } };
  /** The story, after (ink knots): you took the square (the fight follows, then this knot plays at the square); or dawn came first. */
  knots: { won: string; lost: string };
}

/**
 * Where the riot starts (tuned by simulation: docs/sequences/chapter-3/war-table.md): the square burning,
 * three streets at 2, four at 1; pikes on the stair, the arches and the back stairs, a shield wall at the
 * lifts, the watch at the lamp shop.
 */
const RIOT_START: Pick<RiotScenario, 'unrest' | 'squads'> = {
  unrest: { square: 3, market: 2, screens: 2, weavers: 2, cellar: 1, well: 1, bridge: 1, tenements: 1 },
  squads: [
    { kind: 'pikes', place: 'stair' }, { kind: 'shields', place: 'lifts' }, { kind: 'pikes', place: 'arch' },
    { kind: 'watch', place: 'lamp' }, { kind: 'pikes', place: 'back' },
  ],
};

const riot = (id: string, board: RiotBoard, district: 'low' | 'promenade', squareArea: RiotScenario['squareArea']): RiotScenario => ({
  id, board, district, ...RIOT_START, square: 'riot_square', squareArea,
  knots: { won: 'c3day4_square', lost: 'c3day4_dawn' },
});

export const RIOTS: Record<string, RiotScenario> = {
  riot_low: riot('riot_low', LOW_DISTRICT_BOARD, 'low', { areaId: 'low-district', start: { x: 720, y: 236 } }),
  riot_promenade: riot('riot_promenade', PROMENADE_BOARD, 'promenade', { areaId: 'promenade', start: { x: 720, y: 232 } }),
};
