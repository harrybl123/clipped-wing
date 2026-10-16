import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './cityProps';
import { addressScreens, deadScreen } from './citadelProps';
import type { AreaDefinition } from '../types';
import { cast, citizen, guard, inStory, LATE } from './people';

// The hideout (Chapter 3): under the low district, an old cellar of rough stone, the city's oldest, made
// a bar: where citizens band together against injustice, and the capital and your father call them
// terrorists (designer; docs/areas/capital/hideout.md). Warm, low, lamps hanging in cages; the counter,
// bottles catching the light, small tables; the steps up to the street; a back way out into the dark.
// Raided and ransacked while you're there (designer): after, smashed and dark (not built yet). The symbol
// painted large on the wall: the clipped wing over bare ground (designer).

const W = 480;
const FLOOR = 226;
const TOP = 80;
/** Chapter 3, Day 5's night: they're waiting for you (and then the raid). */
const NIGHT5 = 'c3day5=below,hideout,raid,out';

export const hideout: AreaDefinition = {
  id: 'hideout',
  name: 'the hideout',
  width: W,
  height: 270,
  walls: 'stone',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 4 },
  ambient: 0.8,
  playerStart: { x: 44, y: FLOOR },
  surface: 'stone',
  acoustics: 'small',
  ambience: [
    { sound: 'room', volume: 0.3 },
    { sound: 'chatter', volume: 0.15 },
    { sound: 'drips', volume: 0.15 },
  ],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 150, y: 170, colour: S.amber, radius: 90, radiusY: 60, strength: 0.6 },
    { x: 250, y: 170, colour: S.amber, radius: 70, radiusY: 50, strength: 0.45 },
    { x: 380, y: 170, colour: S.amber, radius: 90, radiusY: 60, strength: 0.6 }, // over the bar
  ],

  lines: [],

  props: [
    // The steps up to the street.
    { sprite: P.CELLAR_DOOR, x: 24, y: FLOOR - 34 },
    // Notices on the wall, the movement's and the capital's over them; barrels and crates.
    // The symbol, painted large: the clipped wing over bare ground (designer).
    { sprite: P.symbolMark('paint', 3), x: 150, y: 94 },
    { sprite: P.NOTICES, x: 92, y: 112 },
    { sprite: P.NOTICES, x: 230, y: 118 },
    { sprite: P.CRATES, x: 64, y: FLOOR - 30 },
    { sprite: P.BARREL, x: 290, y: FLOOR - 18 },
    // The long table and its benches, small tables.
    { sprite: P.LONG_TABLE, x: 120, y: FLOOR - 16 },
    { sprite: P.BAR_TABLE, x: 196, y: FLOOR - 7 },
    { sprite: P.BAR_TABLE, x: 236, y: FLOOR - 7 },
    // The bar.
    { sprite: P.BOTTLES, x: 340, y: FLOOR - 92 },
    { sprite: P.barCounter(120), x: 316, y: FLOOR - 24 },
    // The back way out.
    { sprite: P.CELLAR_DOOR, x: 444, y: FLOOR - 34 },
  ],

  features: [
    ...[150, 250, 380].map((x) => ({ type: 'swing' as const, sprite: P.CAGE_LAMP, x, y: TOP + 56, ropeTop: TOP, quiet: true, ropeColour: S.deep })),
    // Chapter 3, Day 3: coming down the steps, the first time.
    { type: 'trigger', x: 60, y: FLOOR, reach: 12, knot: 'c3day3_hideout', showIf: 'c3day3=sneak', hideIf: 'met_hideout' },
    { type: 'trigger', x: 138, y: FLOOR, reach: 14, knot: 'c3day3_overhear_sister', showIf: 'c3day3=hideout', hideIf: 'heard_sister3' },
    { type: 'trigger', x: 238, y: FLOOR, reach: 14, knot: 'c3day3_overhear_stairs', showIf: 'c3day3=hideout', hideIf: 'heard_stairs3' },
    { type: 'trigger', x: 332, y: FLOOR, reach: 12, knot: 'c3day3_overhear_counter', showIf: 'c3day3=hideout', hideIf: 'heard_counter3' },
    // Day 5: a small screen up behind the bar, that nobody ever watches, until the address (a cutaway): the
    // barkeep turns it off at the end (`off5`), and it stays off.
    ...addressScreens(48, 36, 276, 96, 'off5'),
    { type: 'frames', frames: [deadScreen(48, 36)], x: 276, y: 96, every: 60000, showIf: 'off5' },
    // Day 5: coming down the steps, and every head turns.
    { type: 'trigger', x: 60, y: FLOOR, reach: 12, knot: 'c3day5_hideout', showIf: 'c3day5=below' },
  ],
  people: [
    cast('hideout_keeper', 404, FLOOR, { knot: 'hideout_keeper', flipX: true }), // behind the counter, always
    // The evening and the night: regulars round the long table and the small ones, one at the counter.
    // (Day 3's night has its own: below.)
    citizen('regular-1', 0, 128, FLOOR, 'hideout_folk', LATE, { hideIf: ['c3day3=below,sneak,hideout,home', NIGHT5] }),
    citizen('regular-2', 7, 168, FLOOR, 'hideout_folk', LATE, { flipX: true, hideIf: ['c3day3=below,sneak,hideout,home', NIGHT5] }),
    citizen('regular-3', 12, 206, FLOOR, 'hideout_folk', LATE, { hideIf: ['c3day3=below,sneak,hideout,home', NIGHT5] }),
    citizen('regular-4', 13, 252, FLOOR, 'hideout_folk', ['night'], { flipX: true, hideIf: ['c3day3=below,sneak,hideout,home', NIGHT5] }),
    citizen('at-counter', 4, 332, FLOOR, 'hideout_folk', LATE, { hideIf: ['c3day3=below,sneak,hideout,home', NIGHT5] }),
    citizen('in-the-corner', 2, 76, FLOOR, 'hideout_corner', ['night'], { hideIf: ['c3day3=below,sneak,hideout,home', NIGHT5] }),
    citizen('regular', 5, 290, FLOOR, 'hideout_regular', LATE, { flipX: true, hideIf: ['c3day3=below,sneak,hideout,home', NIGHT5] }),
    // Chapter 3's story. Day 3, the first time: busy and loud, and you're one more hood (designer: you listen
    // in; only the kid knows you). The barkeep; tables you listen in on (a trigger by each); the painter in the
    // corner by the steps (his brother was the man taken). Your hand waits up in the street.
    inStory('keeper-3', 'hideout_keeper', 404, FLOOR, 'c3day3=sneak,hideout,home', { knot: 'c3day3_keeper', flipX: true }),
    citizen('rewards-1', 5, 128, FLOOR, 'c3day3_stranger', undefined, { showIf: 'c3day3=sneak,hideout,home' }),
    citizen('folk-3a', 0, 148, FLOOR, 'c3day3_stranger', undefined, { showIf: 'c3day3=sneak,hideout,home', flipX: true }),
    citizen('rewards-2', 7, 228, FLOOR, 'c3day3_stranger', undefined, { showIf: 'c3day3=sneak,hideout,home' }),
    citizen('rewards-3', 9, 248, FLOOR, 'c3day3_stranger', undefined, { showIf: 'c3day3=sneak,hideout,home', flipX: true }),
    citizen('folk-3c', 12, 290, FLOOR, 'c3day3_stranger', undefined, { showIf: 'c3day3=sneak,hideout,home', flipX: true }),
    citizen('counter-3', 13, 344, FLOOR, 'c3day3_stranger', undefined, { showIf: 'c3day3=sneak,hideout,home' }),
    // (Busier than any other night: every table, and people standing.)
    ...([[60, 2], [138, 11], [206, 4], [272, 1], [314, 10], [366, 3], [384, 8], [424, 14]] as const).map(([x, look], i) =>
      citizen(`crowd-3${i}`, look, x, FLOOR, 'c3day3_stranger', undefined, { showIf: 'c3day3=sneak,hideout,home', flipX: i % 2 === 1 }),
    ),
    inStory('painter-3', 'painter', 74, FLOOR, 'c3day3=hideout,home', { knot: 'c3day3_painter' }),
    // Day 5: they want to talk to you (designer: the plan), after last night: the barkeep, a woman whose
    // husband was on the square, the kid; everyone else watching you. Your hand by the steps, until he goes up
    // for air. Then the raid: the guard down the steps, and the captain.
    inStory('keeper-5', 'hideout_keeper', 404, FLOOR, 'c3day5=speech,below,hideout,raid,out', { knot: 'c3day5_keeper', flipX: true }),
    citizen('angry-5', 5, 140, FLOOR, 'c3day5_angry', undefined, { showIf: NIGHT5 }),
    inStory('painter-5', 'painter', 84, FLOOR, NIGHT5, { knot: 'c3day5_painter' }),
    inStory('painter-5s', 'painter', 300, FLOOR, 'c3day5=speech'),
    ...([[216, 0], [240, 11], [318, 7], [350, 2], [372, 13]] as const).map(([x, look], i) =>
      citizen(`folk-5${i}`, look, x, FLOOR, 'c3day5_crowd', undefined, { showIf: NIGHT5, flipX: i % 2 === 0 })),
    inStory('hand-5', 'diplomat', 52, FLOOR, 'c3day5=hideout,raid', { knot: 'c3day5_hand' }),
    ...[46, 60, 74, 128].map((x, i) => guard(`raid-${i + 1}`, i % 2, x, FLOOR, 'c3_guard', undefined, { showIf: 'c3day5=raid,out', hidden: true, knot: undefined })),
    inStory('captain-5r', 'captain', 36, FLOOR, 'c3day5=raid,out', { hidden: true }),
  ],
  interactables: [
    { id: 'emblem', x: 180, y: FLOOR, reach: 14, label: 'Look', knot: 'hideout_emblem' },
    { id: 'notices', x: 106, y: FLOOR, reach: 10, label: 'Look', knot: 'hideout_notices', hideIf: NIGHT5 },
    // Day 5: where the notices were, the names of the ones who went to the square and haven't come home.
    { id: 'names-5', x: 106, y: FLOOR, reach: 10, label: 'Look', knot: 'c3day5_names', showIf: NIGHT5 },
    { id: 'back-way', x: 456, y: FLOOR, reach: 10, label: 'Look', knot: 'hideout_back_way' },
  ],

  exits: [{ id: 'to-low-district', x: 39, y: FLOOR, reach: 12, to: 'low-district' }],
};
