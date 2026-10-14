import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './cityProps';
import { rail, scrollingScreen } from './citadelProps';
import type { AreaDefinition, Feature, Prop, Solid } from '../types';
import type { RowSprite } from '../../../ui/sprites';
import { cast, citizen, guard, inStory, patrol, strollingCitizen, watch, AWAKE, DAY, LATE, MORNING } from './people';

// The promenade (Chapter 3): the mid-city market, where the city meets, between the citadel and the low
// district (docs/areas/capital/promenade.md). The first street in the city, so it sets the look: the
// towers behind lit cyan and amber, the citadel high above them; shopfronts under striped awnings, their
// windows lit, signs of light flickering over them; a square with a great screen on a mast, food stalls
// steaming, benches, street lamps; a raised walkway on the right with more shops along it; cables slung
// overhead; rain at night. If you give the power to the people, it's the promenade that goes dark and
// rises (doc).

const W = 960;
const FLOOR = 232;
/** The raised walkway on the right, and the stair up to it. */
const WALK = 160;
const WALK_FROM = 600;
const WALK_TO = 900;

function walkwayStair(): Solid[] {
  const steps = (FLOOR - WALK) / 8;
  return Array.from({ length: steps - 1 }, (_, i) => {
    const x = WALK_FROM - 8 * (steps - 1) + 8 * i;
    const top = FLOOR - 8 * (i + 1);
    return { x, y: top, width: WALK_FROM - x, height: FLOOR - top, oneWay: true };
  });
}

/** A shopfront with the building above it, up to `top`. */
function shop(x: number, width: number, seed: number, floor: number, top: number): Prop[] {
  return [
    { sprite: P.facade(width, floor - 50 - top, seed), x, y: top },
    { sprite: P.shopfront(width, seed), x, y: floor - 50 },
  ];
}

/** A stall's steam, and a vent's. */
const steam = (x: number, y: number): Feature => ({ type: 'smoke', x, y, top: y - 90 });

/** Chapter 3, Day 1: the symbol in chalk, its right side already scrubbed away to a smear. */
const HALF_SCRUBBED: RowSprite = (() => {
  const chalk = P.symbolMark('chalk');
  const scrubbed = P.symbolMark('scrubbed');
  return { ...chalk, rows: chalk.rows.map((row, y) => row.slice(0, 11) + scrubbed.rows[y]!.slice(11)) };
})();

export const promenade: AreaDefinition = {
  id: 'promenade',
  name: 'the promenade',
  width: W,
  height: 270,
  cavity: { x: 0, y: 0, width: W, height: 270, radius: 0 },
  outdoor: { horizon: 206, treeX: 530, treeScale: 0.18, backdrop: 'city', citadelX: 230, ground: 'street' },
  ambient: 1,
  playerStart: { x: 60, y: FLOOR },
  surface: 'stone',
  acoustics: 'street',
  ambience: [
    { sound: 'footfall', volume: 0.3 },
    { sound: 'chatter', volume: 0.25 },
    { sound: 'hum', volume: 0.1 },
  ],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: WALK_FROM, y: WALK, width: WALK_TO - WALK_FROM, height: 6, oneWay: true },
    ...walkwayStair(),
    { x: 0, y: 0, width: 4, height: 270, invisible: true },
    { x: W - 4, y: 0, width: 4, height: 270, invisible: true },
  ],

  lights: [
    { x: 300, y: FLOOR, colour: S.cyan, radius: 50, radiusY: 10, strength: 0.4 },
    { x: 520, y: FLOOR, colour: S.cyan, radius: 50, radiusY: 10, strength: 0.4 },
    { x: 410, y: FLOOR, colour: S.cyan, radius: 90, radiusY: 10, strength: 0.25 }, // the great screen's glow on the square
    { x: 750, y: WALK, colour: S.amber, radius: 150, radiusY: 8, strength: 0.25 },
  ],

  lines: [
    // Cables slung overhead, sagging between the buildings.
    { from: { x: 0, y: 40 }, to: { x: 150, y: 52 }, colour: S.deep },
    { from: { x: 150, y: 52 }, to: { x: 300, y: 38 }, colour: S.deep },
    { from: { x: 300, y: 30 }, to: { x: 520, y: 48 }, colour: S.deep },
    { from: { x: 520, y: 48 }, to: { x: 700, y: 26 }, colour: S.deep },
    { from: { x: 640, y: 18 }, to: { x: 960, y: 34 }, colour: S.deep },
    // The great screen's mast.
    { from: { x: 410, y: 126 }, to: { x: 410, y: FLOOR - 1 }, colour: S.deep },
    { from: { x: 411, y: 126 }, to: { x: 411, y: FLOOR - 1 }, colour: S.woodLight },
  ],

  props: [
    // The left: shops along the street, the buildings over them; the alley to the gate.
    ...shop(16, 70, 1, FLOOR, 70),
    ...shop(90, 76, 2, FLOOR, 46),
    { sprite: P.alley(44, FLOOR - 80, 9), x: 168, y: 80 },
    ...shop(214, 62, 3, FLOOR, 66),
    // The square: stalls, a bench, a vent, lamps.
    { sprite: P.streetLamp(70), x: 296, y: FLOOR - 70 },
    { sprite: P.FOOD_STALL, x: 326, y: FLOOR - 40 },
    { sprite: P.STREET_BENCH, x: 390, y: FLOOR - 5 },
    { sprite: P.FOOD_STALL, x: 440, y: FLOOR - 40 },
    { sprite: P.VENT, x: 498, y: FLOOR - 8 },
    { sprite: P.streetLamp(70), x: 516, y: FLOOR - 70 },
    // The right: shops under the walkway, more along it, the buildings over them.
    // (The stair up to the walkway is open behind; the building with the walkway along it comes down to the
    // street, its upper shops on the walkway, its lower ones under it.)
    { sprite: P.facade(300, WALK - 24, 10), x: WALK_FROM, y: 24 },
    { sprite: P.facade(300, FLOOR - WALK - 6, 14), x: WALK_FROM, y: WALK + 6 },
    { sprite: P.shopfront(70, 5), x: 616, y: WALK - 50 },
    { sprite: P.shopfront(64, 6), x: 700, y: WALK - 50 },
    { sprite: P.shopfront(76, 7), x: 780, y: WALK - 50 },
    { sprite: P.shopfront(70, 8), x: 620, y: FLOOR - 50 },
    { sprite: P.shopfront(66, 11), x: 708, y: FLOOR - 50 },
    { sprite: P.shopfront(72, 12), x: 790, y: FLOOR - 50 },
    { sprite: rail(WALK_TO - WALK_FROM, 10), x: WALK_FROM, y: WALK - 10 },
    { sprite: P.facade(60, FLOOR - 70, 13), x: WALK_TO, y: 70 },
    { sprite: P.cableBundle(FLOOR - 70), x: WALK_TO + 4, y: 70 },
    { sprite: P.streetLamp(60), x: 930, y: FLOOR - 60 },
  ],

  features: [
    { type: 'rain' },
    { type: 'frames', frames: scrollingScreen(100, 56), x: 360, y: 70, every: 450 },
    { type: 'frames', frames: P.signFrames(36, 12, 1), x: 30, y: 100, every: 260 },
    { type: 'frames', frames: P.signFrames(28, 12, 2), x: 112, y: 78, every: 310 },
    { type: 'frames', frames: P.signFrames(30, 14, 3), x: 230, y: 104, every: 280 },
    { type: 'frames', frames: P.signFrames(44, 12, 4), x: 660, y: 48, every: 340 },
    { type: 'frames', frames: P.signFrames(26, 12, 5), x: 820, y: 66, every: 290 },
    steam(340, FLOOR - 22),
    // Chapter 3, Day 1, the official walk: a chalk bird half scrubbed off a wall; the stall keeper presses
    // food on you; people bow as you pass.
    { type: 'frames', frames: [HALF_SCRUBBED], x: 296, y: FLOOR - 24, every: 500, showIf: 'c3day1=walk,requests' },
    { type: 'trigger', x: 346, y: FLOOR, reach: 10, knot: 'c3day1_stall', showIf: 'c3day1=walk', hideIf: 'stall1' },
    { type: 'barks', lines: [{ who: 'passer-1', text: 'Highness.', wait: 2400 }, { who: 'shopper-3', text: 'Highness!', wait: 2400 }, { who: 'passer-2', text: 'Highness.' }], loopFrom: 99, showIf: 'c3day1=walk' },
    steam(454, FLOOR - 22),
    steam(503, FLOOR - 8),
    // Light running along the walkway's rail.
    { type: 'pulse', points: [{ x: WALK_FROM, y: WALK - 10 }, { x: WALK_TO, y: WALK - 10 }], speed: 90, every: 400, count: 2, colour: S.cyan },
  ],
  people: [
    // The stalls' cooks.
    citizen('cook-1', 1, 346, FLOOR, 'promenade_cook', AWAKE),
    citizen('cook-2', 10, 460, FLOOR, 'promenade_cook', AWAKE, { flipX: true }),
    // The square: people about their business, a kid, someone resting by the bench.
    strollingCitizen('passer-1', 0, 60, 560, FLOOR, 'promenade_folk', AWAKE),
    strollingCitizen('passer-2', 5, 220, 580, FLOOR, 'promenade_folk', DAY),
    strollingCitizen('passer-3', 12, 80, 300, FLOOR, 'promenade_folk', ['afternoon', 'evening']),
    strollingCitizen('kid', 6, 300, 520, FLOOR, 'c3_kid', DAY),
    citizen('resting', 3, 404, FLOOR, 'c3_old', ['afternoon']),
    // Shoppers along the walkway and under it.
    citizen('shopper-1', 8, 650, WALK, 'promenade_shopper', AWAKE),
    strollingCitizen('shopper-2', 11, 640, 880, WALK, 'promenade_shopper', DAY),
    citizen('shopper-3', 13, 800, FLOOR, 'promenade_shopper', AWAKE, { flipX: true }),
    // At night, in the rain: someone hooded, the watch on its beat.
    strollingCitizen('hooded', 2, 100, 900, FLOOR, 'promenade_night', ['night']),
    patrol('watch-1', 1, 200, 580, FLOOR, 'c3_watch', LATE),
    watch('watch-2', 0, 562, FLOOR, 'c3_watch', ['afternoon', 'night'], { flipX: true, hideIf: 'c3day1=walk,requests' }),
    // The commander of the watch, looking the square over.
    cast('commander', 540, FLOOR, { knot: 'promenade_commander', when: ['afternoon'] }),
    // The reformer talking to people in the morning; the kid who chalks the symbol; the envoy, lost, in the evening.
    cast('reformer', 480, FLOOR, { knot: 'promenade_reformer', when: MORNING }),
    cast('painter', 250, FLOOR, { knot: 'promenade_painter', when: MORNING }),
    cast('envoy', 250, FLOOR, { id: 'envoy-evening', knot: 'promenade_envoy', when: ['evening'] }),
    // Chapter 3's story. Day 1: a city worker scrubbing the chalk bird, one of your guards close by; your hand with you.
    citizen('scrubber', 14, 324, FLOOR, 'c3day1_scrubber', undefined, { showIf: 'c3day1=walk,requests', flipX: true }),
    guard('escort', 0, 236, FLOOR, 'c3_guard', undefined, { showIf: 'c3day1=walk' }),
    // Day 1, your duty: inspecting the watch. Its commander, and a pair of the watch at their post.
    inStory('commander-1', 'commander', 252, FLOOR, 'c3day1=walk,requests', { knot: 'c3day1_commander', flipX: true }),
    watch('post-1', 0, 196, FLOOR, 'c3_watch', undefined, { showIf: 'c3day1=walk,requests' }),
    watch('post-2', 1, 210, FLOOR, 'c3_watch', undefined, { showIf: 'c3day1=walk,requests', flipX: true }),
    inStory('hand', 'diplomat', 40, FLOOR, 'hand_with_you', { follow: true, knot: 'c3day1_hand_walk' }),
  ],
  interactables: [
    { id: 'screen', x: 410, y: FLOOR, reach: 10, label: 'Look', knot: 'promenade_screen' },
    { id: 'signs', x: 120, y: FLOOR, reach: 14, label: 'Look', knot: 'promenade_signs' },
    { id: 'view', x: 780, y: WALK, reach: 14, label: 'Look', knot: 'promenade_view' },
  ],

  exits: [
    { id: 'to-lifts', x: 24, y: FLOOR, reach: 14, to: 'lifts' },
    { id: 'to-gate', x: 186, y: FLOOR, reach: 12, to: 'city-gate' },
    { id: 'to-low-district', x: 940, y: FLOOR, reach: 14, to: 'low-district' },
  ],
};
