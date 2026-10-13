import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition } from '../types';

// Your quarters (Chapter 3): the prince's private rooms high in the citadel, and the first area of the
// capital, so it sets the look (docs/areas/capital/prince-quarters.md): white marble with grey veins, gold,
// blue light up the seams; calm and expensive, too quiet. The bedroom on the left, the door out to the
// halls; a sitting room with a screen and a tall window; then the balcony, open to the sky, where you can
// stand at the rail over the whole city, the low district in shadow at the bottom, and the tree far off on
// the horizon. The view is painted for the time of day.

const W = 560;
const FLOOR = 226;
const TOP = 40;
/** Where the room ends and the balcony begins, open to the sky. */
const BALCONY = 394;

export const princeQuarters: AreaDefinition = {
  id: 'prince-quarters',
  name: 'your quarters',
  width: W,
  height: 270,
  walls: 'marble',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 1,
  playerStart: { x: 120, y: FLOOR },
  surface: 'stone',
  acoustics: 'small',
  ambience: [
    { sound: 'room', volume: 0.3 },
    { sound: 'hum', volume: 0.12 },
    { sound: 'wind', volume: 0.25 },
  ],

  views: [
    // The tall window in the sitting room.
    { x: 270, y: 78, width: 56, height: 96, horizon: 128, treeX: 640, mullions: 14 },
    // The balcony's open side: sky to the top, the city below, the tree on the horizon.
    { x: BALCONY, y: 0, width: W - BALCONY, height: FLOOR, horizon: 116, treeX: 500, treeScale: 0.22 },
  ],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 14, y: 0, width: 14, height: 270, invisible: true }, // the balcony's rail
  ],

  lights: [
    { x: 92, y: 188, colour: S.amber, radius: 80, radiusY: 40, strength: 0.14 }, // by the bed
    { x: 230, y: 196, colour: S.amber, radius: 70, radiusY: 34, strength: 0.18 }, // the lamp by the couch
    { x: 344, y: 116, colour: S.cyan, radius: 40, radiusY: 26, strength: 0.12 }, // the screen
    { x: BALCONY, y: 150, colour: S.white, radius: 60, radiusY: 110, strength: 0.1 }, // daylight in from the balcony
  ],

  lines: [],

  props: [
    // The door out to the halls.
    { sprite: P.doorway(24, 46), x: 24, y: FLOOR - 46 },
    // The bedroom.
    { sprite: P.rug(90), x: 62, y: FLOOR - 3 },
    { sprite: P.BED, x: 66, y: FLOOR - 22 },
    { sprite: P.LAMP, x: 126, y: FLOOR - 7 },
    { sprite: P.WARDROBE, x: 146, y: FLOOR - 52 },
    { sprite: P.MIRROR, x: 178, y: FLOOR - 48 },
    // The sitting room.
    { sprite: P.rug(120), x: 206, y: FLOOR - 3 },
    { sprite: P.LAMP, x: 210, y: FLOOR - 7 },
    { sprite: P.COUCH, x: 220, y: FLOOR - 16 },
    { sprite: P.LOW_TABLE, x: 266, y: FLOOR - 7 },
    { sprite: P.screen(44, 28), x: 334, y: 100 },
    // The columns at the balcony's opening, and the rail along it.
    { sprite: P.column(FLOOR - TOP), x: BALCONY - 10, y: TOP },
    { sprite: P.rail(W - BALCONY - 14, 16), x: BALCONY, y: FLOOR - 16 },
    { sprite: P.column(30), x: W - 14, y: FLOOR - 30 },
  ],

  features: [],
  people: [],
  interactables: [],

  exits: [{ id: 'to-halls', x: 36, y: FLOOR, reach: 12, to: 'citadel-halls' }],
};
