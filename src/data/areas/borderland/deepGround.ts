import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './deepGroundProps';
import type { AreaDefinition } from '../types';
import { cast, dogFollowing, local, rival } from './people';
import { HUT } from './rivalLineProps';

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
    { sprite: HUT, x: 1240, y: FLOOR - 30 }, // their camp, far out: where they keep the boss's daughter
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

  features: [
    // Day 11: the scout leads you out across the deep ground to their camp; the camp.
    { type: 'lead', person: 'scout-lead11', route: 'to-camp', near: 90 },
    { type: 'trigger', x: 1150, y: FLOOR, reach: 30, knot: 'c2day11_girl_hut', showIf: 'scout_leading11', hideIf: 'girl_hut11' },
    { type: 'fire', x: 1236, y: FLOOR, showIf: 'girl11' },
    // Chapter 2, Day 8: out here with the dog, on the raiders' trail, to their drop under the fallen marker.
    { type: 'trigger', x: 50, y: FLOOR, reach: 40, knot: 'c2day8_deep_arrive', showIf: 'going_deep8', hideIf: 'deep_arrived' },
    { type: 'seek', dog: 'dog-follow', range: 220, showIf: 'seeking8', finds: [{ x: 1100, y: FLOOR, knot: 'c2day8_drop', done: 'drop_found', item: 'box' }] },
  ],
  people: [
    dogFollowing(30, FLOOR),
    // Chapter 2, Day 11 (free the boss's daughter): the scout leading you out to their camp; its guards, the hut,
    // his daughter; then the boss, come after you with his circle and your brother, and the son behind them.
    rival('scout-lead11', 1, 100, FLOOR, ['evening', 'night'], { showIf: 'scout_leading11' }),
    rival('scout-camp11', 1, 1150, FLOOR, ['evening', 'night'], { showIf: 'girl_hut11' }),
    rival('camp-guard-1', 0, 1206, FLOOR, ['evening', 'night'], { showIf: 'girl11', hideIf: 'daughter11', flipX: true }),
    rival('camp-guard-2', 1, 1290, FLOOR, ['evening', 'night'], { showIf: 'girl11', hideIf: 'daughter11', flipX: true }),
    rival('camp-guard-3', 0, 1320, FLOOR, ['evening', 'night'], { showIf: 'girl11', hideIf: 'daughter11', flipX: true }),
    rival('daughter11', 2, 1250, FLOOR, ['evening', 'night'], { showIf: 'daughter11', flipX: true }),
    cast('boss', 1040, FLOOR, { id: 'boss-camp11', when: ['evening', 'night'], showIf: 'father11' }),
    cast('brother', 1016, FLOOR, { id: 'brother-camp11', when: ['evening', 'night'], showIf: 'father11', hideIf: 'brother_saved11' }),
    local('circle-camp-1', 7, 996, FLOOR, ['evening', 'night'], { showIf: 'father11' }),
    local('circle-camp-2', 10, 1066, FLOOR, ['evening', 'night'], { showIf: 'father11' }),
    cast('boss_son', 970, FLOOR, { id: 'son-camp11', when: ['evening', 'night'], showIf: 'father11' }),
    // Day 8: the drop's guards, coming in from the posts; and (if you watch) the one who collects it.
    rival('drop-guard-1', 0, 1392, FLOOR, ['morning'], { showIf: 'drop_guards_here' }),
    rival('drop-guard-2', 1, 1396, FLOOR, ['morning'], { showIf: 'drop_guards_here' }),
    rival('scout', 1, 1396, FLOOR, ['morning'], { showIf: 'scout_coming' }),
  ],

  interactables: [
    { id: 'grooves', x: 500, y: FLOOR, reach: 30, label: 'Look', knot: 'deep_ground_grooves' },
    { id: 'sled', x: 754, y: FLOOR, reach: 26, label: 'Search', knot: 'deep_ground_search_sled' },
    { id: 'marker', x: 1040, y: FLOOR, reach: 20, label: 'Look', knot: 'deep_ground_marker' },
    { id: 'old-marker', x: 1124, y: FLOOR, reach: 20, label: 'Look', knot: 'deep_ground_old_marker' },
    { id: 'posts', x: 1300, y: FLOOR, reach: 34, label: 'Look', knot: 'deep_ground_posts' },
    { id: 'beyond', x: 1380, y: FLOOR, reach: 16, label: 'Look', knot: 'deep_ground_beyond' },
  ],

  routes: {
    // Day 11: the scout, out across the deep ground to their camp.
    'to-camp': [{ x: 100, y: FLOOR }, { x: 260, y: FLOOR }, { x: 440, y: FLOOR }, { x: 620, y: FLOOR }, { x: 800, y: FLOOR }, { x: 960, y: FLOOR }, { x: 1110, y: FLOOR }],
  },

  exits: [{ id: 'to-sunk-town', x: 16, y: FLOOR, reach: 12, to: 'sunk-town' }],

  ambience: [{ sound: 'wind', volume: 0.08 }], // the air goes still
};
