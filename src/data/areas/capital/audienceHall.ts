import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition, Solid } from '../types';

// The audience hall (Chapter 3): where envoys and petitioners come before the throne
// (docs/areas/capital/audience-hall.md). Huge and cold: marble columns, a gold-inlaid floor, high windows,
// blue light up the walls. The doors in from the halls and the lifts on the left; petitioners' benches;
// the dais on the right, the throne on it under the great screen, your seat beside your father's. The
// broadcast is made from here, the city watching on every screen (designer).

const W = 800;
const FLOOR = 236;
const TOP = 20;
/** The dais: three steps up to it from the left. */
const DAIS_FROM = 560;
const DAIS = FLOOR - 24;

function dais(): Solid[] {
  return [0, 1, 2].map((i) => {
    const x = DAIS_FROM + 8 * i;
    const top = FLOOR - 8 * (i + 1);
    return { x, y: top, width: W - 16 - x, height: FLOOR - top, oneWay: true };
  });
}

export const audienceHall: AreaDefinition = {
  id: 'audience-hall',
  name: 'the audience hall',
  width: W,
  height: 270,
  walls: 'marble',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.9,
  playerStart: { x: 120, y: FLOOR },
  surface: 'stone',
  acoustics: 'hall',
  ambience: [
    { sound: 'room', volume: 0.4 },
    { sound: 'hum', volume: 0.2 },
  ],

  views: [
    // High windows, mostly sky.
    { x: 196, y: TOP + 12, width: 44, height: 46, horizon: TOP + 52, treeX: 2000, mullions: 11 },
    { x: 386, y: TOP + 12, width: 44, height: 46, horizon: TOP + 52, treeX: 2000, mullions: 11 },
  ],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    ...dais(),
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 680, y: 80, colour: S.cyan, radius: 120, radiusY: 60, strength: 0.18 }, // the great screen
    { x: 670, y: 190, colour: S.amber, radius: 90, radiusY: 40, strength: 0.14 }, // the dais
    { x: 50, y: 200, colour: S.amber, radius: 60, radiusY: 40, strength: 0.12 }, // the doors
  ],

  lines: [
    // Gold inlaid down the length of the floor, towards the throne.
    { from: { x: 16, y: FLOOR + 3 }, to: { x: DAIS_FROM - 1, y: FLOOR + 3 }, colour: S.amberDeep },
  ],

  props: [
    { sprite: P.column(FLOOR - TOP), x: 140, y: TOP },
    { sprite: P.column(FLOOR - TOP), x: 330, y: TOP },
    { sprite: P.column(FLOOR - TOP), x: 520, y: TOP },
    { sprite: P.lightStrip(110), x: 240, y: 110 },
    { sprite: P.lightStrip(110), x: 430, y: 110 },
    { sprite: P.banner(20, 90), x: 266, y: TOP + 14 },
    { sprite: P.banner(20, 90), x: 456, y: TOP + 14 },
    // The doors in.
    { sprite: P.greatDoors(40, 62), x: 20, y: FLOOR - 62 },
    { sprite: P.doorway(26, 46), x: 77, y: FLOOR - 46 },
    // The petitioners' benches and the rope they wait behind.
    { sprite: P.rug(380), x: 170, y: FLOOR - 3 },
    { sprite: P.bench(56), x: 160, y: FLOOR - 9 },
    { sprite: P.bench(56), x: 250, y: FLOOR - 9 },
    { sprite: P.bench(56), x: 354, y: FLOOR - 9 },
    { sprite: P.bench(56), x: 440, y: FLOOR - 9 },
    { sprite: P.ropeLine(31), x: 528, y: FLOOR - 16 },
    // The dais: the great screen, the throne, your seat beside it.
    { sprite: P.screen(120, 64), x: 620, y: TOP + 26 },
    { sprite: P.column(DAIS - TOP), x: 596, y: TOP },
    { sprite: P.column(DAIS - TOP), x: 760, y: TOP },
    { sprite: P.rug(150), x: 604, y: DAIS - 3 },
    { sprite: P.HEIR_SEAT, x: 646, y: DAIS - 32 },
    { sprite: P.THRONE, x: 674, y: DAIS - 60 },
  ],

  features: [],
  people: [],
  interactables: [],

  exits: [
    { id: 'to-halls', x: 40, y: FLOOR, reach: 16, to: 'citadel-halls' },
    { id: 'to-lifts', x: 90, y: FLOOR, reach: 12, to: 'lifts' },
  ],
};
