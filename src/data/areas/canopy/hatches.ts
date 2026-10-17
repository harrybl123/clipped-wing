import { SHADES as S } from '../../../ui/pixelArt';
import type { RowSprite } from '../../../ui/sprites';
import { heartwoodSolids } from '../tunnels';
import * as P from './canopyProps';
import type { AreaDefinition, Rect, Solid } from '../types';

// The hatches (Chapter 4): hidden ways through the bark that only the canopy's people know (doc;
// docs/areas/canopy/hatches.md). A long shaft down inside the bark, boards wedged across it to climb and drop
// between, ropes and rungs, the tube's light seeping through the wood along one side, its hum all the way
// down. At the top, the hatch up into the great house; at the bottom, a panel of bark you'd never have seen
// from the other side, out into Act 1's back routes. The hatch-keeper's lamp.

const W = 320;
const H = 560;
const TOP = 112;
const BOTTOM = 504;

const TUNNELS: Rect[] = [
  { x: 136, y: 48, width: 64, height: 456 }, // the shaft
  { x: 40, y: 48, width: 104, height: 64 }, // the landing under the hatch up into the great house
  { x: 192, y: 448, width: 96, height: 56 }, // the way out at the bottom, to the back routes
];

/** Boards across the shaft, zigzagging down: one-way (jump up through, drop down through). */
const BOARDS: Solid[] = [
  { x: 136, y: TOP, width: 64, height: 3, oneWay: true },
  ...[160, 208, 256, 304, 352, 400, 448].map((y, i) => ({ x: i % 2 ? 168 : 136, y, width: 32, height: 3, oneWay: true })),
];

/** A hatch in the roof of the landing; the panel of bark at the bottom. */
const HATCH_UP: RowSprite = { rows: ['nnnnnnnnnnnnnnnnnn', 'oppppoppplpopppppo', 'oooooooooooooooooo'], colours: P.C };
const PANEL: RowSprite = {
  rows: ['..oooooooooo..', '.onnnnnnnnnno.', 'onndnnnnndnnno', 'onnnnnnnnnnnno', 'onnnnndnnnnnno', 'onnnnnnnnnnnno', 'onndnnnnnnndno', 'onnnnnnnnnnnno', 'onnnnnnndnnnno', 'onnnnnnnnnnnno', 'onnnnnnnnnnnno', 'onnnndnnnnnnno', 'onnnnnnnnnnnno', 'onnnnnnnnnndno', 'onnnnnnnnnnnno', 'onnnnnnnnnnnno', 'onnnnnnnnnnnno', 'onnndnnnnnnnno', 'onnnnnnnnnnnno', 'onnnnnnnnnnnno', 'onnnnnnndnnnno', 'onnnnnnnnnnnno', 'onnnnnnnnnnnno', 'onnnnnnnnnnnno', 'pppppppppppppp'],
  colours: P.C,
};

const [cavity, ...nooks] = TUNNELS;

export const hatches: AreaDefinition = {
  id: 'hatches',
  name: 'the hatches',
  width: W,
  height: H,
  cavity: { ...cavity!, radius: 5 },
  nooks: nooks.map((t) => ({ ...t, radius: 5 })),
  heartwood: 'packed',
  ambient: 0.75,
  playerStart: { x: 168, y: TOP },
  surface: 'wood',
  acoustics: 'tunnel',
  ambience: [{ sound: 'room', volume: 0.5 }, { sound: 'hum', volume: 0.45 }, { sound: 'creaks', volume: 0.5 }],

  solids: [...heartwoodSolids(TUNNELS, W, H), ...BOARDS],

  lights: [
    { x: 80, y: 70, colour: S.white, radius: 40, radiusY: 30, strength: 0.35 }, // daylight down through the hatch
    { x: 196, y: 280, colour: S.cyan, radius: 16, radiusY: 240, strength: 0.25 }, // the tube's light through the wood
    { x: 250, y: 480, colour: S.amber, radius: 30, radiusY: 20, strength: 0.3 }, // a lamp left by the panel
    { x: 160, y: 200, colour: S.amber, radius: 30, radiusY: 40, strength: 0.15 },
  ],

  lines: [
    // A rope down the shaft, knotted, and rungs cut into its far wall.
    { from: { x: 150, y: 50 }, to: { x: 150, y: BOTTOM - 1 }, colour: S.woodPale },
    ...[80, 128, 176, 224, 272, 320, 368, 416].map((y) => ({ from: { x: 190, y }, to: { x: 197, y }, colour: S.woodPale })),
  ],

  props: [
    { sprite: HATCH_UP, x: 60, y: 46 },
    { sprite: PANEL, x: 270, y: BOTTOM - 25 },
    { sprite: P.LANTERN, x: 250, y: BOTTOM - 10 },
  ],

  features: [
    // The tube's light, seeping up through the wood along the shaft's side.
    { type: 'pulse', points: [{ x: 199, y: BOTTOM - 10 }, { x: 199, y: 60 }], speed: 40, every: 900, count: 3, colour: S.cyan },
  ],

  people: [],

  interactables: [{ id: 'glow', x: 186, y: 304, reach: 10, label: 'Look', knot: 'c4_look_hatch_glow' }],

  exits: [
    { id: 'to-great-house', x: 72, y: TOP, reach: 12, to: 'great-house' },
    { id: 'to-back-routes', x: 272, y: BOTTOM, reach: 12, to: 'back-routes' },
  ],
};
