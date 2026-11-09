import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './canopyProps';
import * as I from './canopyInteriors';
import { sides } from './canopyArea';
import type { AreaDefinition } from '../types';

// The message loft (Chapter 4): your workspace, where messages are made and sent down (doc;
// docs/areas/canopy/message-loft.md), up over the great house's sorting deck. A carver's bench under a
// skylight; on the wall, Grounded's plates to you, every message (the eye, the clipped wing, the seed, the
// cage), seen from his side; blank plates waiting on a shelf; a pipe down through the floor to the tube, for
// a message to go down. Where you make your message on Day 4 (designer: big choice 3).

const W = 480;
const H = 270;
const FLOOR = 230;

export const messageLoft: AreaDefinition = {
  id: 'message-loft',
  name: 'the message loft',
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 150, treeX: -9999, backdrop: 'canopy', ground: 'deck' },
  ambient: 1,
  playerStart: { x: 40, y: FLOOR },
  surface: 'plank',
  acoustics: 'small',
  ambience: [{ sound: 'wind', volume: 0.15 }, { sound: 'leaves', volume: 0.2 }],

  solids: [{ x: 0, y: FLOOR, width: W, height: H - FLOOR }, ...sides(W, H)],

  lights: [
    { x: 230, y: FLOOR, colour: S.white, radius: 90, radiusY: 10, strength: 0.3 }, // the skylight on the bench
    { x: 300, y: FLOOR, colour: S.amber, radius: 50, radiusY: 8, strength: 0.25 },
  ],

  lines: [
    // The pipe down to the tube, through the floor.
    { from: { x: 420, y: 60 }, to: { x: 420, y: FLOOR - 1 }, colour: S.dim },
    { from: { x: 421, y: 60 }, to: { x: 421, y: FLOOR - 1 }, colour: S.light },
    { from: { x: 422, y: 60 }, to: { x: 422, y: FLOOR - 1 }, colour: S.woodLight },
  ],

  props: [
    // The walls, a skylight over the bench, a round window onto the leaves; the roof's beams.
    { sprite: I.wovenWall(W, FLOOR - 10, 9, [[200, 0, 70, 40], [330, 50, 40, 60], [36, 60, 30, 46]], 0), x: 0, y: 10, behind: true },
    { sprite: P.bough(W, 10, 6, 0), x: 0, y: 2 },
    // Grounded's plates to you, on the wall: every message.
    { sprite: I.plate('eye'), x: 140, y: 70 },
    { sprite: I.plate('wing'), x: 168, y: 70 },
    { sprite: I.plate('up'), x: 196, y: 70 },
    { sprite: I.plate('seed'), x: 140, y: 92 },
    { sprite: I.plate('cage'), x: 168, y: 92 },
    { sprite: I.plate('tree'), x: 196, y: 92 },
    // Blank plates waiting on a shelf; the bench under the skylight; a stool; pots on the sill.
    { sprite: I.blessingShelves(60, 36, 8), x: 260, y: 120 },
    { sprite: I.CARVER_BENCH, x: 200, y: FLOOR - 26 },
    { sprite: P.bench(12), x: 186, y: FLOOR - 6 },
    { sprite: P.pots(30, 4), x: 334, y: 110 - 16 },
    // The pipe's funnel, where a message goes in.
    { sprite: P.waterFunnel(0), x: 408, y: 50 },
    { sprite: I.homeDoor(7), x: 4, y: FLOOR - 30 },
    { sprite: P.pots(40, 5), x: 434, y: FLOOR - 16 },
  ],

  features: [
    { type: 'swing', sprite: P.LANTERN, x: 296, y: FLOOR - 60, ropeTop: 12, quiet: true, ropeColour: S.wood },
    { type: 'motes', x: 235, top: 50, bottom: FLOOR - 20, halfWidth: 30 },
  ],

  people: [],

  interactables: [
    { id: 'plates', x: 180, y: FLOOR, reach: 20, label: 'Look', knot: 'c4_look_plates' },
    { id: 'bench', x: 226, y: FLOOR, reach: 14, label: 'Look', knot: 'c4_look_loft_bench' },
    { id: 'pipe', x: 418, y: FLOOR, reach: 12, label: 'Look', knot: 'c4_look_loft_pipe' },
  ],

  exits: [{ id: 'to-great-house', x: 14, y: FLOOR, reach: 12, to: 'great-house' }],
};
