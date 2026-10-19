import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';
import * as P from './canopyProps';
import * as I from './canopyInteriors';
import type { AreaDefinition } from '../types';
import { colonist, inStory } from './people';

// The lookout (Chapter 4): the highest point (doc; docs/areas/canopy/lookout.md). A small railed platform on a
// mast above all the leaves, all sky: a spyglass on its stand, the canopy's flag, a turbine turning, the wind.
// The treetop spread out below on every side; on the horizon, the capital (doc: on a clear night its lights),
// as the prince sees the tree from his balcony.

const W = 480;
const H = 330;
const DECK = 210;
const FROM = 150;
const TO = 330;

const HATCH: RowSprite = { rows: ['nnnnnnnnnnnn', 'oppoliloppoo'], colours: P.C };

export const lookout: AreaDefinition = {
  id: 'lookout',
  name: 'the lookout',
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 170, treeX: -9999, backdrop: 'canopy', ground: 'deck', canopyDrop: 80, citadelX: 400 },
  ambient: 1,
  playerStart: { x: 172, y: DECK },
  surface: 'plank',
  acoustics: 'open',
  ambience: [{ sound: 'wind', volume: 0.7 }, { sound: 'leaves', volume: 0.2 }],

  solids: [
    { x: FROM, y: DECK, width: TO - FROM, height: 8 },
    // (The rail: no further.)
    { x: FROM - 4, y: 0, width: 4, height: DECK, invisible: true },
    { x: TO, y: 0, width: 4, height: DECK, invisible: true },
  ],

  lights: [],

  lines: [
    // Stays from the mast out to the platform's ends.
    { from: { x: 240, y: DECK + 8 }, to: { x: FROM, y: H - 1 }, colour: S.wood },
    { from: { x: 240, y: DECK + 8 }, to: { x: TO, y: H - 1 }, colour: S.wood },
  ],

  props: [
    // The mast down into the leaves, out of sight.
    { sprite: I.livingColumn(H - DECK - 8, 71), x: 233, y: DECK + 8 },
    { sprite: P.rail(TO - FROM), x: FROM, y: DECK - 10 },
    { sprite: I.SPYGLASS, x: 290, y: DECK - 13 },
    { sprite: I.flag(64), x: FROM + 6, y: DECK - 64 },
    { sprite: HATCH, x: 166, y: DECK - 1 },
  ],

  features: [{ type: 'frames', frames: P.turbineFrames(40), x: 246, y: DECK - 65, every: 120, power: 'any' }],

  people: [colonist('hunter-lookout', 'hunter', 310, DECK, ['night']), inStory('grounded-lookout', 'grounded', 270, DECK, 'c4day1=lookout,lore', 'c4day1_grounded_lookout')],

  interactables: [
    { id: 'spyglass', x: 296, y: DECK, reach: 12, label: 'Look', knot: 'c4_look_spyglass' },
    { id: 'treetop', x: 220, y: DECK, reach: 16, label: 'Look', knot: 'c4_look_treetop' },
  ],

  exits: [{ id: 'to-groundeds-house', x: 172, y: DECK, reach: 8, to: 'groundeds-house' }],
};
