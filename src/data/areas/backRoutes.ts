import { FRIEND, GIRL } from '../../ui/characters';
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

/** The carved tunnels; everything else is heartwood. */
const TUNNELS: Rect[] = [
  { x: 16, y: 192, width: 584, height: 40 }, // middle tunnel (the way in from your home)
  { x: 592, y: 176, width: 248, height: 56 }, // middle, further on
  { x: 16, y: 80, width: 424, height: 40 }, // upper left
  { x: 16, y: 48, width: 80, height: 72 }, // under the Tender's shrine
  { x: 432, y: 32, width: 128, height: 88 }, // under the offering floor
  { x: 560, y: 80, width: 384, height: 40 }, // upper right, to your friend's window
  { x: 704, y: 48, width: 32, height: 32 }, // a dead-end crack
  { x: 16, y: 320, width: 824, height: 40 }, // lower tunnel (the way in from the lower roots)
  { x: 480, y: 272, width: 120, height: 48 }, // where unwanted things end up
  // Shafts between the levels.
  { x: 368, y: 120, width: 32, height: 72 },
  { x: 768, y: 120, width: 32, height: 56 },
  { x: 200, y: 232, width: 32, height: 88 },
  { x: 800, y: 232, width: 32, height: 88 },
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
    ...boards(768, [196]),
    // (Rotten boards in the shafts and over the top of the 768 shaft: see the crumble features.)
    ...boards(200, [324, 288, 256]),
    ...boards(800, [324, 256]),
  ],

  lights: [
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
    // Day 3 on: the routes are crumbling. Rotten boards give way; lumps fall from the ceiling (dust first).
    { type: 'crumble', x: 800, y: 288, width: 32 },
    { type: 'crumble', x: 768, y: 160, width: 32 },
    { type: 'crumble', x: 768, y: UPPER, width: 32 }, // over the top of the shaft: cross it quickly
    // Day 3: the tunnel comes down round you, on the way there (lower) and on the way back (upper, the top way).
    { type: 'collapse', from: 400, to: 560, y: LOWER, top: 322, reset: { x: 380, y: LOWER }, showIf: 'girl_with_you' },
    { type: 'collapse', from: 580, to: 900, y: UPPER, top: 82, reset: { x: 900, y: UPPER }, showIf: 'routes_collapsing' },
    // Which way: shown while the girl is with you.
    { type: 'hint', x: 816, y: LOWER, reach: 24, text: 'Up the shaft', showIf: 'girl_with_you' },
    { type: 'hint', x: 790, y: MIDDLE, reach: 30, text: 'Up again, just along to the left', showIf: 'girl_with_you' },
    { type: 'hint', x: 860, y: UPPER, reach: 50, text: 'His window is at the end of this tunnel', showIf: 'girl_with_you' },
    { type: 'rubble', x: 330, top: 322, floorY: LOWER, every: 2600, reset: { x: 270, y: LOWER } },
    { type: 'rubble', x: 610, top: 322, floorY: LOWER, every: 2200, reset: { x: 560, y: LOWER } },
    { type: 'rubble', x: 690, top: 322, floorY: LOWER, every: 2900, reset: { x: 560, y: LOWER } },
    { type: 'rubble', x: 860, top: 82, floorY: UPPER, every: 2400, reset: { x: 816, y: UPPER } },
    { type: 'hint', x: 290, y: LOWER, reach: 50, text: 'When dust falls, something follows', showIf: 'girl_with_you' },
    { type: 'hint', x: 816, y: 324, reach: 20, text: "Rotten boards won't hold you for long", showIf: 'girl_with_you' },
    { type: 'motes', x: 496, top: 34, bottom: UPPER, halfWidth: 14 }, // dust in the light from the tube
    { type: 'drip', x: 720, y: 50, floorY: UPPER - 4 },
    { type: 'drip', x: 300, y: 324, floorY: LOWER - 4 },
    { type: 'drip', x: 150, y: 196, floorY: MIDDLE - 4 },
    { type: 'drip', x: 580, y: 276, floorY: LOWER - 4 },
  ],

  people: [
    // Day 3: the girl, showing you the way.
    { id: 'girl-guide', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 60, y: LOWER, knot: 'girl_guide', showIf: 'girl_with_you', follow: true },
    // Day 3: your friend, leaning out of his window when you knock.
    { id: 'friend-window', sprite: FRIEND.idle[0]!, idleFrames: FRIEND.idle, x: 936, y: UPPER, flipX: true, hidden: true },
  ],

  interactables: [
    { id: 'shrine-grate', x: 66, y: UPPER, reach: 8, label: 'Listen', knot: 'back_routes_shrine_grate' },
    { id: 'offering-grate', x: 530, y: UPPER, reach: 10, label: 'Look', knot: 'back_routes_offering_grate' },
    { id: 'broken-blessings', x: 540, y: LOWER, reach: 16, label: 'Search', knot: 'back_routes_broken_blessings' },
    { id: 'mark', x: 356, y: MIDDLE, reach: 8, label: 'Look', knot: 'back_routes_mark' },
    { id: 'friends-window', x: 912, y: UPPER, reach: 8, label: 'Knock', knot: 'back_routes_window' },
  ],

  exits: [
    { id: 'to-shrine', x: 36, y: UPPER, reach: 12, to: 'tenders-shrine' },
    { id: 'to-offering-floor', x: 496, y: UPPER, reach: 10, to: 'offering-floor' },
    { id: 'to-friends-window', x: 930, y: UPPER, reach: 6, to: 'friends-home' },
    { id: 'to-home', x: 36, y: MIDDLE, reach: 12, to: 'home' },
    { id: 'to-lower-roots', x: 36, y: LOWER, reach: 12, to: 'lower-roots' },
  ],
};
