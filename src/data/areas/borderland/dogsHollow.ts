import * as P from './dogsHollowProps';
import { cableCoil, casingPod } from './scrapProps';
import type { AreaDefinition } from '../types';
import { dog } from './people';

// The dog's hollow (Chapter 2): your secret training spot on the outskirts, not on the map until you've
// found the dog (designer). A dip in the ground, out of sight, sheltered by a toppled slab leaning over it
// like a roof. Quieter than anywhere else; the wind drops. The dog's bed in its shadow, your training
// things, marks where finds were buried and dug up again; the rim to watch from; the tree on the horizon.
// See docs/areas/borderland/dogs-hollow.md. You and the dog (the dog comes with the cast).

const RIM = 206;
const FLOOR = 232;
const DIP = { x: 140, end: 380 };

export const dogsHollow: AreaDefinition = {
  id: 'dogs-hollow',
  name: "the dog's hollow",
  width: 480,
  height: 270,
  cavity: { x: 0, y: 0, width: 480, height: 270, radius: 0 },
  outdoor: { horizon: 170, treeX: 330, treeScale: 0.8 },
  ambient: 1,
  playerStart: { x: 30, y: RIM },
  surface: 'dirt',
  acoustics: 'open',

  solids: [
    { x: 0, y: RIM, width: DIP.x, height: 270 - RIM },
    { x: DIP.x, y: FLOOR, width: DIP.end - DIP.x, height: 270 - FLOOR },
    { x: DIP.end, y: RIM, width: 480 - DIP.end, height: 270 - RIM },
    // A lip of earth on each side to step on, half way.
    { x: DIP.x, y: 220, width: 14, height: FLOOR - 220 },
    { x: DIP.end - 14, y: 220, width: 14, height: FLOOR - 220 },
    { x: -8, y: 0, width: 8, height: 270, invisible: true },
    { x: 480, y: 0, width: 8, height: 270, invisible: true },
  ],

  lights: [],
  lines: [],

  props: [
    { sprite: P.scrub(30, 1), x: 40, y: RIM - 8 },
    { sprite: P.scrub(20, 2), x: 410, y: RIM - 8 },
    { sprite: casingPod(16), x: 90, y: RIM - 9 },
    { sprite: P.SHELTER, x: DIP.x + 10, y: FLOOR - 74 },
    { sprite: P.BED, x: 196, y: FLOOR - 4 },
    { sprite: P.TRAINING, x: 236, y: FLOOR - 7 },
    { sprite: P.MARK, x: 290, y: FLOOR - 5 },
    { sprite: P.MARK, x: 318, y: FLOOR - 5 },
    { sprite: P.MARK, x: 344, y: FLOOR - 5 },
    { sprite: cableCoil(16), x: 300, y: FLOOR - 5 },
    { sprite: P.scrub(24, 3), x: 156, y: FLOOR - 8 },
  ],

  features: [],
  // The dog, nosing about its hollow (once you've found it).
  people: [dog(262, FLOOR, { knot: 'dogs_hollow_dog', label: 'Pet', flipX: true, showIf: 'found_dog', wander: { from: 200, to: 340 } })],

  interactables: [
    { id: 'bed', x: 204, y: FLOOR, reach: 12, label: 'Look', knot: 'dogs_hollow_bed' },
    { id: 'train', x: 318, y: FLOOR, reach: 30, label: 'Train', knot: 'dogs_hollow_train' },
    { id: 'rim', x: 440, y: RIM, reach: 30, label: 'Watch', knot: 'dogs_hollow_rim' },
  ],

  exits: [{ id: 'to-picked-fields', x: 16, y: RIM, reach: 12, to: 'picked-fields' }],

  ambience: [{ sound: 'wind', volume: 0.15 }], // the wind drops down here
};
