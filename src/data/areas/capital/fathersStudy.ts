import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition } from '../types';

// Your father's study (Chapter 3): his wisdom (docs/areas/capital/fathers-study.md). The warmest room in
// the citadel: dark wood panelling over the marble floor, shelves of books and old things from before, amber lamplight,
// a clock. His desk by the window over the city, a screen on it kept face down. In the back wall, the
// door to the sealed wing, and you can hear it hum.

const W = 480;
const FLOOR = 230;
const TOP = 40;

export const fathersStudy: AreaDefinition = {
  id: 'fathers-study',
  name: "your father's study",
  width: W,
  height: 270,
  walls: 'panelled',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.72,
  playerStart: { x: 40, y: FLOOR },
  surface: 'stone',
  acoustics: 'small',
  ambience: [
    { sound: 'room', volume: 0.3 },
    { sound: 'clock', volume: 0.35 },
    { sound: 'hum', volume: 0.3 },
  ],

  views: [{ x: 392, y: 74, width: 52, height: 92, horizon: 120, treeX: 430, treeScale: 0.16, mullions: 13 }],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 366, y: 196, colour: S.amber, radius: 90, radiusY: 50, strength: 0.32 }, // the desk lamp
    { x: 150, y: 150, colour: S.amber, radius: 140, radiusY: 80, strength: 0.14 }, // the room, warm
    { x: 286, y: 200, colour: S.cyan, radius: 30, radiusY: 40, strength: 0.14 }, // round the sealed wing's door
  ],

  lines: [],

  props: [
    { sprite: P.doorway(24, 46), x: 22, y: FLOOR - 46 },
    { sprite: P.bookshelf(130, 112), x: 60, y: FLOOR - 112 },
    { sprite: P.bookshelf(60, 112), x: 196, y: FLOOR - 112 },
    // The door to the sealed wing: plain, dark, blue light at its edges.
    { sprite: P.doorway(26, 50), x: 273, y: FLOOR - 50 },
    { sprite: P.rug(150), x: 300, y: FLOOR - 3 },
    { sprite: P.DESK, x: 330, y: FLOOR - 26 },
    { sprite: P.HIGH_CHAIR, x: 378, y: FLOOR - 28 },
    { sprite: P.LAMP, x: 448, y: FLOOR - 7 },
  ],

  features: [],
  people: [],
  interactables: [],

  exits: [
    { id: 'to-halls', x: 34, y: FLOOR, reach: 12, to: 'citadel-halls' },
    { id: 'to-sealed-wing', x: 286, y: FLOOR, reach: 14, to: 'sealed-wing' },
  ],
};
