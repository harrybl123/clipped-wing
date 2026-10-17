import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './canopyProps';
import * as I from './canopyInteriors';
import { CANOPY_AMBIENCE, sides, stair } from './canopyArea';
import type { AreaDefinition } from '../types';

// The ascended's hall (Chapter 4): everyone who ever went up the tube is alive here (doc;
// docs/areas/canopy/ascended-hall.md). A long hall in the boughs under a low roof held up by columns of living
// wood, open to the leaves: along its back, the wall of every master's last piece, the ones they carried up,
// each in its niche with the spiral cut into it (Act 1: every master's mark); curtained alcoves, people's
// rooms; benches. Not a heaven: an old people's home and a guild hall at once. At its right end a terrace,
// the way on to the tube mouth; at its left, steps down to a bough deck and the rope bridge to the great house.

const W = 760;
const H = 360;
const FLOOR = 240;
const LOW = 320;
const HALL_FROM = 130;
const HALL_TO = 600;

export const ascendedHall: AreaDefinition = {
  id: 'ascended-hall',
  name: "the ascended's hall",
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 230, treeX: -9999, backdrop: 'canopy', ground: 'deck', tentaclesX: 600 },
  ambient: 1,
  playerStart: { x: 700, y: FLOOR },
  surface: 'plank',
  acoustics: 'hall',
  ambience: [...CANOPY_AMBIENCE, { sound: 'chatter', volume: 0.15 }, { sound: 'pages', volume: 0.15 }],

  solids: [
    // The hall's floor and the terrace, on a great bough.
    { x: 120, y: FLOOR, width: 580, height: 20 },
    { x: 700, y: FLOOR, width: W - 700, height: 4 },
    // Steps down at the left end to a bough deck and the bridge to the great house.
    ...stair(120, LOW, FLOOR, 'right'),
    { x: 0, y: LOW, width: 120, height: H - LOW },
    ...sides(W, H),
  ],

  lights: [
    { x: 300, y: FLOOR, colour: S.amber, radius: 200, radiusY: 10, strength: 0.18 },
    { x: 640, y: FLOOR, colour: S.white, radius: 80, radiusY: 8, strength: 0.15 },
  ],

  lines: [
    { from: { x: 700, y: FLOOR - 14 }, to: { x: 730, y: FLOOR - 10 }, colour: S.woodPale },
    { from: { x: 730, y: FLOOR - 10 }, to: { x: 759, y: FLOOR - 14 }, colour: S.woodPale },
  ],

  props: [
    // Far back: a bough from the left, a house on its own limb by the terrace; leaves over.
    { sprite: P.leafFloor(W, 90, 31), x: 0, y: H - 90, behind: true },
    { sprite: P.giantTrunk(90, H, 31), x: 640, y: 0, behind: true },
    { sprite: P.bough(W, 30, 33, 0, 'both'), x: 0, y: FLOOR - 4, behind: true },
    { sprite: P.giantTrunk(70, H, 32), x: 30, y: 0, behind: true },
    { sprite: P.leafClump(240, 60, 32), x: 0, y: 0 },
    { sprite: P.leafClump(200, 56, 33), x: 560, y: 0 },
    { sprite: P.vines(40, 80, 34), x: 610, y: 40 },
    // The hall: its back wall of masters' last pieces, alcoves, columns of living wood, the low roof.
    { sprite: I.wovenWall(HALL_TO - HALL_FROM, FLOOR - 112, 35, [[400, 30, 22, 40]], 0), x: HALL_FROM, y: 112, behind: true },
    { sprite: I.lastPieces(240, 98, 36), x: 246, y: FLOOR - 104, behind: true },
    { sprite: I.alcove(1), x: 146, y: FLOOR - 44 },
    { sprite: I.alcove(2), x: 186, y: FLOOR - 44 },
    { sprite: I.alcove(3), x: 500, y: FLOOR - 44 },
    { sprite: I.alcove(4), x: 540, y: FLOOR - 44 },
    { sprite: I.bigRoof(HALL_TO - HALL_FROM + 50, 36, 37), x: HALL_FROM - 25, y: 80 },
    ...[HALL_FROM, 232, 486, HALL_TO - 14].map((x) => ({ sprite: I.livingColumn(FLOOR - 116, x), x, y: 116 })),
    // Benches, pots, a rail along the terrace, a lamp; a sign to the tube mouth.
    { sprite: P.bench(30), x: 270, y: FLOOR - 6 },
    { sprite: P.bench(30), x: 400, y: FLOOR - 6 },
    { sprite: P.pots(26, 38), x: 450, y: FLOOR - 16 },
    { sprite: P.rail(150), x: 610, y: FLOOR - 10 },
    { sprite: P.signpost('tube', 22), x: 736, y: FLOOR - 22 },
    { sprite: P.lampPost(40), x: 614, y: FLOOR - 40 },
    // The bough deck below: a garden, a sign to the great house.
    { sprite: P.planter(46, 40), x: 40, y: LOW - 24 },
    { sprite: P.signpost('house', 22), x: 6, y: LOW - 22 },
    { sprite: P.vines(80, 40, 41), x: 200, y: FLOOR + 22 },
    { sprite: P.vines(60, 30, 42), x: 460, y: FLOOR + 22 },
  ],

  features: [
    { type: 'swing', sprite: P.LANTERN, x: 220, y: FLOOR - 60, ropeTop: 118, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.LANTERN, x: 366, y: FLOOR - 70, ropeTop: 118, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.LANTERN, x: 520, y: FLOOR - 60, ropeTop: 118, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.CHIME, x: 680, y: FLOOR + 24, ropeTop: FLOOR + 4, quiet: true, ropeColour: S.wood },
  ],

  people: [],

  interactables: [
    { id: 'pieces', x: 366, y: FLOOR, reach: 40, label: 'Look', knot: 'c4_look_last_pieces' },
    { id: 'alcoves', x: 178, y: FLOOR, reach: 30, label: 'Look', knot: 'c4_look_alcoves' },
    { id: 'columns', x: 492, y: FLOOR, reach: 8, label: 'Look', knot: 'c4_look_columns' },
  ],

  exits: [
    { id: 'to-tube-mouth', x: 748, y: FLOOR, reach: 10, to: 'tube-mouth' },
    { id: 'to-great-house', x: 14, y: LOW, reach: 10, to: 'great-house' },
  ],
};
