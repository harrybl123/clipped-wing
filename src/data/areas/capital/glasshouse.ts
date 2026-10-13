import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition, Line, Solid } from '../types';

// The glasshouse (Chapter 3): the only greenery, where upper society's salons happen
// (docs/areas/capital/glasshouse.md). A great roof of glass over the citadel, the sky through it, painted
// for the time of day; beds of plants rimmed in gold, small trees in pots, a fountain; the one place with
// soil in it. A raised terrace on the right where the hostess holds court.

const W = 640;
const FLOOR = 230;
const TOP = 20;
/** Where the glass roof ends and the marble walls begin. */
const GLASS = 140;
/** The terrace: steps up from the left, then level to the wall. */
const TERRACE_FROM = 456;
const TERRACE = FLOOR - 24;

function terrace(): Solid[] {
  return [0, 1, 2].map((i) => {
    const x = TERRACE_FROM + 8 * i;
    const top = FLOOR - 8 * (i + 1);
    return { x, y: top, width: W - 16 - x, height: FLOOR - top, oneWay: true };
  });
}

/** The glass roof's great gold rib, arching across. */
function rib(): Line[] {
  const points = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    return { x: Math.round(16 + t * (W - 32)), y: Math.round(GLASS - Math.sin(t * Math.PI) * (GLASS - TOP - 4)) };
  });
  return points.slice(1).map((to, i) => ({ from: points[i]!, to, colour: S.amber }));
}

export const glasshouse: AreaDefinition = {
  id: 'glasshouse',
  name: 'the glasshouse',
  width: W,
  height: 270,
  walls: 'marble',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.95,
  playerStart: { x: 40, y: FLOOR },
  surface: 'stone',
  acoustics: 'hall',
  ambience: [
    { sound: 'room', volume: 0.25 },
    { sound: 'leaves', volume: 0.3 },
    { sound: 'drips', volume: 0.2 },
  ],

  // The glass roof: sky only (the horizon is far below it).
  views: [{ x: 18, y: TOP, width: W - 36, height: GLASS - TOP, horizon: 600, treeX: 3000, mullions: 32 }],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    ...terrace(),
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 320, y: GLASS, colour: S.white, radius: 300, radiusY: 50, strength: 0.16 }, // daylight down through the glass
    { x: 320, y: 214, colour: S.green, radius: 220, radiusY: 26, strength: 0.08 }, // the beds
    { x: 320, y: 210, colour: S.cyan, radius: 30, radiusY: 24, strength: 0.12 }, // the fountain
  ],

  lines: rib(),

  props: [
    { sprite: P.doorway(24, 46), x: 22, y: FLOOR - 46 },
    // Vines trailing from the glass.
    ...[70, 118, 236, 284, 396, 520, 580].map((x, i) => ({ sprite: P.vines(30 + ((i * 17) % 40)), x, y: GLASS + 2 })),
    { sprite: P.POTTED_TREE, x: 90, y: FLOOR - 56 },
    { sprite: P.POTTED_TREE, x: 270, y: FLOOR - 56 },
    // Trellises on the walls, plants climbing them.
    { sprite: P.trellis(80, 66), x: 176, y: GLASS + 6 },
    { sprite: P.trellis(80, 66), x: 352, y: GLASS + 6 },
    { sprite: P.plantBed(70, 26), x: 60, y: FLOOR - 26 },
    { sprite: P.POTTED_TREE, x: 140, y: FLOOR - 56 },
    { sprite: P.plantBed(100, 30), x: 180, y: FLOOR - 30 },
    { sprite: P.plantBed(80, 24), x: 350, y: FLOOR - 24 },
    { sprite: P.POTTED_TREE, x: 430, y: FLOOR - 56 },
    // The terrace.
    { sprite: P.rug(130), x: 490, y: TERRACE - 3 },
    { sprite: P.COUCH, x: 500, y: TERRACE - 16 },
    { sprite: P.LOW_TABLE, x: 546, y: TERRACE - 7 },
    { sprite: P.COUCH, x: 572, y: TERRACE - 16 },
  ],

  features: [
    { type: 'frames', frames: P.FOUNTAIN_FRAMES, x: 300, y: FLOOR - 30, every: 200 },
    { type: 'drip', x: 160, y: GLASS + 2, floorY: FLOOR },
    { type: 'drip', x: 342, y: GLASS + 2, floorY: FLOOR },
    { type: 'drip', x: 470, y: GLASS + 2, floorY: TERRACE },
  ],
  people: [],
  interactables: [],

  exits: [{ id: 'to-halls', x: 34, y: FLOOR, reach: 12, to: 'citadel-halls' }],
};
