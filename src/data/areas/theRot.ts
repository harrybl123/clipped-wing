import { GIRL } from '../../ui/characters';
import { SHADES as S } from '../../ui/pixelArt';
import { FUNGI } from '../../ui/sprites';
import * as L from './lowerRootsProps';
import * as P from './girlsHomeProps';
import { heartwoodSolids } from './tunnels';
import type { AreaDefinition, Rect } from './types';

// The rot (Day 4 night): off the map, down through the board in the girl's floor. A low hollow of
// dying roots under the lower roots: sticky, grimy and glistening, glowing green in every hollow
// (designer: nothing special to find). The hazards from the back routes on the way to the far end,
// where the great root holding up her house comes down, soft as bread. It runs on into the dark
// beyond: no way through yet (the Day 7 roots ending pays this off). Tunnel-built, like the back routes.

const W = 720;
const H = 270;
const FLOOR = 232;
const TOP = 128;

/** Pits where the floor has rotted through: [x, width]. */
const PITS: [number, number][] = [[176, 24], [400, 24]];

const TUNNELS: Rect[] = [
  { x: 16, y: TOP, width: 688, height: FLOOR - TOP }, // the hollow
  { x: 24, y: 96, width: 32, height: 32 }, // up through her floor
  { x: 664, y: 104, width: 40, height: 24 }, // where the great root comes down
  ...PITS.map(([x, width]) => ({ x, y: FLOOR, width, height: 24 })),
];

const [cavity, ...nooks] = TUNNELS;


export const theRot: AreaDefinition = {
  id: 'the-rot',
  name: 'the rot',
  width: W,
  height: H,
  cavity: { ...cavity!, radius: 10 },
  nooks: nooks.map((t) => ({ ...t, radius: 4 })),
  heartwood: 'packed',
  ambient: 0.55,
  playerStart: { x: 40, y: FLOOR },

  solids: heartwoodSolids(TUNNELS, W, H),

  lights: [
    { x: 40, y: 110, colour: S.green, radius: 16, radiusY: 30, strength: 0.25 }, // her lamp, through the hole in the floor
    ...PITS.map(([x, width]) => ({ x: x + width / 2, y: FLOOR + 18, colour: S.green, radius: width, radiusY: 18, strength: 0.45 })),
    { x: 544, y: 150, colour: S.green, radius: 18, radiusY: 50, strength: 0.25 }, // rot dripping
    { x: 676, y: 190, colour: S.green, radius: 44, radiusY: 50, strength: 0.32 }, // the great root, rotting
    ...[[110, 150], [300, 200], [360, 140], [480, 210], [620, 160]].map(([x, y]) => ({ x: x!, y: y!, colour: S.green, radius: 20, radiusY: 14, strength: 0.24 })),
  ],

  lines: [],

  props: [
    { sprite: L.ladder(36), x: 36, y: 96 },
    { sprite: P.slime(120, 1), x: 70, y: TOP },
    { sprite: P.slime(150, 2), x: 260, y: TOP },
    { sprite: P.slime(90, 3), x: 470, y: TOP },
    { sprite: L.hangingRoots(30, 40, 3), x: 210, y: TOP },
    { sprite: L.hangingRoots(26, 30, 6), x: 590, y: TOP },
    ...[[90, 170, 1], [250, 150, 2], [330, 190, 3], [450, 160, 4], [520, 200, 5], [610, 180, 6]].map(([x, y, seed]) => ({ sprite: P.rotSmear(36, 22, seed), x: x!, y: y! })),
    { sprite: L.SOFT_PATCH, x: 140, y: 140 },
    { sprite: L.SOFT_PATCH, x: 430, y: 196 },
    { sprite: L.rootPillar(26, 128), x: 668, y: 104 }, // the great root under her house
    { sprite: P.rotSmear(30, 50, 9), x: 666, y: 150 },
    { sprite: FUNGI.droop, x: 120, y: FLOOR - 5 },
    { sprite: FUNGI.cluster, x: 330, y: FLOOR - 7 },
    { sprite: FUNGI.bent, x: 600, y: FLOOR - 7 },
  ],

  features: [
    ...PITS.map(([x, width]) => ({ type: 'rot' as const, x, y: FLOOR + 14, width, height: 10, reset: { x: x - 20, y: FLOOR } })),
    { type: 'beetle', from: 230, to: 380, y: FLOOR, speed: 30, reset: { x: 150, y: FLOOR } },
    // Day 4 night: past the pits, the beetles (a fight, with the girl beside you).
    // (Compulsory: it spans the whole floor from the second pit to the drips, so you can't jump past it.)
    { type: 'trigger', x: 480, y: FLOOR, reach: 54, knot: 'day4_rot_creatures', showIf: 'rot_creatures', hideIf: 'rot_creatures_done' },
    { type: 'drips', xs: [538, 548], top: TOP + 4, bottom: FLOOR, count: 2, every: 4400, reset: { x: 500, y: FLOOR } },
    { type: 'drip', x: 90, y: TOP + 2, floorY: FLOOR - 3 },
    { type: 'drip', x: 470, y: TOP + 2, floorY: FLOOR - 3 },
    { type: 'drip', x: 640, y: TOP + 2, floorY: FLOOR - 3 },
  ],

  people: [
    { id: 'girl-rot', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 60, y: FLOOR, knot: 'the_rot_girl', showIf: 'girl_with_you', follow: true },
    // Day 7 (fall): if you blamed her, she's been down here all day; then she comes with you.
    { id: 'girl-fallen', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 610, y: FLOOR, flipX: true, knot: 'the_rot_girl_fallen', showIf: 'girl_in_rot', hideIf: 'girl_follows', when: ['night'] },
    { id: 'girl-rot-follow', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 610, y: FLOOR, knot: 'the_rot_girl', showIf: 'girl_follows', follow: true },
  ],

  interactables: [
    { id: 'way-up', x: 40, y: FLOOR, reach: 10, label: 'Climb', knot: 'the_rot_way_up' },
    { id: 'dying-root', x: 660, y: FLOOR, reach: 12, label: 'Look', knot: 'the_rot_dying_root' },
    { id: 'crack', x: 694, y: FLOOR, reach: 8, label: 'Look', knot: 'the_rot_crack' },
  ],

  acoustics: 'tunnel',
  ambience: [{ sound: 'room', volume: 0.5 }, { sound: 'bubbles', volume: 0.7 }, { sound: 'drips', volume: 0.55 }, { sound: 'fizz', volume: 0.3 }],
  surface: 'wet',
  exits: [],
};
