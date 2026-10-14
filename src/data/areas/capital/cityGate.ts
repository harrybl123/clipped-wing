import { SHADES as S } from '../../../ui/pixelArt';
import { scrollingScreen } from './citadelProps';
import * as P from './cityProps';
import type { AreaDefinition } from '../types';
import { cast, citizen, strollingCitizen, watch, AWAKE, DAY, MORNING } from './people';

// The gate (Chapter 3): the city's edge, where envoys arrive from outside (docs/areas/capital/city-gate.md).
// Inside, on the right: the checkpoint, its booth and screens, the barrier across the road, the city's
// buildings crowding up to the wall. Then the wall itself, old stone below and gold and marble gone dull
// above, and the passage through it under an arch; out on the left, the road going away across the waste,
// and far off on the horizon, the tree. (Suggestion: those sent away to be useful leave through it.)

const W = 800;
const FLOOR = 232;
const WALL = { x: 290, width: 150, height: 196 };

export const cityGate: AreaDefinition = {
  id: 'city-gate',
  name: 'the gate',
  width: W,
  height: 270,
  cavity: { x: 0, y: 0, width: W, height: 270, radius: 0 },
  outdoor: { horizon: 200, treeX: 150, treeScale: 0.3, ground: 'street' },
  ambient: 1,
  playerStart: { x: 760, y: FLOOR },
  surface: 'stone',
  acoustics: 'street',
  ambience: [
    { sound: 'wind', volume: 0.3 },
    { sound: 'hum', volume: 0.1 },
  ],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 0, y: 0, width: 4, height: 270, invisible: true },
    { x: W - 4, y: 0, width: 4, height: 270, invisible: true },
  ],

  lights: [
    { x: 510, y: FLOOR, colour: S.amber, radius: 60, radiusY: 10, strength: 0.4 }, // the booth
    { x: WALL.x + 75, y: FLOOR, colour: S.amber, radius: 60, radiusY: 8, strength: 0.25 }, // lamps in the passage
  ],

  lines: [],

  props: [
    // Inside: the city's buildings crowding up to the wall.
    { sprite: P.facade(130, FLOOR - 20, 51), x: 440, y: 20 },
    { sprite: P.facade(120, FLOOR - 50, 52), x: 570, y: 50 },
    { sprite: P.facade(120, FLOOR - 10, 53), x: 680, y: 10 },
    { sprite: P.cableBundle(FLOOR - 20), x: 566, y: 20 },
    // The checkpoint.
    { sprite: P.BOOTH, x: 494, y: FLOOR - 50 },
    { sprite: P.barrierArm(60), x: 444, y: FLOOR - 26 },
    { sprite: P.streetLamp(70), x: 650, y: FLOOR - 70 },
    // The wall, and the passage through it.
    { sprite: P.gateWall(WALL.width, WALL.height, { x: 35, width: 80, height: 90 }), x: WALL.x, y: FLOOR - WALL.height },
  ],

  features: [
    { type: 'rain' },
    { type: 'frames', frames: scrollingScreen(40, 26), x: 560, y: 120, every: 420 },
  ],
  people: [
    // The watch at the checkpoint, and its commander in the morning.
    watch('booth-watch', 0, 532, FLOOR, 'gate_watch', undefined, { flipX: true }),
    watch('barrier-watch', 1, 470, FLOOR, 'gate_watch', DAY, { flipX: true }),
    cast('commander', 584, FLOOR, { knot: 'gate_commander', when: MORNING, flipX: true }),
    // Outside the wall: the envoy arriving, people waiting to be let in.
    cast('envoy', 230, FLOOR, { knot: 'gate_envoy', when: MORNING }),
    citizen('traveller-1', 9, 180, FLOOR, 'gate_traveller', MORNING),
    citizen('traveller-2', 2, 150, FLOOR, 'gate_traveller', ['afternoon']),
    strollingCitizen('passer', 7, 600, 760, FLOOR, 'gate_folk', AWAKE),
    cast('commander', 560, FLOOR, { id: 'commander-night', knot: 'gate_commander_night', when: ['night'], flipX: true }),
  ],
  interactables: [
    { id: 'wall', x: 365, y: FLOOR, reach: 14, label: 'Look', knot: 'gate_wall' },
    { id: 'booth', x: 508, y: FLOOR, reach: 10, label: 'Look', knot: 'gate_booth' },
    { id: 'road', x: 60, y: FLOOR, reach: 14, label: 'Look', knot: 'gate_road' },
  ],

  exits: [{ id: 'to-promenade', x: 780, y: FLOOR, reach: 14, to: 'promenade' }],
};
