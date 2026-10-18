import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './canopyProps';
import * as I from './canopyInteriors';
import * as CAPITAL from '../capital/cityProps';
import { CANOPY_AMBIENCE, sides } from './canopyArea';
import type { AreaDefinition } from '../types';
import { colonist, girlGuide, guide, inStory } from './people';

// Grounded's house (Chapter 4): the highest and oldest treehouse (doc; docs/areas/canopy/groundeds-house.md).
// Old wood, untidy, a revolutionary's and a poet's (designer: lots of character, clearly an intellectual):
// books everywhere, the wing painted big on the wall, poems and plans pinned up with threads between them, a
// map of the world, the press he prints pamphlets on, his radio, a reading chair, candles burnt low. A
// balcony out over the leaves, the bridge on to the seed bed; a ladder up his limb to the lookout; the door
// down to the walkways.

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
    // The room: old walls, two round windows; the limb up through it; the roof.
    { sprite: I.wovenWall(ROOM_TO - ROOM_FROM, FLOOR - 100, 53, [[300, 24, 30, 30], [30, 30, 26, 30]], 0), x: ROOM_FROM, y: 100, behind: true },
    { sprite: P.giantTrunk(76, H, 52), x: 392, y: 0, behind: true },
    { sprite: I.bigRoof(ROOM_TO - ROOM_FROM + 50, 40, 54), x: ROOM_FROM - 25, y: 62 },
    // A revolutionary's, a poet's (designer): books on every wall and in piles on the floor; the wing, his
    // mark, painted big; pages pinned up over his desk with threads between them; a map of the world with
    // the places he knows joined up; the press he prints his pamphlets on; a reading chair, candles.
    { sprite: I.bookshelves(70, 120, 1), x: 62, y: FLOOR - 120 },
    { sprite: CAPITAL.symbolMark('paint', 2), x: 142, y: 110 },
    { sprite: I.pinnedPages(110, 60, 2), x: 196, y: 112 },
    { sprite: I.WORLD_MAP, x: 312, y: 118 },
    { sprite: I.bookshelves(46, 90, 3), x: 340, y: FLOOR - 90 },
    { sprite: I.ARMCHAIR, x: 36, y: FLOOR - 11 },
    { sprite: I.bookPiles(40, 4), x: 136, y: FLOOR - 26 },
    { sprite: I.WRITING_DESK, x: 192, y: FLOOR - 34 },
    { sprite: I.CANDLES, x: 232, y: FLOOR - 40 },
    { sprite: I.PRINTING_PRESS, x: 268, y: FLOOR - 40 },
    { sprite: I.bookPiles(30, 5), x: 312, y: FLOOR - 26 },
    { sprite: I.RADIO, x: 350, y: FLOOR - 101 },
    { sprite: I.homeDoor(9), x: 4, y: FLOOR - 30 },
    { sprite: P.ladder(FLOOR - 66), x: 420, y: 66 },
    // The balcony: a rail, pots, a chime; the bridge to the seed bed.
    { sprite: P.rail(90), x: 470, y: FLOOR - 10 },
    { sprite: P.pots(30, 56), x: 480, y: FLOOR - 16 },
    { sprite: P.signpost('leaf', 22), x: 576, y: FLOOR - 22 },
    { sprite: P.vines(70, 36, 57), x: 100, y: FLOOR + 22 },
  ],

  features: [
    // Chapter 4, Day 1: coming in.
    { type: 'trigger', x: 76, y: FLOOR, reach: 16, knot: 'c4day1_grounded', showIf: 'c4day1=led' },
    { type: 'swing', sprite: P.LANTERN, x: 200, y: FLOOR - 70, ropeTop: 100, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.CHIME, x: 530, y: FLOOR - 40, ropeTop: 92, quiet: true, ropeColour: S.wood },
  ],

  people: [
    colonist('grounded', 'grounded', 250, FLOOR, ['afternoon', 'evening', 'night']),
    // Chapter 4, Day 1: at his desk, his back to the door, before you come in.
    inStory('grounded-1', 'grounded', 250, FLOOR, 'c4day1=led,house', 'c4day1_grounded_desk', { turns: false }),
    guide('master', 30, FLOOR),
    guide('hunter', 30, FLOOR),
    girlGuide(24, FLOOR),
  ],

  interactables: [
    { id: 'books', x: 96, y: FLOOR, reach: 26, label: 'Look', knot: 'c4_look_groundeds_books' },
    { id: 'wing', x: 160, y: FLOOR, reach: 10, label: 'Look', knot: 'c4_look_groundeds_wing' },
    { id: 'desk', x: 224, y: FLOOR, reach: 16, label: 'Look', knot: 'c4_look_groundeds_desk' },
    { id: 'press', x: 290, y: FLOOR, reach: 12, label: 'Look', knot: 'c4_look_press' },
    { id: 'map', x: 348, y: FLOOR, reach: 12, label: 'Look', knot: 'c4_look_world_map' },
  ],

  exits: [
    { id: 'to-walkways', x: 14, y: FLOOR, reach: 10, to: 'walkways' },
    { id: 'to-lookout', x: 424, y: FLOOR, reach: 8, to: 'lookout' },
    { id: 'to-seed-bed', x: 588, y: FLOOR, reach: 10, to: 'seed-bed' },
  ],
};
