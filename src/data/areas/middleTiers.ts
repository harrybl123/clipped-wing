import { GUARD, RESIDENTS } from '../../ui/characters';
import { SHADES as S } from '../../ui/pixelArt';
import { handrail } from './friendsHomeProps';
import * as P from './middleTiersProps';
import { ARCHWAY, BANNER, tubeColumn } from './offeringFloorProps';
import { CELL_LANTERN, railing, wallWindow } from './rootsMarketProps';
import { hangingPlank } from './trunkClimbProps';
import type { AreaDefinition, Person, Solid } from './types';

// The middle tiers: the official way up through the trunk, "passing through: better homes, more
// light" (Day 5: the escort takes you up; Day 7: the chase). A grand stair-street climbs left to
// right in two flights, with a guard post at the foot (roots-dwellers are turned back unless
// summoned, which is why the trunk climb is the back way). Master crafters' workshops and neat
// homes along the landings, the tube glowing behind, and a counterweight lift for those who can
// pay. See docs/areas/middle-tiers.md.

const W = 960;
const H = 400;
const FLOOR = 360;
const MID = 232;
const TOP = 104;
const FLIGHT_A = 300; // where the first flight starts (rising right to MID)
const FLIGHT_B = 640; // where the second flight starts (rising right to TOP)
const STEPS = 15;
const DAY: Person['when'] = ['morning', 'afternoon', 'evening'];

/** A flight of one-way steps rising to the right from (x, base) to the next level 128px up. */
function flight(x: number, base: number): Solid[] {
  return Array.from({ length: STEPS }, (_, i) => {
    const top = base - 8 * (i + 1);
    const left = x + 8 * i;
    return { x: left, y: top, width: x + 8 * (STEPS + 1) - left, height: base - top, oneWay: true };
  });
}

const resident = (id: string, look: number, x: number, y: number, extra: Partial<Person> = {}): Person => ({
  id,
  sprite: RESIDENTS[look]!.idle[0]!,
  idleFrames: RESIDENTS[look]!.idle,
  x,
  y,
  when: DAY,
  ...extra,
});

const strolling = (id: string, look: number, from: number, to: number, y: number): Person => ({
  ...resident(id, look, from + Math.round((to - from) / 2), y),
  walkFrames: RESIDENTS[look]!.walk,
  wander: { from, to },
});

export const middleTiers: AreaDefinition = {
  id: 'middle-tiers',
  name: 'the middle tiers',
  width: W,
  height: H,
  cavity: { x: 12, y: 24, width: W - 24, height: FLOOR - 24, radius: 36 },
  ambient: 0.95,
  playerStart: { x: 60, y: FLOOR },

  solids: [
    { x: 0, y: FLOOR, width: W, height: H - FLOOR },
    ...flight(FLIGHT_A, FLOOR),
    { x: FLIGHT_A + 128, y: MID, width: 912 - (FLIGHT_A + 128), height: 8, oneWay: true }, // first landing
    ...flight(FLIGHT_B, MID),
    { x: FLIGHT_B + 128, y: TOP, width: 912 - (FLIGHT_B + 128), height: 8, oneWay: true }, // top landing
    { x: 0, y: 0, width: 12, height: H, invisible: true },
    { x: W - 12, y: 0, width: 12, height: H, invisible: true },
  ],

  lights: [
    { x: 552, y: 200, colour: S.cyan, radius: 44, radiusY: 180, strength: 0.3 }, // the tube
    { x: 140, y: 330, colour: S.amber, radius: 40, strength: 0.3 }, // guard post
    { x: 480, y: 200, colour: S.amber, radius: 50, radiusY: 36, strength: 0.32 }, // workshop
    { x: 840, y: 80, colour: S.amber, radius: 60, radiusY: 40, strength: 0.3 }, // top landing
    { x: 830, y: 180, colour: S.amber, radius: 44, strength: 0.26 },
    { x: 690, y: 300, colour: S.amber, radius: 60, radiusY: 40, strength: 0.24 }, // lower homes
    { x: 460, y: 300, colour: S.amber, radius: 40, strength: 0.22 },
    { x: 250, y: 120, colour: S.amber, radius: 90, radiusY: 60, strength: 0.18 }, // homes high on the left
    { x: 930, y: 150, colour: S.cyan, radius: 20, radiusY: 60, strength: 0.18 }, // the lift's cell lanterns
    ...[[60, 150], [120, 100], [180, 170], [300, 90], [360, 150], [420, 100], [240, 220]].map(([x, y]) => ({ x: x! + 5, y: y! + 5, colour: S.amber, radius: 14, strength: 0.22 })),
  ],

  lines: [
    { from: { x: 912, y: 24 }, to: { x: 912, y: FLOOR }, colour: S.deep }, // lift shaft guides
    { from: { x: 948, y: 24 }, to: { x: 948, y: FLOOR }, colour: S.deep },
  ],

  props: [
    // The tube, glowing behind everything, seen through a railed gap on the first landing.
    { sprite: tubeColumn(24, MID - 24), x: 540, y: 24 }, // above the landing's plank
    { sprite: tubeColumn(24, FLOOR - MID - 8), x: 540, y: MID + 8 }, // and below it
    // Homes high on the left wall: windows, a few dark.
    ...[[60, 150, true], [120, 100, true], [180, 170, true], [240, 120, false], [300, 90, true], [360, 150, true], [420, 100, true], [240, 220, true], [90, 220, false]].map(
      ([x, y, lit]) => ({ sprite: wallWindow(lit as boolean), x: x as number, y: y as number }),
    ),
    { sprite: P.PLANTER, x: 150, y: 150 },
    { sprite: P.PLANTER, x: 330, y: 120 },
    { sprite: BANNER, x: 200, y: 40 },
    { sprite: BANNER, x: 420, y: 150 },
    // The foot of the stair: the way in from the trunk climb, the guard post.
    { sprite: ARCHWAY, x: 16, y: FLOOR - 38 },
    { sprite: P.GUARD_POST, x: 110, y: FLOOR - 40 },
    { sprite: P.GLASS_LANTERN, x: 128, y: 300 },
    { sprite: P.townhouse(54, 62, 9), x: 184, y: FLOOR - 62 },
    { sprite: P.townhouse(56, 70, 10), x: 240, y: FLOOR - 70 },
    { sprite: handrail(STEPS, 8), x: FLIGHT_A, y: FLOOR - STEPS * 8 - 20 },
    // A gallery along the wall above, where the better-off look down on who's coming up.
    { sprite: P.gallery(250), x: 30, y: 196 },
    // Under the first landing: the lower, plainer end of the tiers.
    ...[[440, 70, 1], [586, 60, 2], [656, 70, 3], [736, 70, 4], [816, 80, 5]].map(([x, w, seed]) => ({ sprite: P.townhouse(w!, 58, seed), x: x!, y: FLOOR - 58 })),
    // The first landing: the master carver's workshop, the railed view of the tube, a house.
    { sprite: P.CARVER_WORKSHOP, x: 436, y: MID - 62 },
    { sprite: railing(40), x: 530, y: MID - 8 },
    { sprite: P.townhouse(56, 70, 6), x: 580, y: MID - 70 },
    { sprite: handrail(STEPS, 8), x: FLIGHT_B, y: MID - STEPS * 8 - 20 },
    // Under the top landing.
    { sprite: P.townhouse(70, 80, 7), x: 780, y: MID - 80 },
    { sprite: P.GEAR_CLOCK, x: 868, y: 140 },
    { sprite: P.GLASS_LANTERN, x: 858, y: 170 },
    // The top landing: the way on to the upper halls, a fine house.
    { sprite: ARCHWAY, x: 784, y: TOP - 38 },
    { sprite: P.townhouse(80, 60, 8), x: 818, y: TOP - 60 },
    { sprite: P.GLASS_LANTERN, x: 812, y: 50 },
    { sprite: P.PLANTER, x: 900, y: 30 },
    // The lift: cell lanterns in the shaft.
    { sprite: CELL_LANTERN, x: 914, y: 140 },
    { sprite: CELL_LANTERN, x: 944, y: 260 },
  ],

  features: [
    { type: 'mover', sprite: hangingPlank(34), x: 913, y: FLOOR, to: { x: 913, y: TOP }, speed: 40, ropeTop: 24 }, // the counterweight lift
  ],

  people: [
    { id: 'guard', sprite: GUARD.idle[0]!, idleFrames: GUARD.idle, x: 160, y: FLOOR, knot: 'middle_guard', flipX: true },
    resident('carver', 3, 500, MID, { knot: 'middle_carver' }),
    resident('lift-keeper', 1, 896, FLOOR, { knot: 'middle_lift_keeper', flipX: true, when: ['morning', 'afternoon'] }),
    strolling('landing-1', 0, 440, 530, MID),
    strolling('street-1', 2, 440, 890, FLOOR),
    resident('top-1', 2, 860, TOP, { flipX: true }),
    strolling('top-2', 0, 800, 900, TOP),
  ],

  interactables: [
    { id: 'workshop', x: 466, y: MID, reach: 12, label: 'Look', knot: 'middle_workshop' },
    { id: 'tube-view', x: 550, y: MID, reach: 12, label: 'Look', knot: 'middle_tube_view' },
    { id: 'clock', x: 876, y: MID, reach: 10, label: 'Look', knot: 'middle_clock' },
  ],

  exits: [
    { id: 'to-trunk-climb', x: 27, y: FLOOR, reach: 12, to: 'trunk-climb' },
    { id: 'to-upper-halls', x: 795, y: TOP, reach: 12, to: 'upper-halls' },
  ],
};
