import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition, Solid } from '../types';
import { cast, citizen, courtier, guard, strollingServant, DAY, MORNING } from './people';

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
  playerStart: { x: 140, y: FLOOR },
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
    // The doors in: the great doors set in the old castle's gate, its portcullis raised for good.
    { sprite: P.oldArch(76, 100), x: 2, y: FLOOR - 100 },
    { sprite: P.PORTCULLIS, x: 16, y: FLOOR - 86 },
    { sprite: P.greatDoors(40, 62), x: 20, y: FLOOR - 62 },
    { sprite: P.doorway(26, 46), x: 104, y: FLOOR - 46 },
    // The petitioners' benches and the rope they wait behind.
    { sprite: P.rug(380), x: 170, y: FLOOR - 3 },
    { sprite: P.bench(56), x: 160, y: FLOOR - 9 },
    { sprite: P.bench(56), x: 250, y: FLOOR - 9 },
    { sprite: P.bench(56), x: 354, y: FLOOR - 9 },
    { sprite: P.bench(56), x: 440, y: FLOOR - 9 },
    { sprite: P.ropeLine(31), x: 528, y: FLOOR - 16 },
    // The dais: the great screen, the throne, your seat beside it.
    { sprite: P.column(DAIS - TOP), x: 596, y: TOP },
    { sprite: P.column(DAIS - TOP), x: 760, y: TOP },
    { sprite: P.rug(150), x: 604, y: DAIS - 3 },
    { sprite: P.HEIR_SEAT, x: 646, y: DAIS - 32 },
    { sprite: P.THRONE, x: 674, y: DAIS - 60 },
  ],

  features: [
    { type: 'frames', frames: P.scrollingScreen(120, 64), x: 620, y: TOP + 26, every: 450 },
    // Light running along the gold in the floor, towards the throne.
    { type: 'pulse', points: [{ x: 70, y: FLOOR + 3 }, { x: DAIS_FROM, y: FLOOR + 3 }], speed: 110, every: 300, count: 3, colour: S.cyan },
    { type: 'swing', sprite: P.CHANDELIER, x: 235, y: TOP + 62, ropeTop: TOP, quiet: true, ropeColour: S.amberDeep },
    { type: 'swing', sprite: P.CHANDELIER, x: 425, y: TOP + 62, ropeTop: TOP, quiet: true, ropeColour: S.amberDeep },
  ],
  people: [
    // The guards: on the great doors, by the dais, behind the throne.
    guard('door-guard', 0, 76, FLOOR, 'c3_guard'),
    guard('dais-guard-1', 1, 548, FLOOR, 'c3_guard', ['afternoon', 'evening', 'night'], { flipX: true }),
    guard('dais-guard-2', 0, 772, DAIS, 'c3_guard', undefined, { flipX: true }),
    // The morning's audience: petitioners in their best by the benches and at the rope, courtiers watching.
    citizen('petitioner-1', 1, 186, FLOOR, 'audience_petitioner', MORNING),
    citizen('petitioner-2', 5, 278, FLOOR, 'audience_petitioner', MORNING),
    citizen('petitioner-3', 3, 380, FLOOR, 'audience_petitioner', MORNING),
    citizen('petitioner-4', 2, 470, FLOOR, 'audience_petitioner', MORNING),
    citizen('petitioner-5', 12, 512, FLOOR, 'audience_petitioner', MORNING),
    citizen('petitioner-6', 9, 300, FLOOR, 'audience_petitioner', ['afternoon']),
    courtier('courtier-1', 0, 230, FLOOR, 'audience_courtier', MORNING),
    courtier('courtier-2', 7, 430, FLOOR, 'audience_courtier', DAY, { flipX: true }),
    strollingServant('sweeper', 0, 180, 500, FLOOR, 'c3_servant', ['evening']),
    // Your father on the throne, your hand beside your seat, the captain at the rope.
    cast('father', 689, DAIS, { knot: 'audience_father', when: MORNING, flipX: true }),
    cast('diplomat', 626, DAIS, { knot: 'audience_diplomat', when: MORNING, flipX: true }),
    cast('captain', 544, FLOOR, { knot: 'audience_captain', when: MORNING, flipX: true }),
    // The envoy, still waiting to be heard.
    cast('envoy', 512, FLOOR, { knot: 'audience_envoy', when: ['afternoon'] }),
  ],
  interactables: [
    { id: 'gate', x: 64, y: FLOOR, reach: 10, label: 'Look', knot: 'audience_gate' },
    { id: 'benches', x: 340, y: FLOOR, reach: 14, label: 'Look', knot: 'audience_benches' },
    { id: 'seat', x: 654, y: DAIS, reach: 10, label: 'Look', knot: 'audience_seat' },
    { id: 'throne', x: 704, y: DAIS, reach: 10, label: 'Look', knot: 'audience_throne' },
  ],

  exits: [
    { id: 'to-halls', x: 40, y: FLOOR, reach: 16, to: 'citadel-halls' },
    { id: 'to-lifts', x: 117, y: FLOOR, reach: 12, to: 'lifts' },
  ],
};
