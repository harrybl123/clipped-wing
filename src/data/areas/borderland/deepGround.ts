import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './deepGroundProps';
import type { AreaDefinition } from '../types';

// The deep ground (Chapter 2): forbidden and far out; the edge of what the borderland knows. Past the
// last junk the ground changes: harder, darker, cut through with straight grooves that run away to the
// horizon, like the marks of something enormous (nobody knows what made them). No people. The tree a long
// way behind you; the air still. A long walk to the clan's last marker, which says go no further, and
// beyond it an older marker lying flat (the line has been pulled back), and a row of tall smooth posts
// running out beside the grooves, one still faintly lit. Before the marker, a scavenger's sled left loaded. See docs/areas/borderland/deep-ground.md.

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

  lights: [{ x: 1332, y: FLOOR, colour: S.cyan, radius: 14, radiusY: 4, strength: 0.15 }], // the lit post's glow at its foot
  lines: [],

  props: [
    { sprite: P.lastJunk(30, 1), x: 60, y: FLOOR - 8 },
    { sprite: P.lastJunk(18, 2), x: 190, y: FLOOR - 8 },
    { sprite: P.lastJunk(12, 3), x: 380, y: FLOOR - 8 },
    { sprite: P.lastJunk(8, 4), x: 640, y: FLOOR - 8 },
    { sprite: P.SLED, x: 730, y: FLOOR - 16 },
    { sprite: P.LAST_MARKER, x: 1010, y: FLOOR - 64 },
    // Beyond the marker: an older one, further out, lying flat; then the posts.
    { sprite: P.FALLEN_MARKER, x: 1090, y: FLOOR - 9 },
    ...[1190, 1260, 1330, 1390].map((x, i) => ({ sprite: P.post(i === 2), x, y: FLOOR - 72 })),
  ],

  features: [],
  people: [],

  interactables: [
    { id: 'grooves', x: 500, y: FLOOR, reach: 30, label: 'Look', knot: 'deep_ground_grooves' },
    { id: 'sled', x: 754, y: FLOOR, reach: 26, label: 'Search', knot: 'deep_ground_search_sled' },
    { id: 'marker', x: 1040, y: FLOOR, reach: 20, label: 'Look', knot: 'deep_ground_marker' },
    { id: 'old-marker', x: 1124, y: FLOOR, reach: 20, label: 'Look', knot: 'deep_ground_old_marker' },
    { id: 'posts', x: 1300, y: FLOOR, reach: 34, label: 'Look', knot: 'deep_ground_posts' },
    { id: 'beyond', x: 1380, y: FLOOR, reach: 16, label: 'Look', knot: 'deep_ground_beyond' },
  ],

  exits: [{ id: 'to-sunk-town', x: 16, y: FLOOR, reach: 12, to: 'sunk-town' }],

  ambience: [{ sound: 'wind', volume: 0.08 }], // the air goes still
};
