import * as P from './deepGroundProps';
import type { AreaDefinition } from '../types';

// The deep ground (Chapter 2): forbidden and far out; the edge of what the borderland knows. Past the
// last junk the ground changes: harder, darker, cut through with straight grooves that run away to the
// horizon, like the marks of something enormous (nobody knows what made them). No people. The tree a long
// way behind you; the air still. A long walk to the clan's last marker, which says go no further, and
// beyond it more of the same. See docs/areas/borderland/deep-ground.md.

const W = 1400;
const FLOOR = 232;

export const deepGround: AreaDefinition = {
  id: 'deep-ground',
  name: 'the deep ground',
  width: W,
  height: 270,
  cavity: { x: 0, y: 0, width: W, height: 270, radius: 0 },
  outdoor: { horizon: 170, treeX: 60, treeScale: 0.5, ground: 'deep' },
  ambient: 1,
  playerStart: { x: 30, y: FLOOR },
  surface: 'dirt',
  acoustics: 'open',

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: -8, y: 0, width: 8, height: 270, invisible: true },
    { x: W, y: 0, width: 8, height: 270, invisible: true },
  ],

  lights: [],
  lines: [],

  props: [
    { sprite: P.lastJunk(30, 1), x: 60, y: FLOOR - 8 },
    { sprite: P.lastJunk(18, 2), x: 190, y: FLOOR - 8 },
    { sprite: P.lastJunk(12, 3), x: 380, y: FLOOR - 8 },
    { sprite: P.lastJunk(8, 4), x: 640, y: FLOOR - 8 },
    { sprite: P.LAST_MARKER, x: 1010, y: FLOOR - 64 },
  ],

  features: [],
  people: [],

  interactables: [
    { id: 'grooves', x: 500, y: FLOOR, reach: 30, label: 'Look', knot: 'deep_ground_grooves' },
    { id: 'marker', x: 1040, y: FLOOR, reach: 20, label: 'Look', knot: 'deep_ground_marker' },
    { id: 'beyond', x: 1370, y: FLOOR, reach: 30, label: 'Look', knot: 'deep_ground_beyond' },
  ],

  exits: [{ id: 'to-sunk-town', x: 16, y: FLOOR, reach: 12, to: 'sunk-town' }],

  ambience: [{ sound: 'wind', volume: 0.08 }], // the air goes still
};
