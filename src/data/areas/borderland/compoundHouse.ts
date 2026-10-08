import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './compoundProps';
import type { AreaDefinition, Solid } from '../types';
import { AWAKE, cast, local } from './people';

// The boss's house (Chapter 2): inside the compound, entered by the front door (an area within an area:
// it isn't on the map; the map shows you at the compound). Whole matched panels, warm, kept, a home
// (designer: more detailed and more homely). Downstairs: the hall with pegs and boots by the door; the
// main room, the boss's long table with real food on it under the working light (the only part in the
// borderland that still does what it was made to do); the kitchen, a stove going, a pot on it, shelves of
// food put by, pots on a rail, a water barrel; the circle's side room with its reckoning board and the
// locked door nobody opens. Up the stairs, the private rooms: the boss's big bed with a patchwork quilt,
// a chest, a wash stand, a rail of clothes; a sitting room with cushions and a shelf of prized finds; a
// room with two beds. Windows look out over the settlement. The walkway door to the tally house is upstairs.
// See docs/areas/borderland/compound.md.

const W = 640;
const FLOOR = 236;
const TOP = 56;
const UPPER = 148;
/** Where the upper floor ends and the stairs begin, climbing leftwards from the right wall. */
const STAIRS_TOP = W - 16 - 88;

/** Stairs up to the private rooms: the lowest step at the right, the highest against the upper floor. */
function stairs(): Solid[] {
  const count = (FLOOR - UPPER) / 8;
  return Array.from({ length: count - 1 }, (_, i) => {
    const top = FLOOR - 8 * (i + 1);
    const x = STAIRS_TOP + 8 * (count - 2 - i);
    // Each step's block runs from the top of the stairs out to its own front edge, so the lower steps are
    // longer and the blocks paint as a staircase (they ran to the wall, and painted as one block).
    return { x: STAIRS_TOP, y: top, width: x - STAIRS_TOP + 8, height: FLOOR - top, oneWay: true };
  });
}

/** The stove's firebox, where the fire burns. */
const FIRE = { x: 308, y: FLOOR - 7 };

export const compoundHouse: AreaDefinition = {
  id: 'compound-house',
  name: "the boss's house",
  width: W,
  height: 270,
  walls: 'matched',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.95,
  playerStart: { x: 40, y: FLOOR },
  surface: 'plank',
  acoustics: 'small',

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 16, y: UPPER, width: STAIRS_TOP - 16, height: 6, oneWay: true }, // the upper floor
    ...stairs(),
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 320, y: 150, colour: S.amber, radius: 320, radiusY: 100, strength: 0.12 }, // the whole house, warm
    { x: FIRE.x, y: FIRE.y - 10, colour: S.amber, radius: 60, radiusY: 34, strength: 0.45 }, // the stove
    { x: 170, y: 176, colour: S.cyan, radius: 70, radiusY: 40, strength: 0.18 }, // the working light
    { x: 200, y: 110, colour: S.amber, radius: 70, radiusY: 30, strength: 0.22 }, // the boss's room
    { x: 300, y: 110, colour: S.amber, radius: 60, radiusY: 30, strength: 0.2 }, // the sitting room
  ],

  lines: [
    // Partitions between the rooms upstairs, and the side room's wall downstairs.
    { from: { x: 258, y: TOP }, to: { x: 258, y: UPPER - 1 }, colour: S.woodLight },
    { from: { x: 378, y: TOP }, to: { x: 378, y: UPPER - 1 }, colour: S.woodLight },
    { from: { x: 410, y: UPPER + 6 }, to: { x: 410, y: FLOOR - 1 }, colour: S.woodLight },
    // The ceiling's beam over the ground floor.
    { from: { x: 16, y: UPPER + 6 }, to: { x: STAIRS_TOP, y: UPPER + 6 }, colour: S.deep },
  ],

  props: [
    // Downstairs. The hall: the front door, pegs and boots.
    { sprite: P.doorway('day'), x: 24, y: FLOOR - 40 },
    { sprite: P.PEGS, x: 52, y: FLOOR - 34 },
    // The main room.
    { sprite: P.WORKING_LIGHT, x: 150, y: UPPER + 7 },
    { sprite: P.hanging(36, 28, 'a'), x: 218, y: UPPER + 16 },
    { sprite: P.rug(160), x: 96, y: FLOOR - 3 },
    { sprite: P.CHAIR, x: 102, y: FLOOR - 10 },
    { sprite: P.feastTable(130), x: 114, y: FLOOR - 22 },
    { sprite: P.CHAIR, x: 248, y: FLOOR - 10 },
    // The kitchen.
    { sprite: P.stove(FLOOR - UPPER - 7), x: 290, y: UPPER + 7 },
    { sprite: P.HANGING_POTS, x: 332, y: UPPER + 8 },
    { sprite: P.pantry(40, 56), x: 334, y: FLOOR - 58 },
    { sprite: P.BARREL, x: 382, y: FLOOR - 20 },
    // The circle's side room.
    { sprite: P.RECKONING, x: 440, y: UPPER + 18 },
    { sprite: P.STOOL, x: 424, y: FLOOR - 5 },
    { sprite: P.feastTable(50), x: 436, y: FLOOR - 22 },
    { sprite: P.STOOL, x: 490, y: FLOOR - 5 },
    { sprite: P.LOCKED_DOOR, x: 508, y: FLOOR - 34 },
    { sprite: P.WALL_LAMP, x: 480, y: UPPER + 14 },

    // Upstairs. The walkway door and a window.
    { sprite: P.doorway('dark'), x: 24, y: UPPER - 40 },
    { sprite: P.windowOut(30, 26), x: 62, y: TOP + 20 },
    // The boss's room.
    { sprite: P.hanging(30, 26, 'a'), x: 124, y: TOP + 12 },
    { sprite: P.rug(100), x: 104, y: UPPER - 3 },
    { sprite: P.BIG_BED, x: 106, y: UPPER - 20 },
    { sprite: P.CHEST, x: 166, y: UPPER - 12 },
    { sprite: P.WASH_STAND, x: 192, y: UPPER - 10 },
    { sprite: P.CLOTHES_RAIL, x: 216, y: UPPER - 36 },
    { sprite: P.WALL_LAMP, x: 180, y: TOP + 24 },
    // The sitting room.
    { sprite: P.TROPHIES, x: 286, y: TOP + 34 },
    { sprite: P.WALL_LAMP, x: 270, y: TOP + 22 },
    { sprite: P.windowOut(26, 24), x: 340, y: TOP + 18 },
    { sprite: P.CUSHIONS, x: 270, y: UPPER - 5 },
    { sprite: P.LOW_TABLE, x: 296, y: UPPER - 6 },
    { sprite: P.CUSHIONS, x: 316, y: UPPER - 5 },
    { sprite: P.rug(90), x: 266, y: UPPER - 3 },
    // The room with two beds.
    { sprite: P.hanging(30, 24, 'G'), x: 420, y: TOP + 14 },
    { sprite: P.bed(36, 'G'), x: 392, y: UPPER - 12 },
    { sprite: P.bed(32, 'a'), x: 448, y: UPPER - 12 },
    { sprite: P.WALL_LAMP, x: 470, y: TOP + 26 },
  ],

  features: [{ type: 'fire', x: FIRE.x, y: FIRE.y }],
  people: [
    // The boss at his table, the watcher at his shoulder; at night, upstairs.
    cast('boss', 176, FLOOR, { knot: 'house_boss', when: AWAKE }),
    cast('watcher', 246, FLOOR, { knot: 'house_watcher', when: AWAKE, flipX: true }),
    cast('boss', 236, UPPER, { id: 'boss-night', knot: 'house_boss', when: ['night'], flipX: true }),
    cast('watcher', 62, FLOOR, { id: 'watcher-night', knot: 'house_watcher', when: ['night'] }),
    // The circle in the side room, in the evening.
    local('circle-1', 7, 432, FLOOR, ['evening']),
    local('circle-2', 10, 494, FLOOR, ['evening'], { flipX: true }),
    // Someone at the stove.
    local('cook', 4, 330, FLOOR, AWAKE, { flipX: true }),
    // Your brother, if he's come to live here (big choice 1): fed, at the boss's elbow.
    cast('brother', 130, FLOOR, { id: 'brother-here', knot: 'house_brother', when: AWAKE, showIf: 'brother_moved' }),
  ],

  interactables: [
    // Downstairs.
    { id: 'pegs', x: 66, y: FLOOR, reach: 12, label: 'Look', knot: 'house_pegs' },
    { id: 'light', x: 144, y: FLOOR, reach: 18, label: 'Look', knot: 'compound_light' },
    { id: 'table', x: 206, y: FLOOR, reach: 20, label: 'Look', knot: 'compound_table' },
    { id: 'stove', x: FIRE.x, y: FLOOR, reach: 14, label: 'Look', knot: 'house_stove' },
    { id: 'pantry', x: 354, y: FLOOR, reach: 14, label: 'Look', knot: 'house_pantry' },
    { id: 'side-room', x: 460, y: FLOOR, reach: 16, label: 'Look', knot: 'house_side_room' },
    { id: 'locked-door', x: 517, y: FLOOR, reach: 10, label: 'Try', knot: 'compound_locked' },
    // Upstairs.
    { id: 'window', x: 77, y: UPPER, reach: 12, label: 'Look', knot: 'house_window' },
    { id: 'bed', x: 140, y: UPPER, reach: 22, label: 'Look', knot: 'house_bed' },
    { id: 'trophies', x: 300, y: UPPER, reach: 18, label: 'Look', knot: 'house_trophies' },
    { id: 'rooms', x: 430, y: UPPER, reach: 30, label: 'Look', knot: 'compound_rooms' },
  ],

  exits: [
    { id: 'to-compound', x: 35, y: FLOOR, reach: 12, to: 'compound' },
    { id: 'to-tally-house', x: 35, y: UPPER, reach: 12, to: 'tally-house' },
  ],

  ambience: [
    { sound: 'room', volume: 0.3 },
    { sound: 'hearth', volume: 0.5 }, // the stove
    { sound: 'hum', volume: 0.15 }, // the working light
    { sound: 'chatter', volume: 0.06, when: ['morning', 'afternoon', 'evening'] }, // the settlement, through the walls
  ],
};
