import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition } from '../types';
import { guard, inStory } from './people';

// The simulation room (Chapter 3, Day 2; designer): behind your father's study's bookshelf, and you never
// knew. A hall of black with points of blue light dotted across it, running off into the dark (designer);
// panels of light hanging in it; and in the middle, the war table: the capital in light, side-on, every place
// and every lift (docs/sequences/chapter-3/plan.md). "Where we practise the art of war."

const W = 600;
const FLOOR = 230;
const TOP = 50;

export const simulationRoom: AreaDefinition = {
  id: 'simulation-room',
  name: 'the simulation room',
  width: W,
  height: 270,
  walls: 'void',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.4,
  playerStart: { x: 44, y: FLOOR },
  surface: 'stone',
  acoustics: 'small',
  ambience: [
    { sound: 'hum', volume: 0.35 },
    { sound: 'room', volume: 0.2 },
  ],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 330, y: 190, colour: S.cyan, radius: 200, radiusY: 80, strength: 0.5 }, // the table
  ],

  lines: [],

  props: [
    // The way back through, into the study's warm light.
    { sprite: P.doorway(24, 46), x: 30, y: FLOOR - 46 },
    // Panels of light hanging in the dark.
    { sprite: P.holoPanel(40, 26), x: 120, y: TOP + 20 },
    { sprite: P.holoPanel(32, 20), x: 470, y: TOP + 34 },
    { sprite: P.holoPanel(24, 40), x: 540, y: TOP + 10 },
  ],

  features: [
    // Coming in behind your father.
    { type: 'trigger', x: 64, y: FLOOR, reach: 12, knot: 'c3day2_room', showIf: 'c3day2=study', hideIf: 'room2' },
    // Day 4: coming in to the riot, already lit on the table (nobody else here: your father's asleep).
    { type: 'trigger', x: 64, y: FLOOR, reach: 12, knot: 'c3day4_room', showIf: 'c3day4=table', hideIf: 'room4' },
    // Day 6: coming in with your friend.
    { type: 'trigger', x: 64, y: FLOOR, reach: 12, knot: 'c3day6_room', showIf: 'c3day6=room', hideIf: 'room6' },
    { type: 'frames', frames: P.WAR_TABLE_FRAMES, x: 250, y: FLOOR - 56, every: 380 },
  ],
  people: [
    // Day 2: your father at the head of the table.
    inStory('father-sim', 'father', 424, FLOOR, 'c3day2=room,table', { knot: 'c3day2_father_room', flipX: true }),
    // Day 6: your friend with you, then across the table from you; your father in the doorway after, the
    // captain and two of the guard behind him (the story brings them in).
    inStory('heir-f', 'heir', 60, FLOOR, 'heir_with_you', { follow: true, knot: 'c3day6_heir_walk' }),
    inStory('heir-6s', 'heir', 404, FLOOR, 'c3day6=table,caught', { flipX: true }),
    inStory('father-6s', 'father', 36, FLOOR, 'c3day6=table,caught', { hidden: true }),
    inStory('captain-6s', 'captain', 30, FLOOR, 'c3day6=table,caught', { hidden: true }),
    guard('guard-6a', 0, 22, FLOOR, 'c3_guard', undefined, { showIf: 'c3day6=table,caught', hidden: true, knot: undefined }),
    guard('guard-6b', 1, 26, FLOOR, 'c3_guard', undefined, { showIf: 'c3day6=table,caught', hidden: true, knot: undefined }),
  ],
  interactables: [
    { id: 'table', x: 330, y: FLOOR, reach: 30, label: 'Stand at the table', knot: 'c3day2_table', showIf: 'c3day2=room' },
    { id: 'table-4', x: 330, y: FLOOR, reach: 30, label: 'Stand at the table', knot: 'c3day4_table', showIf: 'c3day4=table' },
    { id: 'table-6', x: 330, y: FLOOR, reach: 30, label: 'Stand at the table', knot: 'c3day6_table', showIf: 'c3day6=room' },
  ],

  exits: [{ id: 'to-study', x: 42, y: FLOOR, reach: 12, to: 'fathers-study' }],
};
