import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition, Solid } from '../types';
import { guard, cast, courtier, strollingCourtier, strollingServant, DAY, LATE, MORNING } from './people';

// The citadel's halls (Chapter 3): the corridors joining the citadel's rooms (designer: corridors in the
// citadel; docs/areas/capital/citadel-halls.md). Long marble halls on two floors, joined by a grand stair
// in the middle: two flights rising out from a foot between them, under the great screen. Below, the state
// floor: the great doors of the audience hall, the council chamber, the banquet gallery, the glasshouse;
// statues of the rulers before your father, screens. Above, the private floor: your quarters, your
// father's study, the diplomat's office, the guest wing, with tall windows over the city between them.

const W = 960;
const FLOOR = 232;
const UPPER = 136;
const TOP = 24;
/** The grand stair's foot, in the middle: a little landing between the flights, so each has an edge to step up. */
const C = W / 2;
const FOOT = 12;
const STEPS = (FLOOR - UPPER) / 8;
/** Where each flight meets the upper floor. */
const CL = C - FOOT - 8 * (STEPS - 1);
const CR = C + FOOT + 8 * (STEPS - 1);

/** The two flights, rising out from the foot: one leftwards up to the left gallery, one rightwards to the right. */
function grandStair(): Solid[] {
  return Array.from({ length: STEPS - 1 }, (_, i) => {
    const top = FLOOR - 8 * (i + 1);
    const width = 8 * (STEPS - 2 - i) + 8;
    // Each step's block runs from the top of its flight out to its own front edge, so they paint as stairs.
    return [
      { x: CL, y: top, width, height: FLOOR - top, oneWay: true },
      { x: CR - width, y: top, width, height: FLOOR - top, oneWay: true },
    ];
  }).flat();
}

/** The glass lift's shaft, at the far end, between the floors. */
const LIFT = W - 16 - 32;
/** The message tube: along the ceiling, then down into the top of the diplomat's door. */
const TUBE_Y = TOP + 5;
const TUBE_DOWN = 732;

/** A tall window onto the city, on the upper floor. */
const tallWindow = (x: number) => ({ x, y: TOP + 22, width: 52, height: 72, horizon: TOP + 58, treeX: 2000, mullions: 13 });

export const citadelHalls: AreaDefinition = {
  id: 'citadel-halls',
  name: "the citadel's halls",
  width: W,
  height: 270,
  walls: 'marble',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.95,
  playerStart: { x: 140, y: UPPER },
  surface: 'stone',
  acoustics: 'hall',
  ambience: [
    { sound: 'room', volume: 0.35 },
    { sound: 'hum', volume: 0.18 },
  ],

  views: [tallWindow(140), tallWindow(300), tallWindow(610), tallWindow(764)],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 16, y: UPPER, width: CL - 16, height: 6, oneWay: true }, // the left gallery
    { x: CR, y: UPPER, width: LIFT - CR, height: 6, oneWay: true }, // the right gallery, up to the lift's shaft
    ...grandStair(),
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: C, y: 70, colour: S.cyan, radius: 90, radiusY: 50, strength: 0.16 }, // the great screen over the stair
    { x: 120, y: 200, colour: S.amber, radius: 70, radiusY: 36, strength: 0.16 }, // by the great doors
    { x: 300, y: 205, colour: S.amber, radius: 60, radiusY: 30, strength: 0.1 },
    { x: 660, y: 205, colour: S.amber, radius: 60, radiusY: 30, strength: 0.1 },
    { x: 840, y: 205, colour: S.amber, radius: 60, radiusY: 30, strength: 0.1 },
  ],

  lines: [
    // The message tube, brass: along the ceiling and down to the diplomat's door.
    { from: { x: 16, y: TUBE_Y - 1 }, to: { x: TUBE_DOWN + 1, y: TUBE_Y - 1 }, colour: S.amber },
    { from: { x: 16, y: TUBE_Y + 1 }, to: { x: TUBE_DOWN - 1, y: TUBE_Y + 1 }, colour: S.amberDeep },
    { from: { x: TUBE_DOWN + 1, y: TUBE_Y - 1 }, to: { x: TUBE_DOWN + 1, y: UPPER - 49 }, colour: S.amber },
    { from: { x: TUBE_DOWN - 1, y: TUBE_Y + 1 }, to: { x: TUBE_DOWN - 1, y: UPPER - 49 }, colour: S.amberDeep },
    // And one under the gallery, the length of the state floor.
    { from: { x: 16, y: UPPER + 9 }, to: { x: CL - 1, y: UPPER + 9 }, colour: S.amberDeep },
    { from: { x: CR, y: UPPER + 9 }, to: { x: LIFT - 1, y: UPPER + 9 }, colour: S.amberDeep },
    // The stair's gold rails, up each flight.
    { from: { x: C - FOOT - 2, y: FLOOR - 14 }, to: { x: CL + 2, y: UPPER - 6 }, colour: S.amber },
    { from: { x: C + FOOT + 2, y: FLOOR - 14 }, to: { x: CR - 2, y: UPPER - 6 }, colour: S.amber },
    // The gallery's underside.
    { from: { x: 16, y: UPPER + 6 }, to: { x: CL - 1, y: UPPER + 6 }, colour: S.amberDeep },
    { from: { x: CR, y: UPPER + 6 }, to: { x: W - 17, y: UPPER + 6 }, colour: S.amberDeep },
  ],

  props: [
    // The great screen over the stair, and the light up the wall behind its foot.
    { sprite: P.screen(76, 46), x: C - 38, y: TOP + 14 },
    { sprite: P.lightStrip(70), x: C - 1, y: UPPER + 10 },
    // Downstairs, the state floor.
    { sprite: P.rug(300), x: 30, y: FLOOR - 3 },
    { sprite: P.greatDoors(40, 62), x: 100, y: FLOOR - 62 },
    { sprite: P.STATUE, x: 196, y: FLOOR - 46 },
    { sprite: P.banner(14, 56), x: 168, y: UPPER + 12 },
    { sprite: P.banner(14, 56), x: 796, y: UPPER + 12 },
    { sprite: P.screen(34, 22), x: 226, y: 168 },
    { sprite: P.doorway(26, 46), x: 287, y: FLOOR - 46 },
    { sprite: P.STATUE, x: 344, y: FLOOR - 46 },
    { sprite: P.column(FLOOR - UPPER - 7), x: CL - 12, y: UPPER + 7 },
    { sprite: P.column(FLOOR - UPPER - 7), x: CR + 2, y: UPPER + 7 },
    { sprite: P.STATUE, x: 602, y: FLOOR - 46 },
    { sprite: P.doorway(26, 46), x: 647, y: FLOOR - 46 },
    { sprite: P.screen(34, 22), x: 708, y: 168 },
    { sprite: P.STATUE, x: 760, y: FLOOR - 46 },
    { sprite: P.doorway(26, 46), x: 827, y: FLOOR - 46 },
    { sprite: P.rug(300), x: 630, y: FLOOR - 3 },
    { sprite: P.liftShaft(32, FLOOR - TOP - 8), x: LIFT, y: TOP + 8 },
    { sprite: P.TUBE_MOUTH, x: TUBE_DOWN - 2, y: UPPER - 52 },
    // Upstairs, the private floor: the rulers before your father, in a gallery along it.
    ...[205, 274, 356, 584, 676, 740, 822].map((x, i) => ({ sprite: P.portrait(i), x, y: TOP + 46 })),
    { sprite: P.doorway(24, 46), x: 88, y: UPPER - 46 },
    { sprite: P.doorway(24, 46), x: 238, y: UPPER - 46 },
    { sprite: P.rail(40, 12), x: CL - 40, y: UPPER - 12 },
    { sprite: P.rail(40, 12), x: CR, y: UPPER - 12 },
    { sprite: P.doorway(24, 46), x: 708, y: UPPER - 46 },
    { sprite: P.doorway(24, 46), x: 848, y: UPPER - 46 },
  ],

  features: [
    // Capsules shooting through the tubes: messages, all day, to the diplomat's office.
    { type: 'pulse', points: [{ x: 16, y: TUBE_Y }, { x: TUBE_DOWN, y: TUBE_Y }, { x: TUBE_DOWN, y: UPPER - 50 }], speed: 160, every: 2200, count: 2, sprite: P.CAPSULE },
    { type: 'pulse', points: [{ x: LIFT - 2, y: UPPER + 9 }, { x: CR, y: UPPER + 9 }], speed: 140, every: 3400, sprite: P.CAPSULE },
    { type: 'pulse', points: [{ x: CL - 2, y: UPPER + 9 }, { x: 16, y: UPPER + 9 }], speed: 140, every: 3400, sprite: P.CAPSULE },
    // The glass lift, up and down between the floors.
    { type: 'mover', sprite: P.liftCar(28), x: LIFT + 2, y: FLOOR - 2, to: { x: LIFT + 2, y: UPPER - 2 }, speed: 40 },
  ],
  people: [
    // The guards on the audience hall's great doors, always.
    guard('door-guard-1', 0, 92, FLOOR, 'c3_guard'),
    guard('door-guard-2', 1, 148, FLOOR, 'c3_guard', undefined, { flipX: true }),
    // By day: a servant about the floor, a page with letters along the gallery; courtiers passing through.
    strollingServant('servant', 0, 200, 440, FLOOR, 'c3_servant', DAY),
    strollingServant('page', 1, 600, 820, UPPER, 'c3_page', DAY),
    strollingCourtier('courtier-1', 0, 540, 820, FLOOR, 'halls_courtier', ['afternoon', 'evening']),
    courtier('courtier-2', 2, 214, FLOOR, 'halls_courtier', ['afternoon']),
    // The evening: guests on their way in to the banquet.
    courtier('guest-1', 3, 700, FLOOR, 'halls_courtier', ['evening']),
    courtier('guest-2', 4, 716, FLOOR, 'halls_courtier', ['evening'], { flipX: true }),
    // People you know.
    cast('physician', 286, UPPER, { knot: 'halls_physician', when: MORNING, flipX: true }), // waiting on your father
    cast('sister', 770, UPPER, { knot: 'halls_sister', when: ['afternoon'] }), // among the portraits, where she shouldn't be
    cast('captain', 480, FLOOR, { knot: 'halls_captain', when: LATE, flipX: true }), // at the foot of the stair
    // At night, a guard on your father's door.
    guard('night-guard', 2, 270, UPPER, 'c3_guard_night', ['night'], { flipX: true }),
    // More of the people you know: the old councillor by the council's door in the morning, the reformer in
    // the evening, your sister creeping along the gallery at night.
    cast('councillor', 330, FLOOR, { knot: 'halls_councillor', when: MORNING }),
    cast('reformer', 250, FLOOR, { knot: 'halls_reformer', when: ['evening'] }),
    cast('sister', 340, UPPER, { id: 'sister-night', knot: 'halls_sister_night', when: ['night'], flipX: true }),
  ],
  interactables: [],

  exits: [
    // Downstairs.
    { id: 'to-audience-hall', x: 120, y: FLOOR, reach: 16, to: 'audience-hall' },
    { id: 'to-council-chamber', x: 300, y: FLOOR, reach: 12, to: 'council-chamber' },
    { id: 'to-banquet-gallery', x: 660, y: FLOOR, reach: 12, to: 'banquet-gallery' },
    { id: 'to-glasshouse', x: 840, y: FLOOR, reach: 12, to: 'glasshouse' },
    // Upstairs.
    { id: 'to-quarters', x: 100, y: UPPER, reach: 12, to: 'prince-quarters' },
    { id: 'to-study', x: 250, y: UPPER, reach: 12, to: 'fathers-study' },
    { id: 'to-office', x: 720, y: UPPER, reach: 12, to: 'diplomats-office' },
    { id: 'to-guest-wing', x: 860, y: UPPER, reach: 12, to: 'guest-wing' },
  ],
};
