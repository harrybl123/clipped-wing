import { SHADES as S } from '../../../ui/pixelArt';
import * as I from './canopyInteriors';
import * as P from './canopyProps';
import type { AreaDefinition } from '../types';

// The quartermaster's family (Chapter 4): their homestead on the ground (doc; docs/areas/canopy/homestead.md),
// at the forest's edge near the tree's foot, the tree vast beside it. A house of scrap and timber, a fenced
// yard, a garden in rows, a well, washing; their store shed with the canopy's crates in it: the
// quartermaster's hoard (doc). The hunter stops to trade here (plan); the hitman leaves the boy here (Chapter
// 5) and the scavenger finds him (Chapter 6). Off the map for now: the story takes you.

const W = 720;
const H = 270;
const FLOOR = 232;

export const homestead: AreaDefinition = {
  id: 'homestead',
  name: "the quartermaster's family",
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 196, treeX: 160, treeScale: 2.2, atRoots: true },
  ambient: 1,
  playerStart: { x: 24, y: FLOOR },
  surface: 'dirt',
  acoustics: 'open',
  ambience: [{ sound: 'wind', volume: 0.3 }, { sound: 'leaves', volume: 0.25 }, { sound: 'hearth', volume: 0.2 }],

  solids: [{ x: 0, y: FLOOR, width: W, height: H - FLOOR }, { x: -8, y: 0, width: 8, height: H, invisible: true }, { x: W - 4, y: 0, width: 4, height: H, invisible: true }],

  lights: [{ x: 470, y: FLOOR, colour: S.amber, radius: 40, radiusY: 8, strength: 0.3 }],

  lines: [],

  props: [
    { sprite: I.fence(120, 1), x: 60, y: FLOOR - 20 },
    { sprite: I.gardenRows(110, 2), x: 190, y: FLOOR - 14 },
    { sprite: I.SCRAP_HOUSE, x: 320, y: FLOOR - 64 },
    { sprite: P.washing(70, 7), x: 424, y: FLOOR - 26 },
    { sprite: I.WELL, x: 510, y: FLOOR - 11 },
    { sprite: I.STORE_SHED, x: 560, y: FLOOR - 46 },
    { sprite: I.fence(100, 3), x: 620, y: FLOOR - 20 },
    { sprite: P.pots(30, 8), x: 290, y: FLOOR - 16 },
  ],

  features: [
    { type: 'fire', x: 470, y: FLOOR - 1 },
    { type: 'smoke', x: 470, y: FLOOR - 10, top: 60 },
  ],

  people: [],

  interactables: [
    { id: 'shed', x: 588, y: FLOOR, reach: 16, label: 'Look', knot: 'c4_look_store_shed' },
    { id: 'garden', x: 244, y: FLOOR, reach: 30, label: 'Look', knot: 'c4_look_homestead_garden' },
  ],

  exits: [{ id: 'to-trees-edge', x: 14, y: FLOOR, reach: 10, to: 'trees-edge' }],
};
