import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './canopyProps';
import * as I from './canopyInteriors';
import { CANOPY_AMBIENCE, sides } from './canopyArea';
import type { AreaDefinition } from '../types';

// Grounded's house (Chapter 4): the highest and oldest treehouse (doc; docs/areas/canopy/groundeds-house.md).
// Old wood, untidy, a carver's: his bench, half-carved things, his tools; the radio; a chart of the canopy
// pinned up. And on his shelves, every bird you ever sent up, in order, the clipped wing on every one (doc:
// he keeps every one): the only red in the canopy. A hammock; a balcony out over the leaves, the bridge on to
// the seed bed; a ladder up through the roof to the lookout; the door down to the walkways.

const W = 600;
const H = 300;
const FLOOR = 240;
const ROOM_FROM = 30;
const ROOM_TO = 470;

export const groundedsHouse: AreaDefinition = {
  id: 'groundeds-house',
  name: "Grounded's house",
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 200, treeX: -9999, backdrop: 'canopy', ground: 'deck', canopyDrop: 30, tentaclesX: 40 },
  ambient: 1,
  playerStart: { x: 40, y: FLOOR },
  surface: 'plank',
  acoustics: 'small',
  ambience: [...CANOPY_AMBIENCE, { sound: 'creaks', volume: 0.3 }],

  // The oldest bough there is under the floor, out to the balcony and the bridge.
  solids: [{ x: 0, y: FLOOR, width: 560, height: H - FLOOR }, { x: 560, y: FLOOR, width: W - 560, height: 4 }, ...sides(W, H)],

  lights: [
    { x: 300, y: FLOOR, colour: S.amber, radius: 160, radiusY: 10, strength: 0.25 },
    { x: 520, y: FLOOR, colour: S.white, radius: 60, radiusY: 8, strength: 0.15 },
  ],

  lines: [
    { from: { x: 560, y: FLOOR - 14 }, to: { x: 580, y: FLOOR - 10 }, colour: S.woodPale },
    { from: { x: 580, y: FLOOR - 10 }, to: { x: 599, y: FLOOR - 14 }, colour: S.woodPale },
  ],

  props: [
    { sprite: P.leafClump(200, 50, 51), x: 400, y: 0 },
    // The room: old walls, two round windows; the roof; his things.
    { sprite: I.wovenWall(ROOM_TO - ROOM_FROM, FLOOR - 100, 53, [[300, 24, 30, 30], [30, 30, 26, 30]], 0), x: ROOM_FROM, y: 100, behind: true },
    // The limb it's built round, up through the room and the roof: the ladder up it to the lookout.
    { sprite: P.giantTrunk(76, H, 52), x: 392, y: 0, behind: true },
    { sprite: I.bigRoof(ROOM_TO - ROOM_FROM + 50, 40, 54), x: ROOM_FROM - 25, y: 62 },
    { sprite: I.birdShelves(196, 5), x: 96, y: FLOOR - 112 },
    { sprite: I.CANOPY_CHART, x: 310, y: 130 },
    { sprite: I.workbench(56, 55), x: 300, y: FLOOR - 30 },
    { sprite: I.RADIO, x: 362, y: FLOOR - 33 },
    { sprite: P.hammock(54), x: 36, y: FLOOR - 18 },
    { sprite: I.homeDoor(9), x: 4, y: FLOOR - 30 },
    { sprite: P.ladder(FLOOR - 66), x: 420, y: 66 },
    { sprite: I.SACKS, x: 238, y: FLOOR - 6 },
    // The balcony: a rail, pots, a chime; the bridge to the seed bed.
    { sprite: P.rail(90), x: 470, y: FLOOR - 10 },
    { sprite: P.pots(30, 56), x: 480, y: FLOOR - 16 },
    { sprite: P.signpost('leaf', 22), x: 576, y: FLOOR - 22 },
    { sprite: P.vines(70, 36, 57), x: 100, y: FLOOR + 22 },
  ],

  features: [
    { type: 'swing', sprite: P.LANTERN, x: 200, y: FLOOR - 70, ropeTop: 100, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.CHIME, x: 530, y: FLOOR - 40, ropeTop: 92, quiet: true, ropeColour: S.wood },
  ],

  people: [],

  interactables: [
    { id: 'birds', x: 194, y: FLOOR, reach: 40, label: 'Look', knot: 'c4_look_your_birds' },
    { id: 'bench', x: 324, y: FLOOR, reach: 14, label: 'Look', knot: 'c4_look_groundeds_bench' },
    { id: 'radio', x: 370, y: FLOOR, reach: 8, label: 'Look', knot: 'c4_look_radio' },
    { id: 'chart', x: 340, y: FLOOR, reach: 6, label: 'Look', knot: 'c4_look_chart' },
  ],

  exits: [
    { id: 'to-walkways', x: 14, y: FLOOR, reach: 10, to: 'walkways' },
    { id: 'to-lookout', x: 424, y: FLOOR, reach: 8, to: 'lookout' },
    { id: 'to-seed-bed', x: 588, y: FLOOR, reach: 10, to: 'seed-bed' },
  ],
};
