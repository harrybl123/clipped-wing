import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition, CityView } from '../types';

// The guest wing (Chapter 3): where the heirs of families your father doubts are invited to live, as an
// honour, and only find out once they're in that they can't leave (designer; docs/areas/capital/guest-wing.md).
// Beautiful rooms off a gold corridor, their doors shut; your friend's room at the far end, open; windows
// over the city that don't open; the guards' post at the corridor's end, by the way out.

const W = 640;
const FLOOR = 226;
const TOP = 50;

/** A window over the city between the doors (they don't open). */
const shutWindow = (x: number): CityView => ({ x, y: 84, width: 40, height: 66, horizon: 120, treeX: 3000, mullions: 10 });

export const guestWing: AreaDefinition = {
  id: 'guest-wing',
  name: 'the guest wing',
  width: W,
  height: 270,
  walls: 'marble',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.86,
  playerStart: { x: 600, y: FLOOR },
  surface: 'stone',
  acoustics: 'small',
  ambience: [
    { sound: 'room', volume: 0.3 },
    { sound: 'hum', volume: 0.12 },
  ],

  views: [shutWindow(74), shutWindow(214), shutWindow(324), shutWindow(434)],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 60, y: 190, colour: S.amber, radius: 70, radiusY: 40, strength: 0.18 }, // your friend's room
    { x: 560, y: 190, colour: S.amber, radius: 50, radiusY: 34, strength: 0.12 }, // the guards' post
  ],

  lines: [
    // Your friend's room, open at the far end: the edge of its doorway.
    { from: { x: 126, y: TOP }, to: { x: 126, y: FLOOR - 1 }, colour: S.amber },
  ],

  props: [
    // Your friend's room.
    { sprite: P.GUEST_BED, x: 24, y: FLOOR - 16 },
    { sprite: P.LAMP, x: 62, y: FLOOR - 7 },
    { sprite: P.WARDROBE, x: 94, y: FLOOR - 52 },
    // Gold lattice over the windows, so they can't be opened.
    ...[74, 214, 324, 434].map((x) => ({ sprite: P.lattice(40, 66), x, y: 84 })),
    // The corridor: the other guests' doors, shut.
    { sprite: P.rug(470), x: 130, y: FLOOR - 3 },
    { sprite: P.closedDoor(26, 46), x: 150, y: FLOOR - 46 },
    { sprite: P.closedDoor(26, 46), x: 266, y: FLOOR - 46 },
    { sprite: P.closedDoor(26, 46), x: 378, y: FLOOR - 46 },
    { sprite: P.closedDoor(26, 46), x: 488, y: FLOOR - 46 },
    // The guards' post, and the way out.
    { sprite: P.BARRIER, x: 532, y: FLOOR - 22 },
    { sprite: P.doorway(24, 46), x: 596, y: FLOOR - 46 },
  ],

  features: [
    { type: 'frames', frames: P.SURVEILLANCE_FRAMES, x: 540, y: 116, every: 700 },
    // Empty gilded cages, hung for ornament.
    ...[194, 304, 414].map((x) => ({ type: 'swing' as const, sprite: P.CAGE, x, y: TOP + 26, ropeTop: TOP, quiet: true, ropeColour: S.amber })),
  ],
  people: [],
  interactables: [],

  exits: [{ id: 'to-halls', x: 608, y: FLOOR, reach: 12, to: 'citadel-halls' }],
};
