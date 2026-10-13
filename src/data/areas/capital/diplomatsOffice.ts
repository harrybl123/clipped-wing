import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition } from '../types';

// The diplomat's office (Chapter 3): your hand's office: maps, letters, and visitors at odd hours
// (docs/areas/capital/diplomats-office.md). Busy and warm, unlike the rest of the citadel: the wall of
// maps, the city and the managed places beyond, threads between the pins; letters in piles; a screen of
// messages; his desk. A private door at the back, down to the lifts (how you slip out unseen).

const W = 480;
const FLOOR = 230;
const TOP = 40;

export const diplomatsOffice: AreaDefinition = {
  id: 'diplomats-office',
  name: "the diplomat's office",
  width: W,
  height: 270,
  walls: 'marble',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.8,
  playerStart: { x: 40, y: FLOOR },
  surface: 'stone',
  acoustics: 'small',
  ambience: [
    { sound: 'room', volume: 0.3 },
    { sound: 'pages', volume: 0.2 },
  ],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 180, y: 110, colour: S.amber, radius: 120, radiusY: 60, strength: 0.2 }, // the maps, lamplit
    { x: 300, y: 200, colour: S.amber, radius: 70, radiusY: 34, strength: 0.18 }, // the desk
    { x: 380, y: 100, colour: S.cyan, radius: 40, radiusY: 30, strength: 0.14 }, // the screen
  ],

  lines: [
    // The message tube, down from the ceiling to his desk.
    { from: { x: 299, y: TOP }, to: { x: 299, y: FLOOR - 62 }, colour: S.amberDeep },
    { from: { x: 302, y: TOP }, to: { x: 302, y: FLOOR - 62 }, colour: S.amber },
  ],

  props: [
    { sprite: P.doorway(24, 46), x: 22, y: FLOOR - 46 },
    { sprite: P.MAP_WALL, x: 120, y: 72 },
    { sprite: P.LOW_TABLE, x: 70, y: FLOOR - 7 },
    { sprite: P.LETTERS, x: 71, y: FLOOR - 14 },
    { sprite: P.LETTERS, x: 96, y: FLOOR - 7 },
    { sprite: P.rug(140), x: 240, y: FLOOR - 3 },
    { sprite: P.DESK, x: 260, y: FLOOR - 26 },
    { sprite: P.LETTERS, x: 262, y: FLOOR - 33 },
    { sprite: P.HIGH_CHAIR, x: 308, y: FLOOR - 28 },
    { sprite: P.TUBE_MOUTH, x: 299, y: FLOOR - 62 },
    // His private door, down to the lifts.
    { sprite: P.doorway(24, 46), x: 424, y: FLOOR - 46 },
  ],

  features: [
    { type: 'pulse', points: [{ x: 301, y: TOP + 2 }, { x: 301, y: FLOOR - 58 }], speed: 170, every: 2600, sprite: P.CAPSULE },
    { type: 'frames', frames: P.scrollingScreen(44, 28), x: 358, y: 86, every: 400 },
  ],
  people: [],
  interactables: [],

  exits: [
    { id: 'to-halls', x: 34, y: FLOOR, reach: 12, to: 'citadel-halls' },
    { id: 'to-lifts', x: 436, y: FLOOR, reach: 12, to: 'lifts' },
  ],
};
