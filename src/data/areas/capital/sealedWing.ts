import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition } from '../types';

// The sealed wing (Chapter 3): a door only your father goes through. It hums, and nobody explains it
// (docs/areas/capital/sealed-wing.md). A long corridor behind his study that gets plainer as it goes, the
// gold running out, ending at a seamless door with blue light round its edge. You never get through.

const W = 560;
const FLOOR = 226;
const TOP = 60;

export const sealedWing: AreaDefinition = {
  id: 'sealed-wing',
  name: 'the sealed wing',
  width: W,
  height: 270,
  walls: 'marble',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.7,
  playerStart: { x: 40, y: FLOOR },
  surface: 'stone',
  acoustics: 'tunnel',
  ambience: [
    { sound: 'room', volume: 0.2 },
    { sound: 'hum', volume: 0.7 },
  ],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 524, y: 190, colour: S.cyan, radius: 100, radiusY: 70, strength: 1 }, // the door's glow, strong enough to show on the marble
    { x: 60, y: 190, colour: S.amber, radius: 60, radiusY: 40, strength: 0.12 }, // from the study behind you
  ],

  lines: [
    // Cables: along the ceiling and down into the door's frame; along the floor and into its foot.
    { from: { x: 16, y: TOP + 4 }, to: { x: 500, y: TOP + 4 }, colour: S.deep },
    { from: { x: 16, y: TOP + 5 }, to: { x: 500, y: TOP + 5 }, colour: S.cyanDeep },
    { from: { x: 500, y: TOP + 4 }, to: { x: 500, y: FLOOR - 68 }, colour: S.deep },
    { from: { x: 501, y: TOP + 5 }, to: { x: 501, y: FLOOR - 68 }, colour: S.cyanDeep },
    { from: { x: 140, y: FLOOR - 2 }, to: { x: 502, y: FLOOR - 2 }, colour: S.deep },
    { from: { x: 140, y: FLOOR - 3 }, to: { x: 502, y: FLOOR - 3 }, colour: S.cyanDeep },
    { from: { x: 260, y: FLOOR - 5 }, to: { x: 502, y: FLOOR - 5 }, colour: S.deep },
  ],

  props: [
    { sprite: P.doorway(24, 46), x: 22, y: FLOOR - 46 },
    // The gold runs out as you go.
    { sprite: P.rug(140), x: 18, y: FLOOR - 3 },
    { sprite: P.STATUE, x: 92, y: FLOOR - 46 },
    { sprite: P.lightStrip(80), x: 170, y: 120 },
    { sprite: P.lightStrip(60), x: 330, y: 140 },
    // The door.
    { sprite: P.SEALED_DOOR, x: 502, y: FLOOR - 68 },
  ],

  features: [
    // Light running along the cables into the door.
    { type: 'pulse', points: [{ x: 16, y: TOP + 4 }, { x: 500, y: TOP + 4 }, { x: 500, y: FLOOR - 68 }], speed: 150, every: 700, count: 3, colour: S.cyan },
    { type: 'pulse', points: [{ x: 140, y: FLOOR - 3 }, { x: 502, y: FLOOR - 3 }], speed: 130, every: 900, count: 2, colour: S.cyan },
  ],
  people: [],
  interactables: [],

  exits: [{ id: 'to-study', x: 34, y: FLOOR, reach: 12, to: 'fathers-study' }],
};
