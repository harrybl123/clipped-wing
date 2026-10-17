import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';
import * as P from './canopyProps';
import * as I from './canopyInteriors';
import { CANOPY_AMBIENCE, sides, stair } from './canopyArea';
import type { AreaDefinition } from '../types';

// The great house (Chapter 4): the grand central treehouse (docs/areas/canopy/great-house.md), seen in
// cutaway, three storeys under a roof of leaf shingles with solar sails along its ridge. At the top, the
// sorting deck: the cable from the tube mouth comes in with its baskets, offerings spread on long tables,
// split into what's kept (baskets) and what goes on (crates, and a chute down to the lowering platform). In
// the middle, the blessing workshop: benches where blessings are made by hand, shelves of finished ones, the
// master's bench with her bottle. At the bottom, the mess: the kitchen, long tables, bowls; doors along the
// back to people's homes; a trapdoor down to the hatches. Windows in its woven walls show the leaves outside.
// The tube mouth off to the left, the walkways to the right, a rope bridge from the workshop to the
// ascended's hall, the message loft's door off the sorting deck.

const W = 760;
const H = 420;
/** The mess, the workshop, the sorting deck. */
const GROUND = 380;
const WORKSHOP = 292;
const SORTING = 204;
/** The building's walls. */
const L = 90;
const R = 670;

const TRAPDOOR: RowSprite = { rows: ['nnnnnnnnnnnnnnnnnnnn', 'opppopppoliloppppopp'], colours: P.C };

export const greatHouse: AreaDefinition = {
  id: 'great-house',
  name: 'the great house',
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 250, treeX: -9999, backdrop: 'canopy', ground: 'deck' },
  ambient: 1,
  playerStart: { x: 40, y: GROUND },
  surface: 'plank',
  acoustics: 'open',
  ambience: [...CANOPY_AMBIENCE, { sound: 'chatter', volume: 0.3 }, { sound: 'workshop', volume: 0.25 }],

  solids: [
    // The branch it's built on, out to the tube mouth and the walkways.
    { x: 0, y: GROUND, width: W, height: H - GROUND },
    // The workshop's floor (the stairwell open on its right), a rope bridge off it to the ascended's hall.
    { x: L + 6, y: WORKSHOP, width: 520 - L - 6, height: 6, oneWay: true },
    { x: 0, y: WORKSHOP, width: L + 6, height: 4 },
    // The sorting deck's floor (the stairwell open on its left).
    { x: 240, y: SORTING, width: R - 6 - 240, height: 6, oneWay: true },
    // Up from the mess to the workshop (rising to the left, on the right), and on up to the sorting deck (rising to the right, on the left).
    ...stair(520, GROUND, WORKSHOP, 'left'),
    ...stair(240, WORKSHOP, SORTING, 'right'),
    ...sides(W, H),
  ],

  lights: [
    { x: 130, y: GROUND, colour: S.amber, radius: 60, radiusY: 10, strength: 0.4 }, // the stove
    { x: 300, y: GROUND, colour: S.amber, radius: 120, radiusY: 10, strength: 0.18 },
    { x: 330, y: WORKSHOP, colour: S.amber, radius: 140, radiusY: 8, strength: 0.18 },
    { x: 450, y: SORTING, colour: S.white, radius: 180, radiusY: 8, strength: 0.15 }, // daylight through the sails
  ],

  lines: [
    // The cable from the tube mouth, coming in at the sorting deck, its pulley on a post.
    { from: { x: 0, y: 150 }, to: { x: 252, y: 178 }, colour: S.deep },
    // The rope bridge's hand ropes, out to the ascended's hall.
    { from: { x: 0, y: WORKSHOP - 14 }, to: { x: 44, y: WORKSHOP - 10 }, colour: S.woodPale },
    { from: { x: 44, y: WORKSHOP - 10 }, to: { x: L, y: WORKSHOP - 14 }, colour: S.woodPale },
  ],

  props: [
    // Outside, far back: boughs and treehouses behind the great house; leaves hanging over.
    // Giant limbs outside, either side.
    { sprite: P.giantTrunk(70, H, 43), x: 6, y: 0, behind: true },
    { sprite: P.giantTrunk(70, H, 44), x: 690, y: 0, behind: true },
    { sprite: P.leafClump(200, 60, 12), x: 0, y: 0 },
    { sprite: P.leafClump(180, 66, 13), x: 580, y: 0 },
    { sprite: P.vines(40, 90, 14), x: 20, y: 30 },
    // The roof, solar sails along its ridge.
    { sprite: P.solarSail(30, 21, -1), x: 250, y: 64 },
    { sprite: P.solarSail(40, 22, 0), x: 360, y: 46 },
    { sprite: P.solarSail(30, 23, 1), x: 470, y: 64 },
    { sprite: I.bigRoof(R - L + 60, 46, 3), x: L - 30, y: 108 },
    { sprite: P.turbineFrames(24)[0]!, x: 590, y: 70 },
    // The walls, windows onto the leaves on every floor.
    {
      sprite: I.wovenWall(R - L, GROUND - 154, 5, [
        [96, 14, 18, 26], [460, 14, 18, 26], // the sorting deck
        [40, 76, 22, 34], [400, 76, 22, 34], [520, 70, 26, 40], // the workshop
        [250, 160, 24, 44], [420, 156, 28, 50], // the mess
      ], 0),
      x: L,
      y: 154,
      behind: true, // (behind the floors and stairs)
    },
    // The great limb it's built round, going up through every floor and out through the roof.
    { sprite: P.giantTrunk(110, H, 45), x: 326, y: 0, behind: true },
    // Offerings hung on the walls, sacks and barrels, baskets hanging from the beams.
    { sprite: I.wallOfferings(110, 1), x: 300, y: SORTING - 52, behind: true },
    { sprite: I.wallOfferings(90, 2), x: 104, y: WORKSHOP - 64, behind: true },
    { sprite: I.wallOfferings(120, 3), x: 470, y: GROUND - 74, behind: true },
    { sprite: I.SACKS, x: 610, y: SORTING - 12 },
    { sprite: I.BARREL, x: 504, y: GROUND - 14 },
    { sprite: I.SACKS, x: 590, y: GROUND - 12 },
    // The sorting deck: the cable's pulley, the tables, what's kept, what goes on, the chute.
    { sprite: P.cablePost(28), x: 248, y: SORTING - 28 },
    { sprite: I.sortingTable(88, 1), x: 282, y: SORTING - 16 },
    { sprite: I.sortingTable(80, 2), x: 390, y: SORTING - 16 },
    { sprite: I.KEEP_BASKET, x: 478, y: SORTING - 6 },
    { sprite: I.KEEP_BASKET, x: 490, y: SORTING - 6 },
    { sprite: I.chute(96), x: 560, y: SORTING - 8 },
    { sprite: P.CRATE, x: 590, y: SORTING - 8 },
    { sprite: P.CRATE, x: 604, y: SORTING - 8 },
    { sprite: P.CRATE, x: 596, y: SORTING - 16 },
    { sprite: P.signpost('down', 20), x: 536, y: SORTING - 20 },
    // The blessing workshop: the master's bench and her bottle; benches; shelves of blessings going down.
    { sprite: I.workbench(46, 1), x: 102, y: WORKSHOP - 30 },
    { sprite: I.BOTTLE, x: 136, y: WORKSHOP - 18 },
    { sprite: I.workbench(44, 2), x: 252, y: WORKSHOP - 30 },
    { sprite: I.workbench(44, 3), x: 306, y: WORKSHOP - 30 },
    { sprite: I.workbench(44, 4), x: 360, y: WORKSHOP - 30 },
    { sprite: I.blessingShelves(70, 60, 5), x: 420, y: WORKSHOP - 62 },
    { sprite: P.pots(20, 6), x: 494, y: WORKSHOP - 16 },
    // The mess: the kitchen, the long tables, doors to people's homes, the trapdoor down to the hatches.
    { sprite: I.KITCHEN, x: L + 6, y: GROUND - 52 },
    { sprite: I.messTable(100, 1), x: 182, y: GROUND - 14 },
    { sprite: I.homeDoor(1), x: 300, y: GROUND - 30 },
    { sprite: I.messTable(90, 2), x: 330, y: GROUND - 14 },
    { sprite: I.homeDoor(2), x: 426, y: GROUND - 30 },
    { sprite: I.homeDoor(3), x: 606, y: GROUND - 30 },
    { sprite: I.homeDoor(4), x: 630, y: GROUND - 30 },
    { sprite: TRAPDOOR, x: 270, y: GROUND - 1 },
    // Outside: the way to the tube mouth (a sign), the way to the walkways (a lamp, pots).
    { sprite: P.signpost('tube'), x: 22, y: GROUND - 26 },
    { sprite: P.pots(40, 7), x: 46, y: GROUND - 16 },
    { sprite: P.lampPost(44), x: 690, y: GROUND - 44 },
    { sprite: P.signpost('house'), x: 712, y: GROUND - 26 },
    // Under the branch: the pipe, vines.
    { sprite: P.pipeRun(W - 10), x: 4, y: GROUND + 9 },
    { sprite: P.vines(70, 26, 15), x: 200, y: GROUND + 12 },
    { sprite: P.vines(60, 26, 16), x: 520, y: GROUND + 12 },
  ],

  features: [
    // Baskets coming in on the cable from the tube mouth.
    { type: 'pulse', points: [{ x: 0, y: 154 }, { x: 250, y: 182 }], speed: 26, every: 4200, sprite: P.CABLE_BASKET },
    // Smoke from the stove's pipe; lanterns hung on each floor.
    { type: 'smoke', x: L + 24, y: GROUND - 54, top: 160 },
    { type: 'swing', sprite: P.LANTERN, x: 220, y: GROUND - 60, ropeTop: GROUND - 82, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.LANTERN, x: 400, y: GROUND - 60, ropeTop: GROUND - 82, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.LANTERN, x: 200, y: WORKSHOP - 56, ropeTop: WORKSHOP - 82, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.LANTERN, x: 470, y: SORTING - 56, ropeTop: SORTING - 70, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.CHIME, x: 70, y: GROUND - 60, ropeTop: GROUND - 70, quiet: true, ropeColour: S.wood },
  ],

  people: [],

  interactables: [
    { id: 'sorting', x: 330, y: SORTING, reach: 30, label: 'Look', knot: 'c4_look_sorting' },
    { id: 'chute', x: 568, y: SORTING, reach: 10, label: 'Look', knot: 'c4_look_chute' },
    { id: 'workbench', x: 330, y: WORKSHOP, reach: 40, label: 'Look', knot: 'c4_look_workbench' },
    { id: 'blessings', x: 455, y: WORKSHOP, reach: 18, label: 'Look', knot: 'c4_look_blessings' },
    { id: 'kitchen', x: 140, y: GROUND, reach: 30, label: 'Look', knot: 'c4_look_kitchen' },
    { id: 'mess', x: 380, y: GROUND, reach: 30, label: 'Look', knot: 'c4_look_mess' },
  ],

  exits: [
    { id: 'to-tube-mouth', x: 12, y: GROUND, reach: 12, to: 'tube-mouth' },
    { id: 'to-ascended-hall', x: 12, y: WORKSHOP, reach: 12, to: 'ascended-hall' },
    { id: 'to-walkways', x: 748, y: GROUND, reach: 12, to: 'walkways' },
    { id: 'to-message-loft', x: 650, y: SORTING, reach: 12, to: 'message-loft' },
    { id: 'to-hatches', x: 280, y: GROUND, reach: 10, to: 'hatches' },
  ],
};
