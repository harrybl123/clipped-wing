import { SHADES as S } from '../../../ui/pixelArt';
import { SEALED_DOOR, doorway, scrollingScreen } from './citadelProps';
import * as P from './cityProps';
import type { AreaDefinition } from '../types';
import { cast, guard, inStory, strollingCitizen, DAY } from './people';

// The data centre (Chapter 3): where the capital's requests and output come and go; nobody says who's on
// the other end (docs/areas/capital/data-centre.md). The most futuristic place in the city: bare, clean
// panels in cold blue light, rows of racks with their lights blinking, a low steady hum; the operator's
// desk with its bank of screens; deeper in, a sealed door like the one in the citadel, cables running
// into it, light running along them.

const W = 640;
const FLOOR = 230;
const TOP = 30;

export const dataCentre: AreaDefinition = {
  id: 'data-centre',
  name: 'the data centre',
  width: W,
  height: 270,
  walls: 'bare',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.62,
  playerStart: { x: 40, y: FLOOR },
  surface: 'stone',
  acoustics: 'hall',
  ambience: [
    { sound: 'hum', volume: 0.6 },
    { sound: 'fizz', volume: 0.15 },
    { sound: 'room', volume: 0.2 },
  ],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 300, y: 140, colour: S.cyan, radius: 260, radiusY: 90, strength: 0.4 }, // the racks' cold light
    { x: 100, y: 200, colour: S.cyan, radius: 50, radiusY: 30, strength: 0.4 }, // the operator's screens
    { x: 590, y: 190, colour: S.cyan, radius: 70, radiusY: 60, strength: 0.8 }, // the sealed door
  ],

  lines: [
    // Cables along the ceiling into the sealed door.
    { from: { x: 16, y: TOP + 4 }, to: { x: 570, y: TOP + 4 }, colour: S.deep },
    { from: { x: 16, y: TOP + 5 }, to: { x: 570, y: TOP + 5 }, colour: S.cyanDeep },
    { from: { x: 570, y: TOP + 4 }, to: { x: 570, y: FLOOR - 68 }, colour: S.deep },
  ],

  props: [
    { sprite: doorway(24, 46), x: 22, y: FLOOR - 46 },
    { sprite: P.OPERATOR_DESK, x: 64, y: FLOOR - 36 },
    { sprite: SEALED_DOOR, x: 572, y: FLOOR - 68 },
  ],

  features: [
    // Rows of racks, their lights blinking.
    ...[150, 176, 202, 228, 290, 316, 342, 368, 430, 456, 482, 508].map((x, i) => ({ type: 'frames' as const, frames: P.rackFrames(130), x, y: FLOOR - 130, every: 380 + (i % 4) * 70 })),
    { type: 'frames', frames: scrollingScreen(40, 26), x: 72, y: 90, every: 300 },
    { type: 'pulse', points: [{ x: 16, y: TOP + 4 }, { x: 570, y: TOP + 4 }, { x: 570, y: FLOOR - 68 }], speed: 180, every: 500, count: 3, colour: S.cyan },
  ],
  people: [
    cast('operator', 104, FLOOR, { knot: 'data_operator' }), // at the desk, every shift
    strollingCitizen('tech', 11, 150, 520, FLOOR, 'data_tech', DAY),
    guard('door-guard', 2, 552, FLOOR, 'c3_guard_data', undefined, { flipX: true }), // your father's guard, on the door at the back
    cast('engineer', 300, FLOOR, { knot: 'data_engineer', when: ['evening'] }),
    // Chapter 3's story. Day 1: the operator with the day's requests; your hand with you.
    inStory('operator-1', 'operator', 104, FLOOR, 'c3day1=requests', { knot: 'c3day1_requests' }),
    inStory('hand', 'diplomat', 50, FLOOR, 'hand_with_you', { follow: true, knot: 'c3day1_hand_walk' }),
  ],
  interactables: [
    { id: 'racks', x: 240, y: FLOOR, reach: 14, label: 'Look', knot: 'data_racks' },
    { id: 'screens', x: 72, y: FLOOR, reach: 10, label: 'Look', knot: 'data_screens' },
    { id: 'door', x: 590, y: FLOOR, reach: 14, label: 'Look', knot: 'data_door' },
  ],

  exits: [{ id: 'to-lifts', x: 34, y: FLOOR, reach: 12, to: 'lifts' }],
};
