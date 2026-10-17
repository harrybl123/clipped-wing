import { SHADES as S } from '../../../ui/pixelArt';
import * as I from './canopyInteriors';
import * as P from './canopyProps';
import type { AreaDefinition } from '../types';

// The outside deck (Chapter 4): a place in the tree you never knew existed (designer: maybe an outside deck;
// docs/areas/canopy/outside-deck.md). Through a door in the bark from the back routes, out onto a ledge on the
// outside of the trunk, low down, the borderland's plain below: the wind, the stars. A hut of the capital's
// make on it, metal panels riveted, its window glowing, the radio inside; an aerial with its light. A rope
// ladder up the bark (how the doubter comes down from the canopy). The Tender comes here (designer), and it's
// where you fight him (designer). Off the map: you come here by following him.

const W = 560;
const H = 300;
const FLOOR = 236;
const BARK = 170;

export const outsideDeck: AreaDefinition = {
  id: 'outside-deck',
  name: 'the outside deck',
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 170, treeX: -9999 },
  ambient: 1,
  playerStart: { x: 120, y: FLOOR },
  surface: 'plank',
  acoustics: 'open',
  ambience: [{ sound: 'wind', volume: 0.6 }, { sound: 'creaks', volume: 0.4 }],

  solids: [
    // The ledge, out from the bark; no further than its end.
    { x: 0, y: FLOOR, width: 520, height: 10 },
    { x: 520, y: 0, width: 4, height: FLOOR, invisible: true },
    { x: 0, y: 0, width: 4, height: H, invisible: true },
  ],

  lights: [
    { x: 330, y: FLOOR, colour: S.cyan, radius: 60, radiusY: 10, strength: 0.35 }, // the hut's window and door
    { x: 110, y: FLOOR, colour: S.amber, radius: 30, radiusY: 8, strength: 0.25 }, // a lamp by the door in the bark
  ],

  lines: [
    // Brackets under the ledge, into the bark.
    { from: { x: BARK, y: FLOOR + 40 }, to: { x: 300, y: FLOOR + 10 }, colour: S.wood },
    { from: { x: BARK, y: FLOOR + 60 }, to: { x: 450, y: FLOOR + 10 }, colour: S.wood },
  ],

  props: [
    // The trunk's bark, a vast wall on the left, the door cut in it.
    { sprite: P.giantTrunk(BARK, H, 91), x: 0, y: 0, behind: true },
    { sprite: I.barkDoor, x: 70, y: FLOOR - 30 },
    { sprite: I.ropeLadder(FLOOR - 4), x: 140, y: 0 },
    { sprite: I.RADIO_HUT, x: 290, y: FLOOR - 62 },
    { sprite: P.LANTERN, x: 96, y: FLOOR - 26 },
    { sprite: P.rail(150), x: 370, y: FLOOR - 10 },
  ],

  features: [
    // The aerial's light, blinking.
    { type: 'pulse', points: [{ x: 330, y: FLOOR - 62 }, { x: 330, y: FLOOR - 61 }], speed: 1, every: 900, colour: S.cyan },
  ],

  people: [],

  interactables: [
    { id: 'hut', x: 312, y: FLOOR, reach: 18, label: 'Look', knot: 'c4_look_radio_hut' },
    { id: 'view', x: 470, y: FLOOR, reach: 20, label: 'Look', knot: 'c4_look_outside_view' },
  ],

  exits: [
    { id: 'to-back-routes', x: 80, y: FLOOR, reach: 10, to: 'back-routes' },
    { id: 'to-walkways', x: 145, y: FLOOR, reach: 8, to: 'walkways' },
  ],
};
