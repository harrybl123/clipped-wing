import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition } from '../types';
import { cast, inStory, servant, MORNING } from './people';

// Your father's study (Chapter 3): his wisdom (docs/areas/capital/fathers-study.md). The warmest room in
// the citadel: dark wood panelling over the marble floor, shelves of books and old things from before, amber lamplight,
// the castle's own hearth, the only real fire in the citadel; a case clock; a model of the city under glass.
// His desk by the window over the city, a screen on it kept face down. In the back wall, the
// door to the sealed wing, and you can hear it hum.

const W = 480;
const FLOOR = 230;
const TOP = 40;

export const fathersStudy: AreaDefinition = {
  id: 'fathers-study',
  name: "your father's study",
  width: W,
  height: 270,
  walls: 'panelled',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.72,
  playerStart: { x: 40, y: FLOOR },
  surface: 'stone',
  acoustics: 'small',
  ambience: [
    { sound: 'room', volume: 0.3 },
    { sound: 'clock', volume: 0.35 },
    { sound: 'hum', volume: 0.3 },
  ],

  views: [{ x: 392, y: 74, width: 52, height: 92, horizon: 120, treeX: 430, treeScale: 0.16, mullions: 13 }],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 366, y: 196, colour: S.amber, radius: 90, radiusY: 50, strength: 0.32 }, // the desk lamp
    { x: 200, y: 210, colour: S.amber, radius: 80, radiusY: 50, strength: 0.4 }, // the fire
    { x: 150, y: 150, colour: S.amber, radius: 140, radiusY: 80, strength: 0.14 }, // the room, warm
    { x: 286, y: 200, colour: S.cyan, radius: 30, radiusY: 40, strength: 0.14 }, // round the sealed wing's door
  ],

  lines: [],

  props: [
    { sprite: P.doorway(24, 46), x: 22, y: FLOOR - 46 },
    { sprite: P.CITY_MODEL, x: 52, y: FLOOR - 34 },
    { sprite: P.bookshelf(80, 112), x: 88, y: FLOOR - 112 },
    { sprite: P.HEARTH, x: 174, y: FLOOR - 46 },
    { sprite: P.bookshelf(40, 112), x: 230, y: FLOOR - 112 },
    { sprite: P.CASE_CLOCK, x: 304, y: FLOOR - 64 },
    // The door to the sealed wing: plain, dark, blue light at its edges.
    { sprite: P.doorway(26, 50), x: 273, y: FLOOR - 50 },
    { sprite: P.rug(150), x: 300, y: FLOOR - 3 },
    { sprite: P.DESK, x: 330, y: FLOOR - 26 },
    { sprite: P.HIGH_CHAIR, x: 378, y: FLOOR - 28 },
    { sprite: P.LAMP, x: 448, y: FLOOR - 7 },
  ],

  features: [
    { type: 'fire', x: 200, y: FLOOR - 7 },
    // Day 2: the bookshelf swings back, and there's a room behind it (the simulation room).
    { type: 'frames', frames: [P.openShelf(80, 112)], x: 88, y: FLOOR - 112, every: 200, showIf: 'sim_open' },
    { type: 'swing', sprite: P.PENDULUM, x: 313, y: FLOOR - 28, ropeTop: FLOOR - 45, quiet: true, ropeColour: S.amberDeep },
  ],
  people: [
    servant('servant', 0, 204, FLOOR, 'c3_fire', MORNING), // tending the fire
    // The evening: your father at his desk, his physician with him.
    cast('father', 406, FLOOR, { knot: 'study_father', when: ['evening'], flipX: true }),
    cast('physician', 318, FLOOR, { knot: 'study_physician', when: ['evening'] }),
    // Chapter 3's story. Day 2: your father by the bookshelf in the morning (he goes through it ahead of
    // you); by the fire in the evening, when you report; your sister in the doorway, listening.
    inStory('father-2', 'father', 160, FLOOR, 'c3day2=study', { knot: 'c3day2_father_study', flipX: true }),
    inStory('father-5', 'father', 226, FLOOR, 'c3day2=report', { knot: 'c3day2_report', flipX: true }),
    inStory('sister-5', 'sister', 30, FLOOR, 'c3day2=report', { knot: 'c3day2_sister_door' }),
    // Day 4: at his desk, in yesterday's clothes (if the physician sent you); by his fire at night.
    inStory('father-4', 'father', 226, FLOOR, 'c3day4=persuade', { knot: 'c3day4_father', flipX: true }),
    inStory('father-4n', 'father', 226, FLOOR, 'c3day4=night', { knot: 'c3day4_father_night', flipX: true }),
  ],
  interactables: [
    { id: 'model', x: 72, y: FLOOR, reach: 14, label: 'Look', knot: 'study_model' },
    { id: 'books', x: 128, y: FLOOR, reach: 14, label: 'Look', knot: 'study_books', hideIf: 'sim_open' },
    { id: 'hearth', x: 196, y: FLOOR, reach: 14, label: 'Look', knot: 'study_hearth' },
    { id: 'clock', x: 312, y: FLOOR, reach: 8, label: 'Look', knot: 'study_clock' },
    { id: 'desk', x: 356, y: FLOOR, reach: 10, label: 'Look', knot: 'study_desk' },
  ],

  exits: [
    { id: 'to-halls', x: 34, y: FLOOR, reach: 12, to: 'citadel-halls' },
    { id: 'to-sealed-wing', x: 286, y: FLOOR, reach: 14, to: 'sealed-wing' },
    // Through the bookshelf (Day 2 on).
    { id: 'to-simulation-room', x: 128, y: FLOOR, reach: 14, to: 'simulation-room', showIf: 'sim_open' },
  ],
};
