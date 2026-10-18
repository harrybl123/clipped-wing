import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './canopyProps';
import * as I from './canopyInteriors';
import { CANOPY_AMBIENCE, sides } from './canopyArea';
import type { AreaDefinition } from '../types';
import { MORNING, colonist, inStory } from './people';

// The seed bed (Chapter 4): where Grounded keeps the seed and reads the tree's vitality (doc;
// docs/areas/canopy/seed-bed.md). A glasshouse in the high branches, the sky through its panes: raised beds of
// seedlings glowing amber where they're healthy (Act 1: healthy seeds glow amber; green belongs to the rot),
// his instruments on a bench, and your seed in its own bed under a glass bell: amber and living (the
// archivist's), or green and sick (the boy's). What it says becomes what the town feels (designer).

const W = 520;
const H = 270;
const FLOOR = 230;

export const seedBed: AreaDefinition = {
  id: 'seed-bed',
  name: 'the seed bed',
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 190, treeX: -9999, backdrop: 'canopy', ground: 'deck', canopyDrop: 30 },
  ambient: 1,
  playerStart: { x: 30, y: FLOOR },
  surface: 'plank',
  acoustics: 'small',
  ambience: [...CANOPY_AMBIENCE, { sound: 'chime', volume: 0.25 }, { sound: 'drips', volume: 0.1 }],

  solids: [{ x: 0, y: FLOOR, width: W, height: H - FLOOR }, ...sides(W, H)],

  lights: [
    { x: 260, y: FLOOR, colour: S.white, radius: 200, radiusY: 10, strength: 0.2 }, // daylight through the glass
    { x: 150, y: FLOOR, colour: S.amber, radius: 80, radiusY: 8, strength: 0.2 }, // the seedlings' glow
    { x: 330, y: FLOOR, colour: S.amber, radius: 80, radiusY: 8, strength: 0.2 },
  ],

  lines: [
    // The bridge in from Grounded's house: its hand ropes.
    { from: { x: 0, y: FLOOR - 14 }, to: { x: 30, y: FLOOR - 12 }, colour: S.woodPale },
  ],

  props: [
    { sprite: P.leafClump(180, 46, 61), x: 0, y: 0 },
    { sprite: P.leafClump(160, 40, 62), x: 360, y: 0 },
    // The glasshouse: its frame, the sky through it.
    { sprite: I.glassFrame(420, 190), x: 50, y: FLOOR - 190, behind: true },
    // Beds of seedlings on their stands; his bench and instruments; watering pots; hanging baskets.
    { sprite: I.seedlingBed(70, 1), x: 70, y: FLOOR - 30 },
    { sprite: I.seedlingBed(70, 2), x: 150, y: FLOOR - 30 },
    { sprite: I.seedlingBed(60, 3), x: 310, y: FLOOR - 30 },
    ...[72, 140, 152, 218, 312, 368].map((x) => ({ sprite: P.ladder(12), x, y: FLOOR - 12 })),
    { sprite: I.workbench(50, 63), x: 390, y: FLOOR - 30 },
    { sprite: P.pots(34, 64), x: 450, y: FLOOR - 16 },
    { sprite: P.pots(20, 65), x: 30, y: FLOOR - 16 },
    { sprite: P.planter(40, 66), x: 470, y: 90 },
  ],

  features: [
    // Your seed, under its glass bell, by what you sent up in Act 1.
    { type: 'frames', frames: [I.yourSeed(true)], x: 252, y: FLOOR - 24, every: 1000, showIf: 'seed=healthy', power: 'any' },
    { type: 'frames', frames: [I.yourSeed(false)], x: 252, y: FLOOR - 24, every: 1000, showIf: 'seed=roots', power: 'any' },
    { type: 'motes', x: 262, top: FLOOR - 60, bottom: FLOOR - 24, halfWidth: 8 },
  ],

  people: [colonist('grounded-seeds', 'grounded', 330, FLOOR, MORNING), inStory('grounded-seed', 'grounded', 286, FLOOR, 'c4day1=seed', 'c4day1_seed')],

  interactables: [
    { id: 'seedlings', x: 140, y: FLOOR, reach: 40, label: 'Look', knot: 'c4_look_seedlings' },
    { id: 'your-seed', x: 262, y: FLOOR, reach: 12, label: 'Look', knot: 'c4_look_your_seed' },
    { id: 'instruments', x: 414, y: FLOOR, reach: 14, label: 'Look', knot: 'c4_look_instruments' },
  ],

  exits: [{ id: 'to-groundeds-house', x: 12, y: FLOOR, reach: 10, to: 'groundeds-house' }],
};
