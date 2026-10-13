import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition } from '../types';

// The banquet gallery (Chapter 3): dinners and balls, where you feel the tension: flat toasts, empty seats
// (docs/areas/capital/banquet-gallery.md). A long gallery: the dance floor at one end under a screen; the
// long table down the middle, gold everywhere, a high chair at its head for your father; a balcony at the
// far end, open over the city.

const W = 800;
const FLOOR = 230;
const TOP = 30;
/** Where the gallery opens onto its balcony. */
const BALCONY = 674;
const TABLE = { x: 250, width: 340 };

export const banquetGallery: AreaDefinition = {
  id: 'banquet-gallery',
  name: 'the banquet gallery',
  width: W,
  height: 270,
  walls: 'marble',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.86,
  playerStart: { x: 40, y: FLOOR },
  surface: 'stone',
  acoustics: 'hall',
  ambience: [
    { sound: 'room', volume: 0.35 },
    { sound: 'hum', volume: 0.15 },
    { sound: 'wind', volume: 0.15 },
  ],

  views: [{ x: BALCONY, y: 0, width: W - BALCONY, height: FLOOR, horizon: 124, treeX: 760, treeScale: 0.2 }],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 14, y: 0, width: 14, height: 270, invisible: true }, // the balcony's rail
  ],

  lights: [
    { x: 420, y: 170, colour: S.amber, radius: 200, radiusY: 50, strength: 0.18 }, // over the table
    { x: 110, y: 120, colour: S.cyan, radius: 90, radiusY: 60, strength: 0.16 }, // the screen over the dance floor
  ],

  lines: [],

  props: [
    { sprite: P.doorway(24, 46), x: 22, y: FLOOR - 46 },
    // The dance floor and its screen.
    { sprite: P.rug(160), x: 56, y: FLOOR - 3 },
    { sprite: P.column(FLOOR - TOP), x: 228, y: TOP },
    // The long table: chairs along its far side, every place empty.
    ...Array.from({ length: 8 }, (_, i) => ({ sprite: P.BANQUET_CHAIR, x: TABLE.x + 14 + i * 40, y: FLOOR - 26 })),
    { sprite: P.longTable(TABLE.width), x: TABLE.x, y: FLOOR - 20 },
    { sprite: P.HIGH_CHAIR, x: TABLE.x + TABLE.width + 4, y: FLOOR - 28 },
    { sprite: P.screen(44, 26), x: 400, y: TOP + 34 },
    { sprite: P.banner(18, 80), x: 290, y: TOP + 10 },
    { sprite: P.banner(18, 80), x: 540, y: TOP + 10 },
    { sprite: P.lightStrip(110), x: 340, y: TOP + 20 },
    { sprite: P.lightStrip(110), x: 500, y: TOP + 20 },
    // The balcony.
    { sprite: P.column(FLOOR - TOP), x: BALCONY - 10, y: TOP },
    { sprite: P.rail(W - BALCONY - 14, 16), x: BALCONY, y: FLOOR - 16 },
    { sprite: P.column(30), x: W - 14, y: FLOOR - 30 },
  ],

  features: [
    { type: 'frames', frames: P.scrollingScreen(90, 50), x: 70, y: TOP + 30, every: 450 },
    ...[330, 420, 510].map((x) => ({ type: 'swing' as const, sprite: P.CHANDELIER, x, y: TOP + 56, ropeTop: TOP, quiet: true, ropeColour: S.amberDeep })),
  ],
  people: [],
  interactables: [],

  exits: [{ id: 'to-halls', x: 34, y: FLOOR, reach: 12, to: 'citadel-halls' }],
};
