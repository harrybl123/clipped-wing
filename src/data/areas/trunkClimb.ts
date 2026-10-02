import { FRIEND, GIRL } from '../../ui/characters';
import { SHADES as S } from '../../ui/pixelArt';
import { FUNGI, LAMP } from '../../ui/sprites';
import { PULLEY } from './homeProps';
import { hangingRoots } from './lowerRootsProps';
import { beam } from './friendsHomeProps';
import { ARCHWAY, tubeColumn } from './offeringFloorProps';
import { CELL_LANTERN, railing } from './rootsMarketProps';
import * as P from './trunkClimbProps';
import type { AreaDefinition, Light, Prop, Solid } from './types';

// The trunk climb: a tall shaft up the inside of the trunk beside the tube (Night 1: the platformer
// tutorial, climbing to watch the Ascension lights, teaching movement and your weak grip; Day 7:
// the chase). Three screens high; the camera follows you. Ledges zigzag up, changing as you go:
// glowing fungus shelves, bark, climbers' planks, then scavenged metal: green into gold, and more
// tech higher up, with climbers' rigging (a sliding plank, a lift) partway. At the top, a lookout by
// the tube, the way on to the middle tiers, and a metal ladder up to a hatch in the back of the archive:
// the only unguarded way in (the Day 5 heist). See docs/areas/trunk-climb.md.

const W = 480;
const H = 810;
const FLOOR = 780;
const TOP = 118;
const TUBE_X = 404;

/** The ledges, bottom to top: [x, y, width, kind]. Each is within a jump (≤ 44px up, ≤ 40px across) of the one before, or of a moving platform. */
const LEDGES: [number, number, number, P.LedgeKind][] = [
  [120, 736, 60, 'fungus'],
  [40, 692, 60, 'fungus'],
  [130, 648, 70, 'fungus'],
  [230, 610, 60, 'bark'],
  [150, 568, 50, 'bark'],
  [60, 526, 70, 'bark'],
  [150, 484, 50, 'bark'],
  // (Here a plank slides along a rope, then a lift rises: see MOVERS.)
  [250, 362, 50, 'plank'],
  [140, 322, 60, 'plank'],
  [50, 282, 60, 'plank'],
  [140, 240, 50, 'metal'],
  [230, 200, 60, 'metal'],
  [150, 160, 50, 'metal'],
];

/** Climbers' rigging: a plank sliding along a rope, then a lift on a pulley (from the slider's end up to the next ledge). */
const MOVERS = [
  { type: 'mover' as const, sprite: P.hangingPlank(40), x: 200, y: 444, to: { x: 296, y: 444 }, speed: 28, ropeTop: 420 },
  { type: 'mover' as const, sprite: P.hangingPlank(40), x: 332, y: 444, to: { x: 332, y: 362 }, speed: 26, ropeTop: 292 },
];

const ledgeSolids: Solid[] = LEDGES.map(([x, y, width]) => ({ x, y, width, height: 5, oneWay: true, invisible: true }));
const ledgeProps: Prop[] = LEDGES.map(([x, y, width, kind]) => ({ sprite: P.ledge(width, kind), x, y }));

/** Light changes with height: green fungi low down, amber lamps higher, a cell lantern near the top. */
const lights: Light[] = [
  { x: TUBE_X + 12, y: 120, colour: S.cyan, radius: 40, radiusY: 200, strength: 0.28 },
  { x: TUBE_X + 12, y: 420, colour: S.cyan, radius: 36, radiusY: 200, strength: 0.24 },
  { x: TUBE_X + 12, y: 700, colour: S.cyan, radius: 32, radiusY: 140, strength: 0.2 },
  ...LEDGES.filter(([, , , k]) => k === 'fungus').map(([x, y, w]) => ({ x: x + w / 2, y: y + 2, colour: S.green, radius: w * 0.6, radiusY: 18, strength: 0.3 })),
  { x: 60, y: 770, colour: S.green, radius: 30, radiusY: 16, strength: 0.3 },
  { x: 96, y: 500, colour: S.amber, radius: 36, strength: 0.26 },
  { x: 270, y: 336, colour: S.amber, radius: 36, strength: 0.28 },
  { x: 90, y: 250, colour: S.amber, radius: 36, strength: 0.3 },
  { x: 244, y: 148, colour: S.cyan, radius: 26, strength: 0.28 },
  { x: 200, y: 80, colour: S.amber, radius: 80, radiusY: 40, strength: 0.26 },
];

export const trunkClimb: AreaDefinition = {
  id: 'trunk-climb',
  name: 'the trunk climb',
  width: W,
  height: H,
  cavity: { x: 12, y: 16, width: 456, height: FLOOR - 16, radius: 40 },
  ambient: 0.75,
  playerStart: { x: 80, y: FLOOR },

  solids: [
    { x: 0, y: FLOOR, width: W, height: H - FLOOR },
    ...ledgeSolids,
    { x: 20, y: TOP, width: 360, height: 8, oneWay: true }, // the lookout
    { x: 0, y: 0, width: 12, height: H, invisible: true },
    { x: 468, y: 0, width: 12, height: H, invisible: true },
  ],

  lights,

  lines: [
    { from: { x: 96, y: 16 }, to: { x: 96, y: 494 }, colour: S.deep }, // lamp ropes
    { from: { x: 270, y: 16 }, to: { x: 270, y: 330 }, colour: S.deep },
    { from: { x: 90, y: 16 }, to: { x: 90, y: 244 }, colour: S.dim },
    { from: { x: 70, y: 692 }, to: { x: 62, y: 736 }, colour: S.woodLight }, // old ropes between ledges
    { from: { x: 170, y: 568 }, to: { x: 176, y: 610 }, colour: S.woodLight },
    { from: { x: 196, y: 420 }, to: { x: 344, y: 420 }, colour: S.woodPale }, // the slider's rope
  ],

  props: [
    // The tube, rising the whole height behind a lattice of roots.
    { sprite: tubeColumn(24, FLOOR - 16), x: TUBE_X, y: 16 },
    { sprite: P.rootLattice(64, FLOOR - 16), x: TUBE_X - 20, y: 16 },
    ...ledgeProps,
    // Detail in the wall: knotholes, handholds, a rest nook.
    ...[[60, 600], [300, 690], [330, 470], [40, 380], [200, 280], [330, 180], [110, 420]].map(([x, y]) => ({ sprite: P.KNOTHOLE, x: x!, y: y! })),
    { sprite: beam(56), x: 324, y: 284 }, // the lift's pulley beam
    { sprite: PULLEY, x: 350, y: 288 },
    { sprite: P.handholds(90), x: 24, y: 560 },
    { sprite: P.handholds(80), x: 372, y: 300 },
    { sprite: P.handholds(70), x: 20, y: 150 },
    { sprite: P.REST_GEAR, x: 70, y: 526 - 5 },
    // The bottom: the way in from the shrine, fungi, the climbers' marks.
    { sprite: ARCHWAY, x: 16, y: FLOOR - 38 },
    { sprite: P.CLIMBERS_MARKS, x: 70, y: 756 },
    { sprite: FUNGI.cluster, x: 52, y: FLOOR - 7 },
    { sprite: FUNGI.tall, x: 210, y: FLOOR - 8 },
    { sprite: FUNGI.droop, x: 64, y: 692 - 5 },
    { sprite: hangingRoots(30, 40, 3), x: 300, y: 540 },
    // Lamps hung higher up.
    { sprite: LAMP, x: 95, y: 494 },
    { sprite: LAMP, x: 269, y: 330 },
    { sprite: LAMP, x: 89, y: 244 },
    { sprite: P.PEG, x: 243, y: 142 },
    { sprite: CELL_LANTERN, x: 243, y: 144 },
    // The lookout at the top, railed where it meets the tube, with ways on.
    { sprite: railing(40), x: 340, y: TOP - 8 },
    { sprite: ARCHWAY, x: 22, y: TOP - 38 },
    { sprite: P.metalLadder(TOP - 16), x: 196, y: 16 },
  ],

  features: [
    { type: 'mob', delay: 2500, speed: 62, showIf: 'chased' }, // Day 7: the mob, on your heels all the way to the top
    ...MOVERS,
    { type: 'motes', x: TUBE_X + 12, top: 16, bottom: FLOOR, halfWidth: 8 },
    { type: 'drip', x: 300, y: 580, floorY: FLOOR - 4 },
    // Tutorial hints for the first climb (Day 1 night).
    { type: 'hint', x: 110, y: FLOOR, reach: 90, text: 'Space or Up to jump', showIf: 'climb_tutorial' },
    { type: 'hint', x: 175, y: 568, reach: 30, text: 'Down drops you back through a ledge', showIf: 'climb_tutorial' },
    { type: 'hint', x: 175, y: 484, reach: 30, text: 'Wait for the plank to come to you, then hop on', showIf: 'climb_tutorial' },
  ],

  people: [
    // Day 7 (in custody, up): the girl, coming up with you to see you off at the gate.
    { id: 'girl-run', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 60, y: FLOOR, knot: 'day7_girl_runs', showIf: 'girl_runs', follow: true },
    // Day 1 night: your friend partway up (by the rest nook), then at the lookout once you've met.
    { id: 'friend-on-climb', sprite: FRIEND.idle[0]!, idleFrames: FRIEND.idle, x: 112, y: 526, when: ['night'], showIf: 'climb_tutorial', hideIf: 'met_friend_climb', knot: 'trunk_friend_on_climb' },
    { id: 'friend-at-lookout', sprite: FRIEND.idle[0]!, idleFrames: FRIEND.idle, x: 300, y: TOP, when: ['night'], showIf: 'met_friend_climb', hideIf: 'watched_lights', flipX: true, knot: 'trunk_friend_at_lookout' },
  ],

  interactables: [
    { id: 'climbers-marks', x: 80, y: FLOOR, reach: 12, label: 'Look', knot: 'trunk_climbers_marks' },
    { id: 'lookout', x: 360, y: TOP, reach: 14, label: 'Watch', knot: 'trunk_lookout' },
  ],

  acoustics: 'high',
  ambience: [{ sound: 'wind', volume: 0.65 }, { sound: 'hum', volume: 0.15 }, { sound: 'creaks', volume: 0.6 }],
  exits: [
    { id: 'down-to-shrine', x: 27, y: FLOOR, reach: 12, to: 'tenders-shrine' },
    { id: 'to-middle-tiers', x: 33, y: TOP, reach: 12, to: 'middle-tiers' },
    { id: 'up-to-archive', x: 201, y: TOP, reach: 8, to: 'archive' },
  ],
};
