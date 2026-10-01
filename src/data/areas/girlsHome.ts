import { GIRL } from '../../ui/characters';
import { SHADES as S } from '../../ui/pixelArt';
import { FUNGI } from '../../ui/sprites';
import { CRATE } from './rootsMarketProps';
import { FUNGUS_LAMP, RUG, shelf, JAR } from './homeProps';
import * as L from './lowerRootsProps';
import * as P from './girlsHomeProps';
import type { AreaDefinition } from './types';

// The girl's home (Day 4 night on): off the map, through her door at the far end of the lower roots.
// Smaller and more run-down than yours (designer), and crammed with salvage: things hung from the
// low ceiling, junk stacked to the roof, a hammock, her glowing fungus and wall paint, and a curtain
// across the back where her family sleeps. In the middle of the floor, a rug over a newer board: the
// rot is underneath. You come and go through the story (her door, the board), not a door menu.

const FLOOR = 236;
const LEFT = 120;
const RIGHT = 360;
const CEILING = 132;

export const girlsHome: AreaDefinition = {
  id: 'girls-home',
  name: "the girl's home",
  width: 480,
  height: 270,
  cavity: { x: LEFT, y: CEILING, width: RIGHT - LEFT, height: FLOOR - CEILING, radius: 18 },
  ambient: 0.7,
  playerStart: { x: 150, y: FLOOR },

  solids: [
    { x: 0, y: FLOOR, width: 480, height: 270 - FLOOR },
    { x: 0, y: 0, width: LEFT, height: 270, invisible: true },
    { x: RIGHT, y: 0, width: 480 - RIGHT, height: 270, invisible: true },
    { x: 0, y: 0, width: 480, height: CEILING, invisible: true },
  ],

  lights: [
    { x: 196, y: 170, colour: S.green, radius: 40, radiusY: 34, strength: 0.34 }, // her fungus lamp
    { x: 300, y: 196, colour: S.green, radius: 26, radiusY: 20, strength: 0.26 }, // wall paint
    { x: 240, y: 232, colour: S.green, radius: 18, radiusY: 6, strength: 0.25 }, // rot glow through the gaps round the board
    { x: 334, y: 172, colour: S.green, radius: 14, strength: 0.24 }, // fungus jars
    { x: 128, y: 210, colour: S.amber, radius: 12, radiusY: 22, strength: 0.18 }, // the lower roots through the curtain
  ],

  lines: [{ from: { x: 196, y: CEILING }, to: { x: 196, y: 156 }, colour: S.deep }],

  props: [
    { sprite: L.RAG_CURTAIN, x: LEFT + 2, y: FLOOR - 40 }, // her door
    { sprite: P.HANGING_SALVAGE, x: 150, y: CEILING },
    { sprite: P.HANGING_SALVAGE, x: 262, y: CEILING },
    { sprite: L.foundStrings(22), x: 228, y: CEILING },
    { sprite: FUNGUS_LAMP, x: 193, y: 156 },
    { sprite: L.HAMMOCK, x: 140, y: 182 },
    { sprite: P.junkPile(34, 30, 1), x: 132, y: FLOOR - 30 },
    { sprite: P.junkPile(26, 40, 4), x: 282, y: FLOOR - 40 },
    { sprite: L.GLOW_PAINT, x: 284, y: 170 },
    { sprite: shelf(26), x: 318, y: 178 },
    { sprite: JAR, x: 320, y: 172 },
    { sprite: JAR, x: 328, y: 172 },
    { sprite: L.POTTED_FUNGI, x: 334, y: 171 },
    { sprite: P.BACK_CURTAIN, x: RIGHT - 32, y: FLOOR - 58 },
    { sprite: L.SCRATCHED_MAP, x: 170, y: 196 },
    { sprite: CRATE, x: 172, y: FLOOR - 8 },
    { sprite: L.FINDS, x: 184, y: FLOOR - 5 },
    { sprite: RUG, x: 222, y: FLOOR - 2 },
    { sprite: P.FLOOR_BOARD, x: 230, y: FLOOR - 1 },
    { sprite: L.POTTED_FUNGI, x: 260, y: FLOOR - 7 },
    { sprite: FUNGI.cluster, x: 312, y: FLOOR - 7 },
  ],

  features: [{ type: 'drip', x: 248, y: CEILING + 4, floorY: FLOOR - 3 }],

  people: [
    // Here while you visit (and gone down ahead of you into the rot).
    { id: 'girl-home', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 272, y: FLOOR, flipX: true, knot: 'girls_home_girl', hideIf: 'girl_with_you' },
  ],

  interactables: [
    { id: 'board', x: 239, y: FLOOR, reach: 10, label: 'Lift', knot: 'girls_home_board' },
    { id: 'door', x: 130, y: FLOOR, reach: 8, label: 'Leave', knot: 'girls_home_door' },
    { id: 'junk', x: 296, y: FLOOR, reach: 8, label: 'Look', knot: 'girls_home_junk' },
    { id: 'curtain', x: 344, y: FLOOR, reach: 8, label: 'Look', knot: 'girls_home_curtain' },
  ],

  exits: [],
};
