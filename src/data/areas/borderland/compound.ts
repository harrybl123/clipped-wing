import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './compoundProps';
import { roof } from './shackProps';
import type { AreaDefinition } from '../types';
import { DAY, cast, dogFollowing, local, rival, stroller } from './people';

// The boss's compound (Chapter 2): his home and seat, on a rise at the top of the settlement, walled
// with the best scrap. Off limits at first; it opens once you're brought in (and if you move your brother
// in, he lives here). Outside: the lane, then the gateway through the wall (you walk through it). The
// swept yard: washing on the line, a whole water tank, still full, crates of tribute under a cloth. Then
// the house front: two storeys of whole matched panels, windows with curtains and lamplight, a porch with
// lamps, the door standing open. The door leads inside: the boss's house is its own area, within this one
// (`compoundHouse.ts`; designer: the cutaway's door was floating). Ways back to the bar (the lane); the
// walkway to the tally house is upstairs in the house.
// See docs/areas/borderland/compound.md. The boss, his circle and the guards come with the cast.

const W = 960;
const FLOOR = 232;
const GATE_X = 150;
const HOUSE = { x: 430, top: 70, end: 940 };
/** The front door's left edge, in the house front's own pixels. */
const DOOR = 70;

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
    { x: -8, y: 0, width: 8, height: 270, invisible: true },
    { x: W, y: 0, width: 8, height: 270, invisible: true },
  ],

  lights: [
    { x: GATE_X + 12, y: FLOOR, colour: S.amber, radius: 26, radiusY: 7, strength: 0.25 },
    { x: GATE_X + 51, y: FLOOR, colour: S.amber, radius: 26, radiusY: 7, strength: 0.25 },
    { x: 303, y: FLOOR, colour: S.amber, radius: 30, radiusY: 8, strength: 0.2 },
    { x: HOUSE.x + DOOR + 14, y: FLOOR, colour: S.amber, radius: 44, radiusY: 9, strength: 0.4 }, // light spilling from the door
  ],

  lines: [],

  props: [
    // The lane, outside: a stool where the gate guard sits.
    { sprite: P.STOOL, x: 128, y: FLOOR - 5 },
    // The yard's wall behind, from the gateway to the house.
    { sprite: P.matchedWall(HOUSE.x - GATE_X - 64, 40), x: GATE_X + 64, y: FLOOR - 40 },
    // The yard.
    { sprite: P.washingLine(80), x: 222, y: FLOOR - 34 },
    { sprite: P.lampPost(40), x: 300, y: FLOOR - 40 },
    { sprite: P.TANK, x: 314, y: FLOOR - 34 },
    { sprite: P.TRIBUTE, x: 356, y: FLOOR - 20 },
    // The house front, its roof and flue.
    { sprite: roof(HOUSE.end - HOUSE.x + 16, 8), x: HOUSE.x - 8, y: HOUSE.top - 12 },
    { sprite: P.FLUE, x: HOUSE.x + 180, y: HOUSE.top - 34 },
    { sprite: P.houseFront(HOUSE.end - HOUSE.x, FLOOR - HOUSE.top, DOOR), x: HOUSE.x, y: HOUSE.top },
    { sprite: P.CLOTH_POT, x: HOUSE.x + DOOR - 22, y: FLOOR - 8 },
    { sprite: P.CLOTH_POT, x: HOUSE.x + DOOR + 44, y: FLOOR - 8 },
    { sprite: P.BENCH, x: HOUSE.x + 120, y: FLOOR - 7 },
    // The gateway last: you walk through it, in front of everything behind it.
    { sprite: P.GATEWAY, x: GATE_X, y: FLOOR - 72 },
  ],

  features: [],
  people: [
    // Chapter 2, Day 11 (end the conflict): the watcher, waiting for you by the tribute shed.
    cast('watcher', 390, FLOOR, { id: 'watcher-truce11', knot: 'c2day11_truce_watcher', when: ['afternoon', 'evening'], showIf: 'truce11', hideIf: 'truce_watcher11', flipX: true }),
    dogFollowing(30, FLOOR),
    // On the gate, outside.
    cast('enforcer', 116, FLOOR, { knot: 'compound_enforcer', when: ['morning', 'evening', 'night'] }),
    // Day 9, before dawn: the watcher waiting up at the gate; the scout you've brought him.
    // Day 10, afternoon: the watcher by the tribute shed, with the board (if he respects you).
    cast('watcher', 390, FLOOR, { id: 'watcher-10', knot: 'c2day10_watcher', when: ['afternoon'], showIf: 'watcher10', flipX: true }),
    cast('watcher', 96, FLOOR, { id: 'watcher-gate', when: ['night'], showIf: 'turnin9', flipX: true }),
    rival('scout-gate', 1, 76, FLOOR, ['night'], { showIf: 'turnin9' }),
    // The yard.
    cast('boss_son', 296, FLOOR, { knot: 'compound_son', when: ['afternoon', 'evening'], flipX: true }),
    local('washer', 4, 236, FLOOR, ['morning']),
    stroller('runner', 11, 220, 420, FLOOR, DAY),
  ],

  interactables: [
    { id: 'gate', x: GATE_X + 32, y: FLOOR, reach: 14, label: 'Look', knot: 'compound_gate' },
    { id: 'washing', x: 262, y: FLOOR, reach: 18, label: 'Look', knot: 'compound_washing' },
    { id: 'tank', x: 329, y: FLOOR, reach: 12, label: 'Look', knot: 'compound_tank' },
    { id: 'tribute', x: 374, y: FLOOR, reach: 14, label: 'Look', knot: 'compound_tribute' },
    { id: 'windows', x: HOUSE.x + 300, y: FLOOR, reach: 60, label: 'Look', knot: 'compound_windows' },
  ],

  exits: [
    { id: 'to-bar', x: 16, y: FLOOR, reach: 12, to: 'bar' },
    { id: 'to-house', x: HOUSE.x + DOOR + 14, y: FLOOR, reach: 12, to: 'compound-house' },
  ],

  ambience: [
    { sound: 'wind', volume: 0.2 },
    { sound: 'chatter', volume: 0.1, when: ['morning', 'afternoon', 'evening'] }, // the settlement, below
  ],
};
