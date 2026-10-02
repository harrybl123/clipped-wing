import { ARCHIVIST, GUARD, MUM } from '../../ui/characters';
import { SHADES as S } from '../../ui/pixelArt';
import type { RowSprite } from '../../ui/sprites';
import { BENCH, CANDLE, DOOR, STOOL, UNFINISHED_BIRD } from './homeProps';
import { FLOOR_GRATE } from './tendersShrineProps';
import type { AreaDefinition } from './types';

// The cell behind the shrine (Day 7, in custody, if you saved the girl): off the map. A bare back room
// with a bolted door, the guard's stool, a bench (the wood and the knife), someone's tally of days
// scratched into the wall, and a grate in the floor down to the back routes, which is how your
// friend and the girl reach you. Visitors come in one after another (the story shows them).

const FLOOR = 236;
const LEFT = 150;
const RIGHT = 330;
const CEILING = 150;

/** Someone's days, scratched into the wall in fives. */
const TALLIES: RowSprite = {
  rows: Array.from({ length: 9 }, (_, y) =>
    Array.from({ length: 45 }, (_, x) => {
      const col = x % 9;
      // Four strokes, and a fifth struck across them; the last group isn't finished.
      const stroke = col <= 6 && col % 2 === 0 && x < 40;
      const across = col <= 6 && y === 7 - col && x < 36;
      return stroke || across ? 's' : '.';
    }).join(''),
  ),
  colours: { s: S.dim },
};

/** A face looking up through the grate from below: hair, eyes, the top of a face. */
const face = (hair: number, strand?: number): RowSprite => ({
  rows: ['..hhhh..', '.hhhhhh.', 'hhsHhhhh', 'hffffffh', '.fkffkf.', '.ffffff.', '..ffff..'],
  colours: { h: hair, H: strand ?? hair, f: S.light, k: S.deep, s: hair },
});

export const shrineCell: AreaDefinition = {
  id: 'shrine-cell',
  name: 'the cell behind the shrine',
  width: 480,
  height: 270,
  cavity: { x: LEFT, y: CEILING, width: RIGHT - LEFT, height: FLOOR - CEILING, radius: 14 },
  ambient: 0.6,
  playerStart: { x: 250, y: FLOOR },

  solids: [
    { x: 0, y: FLOOR, width: 480, height: 270 - FLOOR },
    { x: 0, y: 0, width: LEFT, height: 270, invisible: true },
    { x: RIGHT, y: 0, width: 480 - RIGHT, height: 270, invisible: true },
    { x: 0, y: 0, width: 480, height: CEILING, invisible: true },
  ],

  lights: [
    { x: 164, y: 234, colour: S.amber, radius: 18, radiusY: 4, strength: 0.4 }, // the strip of light under the door
    { x: 297, y: 212, colour: S.amber, radius: 30, radiusY: 28, strength: 0.36 }, // the candle on the bench
    { x: 238, y: 236, colour: S.green, radius: 16, radiusY: 6, strength: 0.18 }, // the back routes, under the grate
  ],

  lines: [],

  props: [
    { sprite: DOOR, x: LEFT + 4, y: FLOOR - 34 },
    { sprite: STOOL, x: 178, y: FLOOR - 8 },
    { sprite: TALLIES, x: 196, y: 176 },
    { sprite: FLOOR_GRATE, x: 226, y: FLOOR },
    { sprite: BENCH, x: 266, y: FLOOR - 14 },
    { sprite: CANDLE, x: 296, y: FLOOR - 19 },
    { sprite: UNFINISHED_BIRD, x: 276, y: FLOOR - 19 },
  ],

  features: [{ type: 'drip', x: 300, y: CEILING + 6, floorY: FLOOR - 3 }],

  people: [
    // By day the guard sits on the stool by the door; at night he's outside it.
    { id: 'guard-cell', sprite: GUARD.idle[0]!, idleFrames: GUARD.idle, x: 182, y: FLOOR, knot: 'shrine_cell_guard', showIf: 'in_custody', when: ['morning', 'afternoon', 'evening'] },
    // The afternoon's visitors (Day 7), and the girl at night, brought on by the story (#show:).
    { id: 'mum-cell', sprite: MUM.idle[0]!, idleFrames: MUM.idle, x: 210, y: FLOOR, knot: 'shrine_cell_mum', hidden: true },
    { id: 'archivist-cell', sprite: ARCHIVIST.idle[0]!, idleFrames: ARCHIVIST.idle, x: 210, y: FLOOR, knot: 'shrine_cell_archivist', hidden: true },
    { id: 'friend-cell', sprite: face(S.amber), x: 238, y: FLOOR, knot: 'shrine_cell_friend', hidden: true },
    { id: 'girl-cell', sprite: face(S.deep, S.green), x: 238, y: FLOOR, hidden: true },
  ],

  interactables: [
    { id: 'bench', x: 294, y: FLOOR, reach: 18, label: 'Use', knot: 'shrine_cell_bench' },
    { id: 'door', x: 162, y: FLOOR, reach: 8, label: 'Try', knot: 'shrine_cell_door' },
    { id: 'grate', x: 238, y: FLOOR, reach: 8, label: 'Look', knot: 'shrine_cell_grate' },
  ],

  acoustics: 'small',
  ambience: [{ sound: 'room', volume: 0.45 }, { sound: 'creaks', volume: 0.25 }, { sound: 'footfall', volume: 0.2, showIf: 'in_custody', when: ['morning', 'afternoon'] }, { sound: 'crowd', volume: 0.4, when: ['evening', 'night'], showIf: 'day7' }],
  exits: [],
};
