import { ARCHITECT, AUDIENCE, BARRACKS, CHURCH, CLASH, ELITE_SQUAD, MYSTERY, REBEL, RUMBLE, type RiotBoard, type RiotPlace, type RiotRules, type Side } from '../systems/Riot';

// The war table's maps and games (Chapter 3; the game: src/systems/Riot.ts, its design and how it was
// tuned: docs/sequences/chapter-3/war-table.md). Day 2: the lesson in the simulation room (you're the rising,
// your father the guard; then "Now."). Day 4: the riot, for real (you're the guard). Day 6: a duel with your
// friend on the old castle's siege (you hold the keep; he has the bigger army). Day 8: your father plays the
// rising, and you the guard; then again, with the transfer list taken off the table.

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

/**
 * What Jack added, as the riot plays it (and the games after it): rumbles and the elite squads; the audience, the
 * holy cross, the barracks, the architect, one at a time; anyone can go at the barbarians; two towers each, the
 * guard's on their way in, the rising's at the back of the district, without walls (simulated: with them, a
 * first-timer won 2 in 24). Not the rebels' own move: Rally's +2 turns the riot's crowds of 3 into 5s that beat
 * your 4s (a first-timer won none).
 */
const RIOT_FEATURES: Partial<RiotRules> = {
  rumble: { ...RUMBLE, chance: 0.25 }, elites: ELITE_SQUAD, clash: CLASH, mystery: { ...MYSTERY, from: 3, chance: 0.25 },
  audience: { ...AUDIENCE, from: 4, chance: 0.2 }, church: { ...CHURCH, from: 5, chance: 0.1 }, barracks: { ...BARRACKS, from: 4, chance: 0.2 },
  architect: { ...ARCHITECT, chance: 0.2 }, tokensAtOnce: 1, guardsOpen: true,
  towers: { guard: ['arch', 'lamp'], rising: ['wash', 'tenements'], makes: 2, every: 4, walls: 0 },
};

/** Day 4: the riot, for real. You're the guard; take the square before dawn. */
export interface RiotScenario {
  id: string;
  kind: 'riot';
  board: RiotBoard;
  /** How the table's drawn (the low district's warm and crowded, the promenade's glass; the skirmish, the crag). */
  district: 'low' | 'promenade' | 'castle';
  squads: Setup;
  rules?: Partial<RiotRules>;
  /** The fight when you take the square (src/data/combat.ts), and the area its square is in, where you come out after. */
  square: string;
  squareArea: { areaId: string; start: { x: number; y: number } };
  /** A game on its own, for playtesting (Jack): no story, no dawn; it ends when a side's base is taken. */
  skirmish?: boolean;
  /** The table zoomed in (bigger than the screen, dragged round) and zoomed out (all on the screen): Jack's view mode. */
  views?: { in: RiotBoard; out: RiotBoard };
  /**
   * The tutorial (Day 2, after "Now."; designer: then you're introduced to all the features): a card (an ink
   * knot, `c3tut_<topic>`) the first time each thing comes up, and some on set turns; the square taken (`done`)
   * or dawn first, back to the room (`after`).
   */
  tutorial?: { turns: Record<number, TutorialTopic[]>; done: string; dawn: string; after: string };
  /** Day 6's duel on the skirmish's table (your friend the rebels): its knots, the skirmish over. */
  duel?: { intro: string; won: string; lost: string; after: string };
  /**
   * Ink knots: before; you took the square (your father comes in; some of them have broken through, and you
   * go down to stop them: the fight); dawn first (your father comes in); him taking it (and the same news);
   * then, after the fight, at the square.
   */
  knots: { intro: string; won: string; dawn: string; fatherTook: string; square: string };
}

/** What the tutorial explains, each the first time it comes up (`c3tut_<topic>` in story/capital/tutorial.ink). */
export const TUTORIAL_TOPICS = [
  'intro', 'towers', 'fortify', 'split', 'power', 'rumble', 'crest', 'elites', 'enemy_elite', 'clash', 'race', 'captured',
  'mystery', 'audience', 'barracks', 'architect', 'church',
] as const;
export type TutorialTopic = (typeof TUTORIAL_TOPICS)[number];

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
  firsts: { grow: string; pour: string; arrive: string; tie: string; lost: string; idle: string; join: string };
  /** After so many turns of the lesson, he moves on anyway. */
  lessonTurns: number;
  /** "Now.": where everyone stands, and its lines. He plays until he's taken your square (designer: he crushes you); `turns` is only a safety stop. */
  now: { squads: Setup; turns: number; knots: { now: string; cut: string; end: string } };
  knots: { intro: string; good: string; after: string };
  /** After "Now.", the next game (the tutorial), instead of back to the room. */
  next?: string;
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
  // Just numbers (designer: the first go against your father is the simple table we started with; then he says
  // the world's full of chance, and the tutorial brings in everything else).
  rules: { simple: true },
  next: 'tutorial',
  firsts: { grow: 'c3day2_first_grow', pour: 'c3day2_first_pour', arrive: 'c3day2_first_arrive', tie: 'c3day2_react_tie', lost: 'c3day2_react_lost', idle: 'c3day2_react_idle', join: 'c3day2_react_joined' },
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
 * the table and challenge him to a duel on a new map, where you've fewer troops, but it's as easy as the riot;
 * then: the map considerably bigger than the riot's). A game from your family's history, on the table for
 * practice, nearly twice the riot's places, on a table bigger than the screen (it pans). The keep at the top
 * (the square's rules: walls +1, it grows by 1 a turn as people come in from the fields), with its inner yard,
 * towers, postern, walls and gatehouse; the country below it in rows, the mill and the orchards, the old town
 * and the market round the bridge, the woods and the vineyards, the marsh, the tannery, the crossroads, the
 * chapel and the quarry; and along the bottom his siege camp, where more of his army come every turn, between
 * the ford, the farms, the south road and the hills.
 */
export const CASTLE_BOARD: RiotBoard = (() => {
  const at = (id: string, name: string, x: number, y: number, extra: Partial<RiotPlace> = {}): RiotPlace => ({ id, name, x, y, ...extra });
  return {
    width: 800,
    height: 440,
    places: [
      at('wtower', 'The west tower', 180, 56),
      at('postern', 'The postern', 290, 56),
      at('keep', 'The keep', 400, 60, { heart: true }),
      at('yard', 'The inner yard', 510, 56),
      at('etower', 'The east tower', 620, 56),
      at('mill', 'The mill', 70, 130),
      at('wwall', 'The west wall', 200, 130),
      at('gate', 'The gatehouse', 400, 136),
      at('ewall', 'The east wall', 600, 130),
      at('orchards', 'The orchards', 730, 130),
      at('woods', 'The woods', 60, 212),
      at('oldtown', 'The old town', 190, 212),
      at('smithy', 'The smithy', 300, 212),
      at('bridge', 'The bridge', 400, 212),
      at('market', 'The market', 500, 212),
      at('granary', 'The granary', 620, 212),
      at('vineyard', 'The vineyards', 740, 212),
      at('marsh', 'The marsh', 110, 296),
      at('tannery', 'The tannery', 250, 296),
      at('crossroads', 'The crossroads', 400, 296),
      at('chapel', 'The chapel', 550, 296),
      at('quarry', 'The quarry', 700, 296),
      at('ford', 'The ford', 70, 380),
      at('farms', 'The farms', 220, 380),
      at('camp', 'The siege camp', 400, 384, { lifts: true, up: true }),
      at('road', 'The south road', 580, 380),
      at('hills', 'The hills', 740, 380),
    ],
    ways: [
      ['wtower', 'postern'], ['postern', 'keep'], ['keep', 'yard'], ['yard', 'etower'],
      ['wtower', 'wwall'], ['postern', 'wwall'], ['keep', 'gate'], ['yard', 'ewall'], ['etower', 'ewall'], ['wtower', 'mill'], ['etower', 'orchards'],
      ['wwall', 'gate'], ['gate', 'ewall'], ['mill', 'wwall'], ['ewall', 'orchards'],
      ['mill', 'woods'], ['mill', 'oldtown'], ['wwall', 'oldtown'], ['wwall', 'smithy'], ['gate', 'bridge'], ['ewall', 'granary'], ['ewall', 'market'], ['orchards', 'granary'], ['orchards', 'vineyard'],
      ['woods', 'oldtown'], ['oldtown', 'smithy'], ['smithy', 'bridge'], ['bridge', 'market'], ['market', 'granary'], ['granary', 'vineyard'],
      ['woods', 'marsh'], ['oldtown', 'tannery'], ['smithy', 'tannery'], ['bridge', 'crossroads'], ['market', 'chapel'], ['granary', 'quarry'], ['vineyard', 'quarry'],
      ['marsh', 'tannery'], ['tannery', 'crossroads'], ['crossroads', 'chapel'], ['chapel', 'quarry'],
      ['marsh', 'ford'], ['tannery', 'farms'], ['crossroads', 'camp'], ['chapel', 'road'], ['quarry', 'hills'],
      ['ford', 'farms'], ['farms', 'camp'], ['camp', 'road'], ['road', 'hills'],
    ],
  };
})();

/**
 * The skirmish's table (Jack: a bigger map, the rebels' base well away from yours, its three places round it
 * like yours): the siege of the old castle's crag (`CASTLE_BOARD`, Harry's) turned round. The keep at the top is
 * yours (the guard's base, where the guard come in), the siege camp at the bottom the rebels' hideout (their
 * base, growing); the three places round each base drawn in close (Jack: a kind of defensiveness).
 */
export const SKIRMISH_WIDE: RiotBoard = {
  ways: CASTLE_BOARD.ways,
  width: CASTLE_BOARD.width,
  height: CASTLE_BOARD.height,
  places: CASTLE_BOARD.places.map((p): RiotPlace => {
    const moved: Record<string, Partial<RiotPlace>> = {
      keep: { y: 54, heart: undefined, lifts: true, up: true },
      // (The west wall's streets to the postern and the gatehouse, and the east wall's, spread apart: Jack, they
      // ran too close together to tell apart with everyone on the board.)
      postern: { x: 338, y: 62 },
      yard: { x: 462, y: 62 },
      gate: { y: 136 },
      camp: { name: 'The hideout', y: 392, heart: true, lifts: undefined, up: undefined },
      crossroads: { y: 312 },
      farms: { x: 338, y: 372 },
      road: { x: 462, y: 372 },
    };
    const q: RiotPlace = { ...p, ...moved[p.id] };
    for (const k of ['heart', 'lifts', 'up'] as const) if (q[k] === undefined) delete q[k];
    return q;
  }),
};

/**
 * The same, zoomed out (Jack: dragging round the map was a nuisance): squeezed onto the screen (480 by 270), clear
 * of the note at the top and the bar along the bottom; the names shorter.
 */
export const SKIRMISH_BOARD: RiotBoard = {
  ways: SKIRMISH_WIDE.ways,
  compact: true,
  places: SKIRMISH_WIDE.places.map((p) => ({ ...p, x: Math.round(24 + (p.x - 60) * 0.635), y: Math.round(30 + (p.y - 54) * 0.586) })),
};

/** Where the skirmish starts: your guard round the keep and on the walls; the rising in the country below, the hideout full. */
const SKIRMISH_START: Setup = [
  { side: 'guard', place: 'keep', strength: 5 },
  { side: 'guard', place: 'wtower', strength: 3 },
  { side: 'guard', place: 'etower', strength: 3 },
  { side: 'guard', place: 'wwall', strength: 4 },
  { side: 'guard', place: 'ewall', strength: 4 },
  // Even (Jack): 5 in each base, and the same out in the field (19 each), two streets out.
  { side: 'rising', place: 'camp', strength: 5 },
  { side: 'rising', place: 'tannery', strength: 4 },
  { side: 'rising', place: 'chapel', strength: 4 },
  { side: 'rising', place: 'ford', strength: 3 },
  { side: 'rising', place: 'hills', strength: 3 },
];

/**
 * Day 8: your father plays the rising, for once (designer: a game against him before the broadcast, to make a
 * point), on the low district as it is this morning: everyone who was on the square or in the cellar still in it.
 * You're the guard; take the square before dawn. Winnable but difficult (designer; to be tuned again once Jack's
 * work on the table is in). Then again, "with the list": the crowds that are the people on the transfer list
 * come off the table before it starts, all but the one you struck off it, which stays, and grows; and it's easy.
 */
export interface FatherScenario {
  id: string;
  kind: 'father';
  board: RiotBoard;
  district: 'low';
  squads: Setup;
  rules?: Partial<RiotRules>;
  /**
   * The second game: the crowds sent away first (the list), each with the `struck` name it is, if it's one of
   * those you could strike; `left`, how many stay behind (the square: the order takes everyone who was on it).
   */
  list?: { place: string; name?: string; left?: number }[];
  /** How strong the one you kept is, the second time. */
  kept?: number;
  /** The game after this one (on to the list). */
  next?: string;
  /** The story variable the result goes in (won / lost). */
  result: string;
  /** Ink knots: before; won; lost; and, after the last game, back in the room. */
  knots: { intro: string; won: string; lost: string; after?: string };
}

/**
 * Day 8's first game (tuned by simulation, tests/riotGame.test.ts): the riot's start with one more crowd, in the
 * cellar lane (the cellar's people, 2 of them), the square 12, the riot's rules with everything Jack added, and
 * dawn at 20. (Retuned after Jack's work: with a crowd of 3 in the cellar a first go won a few in 32; then, at
 * three in eight, designer: really hard.) A first go (`naive`) takes the square about three in five (the riot's
 * the same), sensible play three in four, careful play always.
 */
export const FATHER_START: Setup = [...RIOT_START.map((q) => (q.place === 'square' ? { ...q, strength: 12 } : q)), { side: 'rising', place: 'cellar', strength: 2 }];
const FATHER_RULES: Partial<RiotRules> = { ...RIOT_FEATURES, dawn: 20 };

/**
 * The transfer list on the table: the barkeep's cellar, the kid's back stairs, the woman's wash house, three
 * more streets' worth, and everyone who was on the square (6 of its 14 stay). With it, the second game's over in
 * two to five turns, whichever you kept (simulated).
 */
export const TRANSFER_LIST: { place: string; name?: string; left?: number }[] = [
  { place: 'square', left: 6 },
  { place: 'cellar', name: 'barkeep' },
  { place: 'back', name: 'kid' },
  { place: 'wash', name: 'woman' },
  { place: 'screens' },
  { place: 'market' },
  { place: 'bridge' },
];

export const FATHER: FatherScenario = {
  id: 'father8', kind: 'father', board: LOW_DISTRICT_BOARD, district: 'low', squads: FATHER_START, rules: FATHER_RULES,
  next: 'father8_list', result: 'table8',
  knots: { intro: 'c3day8_table_intro', won: 'c3day8_table_won', lost: 'c3day8_table_lost' },
};
export const FATHER_LIST: FatherScenario = {
  id: 'father8_list', kind: 'father', board: LOW_DISTRICT_BOARD, district: 'low', squads: FATHER_START, rules: FATHER_RULES,
  list: TRANSFER_LIST, kept: 6, result: 'list8',
  knots: { intro: 'c3day8_list_intro', won: 'c3day8_list_won', lost: 'c3day8_list_lost', after: 'c3day8_after_table' },
};

const riot = (id: string, board: RiotBoard, district: RiotScenario['district'], squareArea: RiotScenario['squareArea']): RiotScenario => ({
  id, kind: 'riot', board, district, squads: RIOT_START, square: 'riot_square', squareArea,
  rules: RIOT_FEATURES,
  knots: { intro: 'c3day4_riot_intro', won: 'c3day4_table_won', dawn: 'c3day4_dawn', fatherTook: 'c3day4_father_took', square: 'c3day4_square' },
});

/**
 * Day 2, after "Now.": the table as it really is (designer: the world is full of chance; war is more complex than
 * this; then you're introduced to all the features, in a tutorial). Day 4's district, Day 4's game (you're the
 * guard: take the square before dawn), with everything Jack added that Day 4 has; but the things on the map come
 * on set turns, one at a time, next to your squads (so you can get there first), each explained as it comes:
 * a rumble, a crest (the elite squad), the diviner, an audience, the barracks, the architect, the holy cross. A
 * longer night, and three crowds fewer, so there's room and time to try it all.
 */
export const TUTORIAL: RiotScenario = (() => {
  const base = riot('tutorial', LOW_DISTRICT_BOARD, 'low', { areaId: 'simulation-room', start: { x: 200, y: 230 } });
  const off = { chance: 0 };
  return {
    ...base,
    // (Three crowds fewer than the riot: with them the district fills up, there's nowhere for things to come,
    // and simulated, a first go never won; without, three in four.)
    squads: RIOT_START.filter((q) => !['back', 'wash', 'bridge'].includes(q.place)),
    rules: {
      ...base.rules,
      dawn: 24,
      rumble: { ...RUMBLE, ...off },
      mystery: { ...MYSTERY, ...off },
      audience: { ...AUDIENCE, ...off, call: { ...AUDIENCE.call, chance: 0 } },
      church: { ...CHURCH, ...off },
      barracks: { ...BARRACKS, ...off },
      architect: { ...ARCHITECT, ...off },
      elites: { ...ELITE_SQUAD, crest: { ...ELITE_SQUAD.crest, first: 999 } },
      script: {
        side: 'guard',
        tokens: [
          { turn: 2, token: 'rumble' },
          { turn: 3, token: 'crest' },
          { turn: 5, token: 'mystery', mark: 'diviner' },
          { turn: 6, token: 'audience' },
          { turn: 7, token: 'barracks' },
          { turn: 8, token: 'architect' },
          { turn: 9, token: 'church' },
        ],
      },
    },
    tutorial: { turns: { 1: ['intro', 'towers', 'fortify'], 2: ['split'], 4: ['power'] }, done: 'c3tut_done', dawn: 'c3tut_dawn', after: 'c3day2_after_table' },
    knots: { ...base.knots, intro: 'c3day2_tutorial_intro' },
  };
})();

// A game mode of its own, for playtesting (Jack: no dawn, an indefinite game; a shake-up every 6 turns gives
// each side a crest, or a quarter of the time it's the trickster; the elite come back once they're gone; take their base and you've won, lose yours and
// you've lost). Dev: ?scene=wartable.
// On the crag (Jack: Harry's bigger map, the rebels' base well away from yours, three places round each base).
const SKIRMISH: RiotScenario = {
    ...riot('skirmish', SKIRMISH_BOARD, 'castle', { areaId: 'low-district', start: { x: 720, y: 236 } }),
    squads: SKIRMISH_START,
    skirmish: true,
    views: { in: SKIRMISH_WIDE, out: SKIRMISH_BOARD },
    rules: {
      elites: { ...ELITE_SQUAD, once: false, hero: { ...ELITE_SQUAD.hero, lasts: 5 } }, clash: CLASH,
      // (Jack: too many now; one at a time, and one thing out of the blue a turn at most, a middle ground in how often.)
      rumble: { ...RUMBLE, chance: 0.25 }, mystery: { ...MYSTERY, from: 3, chance: 0.25 }, audience: { ...AUDIENCE, from: 4, chance: 0.2 },
      church: { ...CHURCH, from: 5, chance: 0.1 }, barracks: { ...BARRACKS, from: 4, chance: 0.2 }, architect: { ...ARCHITECT, chance: 0.2 }, tokensAtOnce: 1,
      rebel: REBEL, homeGrowth: true, baseMakes: 2, guardsOpen: true, baseWalls: 3,
      // Two towers each, out on the flanks (Jack), three streets from home: each makes 2 every 4 turns, there, for
      // whoever holds it (Jack: not 1 every turn). No shake-ups, no brothel (Jack).
      towers: { guard: ['mill', 'orchards'], rising: ['marsh', 'quarry'], makes: 2, every: 4, walls: 1 }, clashOutput: { by: 1, turns: 3 }, dawn: 100000, baseLoss: true },
  };

/**
 * Day 6: a duel with your friend, for fun (designer: the siege of the crag, a new map; then: Jack's gameplay is
 * what the game needed, wire it into the chapter): Jack's skirmish, on the crag. You hold the keep (the guard's
 * side), he's the army in the siege camp (the rebels' side, Jack's computer player); even armies (simulated: a
 * bigger army for him, and a first go never took his camp; even, sensible play always does, a first go now and
 * then). Take his camp and you've won; he takes your keep and he has.
 */
const camp = (b: RiotBoard): RiotBoard => ({ ...b, places: b.places.map((p) => (p.id === 'camp' ? { ...p, name: 'The siege camp' } : p)) });
export const DUEL: RiotScenario = {
  ...SKIRMISH,
  id: 'duel',
  board: camp(SKIRMISH.board),
  views: { in: camp(SKIRMISH_WIDE), out: camp(SKIRMISH_BOARD) },
  duel: { intro: 'c3day6_duel_intro', won: 'c3day6_duel_won', lost: 'c3day6_duel_lost', after: 'c3day6_caught' },
  knots: { ...SKIRMISH.knots, intro: 'c3day6_duel_intro' },
};

export const RIOTS: Record<string, RiotScenario | LessonScenario | FatherScenario> = {
  lesson: LESSON,
  tutorial: TUTORIAL,
  duel: DUEL,
  father8: FATHER,
  father8_list: FATHER_LIST,
  riot_low: riot('riot_low', LOW_DISTRICT_BOARD, 'low', { areaId: 'low-district', start: { x: 720, y: 236 } }),
  riot_promenade: riot('riot_promenade', PROMENADE_BOARD, 'promenade', { areaId: 'promenade', start: { x: 720, y: 232 } }),
  skirmish: SKIRMISH,
};
