import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './cityProps';
import type { AreaDefinition } from '../types';
import { cast, citizen, LATE } from './people';

// The hideout (Chapter 3): under the low district, an old cellar of rough stone, the city's oldest, made
// a bar: where citizens band together against injustice, and the capital and your father call them
// terrorists (designer; docs/areas/capital/hideout.md). Warm, low, lamps hanging in cages; the counter,
// bottles catching the light, small tables; the steps up to the street; a back way out into the dark.
// Raided and ransacked while you're there (designer): after, smashed and dark (not built yet). The symbol
// painted large on the wall: Grounded's bird on bare ground (designer).

const W = 480;
const FLOOR = 226;
const TOP = 80;

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
    // The symbol, painted large: Grounded's bird on bare ground (designer).
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
  ],
  people: [
    cast('hideout_keeper', 404, FLOOR, { knot: 'hideout_keeper', flipX: true }), // behind the counter, always
    // The evening and the night: regulars round the long table and the small ones, one at the counter.
    citizen('regular-1', 0, 128, FLOOR, 'hideout_folk', LATE),
    citizen('regular-2', 7, 168, FLOOR, 'hideout_folk', LATE, { flipX: true }),
    citizen('regular-3', 12, 206, FLOOR, 'hideout_folk', LATE),
    citizen('regular-4', 13, 252, FLOOR, 'hideout_folk', ['night'], { flipX: true }),
    citizen('at-counter', 4, 332, FLOOR, 'hideout_folk', LATE),
    citizen('in-the-corner', 2, 76, FLOOR, 'hideout_corner', ['night']),
    citizen('regular', 5, 290, FLOOR, 'hideout_regular', LATE, { flipX: true }),
  ],
  interactables: [
    { id: 'emblem', x: 180, y: FLOOR, reach: 14, label: 'Look', knot: 'hideout_emblem' },
    { id: 'notices', x: 106, y: FLOOR, reach: 10, label: 'Look', knot: 'hideout_notices' },
    { id: 'back-way', x: 456, y: FLOOR, reach: 10, label: 'Look', knot: 'hideout_back_way' },
  ],

  exits: [{ id: 'to-low-district', x: 39, y: FLOOR, reach: 12, to: 'low-district' }],
};
