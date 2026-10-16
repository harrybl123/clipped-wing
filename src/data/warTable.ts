import { RUMBLE, type RiotBoard, type RiotPlace, type RiotRules, type RisingStyle, type Side } from '../systems/Riot';

// The war table's maps and games (Chapter 3; the game: src/systems/Riot.ts, its design and how it was
// tuned: docs/sequences/chapter-3/war-table.md). Day 2: the lesson in the simulation room (you're the rising,
// your father the guard; then "Now."). Day 4: the riot, for real (you're the guard). Day 6: a duel with your
// friend on the old castle's siege (you hold the keep; he has the bigger army).

/**
 * A district that's risen, close up, as a street plan from above (designer: its own map): the way up along
 * the top (the stair to the citadel, the lifts' foot, where the guard arrives), the square in the middle with
 * five streets into it, the rest of the district round it, a back stair down the west side and a road round
 * the bottom. The same streets in either district; the names are the district's.
 */
function district(names: Record<string, string>): RiotBoard {
  const at = (id: string, x: number, y: number, extra: Partial<RiotPlace> = {}): RiotPlace => ({ id, name: names[id]!, x, y, ...extra });
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
 * up, 15 of them; the square, 14 behind its barricades (orders in sequence let you chain squads into one
 * strike: any less, and a careful player rushes it on turn 2); and crowds of 3 across the district, two of them in the
 * streets next to the square, one at the back stairs, close to yours.
 */
export const RIOT_START: Setup = [
  { side: 'guard', place: 'lifts', strength: 4 },
  { side: 'guard', place: 'stair', strength: 4 },
  { side: 'guard', place: 'arch', strength: 4 },
  { side: 'guard', place: 'lamp', strength: 3 },
  { side: 'rising', place: 'square', strength: 14 },
  { side: 'rising', place: 'screens', strength: 3 },
  { side: 'rising', place: 'market', strength: 3 },
  { side: 'rising', place: 'back', strength: 3 },
  { side: 'rising', place: 'yards', strength: 3 },
  { side: 'rising', place: 'wash', strength: 3 },
  { side: 'rising', place: 'bridge', strength: 3 },
  { side: 'rising', place: 'tenements', strength: 3 },
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
  rules?: Partial<RiotRules>;
  /** What he says the first time each thing happens (ink knots). */
  firsts: { grow: string; pour: string; arrive: string; rumble: string; tie: string; lost: string; idle: string; join: string };
  /** After so many turns of the lesson, he moves on anyway. */
  lessonTurns: number;
  /** "Now.": where everyone stands, and its lines. He plays until he's taken your square (designer: he crushes you); `turns` is only a safety stop. */
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
  // Rumbles in the lesson too (designer: with his word on war being a game of chance).
  rules: { rumble: RUMBLE },
  firsts: { grow: 'c3day2_first_grow', pour: 'c3day2_first_pour', rumble: 'c3day2_first_rumble', arrive: 'c3day2_first_arrive', tie: 'c3day2_react_tie', lost: 'c3day2_react_lost', idle: 'c3day2_react_idle', join: 'c3day2_react_joined' },
  lessonTurns: 14,
  now: {
    // The riot as he'd play it, from the guard's side: your square big enough that it looks like you could hold
    // it; and 12 on his lifts' foot, so going for his lifts can't hold him off (designer: make it impossible;
    // tested against every way of playing the rising, including going all out for his lifts: he takes it in 2
    // to 5 turns).
    squads: [
      { side: 'guard', place: 'lifts', strength: 12 },
      { side: 'guard', place: 'stair', strength: 5 },
      { side: 'guard', place: 'arch', strength: 5 },
      { side: 'guard', place: 'lamp', strength: 4 },
      { side: 'guard', place: 'back', strength: 4 },
      { side: 'rising', place: 'square', strength: 30 },
      { side: 'rising', place: 'screens', strength: 2 },
      { side: 'rising', place: 'market', strength: 2 },
      { side: 'rising', place: 'weavers', strength: 2 },
      { side: 'rising', place: 'yards', strength: 2 },
      { side: 'rising', place: 'wash', strength: 2 },
      { side: 'rising', place: 'bridge', strength: 2 },
      { side: 'rising', place: 'tenements', strength: 2 },
    ],
    turns: 30,
    knots: { now: 'c3day2_table_now', cut: 'c3day2_table_cut', end: 'c3day2_table_end' },
  },
  knots: { intro: 'c3day2_table_intro', good: 'c3day2_table_good', after: 'c3day2_after_table' },
};

/**
 * Day 6: the siege of the old castle, the citadel's crag before it was the citadel (designer: show your friend
 * the table and challenge him to a duel on a new map, where you've fewer troops, but it's as easy as the riot).
 * A game from your family's history, on the table for practice: the keep at the top (the square's rules: walls
 * +1, it grows by 1 a turn as people come in from the fields), its walls, gatehouse, postern and watchtower round it;
 * below, the bridge, the old town and the market, the mill and the orchards, the ford and the quarry; and his
 * siege camp at the bottom, where more of his army come every turn.
 */
export const CASTLE_BOARD: RiotBoard = (() => {
  const at = (id: string, name: string, x: number, y: number, extra: Partial<RiotPlace> = {}): RiotPlace => ({ id, name, x, y, ...extra });
  return {
    places: [
      at('keep', 'The keep', 240, 52, { heart: true }),
      at('postern', 'The postern', 116, 52),
      at('westwall', 'The west wall', 152, 108),
      at('gate', 'The gatehouse', 240, 114),
      at('eastwall', 'The east wall', 328, 108),
      at('tower', 'The watchtower', 372, 46),
      at('mill', 'The mill', 52, 120),
      at('bridge', 'The bridge', 240, 168),
      at('oldtown', 'The old town', 128, 176),
      at('market', 'The market', 352, 176),
      at('orchards', 'The orchards', 436, 116),
      at('ford', 'The ford', 56, 222),
      at('camp', 'The siege camp', 240, 226, { lifts: true, up: true }),
      at('quarry', 'The quarry', 414, 222),
    ],
    ways: [
      ['keep', 'postern'], ['keep', 'westwall'], ['keep', 'gate'], ['keep', 'eastwall'], ['postern', 'westwall'], ['postern', 'mill'],
      ['westwall', 'gate'], ['eastwall', 'gate'], ['eastwall', 'tower'], ['westwall', 'mill'], ['eastwall', 'orchards'], ['gate', 'bridge'],
      ['bridge', 'oldtown'], ['bridge', 'market'], ['bridge', 'camp'], ['oldtown', 'mill'], ['oldtown', 'ford'], ['oldtown', 'camp'],
      ['market', 'orchards'], ['market', 'quarry'], ['market', 'camp'], ['ford', 'camp'], ['quarry', 'camp'], ['tower', 'orchards'],
      ['mill', 'ford'], ['orchards', 'quarry'],
    ],
  };
})();

/** Day 6: a duel, for fun: you hold the keep (the rising's side of the rules) against a friend with the bigger army. */
export interface DuelScenario {
  id: string;
  kind: 'duel';
  board: RiotBoard;
  district: 'castle';
  squads: Setup;
  rules?: Partial<RiotRules>;
  /** How your side's keep behaves (no crowds poured out of it: your orders are your own). */
  style?: Partial<RisingStyle>;
  /** Ink knots: before; you held it till dawn; he took the keep. After either, back in the room (`after`). */
  knots: { intro: string; won: string; lost: string; after: string };
}

/**
 * The siege (tuned by simulation, tests/riotGame.test.ts): you 25 (11 in the keep), him 26 and 2 more a turn at his
 * camp (designer: fewer troops, technically); your friend plays it sensibly (`sensible`), his moves shown as
 * arrows; hold the keep for 12 turns. A first go (hit what you can beat, pull back what's threatened) holds it
 * most of the time; doing nothing, or anything, loses it.
 */
export const DUEL: DuelScenario = {
  id: 'duel',
  kind: 'duel',
  board: CASTLE_BOARD,
  district: 'castle',
  squads: [
    { side: 'rising', place: 'keep', strength: 11 },
    { side: 'rising', place: 'gate', strength: 4 },
    { side: 'rising', place: 'westwall', strength: 3 },
    { side: 'rising', place: 'eastwall', strength: 3 },
    { side: 'rising', place: 'tower', strength: 2 },
    { side: 'rising', place: 'postern', strength: 2 },
    { side: 'guard', place: 'camp', strength: 12 },
    { side: 'guard', place: 'oldtown', strength: 4 },
    { side: 'guard', place: 'market', strength: 4 },
    { side: 'guard', place: 'ford', strength: 3 },
    { side: 'guard', place: 'quarry', strength: 3 },
  ],
  // No power cuts in a siege; rumbles, as ever (Jack).
  rules: { dawn: 12, reinforce: 2, powerEvery: 999, rumble: RUMBLE },
  style: { pour: 0 },
  knots: { intro: 'c3day6_duel_intro', won: 'c3day6_duel_won', lost: 'c3day6_duel_lost', after: 'c3day6_caught' },
};

const riot = (id: string, board: RiotBoard, district: 'low' | 'promenade', squareArea: RiotScenario['squareArea']): RiotScenario => ({
  id, kind: 'riot', board, district, squads: RIOT_START, square: 'riot_square', squareArea,
  // Rumbles in the riot (Jack), not the lesson.
  rules: { rumble: RUMBLE },
  knots: { intro: 'c3day4_riot_intro', won: 'c3day4_table_won', dawn: 'c3day4_dawn', fatherTook: 'c3day4_father_took', square: 'c3day4_square' },
});

export const RIOTS: Record<string, RiotScenario | LessonScenario | DuelScenario> = {
  lesson: LESSON,
  duel: DUEL,
  riot_low: riot('riot_low', LOW_DISTRICT_BOARD, 'low', { areaId: 'low-district', start: { x: 720, y: 236 } }),
  riot_promenade: riot('riot_promenade', PROMENADE_BOARD, 'promenade', { areaId: 'promenade', start: { x: 720, y: 232 } }),
};
