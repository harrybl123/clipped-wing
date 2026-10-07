import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './sunkTownProps';
import type { AreaDefinition, Solid } from '../types';

// The sunk town (Chapter 2): half-buried ruins of the old society, rich but unstable. On the surface,
// domes and a tipped tower top poking out of the dirt, a staircase going down into the ground. Through a
// broken window, a way down into rooms beneath: smooth walls with no joins, rounded windows full of earth,
// dead screens still glowing faintly. Between the two rooms, a door that still opens by itself when you
// come near, then stops halfway and judders (the signature). The ceiling of the deeper room comes down as
// you run through; a shaft of fallen slabs climbs back up to the surface. Nothing is explained.
// See docs/areas/borderland/sunk-town.md.

const W = 900;
const H = 420;
const SURFACE = 170;
const ROOM_A = { x: 240, y: 250, end: 520, floor: 330 };
const ROOM_B = { x: 520, y: 290, end: 820, floor: 370 };
const SHAFT = { x: 300, end: 330 };
const CLIMB = { x: 780, end: 820 };

/** Ledges up the way down (under the broken window) and up the climb at the far end: [x, y, width]. */
const LEDGES: [number, number, number][] = [
  [SHAFT.x, 290, 30], [SHAFT.x, 250, 30], [SHAFT.x, 210, 30],
  [CLIMB.x + 4, 330, 22], [CLIMB.x + 14, 290, 22], [CLIMB.x + 4, 250, 22], [CLIMB.x + 14, 210, 22],
];

/** The earth: everything that isn't a room or a way through, as solid blocks. */
const EARTH: Solid[] = [
  { x: 0, y: SURFACE, width: ROOM_A.x, height: H - SURFACE },
  { x: ROOM_A.x, y: SURFACE, width: SHAFT.x - ROOM_A.x, height: ROOM_A.y - SURFACE },
  { x: SHAFT.end, y: SURFACE, width: ROOM_A.end - SHAFT.end, height: ROOM_A.y - SURFACE },
  { x: ROOM_A.x, y: ROOM_A.floor, width: ROOM_A.end - ROOM_A.x, height: H - ROOM_A.floor },
  { x: ROOM_A.end, y: SURFACE, width: CLIMB.x - ROOM_A.end, height: ROOM_B.y - SURFACE },
  { x: ROOM_B.x, y: ROOM_B.floor, width: ROOM_B.end - ROOM_B.x, height: H - ROOM_B.floor },
  { x: ROOM_B.end, y: SURFACE, width: W - ROOM_B.end, height: H - SURFACE },
];

export const sunkTown: AreaDefinition = {
  id: 'sunk-town',
  name: 'the sunk town',
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 150, treeX: 420, treeScale: 0.85 },
  ambient: 1,
  playerStart: { x: 30, y: SURFACE },
  surface: 'dirt',
  acoustics: 'open',

  solids: [
    ...EARTH,
    { x: -8, y: 0, width: 8, height: H, invisible: true },
    { x: W, y: 0, width: 8, height: H, invisible: true },
    ...LEDGES.map(([x, y, width]): Solid => ({ x, y, width, height: 4, oneWay: true, invisible: true })),
  ],

  lights: [
    { x: 400, y: 320, colour: S.cyan, radius: 60, radiusY: 14, strength: 0.18 }, // the dead screens' glow on the floor
    { x: 660, y: 360, colour: S.cyan, radius: 60, radiusY: 14, strength: 0.16 },
  ],

  lines: [],

  props: [
    // The surface: domes, the tower top, the stairs into the dirt.
    { sprite: P.dome(70, 30, 1), x: 90, y: SURFACE - 30 },
    { sprite: P.TOWER_TOP, x: 200, y: SURFACE - 44 },
    { sprite: P.brokenFrame(SHAFT.end - SHAFT.x), x: SHAFT.x - 4, y: SURFACE - 4 },
    { sprite: P.dome(110, 44, 2), x: 380, y: SURFACE - 44 },
    { sprite: P.STAIRS_DOWN, x: 540, y: SURFACE - 20 },
    { sprite: P.dome(56, 22, 3), x: 640, y: SURFACE - 22 },
    { sprite: P.dome(50, 28, 4), x: 836, y: SURFACE - 28 },
    // Behind the ways down: earth.
    { sprite: P.earth(SHAFT.end - SHAFT.x, ROOM_A.y - SURFACE), x: SHAFT.x, y: SURFACE },
    { sprite: P.earth(CLIMB.end - CLIMB.x, ROOM_B.y - SURFACE), x: CLIMB.x, y: SURFACE },
    // The rooms.
    { sprite: P.roomWall(ROOM_A.end - ROOM_A.x, ROOM_A.floor - ROOM_A.y, 1), x: ROOM_A.x, y: ROOM_A.y },
    { sprite: P.roomWall(ROOM_B.end - ROOM_B.x, ROOM_B.floor - ROOM_B.y, 2), x: ROOM_B.x, y: ROOM_B.y },
    ...LEDGES.map(([x, y, width]) => ({ sprite: P.slab(width), x, y })),
  ],

  features: [
    { type: 'autodoor', sprite: P.AUTODOOR, x: ROOM_A.end - 5, y: ROOM_B.y, range: 50 },
    { type: 'rubble', x: 460, top: ROOM_A.y + 2, floorY: ROOM_A.floor, every: 3800, reset: { x: 340, y: ROOM_A.floor } },
    { type: 'collapse', from: 580, to: 760, y: ROOM_B.floor, top: ROOM_B.y, reset: { x: 540, y: ROOM_B.floor } },
  ],
  people: [],

  interactables: [
    { id: 'dome', x: 435, y: SURFACE, reach: 30, label: 'Look', knot: 'sunk_town_dome' },
    { id: 'stairs', x: 560, y: SURFACE, reach: 14, label: 'Look', knot: 'sunk_town_stairs' },
    { id: 'screen', x: 300, y: ROOM_A.floor, reach: 20, label: 'Look', knot: 'sunk_town_screen' },
    { id: 'door', x: ROOM_A.end - 10, y: ROOM_A.floor, reach: 10, label: 'Look', knot: 'sunk_town_door' },
    { id: 'search', x: 700, y: ROOM_B.floor, reach: 20, label: 'Search', knot: 'sunk_town_search' },
  ],

  exits: [
    { id: 'to-picked-fields', x: 16, y: SURFACE, reach: 12, to: 'picked-fields' },
    { id: 'to-deep-ground', x: 884, y: SURFACE, reach: 12, to: 'deep-ground' },
  ],

  ambience: [
    { sound: 'wind', volume: 0.4 },
    { sound: 'hum', volume: 0.08 }, // something, somewhere, still powered
    { sound: 'drips', volume: 0.2 },
  ],
};
