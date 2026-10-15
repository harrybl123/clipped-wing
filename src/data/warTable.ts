import type { RiotRules, Squad, WarBoard, WarPlace, WarSide, WarWay } from '../systems/WarTable';

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

// --- Day 4: the riot (designer: its own map, not the whole city; a decently long battle) ---

/**
 * The district that's risen, close up, as a street plan seen from above (designer: its own map, larger than
 * the lesson's): the way up along the top (the stair up to the citadel, the lifts' foot), the square in the
 * middle with five streets into it, the rest of the district round it to the edges, and a back stair down the
 * west side. The same streets either way; their names are the district's. All streets but the stair up.
 */
function district(names: Record<string, string>): WarBoard {
  const at = (id: string, x: number, y: number, extra: Partial<WarPlace> = {}): WarPlace => ({ id, name: names[id]!, x, y, level: 0, ...extra });
  const ways: WarWay[] = [
    ['stair_up', 'lifts'], ['stair_up', 'arch'], ['stair_up', 'back'], ['lifts', 'arch'], ['lifts', 'lamp'],
    ['back', 'screens'], ['back', 'weavers'], ['arch', 'screens'], ['arch', 'market'], ['arch', 'lamp'], ['lamp', 'market'], ['lamp', 'yards'],
    ['screens', 'square'], ['weavers', 'square'], ['market', 'square'], ['cellar', 'square'], ['well', 'square'],
    ['weavers', 'cellar'], ['weavers', 'wash'], ['market', 'well'], ['market', 'yards'], ['cellar', 'wash'], ['cellar', 'bridge'],
    ['well', 'bridge'], ['well', 'tenements'], ['yards', 'tenements'], ['bridge', 'tenements'], ['wash', 'bridge'],
  ].map(([a, b]) => ({ a: a!, b: b!, kind: 'street' as const }));
  ways.push({ a: 'stair_up', b: 'screens', kind: 'stair' });
  return {
    places: [
      at('stair_up', 240, 44, { level: 1 }),
      at('lifts', 412, 50),
      at('back', 52, 82),
      at('screens', 150, 92),
      at('arch', 318, 86),
      at('lamp', 432, 112),
      at('weavers', 58, 140),
      // The square: barricaded. Held at +1, and its barricades lose nothing when they hold.
      at('square', 204, 150, { stronghold: true }),
      at('market', 330, 140),
      at('yards', 424, 176),
      at('cellar', 104, 192),
      at('well', 272, 196),
      at('wash', 34, 226),
      at('bridge', 184, 230),
      at('tenements', 368, 228),
    ],
    ways,
    // The guard's pikes and armour: a crowd needs more than their number to break them.
    armoured: 'you',
  };
}

/** The low district (energy high: the district you darkened rises, led by the painter's brother). */
export const LOW_DISTRICT_BOARD = district({
  stair_up: 'The stair up', lifts: 'The lifts\u2019 foot', back: 'The back stairs', screens: 'The screens\u2019 street', arch: 'The arches',
  lamp: 'The lamp shop', weavers: 'The Weavers\u2019 Row', square: 'The square', market: 'The market street', yards: 'The dye yards',
  cellar: 'The cellar lane', well: 'The old well', wash: 'The wash house', bridge: 'The drain bridge', tenements: 'The tenements',
});
/** The promenade (energy to the people: the promenade, dark since, rises, and the reformer speaks to it). */
export const PROMENADE_BOARD = district({
  stair_up: 'The citadel stair', lifts: 'The middle lifts', back: 'The servants\u2019 stair', screens: 'The great screen', arch: 'The colonnade',
  lamp: 'The arcade', weavers: 'The watch post', square: 'The square', market: 'The shopfronts', yards: 'The glass terraces',
  cellar: 'The stair down', well: 'The fountain', wash: 'The bathhouse', bridge: 'The footbridge', tenements: 'The apartments',
});

export interface RiotGoal {
  kind: 'take' | 'seal' | 'clear' | 'square';
  place?: string;
  start: string;
}

export interface RiotScenario {
  id: string;
  board: WarBoard;
  /** Which district it is, for how the table's drawn (the low district's warm, the promenade's glass). */
  district: 'low' | 'promenade';
  squads: Squad[];
  owner: Record<string, WarSide>;
  rules: RiotRules;
  /**
   * One goal after another (as the lesson): take a place; seal the square (a squad on every street into it);
   * clear the streets (no crowd left outside it); then the square, which you go down to yourself.
   */
  goals: RiotGoal[];
  /** More of the guard off the lifts every so often (fighting their way off, if a crowd's got there). */
  reinforce: { place: string; every: number; strength: number };
  /** The power: you can cut it under one of their crowds, once every so many turns. */
  powerEvery: number;
  /** The fight at the square (src/data/combat.ts), and the area its square is in, where you come out after. */
  square: string;
  squareArea: { areaId: string; start: { x: number; y: number } };
  /** The story's lines (ink knots): before, things that go badly (each once), the guard arriving, the power, going down, and the square (played back in the area). */
  knots: { intro: string; lost: string; spread: string; stair: string; reinforce: string; power: string; dropIn: string; taken: string; after: string };
  /** If a crowd takes this place (the stair up to the citadel), you've lost it: he takes command from you (designer). */
  lostIf: string;
}

const riotSquads = (): Pick<RiotScenario, 'squads' | 'owner'> => {
  // The guard (yours, now) comes down at the way up; the rising has the square and most of the district.
  const squads: Squad[] = [
    { id: 'g1', side: 'you', place: 'lifts', strength: 6 },
    { id: 'g2', side: 'you', place: 'stair_up', strength: 4 },
    { id: 'g3', side: 'you', place: 'arch', strength: 4 },
    { id: 'g4', side: 'you', place: 'lamp', strength: 3 },
    { id: 'r0', side: 'him', place: 'square', strength: 4 },
    { id: 'r1', side: 'him', place: 'screens', strength: 2 },
    { id: 'r2', side: 'him', place: 'market', strength: 2 },
    { id: 'r3', side: 'him', place: 'weavers', strength: 2 },
    { id: 'r4', side: 'him', place: 'cellar', strength: 1 },
    { id: 'r5', side: 'him', place: 'well', strength: 2 },
    { id: 'r6', side: 'him', place: 'wash', strength: 1 },
    { id: 'r7', side: 'him', place: 'bridge', strength: 2 },
    { id: 'r8', side: 'him', place: 'tenements', strength: 2 },
    { id: 'r9', side: 'him', place: 'yards', strength: 1 },
  ];
  return { squads, owner: Object.fromEntries(squads.map((q) => [q.place, q.side])) };
};

const riot = (id: string, board: WarBoard, district: 'low' | 'promenade', squareArea: RiotScenario['squareArea']): RiotScenario => ({
  squareArea,
  id,
  board,
  district,
  ...riotSquads(),
  rules: { heart: 'square', grow: 1, cap: 8, spreadAt: 5, spreadSize: 2, upTo: ['stair_up', 'lifts'] },
  goals: [
    { kind: 'take', place: 'market', start: 'c3day4_riot_goal_market' },
    { kind: 'take', place: 'screens', start: 'c3day4_riot_goal_screens' },
    { kind: 'seal', start: 'c3day4_riot_goal_seal' },
    { kind: 'clear', start: 'c3day4_riot_goal_clear' },
    { kind: 'square', place: 'square', start: 'c3day4_riot_goal_square' },
  ],
  reinforce: { place: 'lifts', every: 2, strength: 3 },
  powerEvery: 3,
  square: 'riot_square',
  lostIf: 'stair_up',
  knots: {
    intro: 'c3day4_riot_intro', lost: 'c3day4_riot_lost', spread: 'c3day4_riot_spread', stair: 'c3day4_riot_stair',
    reinforce: 'c3day4_riot_reinforce', power: 'c3day4_riot_power', dropIn: 'c3day4_riot_dropin', taken: 'c3day4_riot_taken', after: 'c3day4_square',
  },
});

export const RIOTS: Record<string, RiotScenario> = {
  riot_low: riot('riot_low', LOW_DISTRICT_BOARD, 'low', { areaId: 'low-district', start: { x: 720, y: 236 } }),
  riot_promenade: riot('riot_promenade', PROMENADE_BOARD, 'promenade', { areaId: 'promenade', start: { x: 720, y: 232 } }),
};
