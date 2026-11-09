import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition, CityView } from '../types';
import { cast, courtier, guard, inStory, servant, strollingCourtier, MORNING } from './people';

// The guest wing (Chapter 3): where the heirs of families your father doubts are invited to live, as an
// honour, and only find out once they're in that they can't leave (designer; docs/areas/capital/guest-wing.md).
// Beautiful rooms off a gold corridor, their doors shut; your friend's room at the far end, open; windows
// over the city that don't open; the guards' post at the corridor's end, by the way out.

const W = 640;
const FLOOR = 226;
const TOP = 50;

/** A window over the city between the doors (they don't open). */
const shutWindow = (x: number): CityView => ({ x, y: 84, width: 40, height: 66, horizon: 120, treeX: 3000, mullions: 10 });

export const guestWing: AreaDefinition = {
  id: 'guest-wing',
  name: 'the guest wing',
  width: W,
  height: 270,
  walls: 'marble',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.86,
  playerStart: { x: 600, y: FLOOR },
  surface: 'stone',
  acoustics: 'small',
  ambience: [
    { sound: 'room', volume: 0.3 },
    { sound: 'hum', volume: 0.12 },
  ],

  views: [shutWindow(74), shutWindow(214), shutWindow(324), shutWindow(434)],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 60, y: 190, colour: S.amber, radius: 70, radiusY: 40, strength: 0.18 }, // your friend's room
    { x: 560, y: 190, colour: S.amber, radius: 50, radiusY: 34, strength: 0.12 }, // the guards' post
  ],

  lines: [
    // Your friend's room, open at the far end: the edge of its doorway.
    { from: { x: 126, y: TOP }, to: { x: 126, y: FLOOR - 1 }, colour: S.amber },
  ],

  props: [
    // Your friend's room.
    { sprite: P.GUEST_BED, x: 24, y: FLOOR - 16 },
    { sprite: P.LAMP, x: 62, y: FLOOR - 7 },
    { sprite: P.WARDROBE, x: 94, y: FLOOR - 52 },
    // Gold lattice over the windows, so they can't be opened.
    ...[74, 214, 324, 434].map((x) => ({ sprite: P.lattice(40, 66), x, y: 84 })),
    // The corridor: the other guests' doors, shut.
    { sprite: P.rug(470), x: 130, y: FLOOR - 3 },
    { sprite: P.closedDoor(26, 46), x: 150, y: FLOOR - 46 },
    { sprite: P.closedDoor(26, 46), x: 266, y: FLOOR - 46 },
    { sprite: P.closedDoor(26, 46), x: 378, y: FLOOR - 46 },
    { sprite: P.closedDoor(26, 46), x: 488, y: FLOOR - 46 },
    // The guards' post, and the way out.
    { sprite: P.BARRIER, x: 532, y: FLOOR - 22 },
    { sprite: P.doorway(24, 46), x: 596, y: FLOOR - 46 },
  ],

  features: [
    // Chapter 3, Day 6: coming in, your friend at the barrier, trying to go home.
    { type: 'trigger', x: 596, y: FLOOR, reach: 16, knot: 'c3day6_barrier', showIf: 'c3day6=wing', hideIf: 'barrier6' },
    { type: 'frames', frames: P.SURVEILLANCE_FRAMES, x: 540, y: 116, every: 700 },
    // Empty gilded cages, hung for ornament.
    ...[194, 304, 414].map((x) => ({ type: 'swing' as const, sprite: P.CAGE, x, y: TOP + 26, ropeTop: TOP, quiet: true, ropeColour: S.amber })),
  ],
  people: [
    // The guards' post at the way out.
    guard('barrier-guard-1', 0, 522, FLOOR, 'c3_guard_guests', undefined, { flipX: true, hideIf: 'c3day7=barrier,halls,lifts,fight,home' }),
    guard('barrier-guard-2', 1, 576, FLOOR, 'c3_guard_guests', undefined, { flipX: true, hideIf: 'c3day7=barrier,halls,lifts,fight,home' }),
    cast('captain', 498, FLOOR, { knot: 'guest_captain', when: ['afternoon'], flipX: true }),
    // The other guests.
    courtier('guest-1', 0, 290, FLOOR, 'guest_wing_guest', MORNING),
    strollingCourtier('guest-2', 5, 160, 470, FLOOR, 'guest_wing_guest', ['afternoon']),
    servant('servant', 0, 404, FLOOR, 'c3_servant', ['evening']),
    // Chapter 3's story. Day 6: the guests settling in (the old councillor's grandson, if you passed him over);
    // your friend at the barrier, then in his room at the far end. From then on, there.
    inStory('heir-6w', 'heir', 506, FLOOR, 'c3day6=wing', { knot: 'c3day6_friend', flipX: true }),
    courtier('guest-6w1', 2, 266, FLOOR, 'c3day6_guest', undefined, { showIf: 'c3day6=wing' }),
    courtier('guest-6w2', 6, 360, FLOOR, 'c3day6_guest', undefined, { showIf: 'c3day6=wing', flipX: true }),
    courtier('guest-6w3', 3, 446, FLOOR, 'c3day6_guest', undefined, { showIf: 'c3day6=wing' }),
    courtier('grandson-6w', 5, 196, FLOOR, 'c3day6_grandson', undefined, { showIf: 'c3day6=wing', hideIf: 'seated=councillor', flipX: true }),
    // Day 7: your friend at his window; at night, the barrier's two guards (sent off by you to the stair), and
    // him with you from there.
    inStory('heir-7', 'heir', 90, FLOOR, 'c3day7=friend,night,barrier,bed', { knot: 'c3day7_friend', hideIf: 'heir_with_you' }),
    guard('guard-7a', 0, 522, FLOOR, 'c3day7_barrier', undefined, { showIf: 'c3day7=barrier', flipX: true }),
    guard('guard-7b', 1, 576, FLOOR, 'c3day7_barrier', undefined, { showIf: 'c3day7=barrier', flipX: true }),
    inStory('heir-f', 'heir', 560, FLOOR, 'heir_with_you', { follow: true, knot: 'c3day7_heir_walk' }),
  ],
  interactables: [
    { id: 'bed', x: 44, y: FLOOR, reach: 14, label: 'Look', knot: 'guest_bed' },
    { id: 'door', x: 165, y: FLOOR, reach: 14, label: 'Look', knot: 'guest_door' },
    { id: 'window', x: 234, y: FLOOR, reach: 14, label: 'Look', knot: 'guest_window' },
    { id: 'cages', x: 310, y: FLOOR, reach: 14, label: 'Look', knot: 'guest_cages' },
  ],

  exits: [{ id: 'to-halls', x: 608, y: FLOOR, reach: 12, to: 'citadel-halls' }],
};
