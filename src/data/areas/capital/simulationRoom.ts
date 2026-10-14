import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition } from '../types';
import { inStory } from './people';

// The simulation room (Chapter 3, Day 2; designer): behind your father's study's bookshelf, and you never
// knew. Dark, bare walls; screens round them showing the city's districts; and filling the room, the war
// table: the capital in light across it, side-on, every place and every lift (docs/sequences/chapter-3/plan.md).
// "Where we practise the art of war."

const W = 400;
const FLOOR = 230;
const TOP = 50;

export const simulationRoom: AreaDefinition = {
  id: 'simulation-room',
  name: 'the simulation room',
  width: W,
  height: 270,
  walls: 'bare',
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
    { x: 230, y: 190, colour: S.cyan, radius: 150, radiusY: 50, strength: 0.4 }, // the table
    { x: 40, y: 200, colour: S.amber, radius: 30, radiusY: 40, strength: 0.15 }, // the study, through the shelf
  ],

  lines: [],

  props: [
    // The way back through, into the study's warm light.
    { sprite: P.doorway(24, 46), x: 30, y: FLOOR - 46 },
    // Screens round the walls, each a district.
    { sprite: P.holoPanel(40, 26), x: 90, y: TOP + 14 },
    { sprite: P.holoPanel(40, 26), x: 300, y: TOP + 14 },
  ],

  features: [
    // Coming in behind your father.
    { type: 'trigger', x: 64, y: FLOOR, reach: 12, knot: 'c3day2_room', showIf: 'c3day2=study', hideIf: 'room2' },
    { type: 'frames', frames: P.WAR_TABLE_FRAMES, x: 150, y: FLOOR - 56, every: 380 },
    { type: 'frames', frames: P.scrollingScreen(48, 30), x: 176, y: TOP + 10, every: 500 },
  ],
  people: [
    // Day 2: your father at the head of the table.
    inStory('father-sim', 'father', 324, FLOOR, 'c3day2=room,table', { knot: 'c3day2_father_room', flipX: true }),
  ],
  interactables: [
    { id: 'table', x: 230, y: FLOOR, reach: 30, label: 'Stand at the table', knot: 'c3day2_table', showIf: 'c3day2=room' },
  ],

  exits: [{ id: 'to-study', x: 42, y: FLOOR, reach: 12, to: 'fathers-study' }],
};
