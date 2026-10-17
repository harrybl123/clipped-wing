import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './canopyProps';
import type { AreaDefinition, Feature, Solid } from '../types';

// The tube mouth (Chapter 4): where the tube comes out of the top of the tree, and offerings and the
// ascended arrive (docs/areas/canopy/tube-mouth.md). The first place in the canopy, so it sets the look:
// solarpunk treehouses in the leaves (designer). The tentacles, like an octopus's (doc), rise out of a great
// collar where the trunk ends, glowing, the light running up them; one curls over and down into a basin
// padded with old cloth, where today's offerings lie (and where, up the tube, you come to: designer, the
// master kneeling by you). Sky above, leaves all round, the treetop going on into the haze. On the left, a
// living-wood stair up to a platform on a bough, carved birds along its rail, and a higher one with the
// view; a rope bridge off to the walkways. On the right, crates going on, a cable with a basket riding up
// it towards the great house, gardens, a beehive, and an arch of woven boughs through to the great house.

const W = 800;
const H = 300;
const FLOOR = 252;
/** The tentacles' sprite: the collar where they come out of the tree is in the middle of the deck. */
const TX = 240;
/** The platform on the bough (up the stair), and the higher one with the view. */
const LEDGE = 200;
const LEDGE_FROM = 96;
const LEDGE_TO = 184;
const HIGH = 150;

/** The stair up to the platform: one-way steps, rising to the left (as the promenade's). */
function ledgeStair(): Solid[] {
  return Array.from({ length: 6 }, (_, k) => {
    const top = LEDGE + 8 * (k + 1);
    return { x: LEDGE_TO, y: top, width: 8 * (k + 1), height: FLOOR - top, oneWay: true };
  });
}

/** Light running up each tentacle, from the collar out (the tube's light, going up and out). */
const tentacleLight = (): Feature[] =>
  P.TENTACLE_PATHS.map((path, i) => ({
    type: 'pulse' as const,
    points: path.map(([x, y]) => ({ x: Math.round(TX + x), y: Math.round(y) })),
    speed: 55 + i * 6,
    every: 1400 + i * 300,
    count: 2,
    colour: i < 2 ? S.cyan : S.white,
  }));

export const tubeMouth: AreaDefinition = {
  id: 'tube-mouth',
  name: 'the tube mouth',
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 214, treeX: -9999, backdrop: 'canopy', ground: 'deck' },
  ambient: 1,
  playerStart: { x: 540, y: FLOOR },
  surface: 'plank',
  acoustics: 'open',
  ambience: [
    { sound: 'wind', volume: 0.35 },
    { sound: 'leaves', volume: 0.45 },
    { sound: 'hum', volume: 0.25 },
  ],

  solids: [
    // The deck: planks laid over the top of the great branch the tube comes out of.
    { x: 64, y: FLOOR, width: W - 64, height: H - FLOOR },
    // The rope bridge off to the walkways.
    { x: 0, y: FLOOR, width: 64, height: 4 },
    // Up the stair to the platform on the bough, and the higher one with the view (a jump up).
    { x: LEDGE_FROM, y: LEDGE, width: LEDGE_TO - LEDGE_FROM, height: 6, oneWay: true },
    ...ledgeStair(),
    { x: 116, y: HIGH, width: 52, height: 6, oneWay: true },
    { x: 0, y: 0, width: 4, height: H, invisible: true },
    { x: W - 4, y: 0, width: 4, height: H, invisible: true },
  ],

  lights: [
    { x: 400, y: FLOOR, colour: S.cyan, radius: 110, radiusY: 12, strength: 0.35 }, // the tentacles' glow round their foot
    { x: 540, y: FLOOR, colour: S.cyan, radius: 50, radiusY: 10, strength: 0.25 }, // the mouth over the basin
    { x: 758, y: FLOOR, colour: S.amber, radius: 50, radiusY: 10, strength: 0.2 }, // the lantern in the arch
  ],

  lines: [
    // The rope bridge's hand ropes, sagging off to the left.
    { from: { x: 0, y: FLOOR - 14 }, to: { x: 32, y: FLOOR - 10 }, colour: S.woodPale },
    { from: { x: 32, y: FLOOR - 10 }, to: { x: 64, y: FLOOR - 14 }, colour: S.woodPale },
    { from: { x: 64, y: FLOOR - 14 }, to: { x: 64, y: FLOOR - 1 }, colour: S.wood },
    // Posts under the platforms.
    { from: { x: 108, y: LEDGE + 6 }, to: { x: 108, y: FLOOR - 1 }, colour: S.wood },
    { from: { x: 109, y: LEDGE + 6 }, to: { x: 109, y: FLOOR - 1 }, colour: S.woodLight },
    { from: { x: 142, y: HIGH + 6 }, to: { x: 142, y: LEDGE - 1 }, colour: S.wood },
    { from: { x: 143, y: HIGH + 6 }, to: { x: 143, y: LEDGE - 1 }, colour: S.woodLight },
    // The cable from the post by the basin up towards the great house.
    { from: { x: 626, y: 195 }, to: { x: 799, y: 142 }, colour: S.deep },
  ],

  props: [
    // Leaves hanging into view at the top.
    { sprite: P.leafClump(180, 70, 3), x: 0, y: 0 },
    { sprite: P.leafClump(180, 60, 8), x: 620, y: 0 },
    // The tentacles, out of their collar in the middle of the deck; the basin under the mouth.
    { sprite: P.TENTACLES, x: TX, y: FLOOR - P.TENTACLES_H },
    { sprite: P.BASIN, x: 503, y: FLOOR - 22 },
    // The left: a water funnel and a planter on the deck; carved birds along the platform's rail; the view's rail.
    { sprite: P.waterFunnel(70), x: 68, y: FLOOR - 82 },
    { sprite: P.planter(36, 2), x: 128, y: FLOOR - 24 },
    { sprite: P.birdRail(LEDGE_TO - LEDGE_FROM, 5), x: LEDGE_FROM, y: LEDGE - 22 },
    { sprite: P.rail(52), x: 116, y: HIGH - 10 },
    // The right: crates going on, the cable's post, a solar sail, gardens, a beehive, the arch through to the great house.
    { sprite: P.solarSail(54, 1, -1), x: 636, y: FLOOR - 24 - 82 },
    { sprite: P.solarSail(40, 4, 1), x: 690, y: FLOOR - 24 - 68 },
    { sprite: P.CRATE, x: 584, y: FLOOR - 8 },
    { sprite: P.CRATE, x: 598, y: FLOOR - 16 },
    { sprite: P.CRATE, x: 600, y: FLOOR - 8 },
    { sprite: P.cablePost(60), x: 618, y: FLOOR - 60 },
    { sprite: P.planter(40, 7), x: 638, y: FLOOR - 24 },
    { sprite: P.planter(28, 11), x: 682, y: FLOOR - 24 },
    { sprite: P.BEEHIVE, x: 712, y: FLOOR - 16 },
    { sprite: P.wovenArch(62, 72), x: 728, y: FLOOR - 72 },
  ],

  features: [
    ...tentacleLight(),
    // A basket of offerings riding up the cable to the great house, now and then.
    { type: 'pulse', points: [{ x: 626, y: 199 }, { x: 799, y: 146 }], speed: 26, every: 4200, sprite: P.CABLE_BASKET },
    // A turbine on the high platform, turning.
    { type: 'frames', frames: P.turbineFrames(30), x: 128, y: HIGH - 55, every: 160, power: 'any' },
    // Lanterns: one in the arch, one under the platform.
    { type: 'swing', sprite: P.LANTERN, x: 759, y: FLOOR - 52, ropeTop: FLOOR - 66, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.LANTERN, x: 150, y: LEDGE + 18, ropeTop: LEDGE + 6, quiet: true, ropeColour: S.wood },
  ],

  people: [],

  interactables: [
    { id: 'basin', x: 540, y: FLOOR, reach: 20, label: 'Look', knot: 'c4_look_basin' },
    { id: 'tentacles', x: 400, y: FLOOR, reach: 18, label: 'Look', knot: 'c4_look_tentacles' },
    { id: 'crates', x: 600, y: FLOOR, reach: 10, label: 'Look', knot: 'c4_look_crates' },
    { id: 'birds', x: 140, y: LEDGE, reach: 30, label: 'Look', knot: 'c4_look_birds' },
    { id: 'view', x: 142, y: HIGH, reach: 20, label: 'Look', knot: 'c4_look_canopy' },
  ],

  exits: [
    { id: 'to-walkways', x: 16, y: FLOOR, reach: 14, to: 'walkways' },
    { id: 'to-great-house', x: 780, y: FLOOR, reach: 14, to: 'great-house' },
  ],
};
