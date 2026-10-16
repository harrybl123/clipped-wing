import { SHADES as S } from '../../../ui/pixelArt';
import { liftCar, liftShaft, scrollingScreen } from './citadelProps';
import * as P from './cityProps';
import type { AreaDefinition } from '../types';
import { cast, citizen, inStory, watch, DAY, LATE, MORNING } from './people';

// The lifts (Chapter 3): glass lifts up the face of the city, between the citadel and the streets, where
// messages change hands (docs/areas/capital/lifts.md). Three screens high: a tower's face, and stations
// jutting out from it at each level, the citadel at the top, the promenade, the data centre, the low
// district at the bottom; the city's towers all round, lit at night, rain. Two glass shafts: the cars take
// you a stage at a time (the citadel to the promenade, the promenade to the data centre, the data centre
// down to the street). The lift operator's booth at the bottom, where they see who rides where.

const W = 480;
const H = 810;
/** The stations. */
const CITADEL = 130;
const PROMENADE = 330;
const DATA = 530;
const FLOOR = 770;
/** The two shafts' left edges; each car is 32 wide. */
const L = 180;
const R = 290;
const CAR = 32;

export const lifts: AreaDefinition = {
  id: 'lifts',
  name: 'the lifts',
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 340, treeX: 420, treeScale: 0.16, backdrop: 'city', citadelX: 120, ground: 'street' },
  ambient: 1,
  playerStart: { x: 60, y: CITADEL },
  surface: 'stone',
  acoustics: 'high',
  ambience: [
    { sound: 'wind', volume: 0.35 },
    { sound: 'hum', volume: 0.15 },
  ],

  solids: [
    { x: 16, y: CITADEL, width: L - 16, height: 8, oneWay: true }, // the citadel's station
    { x: L + CAR, y: PROMENADE, width: R - L - CAR, height: 8, oneWay: true }, // the promenade's, between the shafts
    { x: L + CAR, y: DATA, width: R - L - CAR, height: 8, oneWay: true }, // the data centre's, between the shafts...
    { x: R + CAR, y: DATA, width: W - 16 - R - CAR, height: 8, oneWay: true }, // ...and out to its door
    { x: 0, y: FLOOR, width: W, height: H - FLOOR }, // the street
    { x: 0, y: 0, width: 4, height: H, invisible: true },
    { x: W - 4, y: 0, width: 4, height: H, invisible: true },
  ],

  lights: [
    { x: 100, y: CITADEL, colour: S.amber, radius: 80, radiusY: 8, strength: 0.3 },
    { x: 260, y: PROMENADE, colour: S.amber, radius: 60, radiusY: 8, strength: 0.3 },
    { x: 380, y: DATA, colour: S.cyan, radius: 90, radiusY: 8, strength: 0.4 },
    { x: 240, y: FLOOR, colour: S.amber, radius: 140, radiusY: 10, strength: 0.3 },
  ],

  lines: [
    // The stations between the shafts hang on girders from the shafts' frames: a beam under each, struts.
    ...[PROMENADE, DATA].flatMap((y) => [
      { from: { x: L + CAR, y: y + 8 }, to: { x: R - 1, y: y + 8 }, colour: S.deep },
      { from: { x: L + CAR, y: y + 9 }, to: { x: R - 1, y: y + 9 }, colour: S.woodLight },
      { from: { x: L + CAR + 1, y: y + 9 }, to: { x: L + CAR + 14, y: y + 22 }, colour: S.woodLight },
      { from: { x: R - 2, y: y + 9 }, to: { x: R - 15, y: y + 22 }, colour: S.woodLight },
    ]),
    // The citadel's station on brackets out from the tower.
    { from: { x: 156, y: CITADEL + 8 }, to: { x: 176, y: CITADEL + 8 }, colour: S.deep },
    { from: { x: 156, y: CITADEL + 24 }, to: { x: 176, y: CITADEL + 9 }, colour: S.woodLight },
    // Cables down the tower's face.
    { from: { x: 150, y: 0 }, to: { x: 150, y: FLOOR }, colour: S.deep },
    { from: { x: 440, y: 200 }, to: { x: 440, y: FLOOR }, colour: S.deep },
  ],

  props: [
    // The tower the lifts climb: its face down the left.
    { sprite: P.facade(140, FLOOR - CITADEL - 8, 31), x: 16, y: CITADEL + 8 },
    { sprite: P.facade(150, CITADEL - 20, 32), x: 16, y: 20 },
    // The glass shafts.
    // (Both run the tower's full height, from its top down to the street: nothing hangs in the air.)
    { sprite: liftShaft(CAR + 4, FLOOR - 20), x: L - 2, y: 20 },
    { sprite: liftShaft(CAR + 4, FLOOR - 20), x: R - 2, y: 20 },
    // The stations' signs.
    { sprite: P.neonSign(30, 10, 41), x: 40, y: CITADEL - 40 },
    // The data centre's side of its station: a building with its door.
    { sprite: P.facade(130, DATA - 300, 33), x: R + CAR + 4, y: 300 },
    { sprite: P.facade(130, FLOOR - DATA - 8, 34), x: R + CAR + 4, y: DATA + 8 },
    // The street at the bottom: the operator's booth, a lamp.
    { sprite: P.BOOTH, x: 240, y: FLOOR - 50 },
    { sprite: P.streetLamp(60), x: 120, y: FLOOR - 60 },
    { sprite: P.streetLamp(60), x: 420, y: FLOOR - 60 },
  ],

  features: [
    { type: 'rain' },
    // Day 7's night: the lift operator sees the two of you, and looks away.
    { type: 'trigger', x: 96, y: CITADEL, reach: 16, knot: 'c3day7_lifts', showIf: 'c3day7=lifts', hideIf: 'lifts7' },
    // The cars, each a stage of the way.
    { type: 'mover', sprite: liftCar(CAR), x: L, y: CITADEL - 2, to: { x: L, y: PROMENADE - 2 }, speed: 60 },
    { type: 'mover', sprite: liftCar(CAR), x: R, y: PROMENADE - 2, to: { x: R, y: DATA - 2 }, speed: 60 },
    { type: 'mover', sprite: liftCar(CAR), x: L, y: DATA - 2, to: { x: L, y: FLOOR - 2 }, speed: 60 },
    { type: 'frames', frames: scrollingScreen(48, 30), x: 360, y: 380, every: 400 },
    { type: 'frames', frames: P.signFrames(36, 12, 42), x: 40, y: PROMENADE + 30, every: 300 },
    // Day 3 on: the wing scratched into the shaft's glass at the top, at eye height.
    { type: 'frames', frames: [P.symbolMark('scratch')], x: L + 6, y: CITADEL - 34, every: 60000, showIf: 'c3day3', power: 'any' },
    // And the reward notice on the tower's face, by the street.
    { type: 'frames', frames: P.REWARD_FRAMES, x: 74, y: FLOOR - 74, every: 260, showIf: 'rewards', power: 'any' },
    // (Day 5 on: the word, and your father's hand on your shoulder; the face of the man you let go.)
    ...P.terrorScreens(66, FLOOR - 74),
  ],
  people: [
    cast('lift_operator', 150, CITADEL, { knot: 'lifts_operator' }), // at the top, always
    citizen('waiting-1', 5, 264, PROMENADE, 'lifts_folk', DAY),
    citizen('waiting-2', 0, 228, PROMENADE, 'lifts_folk', ['evening']),
    citizen('clerk', 11, 404, DATA, 'lifts_folk', DAY),
    cast('engineer', 350, DATA, { knot: 'lifts_engineer', when: MORNING }),
    citizen('street-1', 4, 330, FLOOR, 'lifts_folk', LATE),
    watch('watch', 0, 90, FLOOR, 'c3_watch', ['night']),
    // Chapter 3's story: the lift operator at the top, as always; your hand with you (Day 1).
    inStory('lift-operator', 'lift_operator', 150, CITADEL, 'c3_story', { knot: 'lifts_operator' }),
    inStory('hand', 'diplomat', 60, CITADEL, 'hand_with_you', { follow: true, knot: 'c3day1_hand_walk' }),
    inStory('heir-f', 'heir', 44, CITADEL, 'heir_with_you', { follow: true, knot: 'c3day7_heir_walk' }),
    // Day 4, the afternoon: the kid from the cellar, at the foot of the lifts, watching them come down.
    inStory('painter-4', 'painter', 120, FLOOR, 'c3day4=afternoon', { knot: 'c3day4_painter', hideIf: 'painter4' }),
    // Day 5, the address (a cutaway): the queue for the first car up, stopped under the screen on the tower.
    ...([[84, 7], [100, 3], [118, 10], [140, 5], [158, 14]] as const).map(([x, look], i) =>
      citizen(`lift-5${'abcde'[i]}`, look, x, FLOOR, 'c3day5_watching', undefined, { showIf: 'c3day5=speech', flipX: x > 97 })),
  ],
  interactables: [
    { id: 'glass', x: 100, y: CITADEL, reach: 14, label: 'Look', knot: 'lifts_glass' },
    { id: 'booth', x: 258, y: FLOOR, reach: 14, label: 'Look', knot: 'lifts_booth' },
  ],

  exits: [
    { id: 'to-audience-hall', x: 40, y: CITADEL, reach: 14, to: 'audience-hall' },
    { id: 'to-promenade', x: 248, y: PROMENADE, reach: 12, to: 'promenade' },
    { id: 'to-data-centre', x: 440, y: DATA, reach: 14, to: 'data-centre' },
    { id: 'to-low-district', x: 40, y: FLOOR, reach: 14, to: 'low-district' },
  ],
};
