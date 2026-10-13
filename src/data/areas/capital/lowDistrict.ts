import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './cityProps';
import type { AreaDefinition, Solid } from '../types';
import { cast, citizen, strollingCitizen, watch, AWAKE, DAY, LATE, MORNING } from './people';

// The low district (Chapter 3): cramped, at the bottom of the city (docs/areas/capital/low-district.md).
// Under a ceiling of cables slung between homes stacked and patched by hand; washing strung across, plants
// in pots, a cooking fire, steam; less power, so more amber from lamps and fires than blue, a dead screen.
// The towers and the citadel high above. Walkways along the stacks, stairs up to them. A low doorway at
// street level, steps going down into the dark: the way to the hideout. Where your hand takes you to see
// what's really going on (designer). The symbol chalked everywhere: Grounded's bird on bare ground (designer).

const W = 960;
const FLOOR = 236;
/** The walkways along the stacks: on the left, and on the right. */
const LEFT_WALK = 168;
const RIGHT_WALK = 150;

/** Stairs up to a walkway: from `foot` (where they start on the street), climbing towards `top` (where the walkway ends). */
function stairs(top: number, foot: number, level: number): Solid[] {
  const steps = (FLOOR - level) / 8;
  const dir = Math.sign(foot - top); // +1: the walkway is to the left, the stairs climb leftwards
  return Array.from({ length: steps - 1 }, (_, i) => {
    const y = FLOOR - 8 * (i + 1);
    const front = foot - dir * 8 * i; // this step's front edge
    const x = dir > 0 ? top : front;
    return { x, y, width: Math.abs(front - top), height: FLOOR - y, oneWay: true };
  });
}

export const lowDistrict: AreaDefinition = {
  id: 'low-district',
  name: 'the low district',
  width: W,
  height: 270,
  cavity: { x: 0, y: 0, width: W, height: 270, radius: 0 },
  outdoor: { horizon: 214, treeX: 60, treeScale: 0.16, backdrop: 'city', citadelX: 300, ground: 'street' },
  ambient: 1,
  playerStart: { x: 60, y: FLOOR },
  surface: 'stone',
  acoustics: 'street',
  ambience: [
    { sound: 'chatter', volume: 0.2 },
    { sound: 'hearth', volume: 0.2 },
    { sound: 'drips', volume: 0.2 },
  ],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 20, y: LEFT_WALK, width: 230, height: 6, oneWay: true },
    ...stairs(250, 314, LEFT_WALK),
    { x: 700, y: RIGHT_WALK, width: 240, height: 6, oneWay: true },
    ...stairs(700, 620, RIGHT_WALK),
    { x: 0, y: 0, width: 4, height: 270, invisible: true },
    { x: W - 4, y: 0, width: 4, height: 270, invisible: true },
  ],

  lights: [
    { x: 470, y: FLOOR, colour: S.amber, radius: 90, radiusY: 12, strength: 0.5 }, // the cooking fire
    { x: 140, y: LEFT_WALK, colour: S.amber, radius: 100, radiusY: 8, strength: 0.25 },
    { x: 820, y: RIGHT_WALK, colour: S.amber, radius: 100, radiusY: 8, strength: 0.25 },
  ],

  lines: [
    // The ceiling of cables, slung every way between the stacks.
    ...[[0, 30, 320, 52], [0, 60, 480, 40], [200, 20, 700, 46], [300, 70, 640, 30], [480, 36, 960, 64], [620, 18, 960, 40], [100, 90, 300, 74], [660, 84, 900, 96]].map(([x1, y1, x2, y2]) => ({ from: { x: x1!, y: y1! }, to: { x: x2!, y: y2! }, colour: S.deep })),
    { from: { x: 280, y: 50 }, to: { x: 680, y: 58 }, colour: S.cyanDeep },
    // The walkways' rails.
    { from: { x: 20, y: LEFT_WALK - 8 }, to: { x: 249, y: LEFT_WALK - 8 }, colour: S.woodPale },
    { from: { x: 700, y: RIGHT_WALK - 8 }, to: { x: 939, y: RIGHT_WALK - 8 }, colour: S.woodPale },
  ],

  props: [
    // The stacks, both sides: homes on homes over the walkways, shops along the street under them, right up
    // to the walkway (nothing floating, no gaps).
    { sprite: P.homes(250, LEFT_WALK - 20, 3), x: 16, y: 20 },
    { sprite: P.streetShop(62, 'noodles', 1, FLOOR - LEFT_WALK - 6), x: 18, y: LEFT_WALK + 6 },
    { sprite: P.streetShop(60, 'repairs', 2, FLOOR - LEFT_WALK - 6), x: 82, y: LEFT_WALK + 6 },
    { sprite: P.streetShop(58, 'cloth', 3, FLOOR - LEFT_WALK - 6), x: 144, y: LEFT_WALK + 6 },
    { sprite: P.homes(48, FLOOR - LEFT_WALK - 6, 8, { roof: false }), x: 202, y: LEFT_WALK + 6 },
    { sprite: P.homes(250, RIGHT_WALK - 10, 5), x: 700, y: 10 },
    { sprite: P.homes(150, FLOOR - RIGHT_WALK - 6, 6, { roof: false }), x: 704, y: RIGHT_WALK + 6 },
    { sprite: P.streetShop(82, 'grocer', 4, FLOOR - RIGHT_WALK - 6), x: 856, y: RIGHT_WALK + 6 },
    // Behind the street, between the stairs: more homes, further back (darker), so it's cramped; the towers
    // only over the rooftops. At the street, homes and two shops.
    { sprite: P.homes(304, FLOOR - 56 - 100, 7, { back: true }), x: 316, y: 100 },
    { sprite: P.homes(102, 56, 9, { roof: false }), x: 316, y: FLOOR - 56 },
    { sprite: P.streetShop(66, 'grocer', 5), x: 418, y: FLOOR - 56 },
    { sprite: P.streetShop(58, 'lamps', 6), x: 504, y: FLOOR - 56 },
    { sprite: P.homes(58, 56, 10, { roof: false }), x: 562, y: FLOOR - 56 },
    // Washing strung across the street and along the left walkway; plants by a door.
    { sprite: P.washing(150), x: 270, y: 90 },
    { sprite: P.washing(90), x: 40, y: LEFT_WALK - 26 },
    { sprite: P.POTS, x: 200, y: LEFT_WALK - 14 },
    { sprite: P.cableBundle(FLOOR - 20), x: 690, y: 20 },
    // The cooking stall and a vent steaming.
    { sprite: P.FOOD_STALL, x: 372, y: FLOOR - 40 },
    { sprite: P.VENT, x: 330, y: FLOOR - 8 },
    // The symbol, chalked on the walls (one half scrubbed off).
    { sprite: P.symbolMark('chalk'), x: 340, y: 116 },
    { sprite: P.symbolMark('chalk'), x: 580, y: 124 },
    { sprite: P.symbolMark('scrubbed'), x: 214, y: 192 },
    // The way down to the hideout.
    { sprite: P.CELLAR_DOOR, x: 586, y: FLOOR - 34 },
  ],

  features: [
    { type: 'rain' },
    { type: 'fire', x: 470, y: FLOOR - 1 },
    { type: 'smoke', x: 470, y: FLOOR - 10, top: 60 },
    { type: 'smoke', x: 386, y: FLOOR - 22, top: 90 },
    { type: 'smoke', x: 335, y: FLOOR - 8, top: 120 },
    { type: 'frames', frames: P.signFrames(24, 10, 21), x: 120, y: LEFT_WALK + 20, every: 330 },
  ],
  people: [
    // The street: the cook at the stall, the repairer outside his shop, the grocer's girl; people about.
    citizen('cook', 10, 392, FLOOR, AWAKE, { flipX: true }),
    citizen('repairer', 1, 112, FLOOR, AWAKE),
    citizen('grocer', 13, 880, FLOOR, DAY, { flipX: true }),
    strollingCitizen('mechanic', 7, 420, 680, FLOOR, DAY),
    strollingCitizen('walker', 5, 260, 560, FLOOR, MORNING),
    strollingCitizen('kids', 6, 330, 520, FLOOR, ['afternoon']),
    // Up on the walkways: an old woman by her door, neighbours.
    citizen('old-woman', 3, 120, LEFT_WALK, ['afternoon', 'evening']),
    citizen('neighbour', 12, 770, RIGHT_WALK, DAY, { flipX: true }),
    citizen('hooded-1', 9, 820, RIGHT_WALK, LATE),
    // The evening and the night: round the fire, out in the rain; the watch, watching.
    citizen('by-fire-1', 4, 456, FLOOR, LATE),
    citizen('by-fire-2', 11, 486, FLOOR, ['night'], { flipX: true }),
    strollingCitizen('young', 0, 300, 640, FLOOR, LATE),
    strollingCitizen('hooded-2', 2, 640, 900, FLOOR, ['night']),
    watch('watch', 1, 530, FLOOR, ['evening'], { flipX: true }),
    // The kid who chalks the symbol.
    cast('painter', 300, FLOOR, { knot: 'low_painter', when: ['afternoon', 'evening'] }),
  ],
  interactables: [],

  exits: [
    { id: 'to-lifts', x: 24, y: FLOOR, reach: 14, to: 'lifts' },
    { id: 'to-hideout', x: 601, y: FLOOR, reach: 12, to: 'hideout' },
    { id: 'to-promenade', x: 940, y: FLOOR, reach: 14, to: 'promenade' },
  ],
};
