import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './canopyProps';
import * as I from './canopyInteriors';
import { CANOPY_AMBIENCE, sides } from './canopyArea';
import type { AreaDefinition } from '../types';
import { DAY, MORNING, colonist, folk } from './people';

// The lowering platform (Chapter 4): where the tree's output leaves for the outside (doc;
// docs/areas/canopy/lowering-platform.md). Out on a long branch over the drop: the winch, its great drum of
// cable; a jib out over the edge with its pulley, the cable running down out of sight and the cage that rides
// it (the way down to the ground: the tree's edge in Chapter 2's borderland); crates of the tree's work,
// stencilled, waiting to go down, and one going; the tally board; the winch workers' hut.

const W = 760;
const H = 330;
const FLOOR = 230;
const END = 640;

export const loweringPlatform: AreaDefinition = {
  id: 'lowering-platform',
  name: 'the lowering platform',
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 220, treeX: -9999, backdrop: 'canopy', ground: 'deck', canopyDrop: 40, tentaclesX: 40 },
  ambient: 1,
  playerStart: { x: 30, y: FLOOR },
  surface: 'plank',
  acoustics: 'open',
  ambience: [...CANOPY_AMBIENCE, { sound: 'creaks', volume: 0.4 }, { sound: 'workshop', volume: 0.15 }],

  solids: [
    // The branch, out to its end; no further.
    { x: 0, y: FLOOR, width: END, height: H - FLOOR },
    { x: END, y: 0, width: 4, height: FLOOR, invisible: true },
    ...sides(W, H),
  ],

  lights: [
    { x: 470, y: FLOOR, colour: S.amber, radius: 70, radiusY: 8, strength: 0.18 },
    { x: 80, y: FLOOR, colour: S.amber, radius: 50, radiusY: 8, strength: 0.18 },
  ],

  lines: [
    // The jib out over the edge: its arm, its brace, the cable down from its pulley.
    { from: { x: 560, y: 110 }, to: { x: 712, y: 110 }, colour: S.wood },
    { from: { x: 560, y: 111 }, to: { x: 712, y: 111 }, colour: S.woodLight },
    { from: { x: 560, y: FLOOR - 1 }, to: { x: 560, y: 110 }, colour: S.wood },
    { from: { x: 561, y: FLOOR - 1 }, to: { x: 561, y: 110 }, colour: S.woodLight },
    { from: { x: 562, y: 180 }, to: { x: 640, y: 112 }, colour: S.wood },
    { from: { x: 712, y: 116 }, to: { x: 712, y: H - 1 }, colour: S.deep },
    // The cable off the winch's drum, up over the jib.
    { from: { x: 500, y: FLOOR - 36 }, to: { x: 560, y: 112 }, colour: S.deep },
  ],

  props: [
    // The limb the branch grows out of.
    { sprite: P.giantTrunk(90, H, 81), x: 0, y: 0, behind: true },
    { sprite: P.leafClump(200, 56, 82), x: 0, y: 0 },
    // The workers' hut on the branch.
    { sprite: P.treehouse(58, 26, 83, 'thatch'), x: 20, y: FLOOR - P.treehouseTop(58, 26, 'thatch') },
    // The tally board; crates waiting, stacked; the winch; the jib's pulley; the cage.
    { sprite: I.TALLY_BOARD, x: 120, y: FLOOR - 34 },
    ...[[170, 8], [184, 8], [176, 16], [300, 8], [314, 8], [328, 8], [306, 16], [320, 16], [314, 24], [390, 8], [404, 8]].map(([x, h]) => ({ sprite: P.CRATE, x: x!, y: FLOOR - h! })),
    { sprite: I.WINCH, x: 430, y: FLOOR - 56 },
    { sprite: P.cablePost(8), x: 707, y: 106 },
    { sprite: I.CAGE, x: 697, y: 150 },
    { sprite: P.lampPost(44), x: 600, y: FLOOR - 44 },
    { sprite: P.signpost('down', 22), x: 616, y: FLOOR - 22 },
    { sprite: P.vines(80, 50, 84), x: 200, y: FLOOR + 10 },
    { sprite: P.pipeRun(END - 10), x: 4, y: FLOOR + 9 },
  ],

  features: [
    // A crate going down on the cable, now and then.
    { type: 'pulse', points: [{ x: 712, y: 200 }, { x: 712, y: H + 10 }], speed: 22, every: 3500, sprite: P.CRATE },
    { type: 'swing', sprite: P.LANTERN, x: 640, y: 126, ropeTop: 111, quiet: true, ropeColour: S.wood },
  ],

  people: [
    colonist('hunter', 'hunter', 250, FLOOR, ['afternoon', 'evening']),
    colonist('quartermaster', 'quartermaster', 160, FLOOR, MORNING),
    folk('winch-1', 3, 470, FLOOR, 'c4_folk_winch', DAY),
    folk('winch-2', 6, 368, FLOOR, 'c4_folk_winch', DAY),
  ],

  interactables: [
    { id: 'winch', x: 466, y: FLOOR, reach: 26, label: 'Look', knot: 'c4_look_winch' },
    { id: 'crates', x: 318, y: FLOOR, reach: 22, label: 'Look', knot: 'c4_look_going_down' },
    { id: 'tally', x: 134, y: FLOOR, reach: 12, label: 'Look', knot: 'c4_look_tally' },
  ],

  exits: [
    { id: 'to-walkways', x: 12, y: FLOOR, reach: 10, to: 'walkways' },
    { id: 'to-trees-edge', x: 628, y: FLOOR, reach: 10, to: 'trees-edge' },
  ],
};
