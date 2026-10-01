import { DODGER, GIRL, VILLAGERS } from '../../ui/characters';
import { BOARDED_HOLE } from './girlsHomeProps';
import { SHADES as S } from '../../ui/pixelArt';
import { FUNGI } from '../../ui/sprites';
import { CRATE } from './rootsMarketProps';
import * as P from './lowerRootsProps';
import { ARCHWAY } from './offeringFloorProps';
import type { AreaDefinition, Person, Prop } from './types';

// The lower roots: the deepest, most crowded part of the roots, home to the tree's poorest, the
// girl among them. Bigger than one screen (the camera follows you) because Night 4 is a sneak
// through here: a crowded, lit street below and a dark high route of root walkways and a rope
// bridge above (reached by jumping up shack roofs), both leading to the girl's home at the far,
// deepest end. See docs/areas/lower-roots.md.
// Day 4 night is the sneak to her door (designer): the night watch walks the street and the high
// walkway with lanterns, and stands near her door; dark doorways hide you. If the watch sees you,
// you're back at the start of the street. Her home itself is its own area now (girls-home, off the
// map); here there's only her door, and the boarded-up hole where the house next door fell in.

const W = 1120;
const H = 400;
const FLOOR = 360;
const HIGH = 230;
const BUSY: Person['when'] = ['morning', 'afternoon', 'evening'];
const DAY: Person['when'] = ['morning', 'afternoon'];
/** Where the watch sends you back to: the start of the street. */
const START = { x: 60, y: FLOOR };
/** Her home: a shack at the far end (the door's on its right, seed odd). */
const HER_HOME = { x: 976, w: 56, h: 44 };
const HER_DOOR = HER_HOME.x + HER_HOME.w - 9;

const villager = (id: string, look: number, x: number, y: number, extra: Partial<Person> = {}): Person => ({
  id,
  sprite: VILLAGERS[look]!.idle[0]!,
  idleFrames: VILLAGERS[look]!.idle,
  x,
  y,
  ...extra,
});

const wanderer = (id: string, look: number, from: number, to: number, y: number, when: Person['when']): Person => ({
  ...villager(id, look, from + Math.round((to - from) / 3), y, { when }),
  walkFrames: VILLAGERS[look]!.walk,
  wander: { from, to },
});

/** Shacks along the street (bottom on the floor unless `y` is given). */
const SHACKS: { x: number; w: number; h: number; seed: number; win: 'green' | 'amber' | 'dark'; curtain: number; y?: number }[] = [
  { x: 50, w: 52, h: 40, seed: 1, win: 'amber', curtain: S.cyanDeep },
  { x: 108, w: 60, h: 46, seed: 2, win: 'dark', curtain: S.amberDeep },
  { x: 222, w: 56, h: 40, seed: 3, win: 'green', curtain: S.greenDeep },
  { x: 250, w: 44, h: 44, seed: 4, win: 'amber', curtain: S.woodPale, y: 320 }, // stacked: a way up to the rope bridge
  { x: 300, w: 48, h: 38, seed: 5, win: 'green', curtain: S.cyanDeep },
  { x: 356, w: 64, h: 50, seed: 6, win: 'dark', curtain: S.amberDeep },
  { x: 590, w: 56, h: 44, seed: 7, win: 'amber', curtain: S.greenDeep },
  { x: 650, w: 40, h: 34, seed: 8, win: 'green', curtain: S.woodPale },
  { x: 700, w: 70, h: 52, seed: 9, win: 'green', curtain: S.cyanDeep },
  { x: 820, w: 60, h: 40, seed: 10, win: 'dark', curtain: S.amberDeep },
  // Second storeys, built on top of the ones below.
  { x: 116, w: 44, h: 36, seed: 11, win: 'green', curtain: S.woodPale, y: 314 },
  { x: 362, w: 50, h: 40, seed: 12, win: 'amber', curtain: S.greenDeep, y: 310 },
  { x: 708, w: 52, h: 38, seed: 13, win: 'dark', curtain: S.cyanDeep, y: 308 },
  { x: 826, w: 46, h: 34, seed: 14, win: 'green', curtain: S.amberDeep, y: 320 },
];

/** Homes dug into the walls high above the street. */
const BURROWS: [number, number, 'green' | 'amber' | 'dark'][] = [
  [80, 90, 'green'], [160, 60, 'amber'], [300, 120, 'dark'], [360, 70, 'green'], [470, 100, 'amber'], [520, 150, 'green'],
  [700, 80, 'green'], [760, 130, 'dark'], [840, 96, 'amber'], [980, 110, 'green'], [1060, 80, 'dark'], [1010, 170, 'amber'],
];

const FUNGUS_SHELVES: [number, number][] = [[60, 200], [240, 160], [410, 190], [620, 120], [870, 180], [1084, 200], [960, 262], [1086, 290], [520, 300]];

const props: Prop[] = [
  // The walls high up: burrows, fungi, soft patches, roots hanging from the ceiling.
  ...BURROWS.map(([x, y, light]) => ({ sprite: P.burrow(light), x, y })),
  ...FUNGUS_SHELVES.map(([x, y]) => ({ sprite: P.FUNGUS_SHELF, x, y })),
  { sprite: P.SOFT_PATCH, x: 200, y: 130 },
  { sprite: P.SOFT_PATCH, x: 560, y: 60 },
  { sprite: P.SOFT_PATCH, x: 780, y: 330 },
  ...[[150, 0], [380, 1], [640, 2], [820, 3], [1000, 4]].map(([x, s]) => ({ sprite: P.hangingRoots(30, 60, s), x: x!, y: 16 })),
  // Great roots holding everything up.
  { sprite: P.rootPillar(22, 120), x: 432, y: HIGH + 10 },
  { sprite: P.rootPillar(24, 214), x: 586, y: 16 },
  { sprite: P.rootPillar(26, 284), x: 898, y: 16 }, // the wall of the girl's home, her doorway beneath
  // Ways out: up to your home, and a low hole into the back routes.
  { sprite: ARCHWAY, x: 23, y: HIGH - 38 },
  { sprite: ARCHWAY, x: 23, y: FLOOR - 38 },
  // The street: shacks packed in, washing lines strung between them, the shared pot.
  ...SHACKS.map((s) => ({ sprite: P.shack(s.w, s.h, s.seed, s.win, s.curtain), x: s.x, y: (s.y ?? FLOOR) - s.h })),
  { sprite: P.ropeBridge(220), x: 200, y: HIGH - 12 },
  { sprite: P.ladder(46), x: 350, y: 264 },
  { sprite: P.ladder(52), x: 696, y: 256 },
  { sprite: P.ladder(40), x: 812, y: 280 },
  { sprite: P.ladder(44), x: 166, y: 270 },
  { sprite: P.washingLine(60, 1), x: 420, y: 262 },
  { sprite: P.washingLine(50, 2), x: 770, y: 256 },
  { sprite: P.washingLine(46, 3), x: 300, y: 250 },
  { sprite: P.TRIPOD_POT, x: 510, y: FLOOR - 18 },
  { sprite: FUNGI.cluster, x: 176, y: FLOOR - 7 },
  { sprite: FUNGI.tall, x: 470, y: FLOOR - 8 },
  { sprite: FUNGI.droop, x: 800, y: FLOOR - 5 },
  { sprite: FUNGI.bent, x: 640, y: HIGH - 7 },
  // The far end: the boarded hole where the house next to hers fell into the rot, and her home.
  { sprite: BOARDED_HOLE, x: 926, y: FLOOR - 5 },
  { sprite: P.shack(HER_HOME.w, HER_HOME.h, 15, 'green', S.greenDeep), x: HER_HOME.x, y: FLOOR - HER_HOME.h },
  { sprite: P.GLOW_PAINT, x: 1048, y: 300 },
  { sprite: P.SCRATCHED_MAP, x: 1060, y: 330 },
  { sprite: P.hangingRoots(24, 20, 7), x: 1040, y: 237 },
  { sprite: P.foundStrings(28), x: 1010, y: 237 },
  { sprite: P.washingLine(36, 9), x: 1054, y: 250 },
  { sprite: CRATE, x: 1074, y: FLOOR - 8 },
  { sprite: P.POTTED_FUNGI, x: 962, y: FLOOR - 7 },
  { sprite: P.POTTED_FUNGI, x: 1090, y: FLOOR - 7 },
  { sprite: FUNGI.cluster, x: 1060, y: FLOOR - 7 },
];

export const lowerRoots: AreaDefinition = {
  id: 'lower-roots',
  name: 'the lower roots',
  width: W,
  height: H,
  cavity: { x: 12, y: 16, width: W - 24, height: FLOOR - 16, radius: 36 },
  ambient: 0.72,
  playerStart: { x: 80, y: FLOOR },

  solids: [
    { x: 0, y: FLOOR, width: W, height: H - FLOOR },
    // The high route: a root shelf, the rope bridge, two root walkways with a gap to jump.
    { x: 12, y: HIGH, width: 188, height: 10, oneWay: true },
    { x: 200, y: HIGH, width: 220, height: 3, oneWay: true, invisible: true },
    { x: 420, y: HIGH, width: 190, height: 10, oneWay: true },
    { x: 660, y: HIGH, width: 230, height: 10, oneWay: true },
    // Every shack roof can be jumped onto (and dropped through with down).
    ...SHACKS.map((s) => ({ x: s.x, y: (s.y ?? FLOOR) - s.h, width: s.w, height: 3, oneWay: true, invisible: true })),
    { x: 0, y: 0, width: 12, height: H, invisible: true },
    { x: W - 12, y: 0, width: 12, height: H, invisible: true },
  ],

  lights: [
    { x: 520, y: 350, colour: S.amber, radius: 56, radiusY: 36, strength: 0.38 }, // the shared fire
    { x: 945, y: 352, colour: S.green, radius: 24, radiusY: 10, strength: 0.3 }, // rot glowing up through the boarded hole
    { x: 1064, y: 310, colour: S.green, radius: 30, radiusY: 22, strength: 0.22 }, // her glowing wall paint
    { x: 1040, y: 260, colour: S.green, radius: 20, strength: 0.3 }, // her found strings
    ...FUNGUS_SHELVES.map(([x, y]) => ({ x: x + 5, y: y + 3, colour: S.green, radius: 14, radiusY: 10, strength: 0.2 })),
    ...BURROWS.filter(([, , l]) => l !== 'dark').map(([x, y, l]) => ({ x: x + 5, y: y + 4, colour: l === 'green' ? S.green : S.amber, radius: 14, strength: 0.22 })),
    ...SHACKS.filter((s) => s.win !== 'dark').map((s) => ({ x: s.x + (s.seed % 2 === 0 ? s.w - 8 : 8), y: (s.y ?? FLOOR) - s.h + 10, colour: s.win === 'green' ? S.green : S.amber, radius: 16, strength: 0.24 })),
    { x: 180, y: 354, colour: S.green, radius: 16, radiusY: 10, strength: 0.28 }, // floor fungi
    { x: 800, y: 356, colour: S.green, radius: 14, radiusY: 8, strength: 0.26 },
  ],

  lines: [],
  props,

  features: [
    { type: 'fire', x: 520, y: FLOOR - 1 },
    { type: 'drip', x: 566, y: 74, floorY: FLOOR - 4 },
    { type: 'drip', x: 790, y: 60, floorY: FLOOR - 4 },
    // Day 4 night: the watch. One walks the street, one the high walkway, one in front of her door.
    { type: 'watch', from: 150, to: 450, y: FLOOR, speed: 20, range: 80, pause: 1800, reset: START, showIf: 'sneaking' },
    { type: 'watch', from: 440, to: 600, y: HIGH, speed: 18, range: 70, pause: 2000, reset: START, showIf: 'sneaking' },
    { type: 'watch', from: 920, to: 1080, y: FLOOR, speed: 20, range: 64, pause: 2000, reset: START, showIf: 'sneaking' },
    // Dark doorways to hide in (and the nook at the foot of the great root).
    ...SHACKS.filter((s) => (s.y ?? FLOOR) === FLOOR).map((s) => ({ type: 'shadow' as const, x: s.x + (s.seed % 2 === 0 ? 5 : s.w - 13), y: FLOOR, width: 8, showIf: 'sneaking' })),
    { type: 'shadow', x: 898, y: FLOOR, width: 14, showIf: 'sneaking' },
    { type: 'hint', x: 70, y: FLOOR, reach: 50, text: 'Keep out of the lanterns. Doorways and the high walkways are dark.', showIf: 'sneaking' },
  ],

  people: [
    // Round the shared pot.
    villager('pot-1', 0, 494, FLOOR, { when: BUSY }),
    villager('pot-2', 2, 546, FLOOR, { when: BUSY, flipX: true }),
    villager('pot-child', 6, 560, FLOOR, { when: DAY, flipX: true }),
    villager('local', 5, 462, FLOOR, { knot: 'lower_roots_local', when: BUSY }),
    // Squeezing past each other in the street.
    wanderer('street-1', 1, 300, 450, FLOOR, BUSY),
    wanderer('street-2', 3, 600, 870, FLOOR, BUSY),
    wanderer('street-3', 4, 120, 290, FLOOR, DAY),
    villager('doorway', 3, 380, FLOOR, { when: DAY }),
    villager('leaning', 4, 720, HIGH, { when: DAY, flipX: true }),
    // At night, hardly anyone.
    { ...wanderer('night-walker', 4, 300, 880, FLOOR, ['night']), hideIf: 'sneaking' },
    // The girl, at home.
    { id: 'girl', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 1056, y: FLOOR, knot: 'lower_roots_girl', flipX: true, hideIf: ['girl_with_you', 'sneaking'] },
    // Day 5 on: the boy, a sleazy fixer, up on the high walkway where the watch doesn't bother to climb.
    { id: 'dodger', sprite: DODGER.idle[0]!, idleFrames: DODGER.idle, x: 830, y: HIGH, knot: 'lower_roots_dodger', when: ['afternoon', 'evening', 'night'], showIf: 'day5', flipX: true },
    // Night 5: the girl on her doorstep, waiting for you while the watch goes by.
    { id: 'girl-doorstep', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 1040, y: FLOOR, knot: 'lower_roots_girl', flipX: true, showIf: 'girl_on_doorstep' },
    // Day 3: she shows you the way into the back routes, and comes with you.
    { id: 'girl-guide', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 60, y: FLOOR, knot: 'girl_guide', showIf: 'girl_with_you', follow: true },
  ],

  interactables: [
    { id: 'pot', x: 520, y: FLOOR, reach: 10, label: 'Look', knot: 'lower_roots_pot' },
    { id: 'soft-wood', x: 791, y: FLOOR, reach: 8, label: 'Touch', knot: 'lower_roots_soft_wood' },
    { id: 'scratches', x: 1068, y: FLOOR, reach: 8, label: 'Look', knot: 'lower_roots_scratches' },
    { id: 'girls-door', x: HER_DOOR, y: FLOOR, reach: 8, label: 'Knock', knot: 'lower_roots_girls_door' },
  ],

  exits: [
    { id: 'up-to-home', x: 34, y: HIGH, reach: 12, to: 'home' },
    { id: 'to-back-routes', x: 34, y: FLOOR, reach: 12, to: 'back-routes' },
  ],
};
