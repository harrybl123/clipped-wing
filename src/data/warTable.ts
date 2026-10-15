import type { RiotBoard, RiotPlace, RiotRules, Side } from '../systems/Riot';

// The war table's maps and games (Chapter 3; the game: src/systems/Riot.ts, its design and how it was
// tuned: docs/sequences/chapter-3/war-table.md). Day 2: the lesson in the simulation room (you're the rising,
// your father the guard; then "Now."). Day 4: the riot, for real (you're the guard).

/**
 * A district that's risen, close up, as a street plan from above (designer: its own map): the way up along
 * the top (the stair to the citadel, the lifts' foot, where the guard arrives), the square in the middle with
 * five streets into it, the rest of the district round it, a back stair down the west side and a road round
 * the bottom. The same streets in either district; the names are the district's.
 */
function district(names: Record<string, string>): RiotBoard {
  // (Laid out from y 50 to 230, then fitted between the table's top and bottom bars.)
  const at = (id: string, x: number, y: number, extra: Partial<RiotPlace> = {}): RiotPlace => ({ id, name: names[id]!, x, y: Math.round(36 + (y - 50) * 0.97), ...extra });
  return {
    places: [
      at('stair', 240, 50, { up: true }),
      at('lifts', 412, 54, { up: true, lifts: true }),
      at('back', 52, 84),
      at('screens', 150, 94),
      at('arch', 318, 90),
      at('lamp', 432, 114),
      at('weavers', 58, 142),
      at('square', 204, 152, { heart: true }),
      at('market', 330, 142),
      at('yards', 424, 178),
      at('cellar', 104, 194),
      at('well', 272, 198),
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

/** The low district (Day 2's lesson; Day 4 if energy went high: the district you darkened rises, led by the painter's brother). */
export const LOW_DISTRICT_BOARD = district({
  stair: 'The stair up', lifts: 'The lifts’ foot', back: 'The back stairs', screens: 'The screens’ street', arch: 'The arches',
  lamp: 'The lamp shop', weavers: 'The Weavers’ Row', square: 'The square', market: 'The market street', yards: 'The dye yards',
  cellar: 'The cellar lane', well: 'The old well', wash: 'The wash house', bridge: 'The drain bridge', tenements: 'The tenements',
});
/** The promenade (Day 4 if energy went to the people: the promenade, dark since, rises, and the reformer speaks to it). */
export const PROMENADE_BOARD = district({
  stair: 'The citadel stair', lifts: 'The middle lifts', back: 'The servants’ stair', screens: 'The great screen', arch: 'The colonnade',
  lamp: 'The arcade', weavers: 'The watch post', square: 'The square', market: 'The shopfronts', yards: 'The glass terraces',
  cellar: 'The stair down', well: 'The fountain', wash: 'The bathhouse', bridge: 'The footbridge', tenements: 'The apartments',
});

type Setup = { side: Side; place: string; strength: number }[];

/**
 * Where the riot starts (tuned by simulation: docs/sequences/chapter-3/war-table.md): the guard along the way
 * up, 15 of them; the square, 8 behind its barricades; and crowds of 2 across the district, two of them in the
 * streets next to the square, one at the back stairs, close to yours.
 */
export const RIOT_START: Setup = [
  { side: 'guard', place: 'lifts', strength: 4 },
  { side: 'guard', place: 'stair', strength: 4 },
  { side: 'guard', place: 'arch', strength: 4 },
  { side: 'guard', place: 'lamp', strength: 3 },
  { side: 'rising', place: 'square', strength: 8 },
  { side: 'rising', place: 'screens', strength: 2 },
  { side: 'rising', place: 'market', strength: 2 },
  { side: 'rising', place: 'back', strength: 2 },
  { side: 'rising', place: 'yards', strength: 2 },
  { side: 'rising', place: 'wash', strength: 2 },
  { side: 'rising', place: 'bridge', strength: 2 },
  { side: 'rising', place: 'tenements', strength: 2 },
];

/** Day 4: the riot, for real. You're the guard; take the square before dawn. */
export interface RiotScenario {
  id: string;
  kind: 'riot';
  board: RiotBoard;
  /** How the table's drawn (the low district's warm and crowded, the promenade's glass). */
  district: 'low' | 'promenade';
  squads: Setup;
  rules?: Partial<RiotRules>;
  /** The fight when you take the square (src/data/combat.ts), and the area its square is in, where you come out after. */
  square: string;
  squareArea: { areaId: string; start: { x: number; y: number } };
  /**
   * Ink knots: before; you took the square (your father comes in; some of them have broken through, and you
   * go down to stop them: the fight); dawn first (your father comes in); him taking it (and the same news);
   * then, after the fight, at the square.
   */
  knots: { intro: string; won: string; dawn: string; fatherTook: string; square: string };
}

/**
 * Day 2: the lesson in the simulation room (plan: "A district rises. You'll be the rising. I'll be the guard."):
 * the same game, from the rising's side, one thing at a time, his moves shown; a fight at the end you go down to
 * yourself; then "Now.": he means it, as the guard, and takes your square.
 */
export interface LessonScenario {
  id: string;
  kind: 'lesson';
  board: RiotBoard;
  district: 'low' | 'promenade';
  squads: Setup;
  /** One goal after another: take this place (his line before it, and after, if any). */
  goals: { place: string; start: string; done?: string }[];
  /** Taking the last goal, you go down yourself: the fight (src/data/combat.ts). */
  dropIn: { encounter: string; knot: string };
  /** What he says the first time each thing happens (ink knots). */
  firsts: { grow: string; arrive: string; tie: string; lost: string; idle: string; join: string };
  /** After so many turns of the lesson, he moves on anyway. */
  lessonTurns: number;
  /** "Now.": where everyone stands, how long he plays (if he hasn't taken the square by then, he stops), and its lines. */
  now: { squads: Setup; turns: number; knots: { now: string; cut: string; end: string } };
  knots: { intro: string; good: string; after: string };
}

export const LESSON: LessonScenario = {
  id: 'lesson',
  kind: 'lesson',
  board: LOW_DISTRICT_BOARD,
  district: 'low',
  // You (the rising) hold the bottom of the district and the square; he (the guard) the top and two streets.
  squads: [
    { side: 'rising', place: 'square', strength: 4 },
    { side: 'rising', place: 'wash', strength: 3 },
    { side: 'rising', place: 'cellar', strength: 2 },
    { side: 'rising', place: 'well', strength: 2 },
    { side: 'rising', place: 'tenements', strength: 2 },
    { side: 'rising', place: 'bridge', strength: 1 },
    { side: 'guard', place: 'weavers', strength: 2 },
    { side: 'guard', place: 'market', strength: 3 },
    { side: 'guard', place: 'screens', strength: 3 },
    { side: 'guard', place: 'stair', strength: 3 },
    { side: 'guard', place: 'arch', strength: 2 },
    { side: 'guard', place: 'lifts', strength: 3 },
  ],
  goals: [
    // 3 against 2: the bigger number wins, and keeps what's over.
    { place: 'weavers', start: 'c3day2_lesson_weavers', done: 'c3day2_lesson_weavers_done' },
    // 3 of his: two of yours won't do it alone; join them first.
    { place: 'market', start: 'c3day2_lesson_market', done: 'c3day2_lesson_market_done' },
    // And the last of it, you go down to yourself.
    { place: 'screens', start: 'c3day2_lesson_screens' },
  ],
  dropIn: { encounter: 'sim_guards', knot: 'c3day2_table_dropin' },
  firsts: { grow: 'c3day2_first_grow', arrive: 'c3day2_first_arrive', tie: 'c3day2_react_tie', lost: 'c3day2_react_lost', idle: 'c3day2_react_idle', join: 'c3day2_react_joined' },
  lessonTurns: 14,
  now: {
    // The riot as he'd play it, from the guard's side: your square big enough that it looks like you could hold
    // it (tested: whatever the rising does, he takes it in 3 to 7 turns).
    squads: [
      { side: 'guard', place: 'lifts', strength: 6 },
      { side: 'guard', place: 'stair', strength: 5 },
      { side: 'guard', place: 'arch', strength: 5 },
      { side: 'guard', place: 'lamp', strength: 4 },
      { side: 'guard', place: 'back', strength: 4 },
      { side: 'rising', place: 'square', strength: 12 },
      { side: 'rising', place: 'screens', strength: 2 },
      { side: 'rising', place: 'market', strength: 2 },
      { side: 'rising', place: 'weavers', strength: 2 },
      { side: 'rising', place: 'yards', strength: 2 },
      { side: 'rising', place: 'wash', strength: 2 },
      { side: 'rising', place: 'bridge', strength: 2 },
      { side: 'rising', place: 'tenements', strength: 2 },
    ],
    turns: 10,
    knots: { now: 'c3day2_table_now', cut: 'c3day2_table_cut', end: 'c3day2_table_end' },
  },
  knots: { intro: 'c3day2_table_intro', good: 'c3day2_table_good', after: 'c3day2_after_table' },
};

const riot = (id: string, board: RiotBoard, district: 'low' | 'promenade', squareArea: RiotScenario['squareArea']): RiotScenario => ({
  id, kind: 'riot', board, district, squads: RIOT_START, square: 'riot_square', squareArea,
  knots: { intro: 'c3day4_riot_intro', won: 'c3day4_table_won', dawn: 'c3day4_dawn', fatherTook: 'c3day4_father_took', square: 'c3day4_square' },
});

export const RIOTS: Record<string, RiotScenario | LessonScenario> = {
  lesson: LESSON,
  riot_low: riot('riot_low', LOW_DISTRICT_BOARD, 'low', { areaId: 'low-district', start: { x: 720, y: 236 } }),
  riot_promenade: riot('riot_promenade', PROMENADE_BOARD, 'promenade', { areaId: 'promenade', start: { x: 720, y: 232 } }),
};
