import { FRIEND, FRIEND_FATHER, VILLAGERS } from '../../ui/characters';
import { SHADES as S } from '../../ui/pixelArt';
import { FUNGI, LAMP } from '../../ui/sprites';
import * as P from './friendsHomeProps';
import { BOWL, CANDLE, CROCKERY, DOOR, HEARTH, HERBS, JAR, pipe, POT, post, shelf, STOOL, TABLE } from './homeProps';
import { BANNER, MAT } from './offeringFloorProps';
import type { AreaDefinition, Person, Solid } from './types';

// Your friend's home, next to the market: a devout family, a little better off than yours and
// much tidier. Ground floor: the family room (table, the household shrine with their relic),
// the hearth and a well-stocked store under the stairs' landing. Upstairs: your friend's room,
// with their drawings of the tube and the back window, which opens onto a crawlway to the back
// routes (Day 3: you sneak to it). See docs/areas/friends-home.md.

const FLOOR = 236;
const UPPER = { x: 250, y: 164, width: 182 };
const HOME: Person['when'] = ['morning', 'afternoon', 'night'];

/** Stairs up to your friend's room from the left: one-way blocks the player walks up. */
function stairs(): Solid[] {
  const out: Solid[] = [];
  const count = (FLOOR - UPPER.y) / 8;
  for (let i = 0; i < count - 1; i++) {
    const top = FLOOR - 8 * (i + 1);
    const x = UPPER.x - 8 * (count - 1 - i);
    out.push({ x, y: top, width: UPPER.x - x, height: FLOOR - top, oneWay: true });
  }
  return out;
}

const STAIR_STEPS = (FLOOR - UPPER.y) / 8 - 1;

export const friendsHome: AreaDefinition = {
  id: 'friends-home',
  name: "your friend's home",
  width: 480,
  height: 270,
  cavity: { x: 12, y: 40, width: 420, height: FLOOR - 40, radius: 26 },
  nooks: [{ x: 428, y: 134, width: 70, height: 26, radius: 8 }], // the crawlway outside the back window
  ambient: 0.9,
  playerStart: { x: 120, y: FLOOR },

  solids: [
    { x: 0, y: FLOOR, width: 480, height: 270 - FLOOR },
    ...stairs(),
    { x: UPPER.x, y: UPPER.y, width: UPPER.width, height: 8, oneWay: true },
    { x: 0, y: 0, width: 12, height: 270, invisible: true },
    { x: 432, y: 0, width: 48, height: 270, invisible: true },
  ],

  lights: [
    { x: 68, y: 86, colour: S.amber, radius: 44, radiusY: 60, strength: 0.3 }, // lamp over the table
    { x: 124, y: 212, colour: S.cyan, radius: 34, radiusY: 28, strength: 0.34 }, // the relic in the shrine
    { x: 284, y: 226, colour: S.amber, radius: 40, radiusY: 24, strength: 0.34 }, // hearth
    { x: 330, y: 98, colour: S.amber, radius: 40, radiusY: 50, strength: 0.28 }, // lamp in your friend's room
    { x: 454, y: 150, colour: S.green, radius: 18, radiusY: 10, strength: 0.4 }, // fungi in the crawlway
  ],

  lines: [
    { from: { x: 68, y: 62 }, to: { x: 68, y: 80 }, colour: S.deep }, // lamp cords
    { from: { x: 330, y: 40 }, to: { x: 330, y: 92 }, colour: S.deep },
  ],

  props: [
    // Family room: front door, the table, the shrine flanked by banners.
    { sprite: P.beam(222), x: 16, y: 58 },
    { sprite: HERBS, x: 36, y: 63 },
    { sprite: HERBS, x: 46, y: 63 },
    { sprite: HERBS, x: 180, y: 63 },
    { sprite: HERBS, x: 196, y: 63 },
    { sprite: DOOR, x: 18, y: FLOOR - 34 },
    { sprite: shelf(36), x: 46, y: 190 },
    { sprite: CROCKERY, x: 49, y: 184 },
    { sprite: STOOL, x: 40, y: FLOOR - 8 },
    { sprite: TABLE, x: 48, y: FLOOR - 12 },
    { sprite: STOOL, x: 90, y: FLOOR - 8 },
    { sprite: P.RUNNER, x: 53, y: FLOOR - 14 },
    { sprite: BOWL, x: 58, y: FLOOR - 16 },
    { sprite: BOWL, x: 76, y: FLOOR - 16 },
    { sprite: LAMP, x: 67, y: 80 },
    { sprite: BANNER, x: 88, y: 130 },
    { sprite: BANNER, x: 148, y: 130 },
    { sprite: P.mural(110), x: 117, y: 74 },
    { sprite: P.SHRINE, x: 104, y: FLOOR - 52 },
    { sprite: MAT, x: 112, y: FLOOR - 2 },
    // Stairs up, with a handrail.
    { sprite: P.handrail(STAIR_STEPS, 8), x: UPPER.x - STAIR_STEPS * 8, y: FLOOR - STAIR_STEPS * 8 - 20 },
    // Under the landing: hearth and a well-stocked store.
    { sprite: post(64), x: 252, y: UPPER.y + 8 },
    { sprite: post(64), x: 424, y: UPPER.y + 8 },
    { sprite: pipe(46), x: 282, y: UPPER.y + 8 },
    { sprite: HEARTH, x: 262, y: FLOOR - 18 },
    { sprite: POT, x: 266, y: FLOOR - 25 },
    { sprite: shelf(56), x: 340, y: 204 },
    { sprite: shelf(56), x: 340, y: 182 },
    ...[198, 176].flatMap((y) => Array.from({ length: 7 }, (_, i) => ({ sprite: JAR, x: 343 + 7 * i, y }))),
    // Your friend's room: chest, drawings, bed, the back window.
    { sprite: P.CHEST, x: 258, y: UPPER.y - 10 },
    { sprite: P.FOLDED_CLOTH, x: 262, y: UPPER.y - 15 },
    { sprite: shelf(30), x: 350, y: 124 },
    { sprite: CANDLE, x: 356, y: 119 },
    { sprite: P.CLOAK, x: 316, y: 128 },
    { sprite: P.drawing('tube'), x: 280, y: 116 },
    { sprite: P.drawing('rising'), x: 292, y: 112 },
    { sprite: P.drawing('canopy'), x: 304, y: 118 },
    { sprite: LAMP, x: 329, y: 92 },
    { sprite: P.NEAT_BED, x: 364, y: UPPER.y - 10 },
    { sprite: P.WINDOW_FRAME, x: 424, y: 132 },
    { sprite: P.SHUTTER, x: 419, y: 135 },
    { sprite: FUNGI.cluster, x: 450, y: 153 },
    { sprite: FUNGI.droop, x: 460, y: 155 },
  ],

  features: [{ type: 'fire', x: 284, y: FLOOR - 1 }],

  people: [
    { id: 'friend', sprite: FRIEND.idle[0]!, idleFrames: FRIEND.idle, x: 336, y: UPPER.y, knot: 'friends_home_friend', flipX: true, when: ['morning', 'afternoon'] },
    { id: 'parent', sprite: FRIEND_FATHER.idle[0]!, idleFrames: FRIEND_FATHER.idle, x: 162, y: FLOOR, knot: 'friends_home_parent', flipX: true, when: HOME },
    { id: 'other-parent', sprite: VILLAGERS[4]!.idle[0]!, idleFrames: VILLAGERS[4]!.idle, x: 312, y: FLOOR, when: HOME },
  ],

  interactables: [
    { id: 'shrine', x: 124, y: FLOOR, reach: 12, label: 'Look', knot: 'friends_home_shrine' },
    { id: 'store', x: 368, y: FLOOR, reach: 14, label: 'Look', knot: 'friends_home_store' },
    { id: 'drawings', x: 296, y: UPPER.y, reach: 14, label: 'Look', knot: 'friends_home_drawings' },
  ],

  ambience: [{ sound: 'room', volume: 0.35 }, { sound: 'hum', volume: 0.12 }, { sound: 'creaks', volume: 0.2 }],
  surface: 'plank',
  exits: [
    { id: 'front-door', x: 28, y: FLOOR, reach: 14, to: 'roots-market' },
    { id: 'back-window', x: 422, y: UPPER.y, reach: 8, to: 'back-routes' },
  ],
};
