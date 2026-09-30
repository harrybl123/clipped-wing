import { SHADES as S } from '../../ui/pixelArt';
import { BIRD, FUNGUS, VILLAGER } from '../../ui/sprites';
import * as P from './homeProps';
import type { AreaDefinition } from './types';

// The protagonist's home, on the edge of the roots by the rot: one hollowed-out root on two
// levels. Ground floor shared with Mum (door, hearth, table, food store); the loft is yours
// (bed, carving bench, your birds, the hiding place). Layout is placeholder; story is in
// story/home.ink.

const FLOOR = 236;
const LOFT = 150;

export const home: AreaDefinition = {
  id: 'home',
  width: 480,
  height: 270,
  cavity: { x: 16, y: 12, width: 448, height: FLOOR - 12, radius: 30 },
  ambient: 0.8,
  playerStart: { x: 250, y: FLOOR },

  solids: [
    { x: 0, y: FLOOR, width: 480, height: 270 - FLOOR },
    { x: 16, y: LOFT, width: 284, height: 8, oneWay: true },
    { x: 316, y: 198, width: 26, height: 6, oneWay: true }, // root step up to the loft
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: 464, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 102, y: 222, colour: S.amber, radius: 80, radiusY: 50, strength: 0.5 }, // hearth
    { x: 102, y: 150, colour: S.amber, radius: 60, radiusY: 40, strength: 0.15 }, // hearth glow on the loft
    { x: 118, y: 60, colour: S.green, radius: 34, strength: 0.32 }, // fungus lamp
    { x: 456, y: 88, colour: S.green, radius: 24, radiusY: 46, strength: 0.4 }, // light through the crack
    { x: 448, y: 232, colour: S.green, radius: 16, radiusY: 10, strength: 0.3 }, // fungi by the crack
    { x: 247, y: 104, colour: S.cyan, radius: 16, strength: 0.3 }, // scavenged light cell
  ],

  lines: [
    { from: { x: 118, y: 12 }, to: { x: 118, y: 47 }, colour: S.dim }, // lamp cord
    { from: { x: 150, y: 12 }, to: { x: 150, y: 19 }, colour: S.dim }, // herb cords
    { from: { x: 162, y: 12 }, to: { x: 162, y: 23 }, colour: S.dim },
    { from: { x: 174, y: 12 }, to: { x: 174, y: 17 }, colour: S.dim },
    { from: { x: 296, y: 22 }, to: { x: 334, y: 30 }, colour: S.woodPale }, // water channel along a root
    { from: { x: 296, y: 23 }, to: { x: 334, y: 31 }, colour: S.deep },
  ],

  props: [
    { sprite: P.pipe(206), x: 100, y: 12 },
    { sprite: P.post(78), x: 30, y: LOFT + 8 },
    { sprite: P.post(78), x: 294, y: LOFT + 8 },
    // Ground floor
    { sprite: P.DOOR, x: 18, y: FLOOR - 34 },
    { sprite: P.CHARM, x: 44, y: 188 },
    { sprite: P.HEARTH, x: 80, y: FLOOR - 18 },
    { sprite: P.POT, x: 84, y: FLOOR - 25 },
    { sprite: P.GEAR, x: 116, y: FLOOR - 25 },
    { sprite: P.RUG, x: 150, y: FLOOR - 2 },
    { sprite: P.TABLE, x: 188, y: FLOOR - 12 },
    { sprite: P.STOOL, x: 176, y: FLOOR - 8 },
    { sprite: P.STOOL, x: 232, y: FLOOR - 8 },
    { sprite: P.BOWL, x: 196, y: FLOOR - 14 },
    { sprite: P.BOWL, x: 216, y: FLOOR - 14 },
    { sprite: P.PULLEY, x: 358, y: 14 },
    { sprite: P.BUCKET, x: 330, y: FLOOR - 6 },
    { sprite: P.shelf(56), x: 390, y: 204 },
    { sprite: P.shelf(56), x: 390, y: 176 },
    { sprite: P.PATCH, x: 382, y: 96 },
    { sprite: P.CRACK, x: 452, y: 64 },
    { sprite: FUNGUS, x: 440, y: FLOOR - 4 },
    { sprite: FUNGUS, x: 449, y: FLOOR - 4 },
    { sprite: P.HERBS, x: 148, y: 19 },
    { sprite: P.HERBS, x: 160, y: 23 },
    { sprite: P.HERBS, x: 172, y: 17 },
    { sprite: P.FUNGUS_LAMP, x: 115, y: 47 },
    // Loft
    { sprite: P.BED, x: 22, y: LOFT - 10 },
    { sprite: P.PATCH, x: 62, y: 70 },
    { sprite: P.BENCH, x: 156, y: LOFT - 14 },
    { sprite: P.CHISEL, x: 164, y: LOFT - 16 },
    { sprite: P.UNFINISHED_BIRD, x: 184, y: LOFT - 20 },
    { sprite: P.shelf(48), x: 206, y: 110 },
    { sprite: BIRD, x: 208, y: 104 },
    { sprite: BIRD, x: 220, y: 104 },
    { sprite: BIRD, x: 232, y: 104 },
    { sprite: P.LIGHT_CELL, x: 245, y: 104 },
    { sprite: P.LOOSE_BOARD, x: 260, y: LOFT },
  ],

  features: [
    { type: 'fire', x: 102, y: FLOOR - 1 },
    { type: 'swing', sprite: P.BASKET, x: 362, y: 118, ropeTop: 19 },
    { type: 'drip', x: 334, y: 32, floorY: FLOOR - 5 },
    { type: 'jars', sprite: P.JAR, x: 393, y: 204, variable: 'food_store', max: 16, perRow: 8, rowSpacing: 28 },
  ],

  people: [{ id: 'mum', sprite: VILLAGER, x: 150, y: FLOOR, knot: 'home_mum' }],

  interactables: [
    { id: 'door', x: 28, y: FLOOR, reach: 14, label: 'Leave', knot: 'home_door' },
    { id: 'hearth', x: 102, y: FLOOR, reach: 18, label: 'Look', knot: 'home_hearth' },
    { id: 'food-store', x: 418, y: FLOOR, reach: 26, label: 'Look', knot: 'home_food_store' },
    { id: 'bed', x: 46, y: LOFT, reach: 26, label: 'Sleep', knot: 'home_bed' },
    { id: 'bench', x: 184, y: LOFT, reach: 26, label: 'Carve', knot: 'home_bench' },
    { id: 'hiding-spot', x: 266, y: LOFT, reach: 9, label: 'Search', knot: 'home_hiding_spot' },
  ],
};
