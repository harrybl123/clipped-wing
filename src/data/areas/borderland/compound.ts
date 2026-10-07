import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './compoundProps';
import { roof } from './shackProps';
import type { AreaDefinition, Solid } from '../types';

// The boss's compound (Chapter 2): his home and seat, on a rise at the top of the settlement, walled
// with the best scrap. Off limits at first; it opens once you're brought in (and if you move your brother
// in, he lives here). Outside: the lane, then the gate with lamps on its posts. The swept yard: a whole
// water tank, still full; crates of tribute under a cloth. The house in cutaway: the main room with the
// boss's long table and real food on it, under the working light (the only part in the borderland that
// still does what it was made to do); the circle's side room; a locked door nobody opens; stairs up to the
// private rooms. Ways back to the bar (the lane) and the tally house (the walkway door).
// See docs/areas/borderland/compound.md. The boss, his circle and the guards come with the cast.

const W = 960;
const FLOOR = 232;
const HOUSE = { x: 430, top: 70, floor: 152, end: 940 };
const PARTITION = 300; // inside the house's sprite: the side room's wall

/** Where the upper floor ends and the stairs begin, climbing leftwards from the house's right end. */
const STAIRS_TOP = HOUSE.end - 80;

/** Stairs up to the private rooms: the lowest step at the right, the highest against the upper floor. */
function stairs(): Solid[] {
  const count = (FLOOR - HOUSE.floor) / 8;
  return Array.from({ length: count - 1 }, (_, i) => {
    const top = FLOOR - 8 * (i + 1);
    const x = STAIRS_TOP + 8 * (count - 2 - i);
    return { x, y: top, width: HOUSE.end - 8 - x, height: FLOOR - top, oneWay: true };
  });
}

export const compound: AreaDefinition = {
  id: 'compound',
  name: "the boss's compound",
  width: W,
  height: 270,
  cavity: { x: 0, y: 0, width: W, height: 270, radius: 0 },
  outdoor: { horizon: 156, treeX: 260, backdrop: 'settlement' },
  ambient: 1,
  playerStart: { x: 30, y: FLOOR },
  surface: 'dirt',
  acoustics: 'street',

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: HOUSE.x + 4, y: HOUSE.floor, width: STAIRS_TOP - HOUSE.x - 4, height: 6, oneWay: true }, // the upper floor
    ...stairs(),
    { x: -8, y: 0, width: 8, height: 270, invisible: true },
    { x: W, y: 0, width: 8, height: 270, invisible: true },
  ],

  lights: [
    { x: 130, y: FLOOR, colour: S.amber, radius: 30, radiusY: 8, strength: 0.25 },
    { x: 300, y: FLOOR, colour: S.amber, radius: 30, radiusY: 8, strength: 0.2 },
  ],

  lines: [],

  props: [
    // The wall along the lane, and the gate.
    { sprite: P.matchedWall(80, 44), x: 40, y: FLOOR - 44 },
    { sprite: P.GATE, x: 120, y: FLOOR - 62 },
    { sprite: P.matchedWall(70, 44), x: 168, y: FLOOR - 44 },
    // The yard.
    { sprite: P.lampPost(40), x: 250, y: FLOOR - 40 },
    { sprite: P.TANK, x: 280, y: FLOOR - 34 },
    { sprite: P.TRIBUTE, x: 330, y: FLOOR - 20 },
    { sprite: P.lampPost(40), x: 400, y: FLOOR - 40 },
    // The house.
    { sprite: roof(HOUSE.end - HOUSE.x + 16, 8), x: HOUSE.x - 8, y: HOUSE.top - 12 },
    { sprite: P.houseInside(HOUSE.end - HOUSE.x, FLOOR - HOUSE.top, HOUSE.floor - HOUSE.top, PARTITION), x: HOUSE.x, y: HOUSE.top },
    { sprite: P.ENTRANCE, x: HOUSE.x - 17, y: FLOOR - 50 }, // in front of the house's cut-away wall
    { sprite: P.WORKING_LIGHT, x: 520, y: HOUSE.floor + 6 },
    { sprite: P.hanging(40, 30, 'G'), x: 620, y: HOUSE.floor + 14 },
    { sprite: P.hanging(30, 26, 'a'), x: 470, y: HOUSE.top + 20 },
    { sprite: P.hanging(30, 26, 'e'), x: 720, y: HOUSE.top + 20 },
    { sprite: P.WALL_LAMP, x: 700, y: HOUSE.floor + 24 },
    { sprite: P.WALL_LAMP, x: 530, y: HOUSE.top + 30 },
    { sprite: P.WALL_LAMP, x: 650, y: HOUSE.top + 30 },
    { sprite: P.rug(160), x: 460, y: FLOOR - 3 },
    { sprite: P.CHAIR, x: 470, y: FLOOR - 10 },
    { sprite: P.feastTable(110), x: 484, y: FLOOR - 22 },
    { sprite: P.CHAIR, x: 600, y: FLOOR - 10 },
    // The side room: the circle's table.
    { sprite: P.feastTable(50), x: 650, y: FLOOR - 22 },
    { sprite: P.LOCKED_DOOR, x: 750, y: FLOOR - 34 },
    // Upstairs: the private rooms.
    { sprite: P.bed(40, 'a'), x: 460, y: HOUSE.floor - 12 },
    { sprite: P.bed(36, 'G'), x: 560, y: HOUSE.floor - 12 },
    { sprite: P.bed(30, 'e'), x: 680, y: HOUSE.floor - 12 },
  ],

  features: [],
  people: [],

  interactables: [
    { id: 'gate', x: 144, y: FLOOR, reach: 14, label: 'Look', knot: 'compound_gate' },
    { id: 'entrance', x: HOUSE.x, y: FLOOR, reach: 10, label: 'Look', knot: 'compound_entrance' },
    { id: 'tank', x: 295, y: FLOOR, reach: 14, label: 'Look', knot: 'compound_tank' },
    { id: 'tribute', x: 348, y: FLOOR, reach: 14, label: 'Look', knot: 'compound_tribute' },
    { id: 'light', x: 540, y: FLOOR, reach: 24, label: 'Look', knot: 'compound_light' },
    { id: 'table', x: 670, y: FLOOR, reach: 18, label: 'Look', knot: 'compound_table' },
    { id: 'locked-door', x: 759, y: FLOOR, reach: 10, label: 'Try', knot: 'compound_locked' },
    { id: 'rooms', x: 580, y: HOUSE.floor, reach: 60, label: 'Look', knot: 'compound_rooms' },
  ],

  exits: [
    { id: 'to-bar', x: 16, y: FLOOR, reach: 12, to: 'bar' },
    { id: 'to-tally-house', x: 800, y: FLOOR, reach: 10, to: 'tally-house' },
  ],

  ambience: [
    { sound: 'wind', volume: 0.2 },
    { sound: 'chatter', volume: 0.1, when: ['morning', 'afternoon', 'evening'] }, // the settlement, below
    { sound: 'hum', volume: 0.15 }, // the working light
  ],
};
