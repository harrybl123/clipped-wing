import { ELDERS, FRIEND, GIRL, PREACHER, TENDER } from '../../ui/characters';
import { SHADES as S } from '../../ui/pixelArt';
import { FUNGI } from '../../ui/sprites';
import * as P from './backRoutesProps';
import { FUNGUS_SHELF, hangingRoots, SOFT_PATCH } from './lowerRootsProps';
import { heartwoodSolids } from './tunnels';
import type { AreaDefinition, Rect, Solid } from './types';

// The back routes: hidden crawlways beneath the roots that the girl shows you (Days 3, 6, 7).
// A winding network on three levels, joined by shafts with boards to jump up and drop through,
// with her glowing marks at the turnings. Light leaks down from the places above: the Tender's
// shrine (a grate to listen at, for Day 6), the offering floor (the tube's glow through a grate)
// and the market (a crack). Ways out to your home, the lower roots, your friend's back window,
// the shrine and the offering floor. Darker and damper than anywhere: close to the rot.
// Tunnels are just tall enough to walk hunched (no crouching yet). See docs/areas/back-routes.md.

const W = 960;
const H = 400;
const UPPER = 120;
const MIDDLE = 232;
const LOWER = 360;

/** Rot pits in the lower tunnel's floor: [x, width]. Small, because the tunnel's low ceiling cuts jumps short (the last has a rotten board in the middle). */
const PITS: [number, number][] = [[256, 16], [432, 16], [600, 16], [704, 32]];

/** The carved tunnels; everything else is heartwood. */
const TUNNELS: Rect[] = [
  { x: 16, y: 192, width: 584, height: 40 }, // middle tunnel (the way in from your home)
  { x: 592, y: 176, width: 248, height: 56 }, // middle, further on
  { x: 16, y: 80, width: 424, height: 40 }, // upper left
  { x: 16, y: 48, width: 80, height: 72 }, // under the Tender's shrine
  { x: 432, y: 32, width: 128, height: 88 }, // under the offering floor
  { x: 560, y: 104, width: 32, height: 16 }, // a crawlway: crouch to get through (it opens into the chamber under the offering floor; its mouth is on solid floor, so down crouches rather than dropping)
  { x: 592, y: 80, width: 352, height: 40 }, // upper right, to your friend's window
  { x: 704, y: 48, width: 32, height: 32 }, // a dead-end crack
  { x: 16, y: 320, width: 824, height: 40 }, // lower tunnel (the way in from the lower roots)
  { x: 480, y: 272, width: 120, height: 48 }, // where unwanted things end up
  // Shafts between the levels.
  { x: 368, y: 120, width: 32, height: 72 },
  { x: 768, y: 120, width: 32, height: 56 },
  { x: 600, y: 120, width: 32, height: 56 }, // the far shaft up from the middle (past the beetle)
  { x: 200, y: 232, width: 32, height: 88 },
  { x: 800, y: 232, width: 32, height: 88 },
  // Pits where the lower tunnel's floor has rotted through (rot at the bottom).
  ...PITS.map(([x, width]) => ({ x, y: LOWER, width, height: 32 })),
];

/** Boards wedged across a shaft at these heights (one-way: jump up through them, down drops through). */
const boards = (x: number, ys: number[]): Solid[] => ys.map((y) => ({ x, y, width: 32, height: 3, oneWay: true }));

const MARKS: [number, number, 'up' | 'spiral' | 'cross'][] = [
  [352, 206, 'up'], [184, 334, 'up'], [786, 334, 'up'], [750, 192, 'up'],
  [110, 206, 'spiral'], [572, 92, 'spiral'], [714, 58, 'cross'], [488, 286, 'cross'],
];

const [cavity, ...nooks] = TUNNELS;

export const backRoutes: AreaDefinition = {
  id: 'back-routes',
  name: 'the back routes',
  width: W,
  height: H,
  cavity: { ...cavity!, radius: 5 },
  nooks: nooks.map((t) => ({ ...t, radius: 5 })),
  heartwood: 'packed',
  ambient: 0.7,
  playerStart: { x: 120, y: MIDDLE },

  solids: [
    ...heartwoodSolids(TUNNELS, W, H),
    ...boards(368, [196, 160]),
    ...boards(600, [196, 160]),
    // (Rotten boards in the shafts and over the top of the 768 shaft: see the crumble features.)
    ...boards(200, [324, 288, 256]),
    ...boards(800, [324, 256]),
  ],

  lights: [
    ...PITS.map(([x, width]) => ({ x: x + width / 2, y: LOWER + 26, colour: S.green, radius: width * 0.7, radiusY: 16, strength: 0.4 })),
    { x: 816, y: 300, colour: S.green, radius: 14, radiusY: 60, strength: 0.18 }, // rot down the shaft
    { x: 60, y: 56, colour: S.amber, radius: 34, radiusY: 44, strength: 0.34 }, // through the shrine's grate
    { x: 496, y: 50, colour: S.cyan, radius: 46, radiusY: 70, strength: 0.4 }, // the tube's glow through the offering floor
    { x: 646, y: 86, colour: S.amber, radius: 20, radiusY: 26, strength: 0.28 }, // the market crack
    { x: 932, y: 96, colour: S.amber, radius: 14, radiusY: 18, strength: 0.4 }, // your friend's window, lit
    { x: 530, y: 346, colour: S.cyan, radius: 26, radiusY: 16, strength: 0.18 }, // broken blessings, faintly
    ...MARKS.map(([x, y]) => ({ x: x + 3, y: y + 3, colour: S.green, radius: 12, strength: 0.24 })),
    ...[[152, 226], [262, 114], [622, 354], [884, 114], [42, 354], [40, 226]].map(([x, y]) => ({ x: x!, y: y!, colour: S.green, radius: 16, radiusY: 10, strength: 0.28 })),
  ],

  lines: [],

  props: [
    { sprite: P.grate(32, S.amber), x: 44, y: 46 },
    { sprite: P.grate(48, S.cyan), x: 472, y: 30 },
    { sprite: P.MARKET_SLIT, x: 640, y: 78 },
    ...MARKS.map(([x, y, kind]) => ({ sprite: P.mark(kind), x, y })),
    { sprite: P.BROKEN_BLESSINGS, x: 510, y: LOWER - 7 },
    { sprite: SOFT_PATCH, x: 100, y: 330 },
    { sprite: SOFT_PATCH, x: 690, y: 326 },
    { sprite: SOFT_PATCH, x: 560, y: 280 },
    { sprite: SOFT_PATCH, x: 280, y: 90 },
    { sprite: FUNGUS_SHELF, x: 320, y: 200 },
    { sprite: FUNGUS_SHELF, x: 900, y: 88 },
    { sprite: FUNGUS_SHELF, x: 60, y: 330 },
    { sprite: hangingRoots(18, 10, 2), x: 140, y: 192 },
    { sprite: hangingRoots(18, 12, 5), x: 614, y: 80 },
    { sprite: hangingRoots(18, 12, 8), x: 290, y: 320 },
    { sprite: FUNGI.cluster, x: 148, y: MIDDLE - 7 },
    { sprite: FUNGI.droop, x: 258, y: UPPER - 5 },
    { sprite: FUNGI.cluster, x: 618, y: LOWER - 7 },
    { sprite: FUNGI.tall, x: 880, y: UPPER - 8 },
    { sprite: FUNGI.cluster, x: 900, y: UPPER - 7 },
    { sprite: FUNGI.bent, x: 38, y: LOWER - 7 },
    { sprite: FUNGI.droop, x: 36, y: MIDDLE - 5 },
  ],

  features: [
    // Day 3 on: the routes are crumbling and full of rot. On the way to your friend's window, one new
    // thing at a time: rot pits to jump (lower), rot dripping down the shaft (time it), a beetle in the
    // middle (jump it or slip past), then the top tunnel coming down round you. Rotten boards give way.
    ...PITS.map(([x, width]) => ({ type: 'rot' as const, x, y: LOWER + 22, width, height: 10, reset: { x: x - 18, y: LOWER } })),
    { type: 'crumble', x: 714, y: LOWER, width: 12 }, // in the middle of the widest pit
    // More beetles along the lower tunnel, between the pits.
    { type: 'beetle', from: 296, to: 410, y: LOWER, speed: 30, reset: { x: 238, y: LOWER } },
    { type: 'beetle', from: 478, to: 584, y: LOWER, speed: 38, reset: { x: 414, y: LOWER } },
    { type: 'drips', xs: [806, 816, 826], top: 236, bottom: LOWER, count: 3, every: 4600, reset: { x: 788, y: LOWER } }, // a long gap between bursts (designer: it was impossible)
    { type: 'crumble', x: 800, y: 288, width: 32 },
    { type: 'beetle', from: 640, to: 770, y: MIDDLE, speed: 34, reset: { x: 792, y: MIDDLE } },
    { type: 'crumble', x: 600, y: UPPER, width: 32, steadyIf: 'meeting' }, // over the top of the far shaft (it holds on Day 6, by the crawlway)
    { type: 'crumble', x: 768, y: UPPER, width: 32 }, // over the old shaft: cross it quickly
    { type: 'collapse', from: 680, to: 900, y: UPPER, top: 82, reset: { x: 660, y: UPPER }, showIf: 'girl_with_you' },
    { type: 'collapse', from: 520, to: 900, y: UPPER, top: 82, reset: { x: 905, y: UPPER }, showIf: 'routes_collapsing' },
    // The girl's warnings as each new thing comes up (while she's with you).
    { type: 'hint', x: 236, y: LOWER, reach: 30, text: '"Don\'t touch the green. It eats boots."', showIf: 'girl_with_you' },
    { type: 'hint', x: 690, y: LOWER, reach: 30, text: '"That board\'s rotten. Don\'t stop on it."', showIf: 'girl_with_you' },
    { type: 'hint', x: 790, y: LOWER, reach: 30, text: '"It drips in threes. Wait for it... then go up."', showIf: 'girl_with_you' },
    { type: 'hint', x: 816, y: MIDDLE, reach: 26, text: '"Big one. Don\'t wake it. Jump it, or slip past. Then up the far shaft."', showIf: 'girl_with_you' },
    { type: 'hint', x: 650, y: UPPER, reach: 30, text: '"Hear that? The roof. Run!"', showIf: 'girl_with_you' },
    { type: 'hint', x: 905, y: UPPER, reach: 12, text: 'His window', showIf: 'girl_with_you' },
    { type: 'hint', x: 640, y: UPPER, reach: 24, text: 'The tunnel gets low. Hold down (S) to crouch and creep closer.', showIf: 'meeting' },
    { type: 'motes', x: 496, top: 34, bottom: UPPER, halfWidth: 14 }, // dust in the light from the tube
    { type: 'drip', x: 720, y: 50, floorY: UPPER - 4 },
    { type: 'drip', x: 300, y: 324, floorY: LOWER - 4 },
    { type: 'drip', x: 150, y: 196, floorY: MIDDLE - 4 },
    { type: 'drip', x: 580, y: 276, floorY: LOWER - 4 },
  ],

  people: [
    // Day 3: the girl, showing you the way.
    { id: 'girl-guide', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 60, y: LOWER, knot: 'girl_guide', showIf: 'girl_with_you', follow: true },
    // Day 6: the elders' secret meeting, in the old chamber under the offering floor.
    ...[440, 458, 476].map((x, i) => ({ id: `meeting-elder-${i}`, sprite: ELDERS[i]!.idle[0]!, idleFrames: ELDERS[i]!.idle, x, y: UPPER, showIf: 'meeting' })),
    { id: 'meeting-tender', sprite: TENDER.idle[0]!, idleFrames: TENDER.idle, x: 512, y: UPPER, flipX: true, showIf: 'meeting' },
    { id: 'meeting-preacher', sprite: PREACHER.idle[0]!, idleFrames: PREACHER.idle, x: 534, y: UPPER, flipX: true, showIf: 'meeting' },
    // Day 3: your friend, leaning out of his window when you knock.
    { id: 'friend-window', sprite: FRIEND.idle[0]!, idleFrames: FRIEND.idle, x: 936, y: UPPER, flipX: true, hidden: true },
  ],

  interactables: [
    { id: 'shrine-grate', x: 66, y: UPPER, reach: 8, label: 'Listen', knot: 'back_routes_shrine_grate' },
    { id: 'offering-grate', x: 530, y: UPPER, reach: 10, label: 'Look', knot: 'back_routes_offering_grate' },
    { id: 'broken-blessings', x: 540, y: LOWER, reach: 16, label: 'Search', knot: 'back_routes_broken_blessings' },
    { id: 'mark', x: 356, y: MIDDLE, reach: 8, label: 'Look', knot: 'back_routes_mark' },
    { id: 'friends-window', x: 912, y: UPPER, reach: 8, label: 'Knock', knot: 'back_routes_window' },
    { id: 'listen-spot', x: 574, y: UPPER, reach: 10, label: 'Listen', knot: 'back_routes_listen' },
  ],

  acoustics: 'tunnel',
  ambience: [{ sound: 'room', volume: 0.6 }, { sound: 'drips', volume: 0.5 }, { sound: 'creaks', volume: 0.7 }],
  exits: [
    { id: 'to-shrine', x: 36, y: UPPER, reach: 12, to: 'tenders-shrine' },
    { id: 'to-offering-floor', x: 496, y: UPPER, reach: 10, to: 'offering-floor' },
    { id: 'to-friends-window', x: 930, y: UPPER, reach: 6, to: 'friends-home' },
    { id: 'to-home', x: 36, y: MIDDLE, reach: 12, to: 'home' },
    { id: 'to-lower-roots', x: 36, y: LOWER, reach: 12, to: 'lower-roots' },
    // Chapter 4: the hatch up the inside of the bark to the canopy (only the canopy's people know it).
    { id: 'to-hatches', x: 700, y: MIDDLE, reach: 10, to: 'hatches', showIf: 'chapter=4' },
  ],
};
