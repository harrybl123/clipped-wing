import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './canopyProps';
import type { AreaDefinition, Feature, Solid } from '../types';
import { stairSide } from './canopyArea';
import { DAY, MORNING, folk, inStory, strollingFolk } from './people';

// The tube mouth (Chapter 4): where the tube comes out of the top of the tree, and offerings and the
// ascended arrive (docs/areas/canopy/tube-mouth.md). The first place in the canopy, so it sets the look:
// solarpunk treehouses in the leaves (designer). The tentacles, like an octopus's (doc), rise out of a great
// collar where the trunk ends, glowing, the light running up them; one curls over and down into a basin
// padded with old cloth, where today's offerings lie (and where, up the tube, you come to: designer, the
// master kneeling by you). Sky above, leaves all round, the treetop going on into the haze. On the left, a
// living-wood stair up to a platform on a bough, carved birds along its rail, and a higher one with the
// view; a rope bridge off to the walkways. On the right, crates going on, a cable with a basket riding up
// it towards the great house, gardens, a beehive, and an arch of woven boughs through to the great house.

const W = 880;
const H = 300;
const FLOOR = 252;
/** The tentacles' sprite: the collar where they come out of the tree is in the middle of the deck. */
const TX = 160;
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
  playerStart: { x: 668, y: FLOOR },
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
    { x: 440, y: FLOOR, colour: S.cyan, radius: 150, radiusY: 14, strength: 0.4 }, // the tentacles' glow round their foot
    { x: 668, y: FLOOR, colour: S.cyan, radius: 50, radiusY: 10, strength: 0.25 }, // the mouth over the basin
    { x: 849, y: FLOOR, colour: S.amber, radius: 50, radiusY: 10, strength: 0.2 }, // the lantern in the arch
    { x: 300, y: FLOOR, colour: S.amber, radius: 30, radiusY: 8, strength: 0.15 },
    { x: 610, y: FLOOR, colour: S.amber, radius: 30, radiusY: 8, strength: 0.15 },
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
    { from: { x: 750, y: 195 }, to: { x: 879, y: 150 }, colour: S.deep },
  ],

  props: [
    // Far back: a bough out of the leaves on the right; treehouses on boughs behind the deck (nothing floats:
    // one on a bough from the left, one on its own limb rising out of the branch behind the deck).
    // Giant limbs behind the deck: the platforms on the left are built against one; another on the right
    // carries a ring platform and a hut high up.
    { sprite: P.giantTrunk(80, H, 21), x: 40, y: 0, behind: true },
    { sprite: P.giantTrunk(90, H, 22), x: 770, y: 0, behind: true },
    { sprite: P.behind(P.ringDeck(140, 6)), x: 736, y: 112, behind: true },
    { sprite: P.behind(P.roundHut(46, 22, 7)), x: 790, y: 112 - P.roundHut(46, 22, 7).rows.length, behind: true },
    // Leaves and vines hanging into view at the top.
    { sprite: P.leafClump(210, 72, 3), x: 0, y: 0 },
    { sprite: P.vines(46, 90, 4), x: 150, y: 30 },
    { sprite: P.leafClump(200, 62, 8), x: 680, y: 0 },
    { sprite: P.vines(30, 70, 9), x: 700, y: 34 },
    // The tentacles, out of their collar in the middle of the deck; the basin under the mouth.
    { sprite: P.TENTACLES, x: TX, y: FLOOR - P.TENTACLES_H },
    { sprite: P.BASIN, x: 631, y: FLOOR - 22 },
    // The left: a sign at the bridge; a water tank and its funnel; pots; a hammock under the platform; carved
    // birds along the platform's rail; the view's rail; bunting from the platform to the tentacles' collar.
    { sprite: P.signpost('leaf'), x: 40, y: FLOOR - 26 },
    { sprite: P.waterFunnel(56), x: 64, y: FLOOR - 68 - 15 },
    { sprite: P.WATER_TANK, x: 70, y: FLOOR - 15 },
    { sprite: P.hammock(44), x: 114, y: FLOOR - 18 },
    { sprite: P.pots(40, 3), x: 188, y: FLOOR - 16 },
    stairSide(LEDGE_TO, FLOOR, LEDGE, 'left'),
    { sprite: P.birdRail(LEDGE_TO - LEDGE_FROM, 5), x: LEDGE_FROM, y: LEDGE - 22 },
    { sprite: P.rail(52), x: 116, y: HIGH - 10 },
    { sprite: P.bunting(120, 1), x: 168, y: HIGH + 4 },
    // Round the collar: lamps, a bench.
    { sprite: P.lampPost(40), x: 290, y: FLOOR - 40 },
    { sprite: P.bench(26), x: 236, y: FLOOR - 6 },
    { sprite: P.lampPost(40), x: 604, y: FLOOR - 40 },
    // A ladder down off the deck's edge to the great house below.
    { sprite: P.poleLadder(H - FLOOR), x: 568, y: FLOOR },
    // The right: crates going on, the cable's post, solar sails, gardens, a beehive, the arch through to the
    // great house with bunting over it.
    { sprite: P.solarSail(58, 1, -1), x: 752, y: FLOOR - 24 - 86 },
    { sprite: P.solarSail(44, 4, 1), x: 786, y: FLOOR - 24 - 72 },
    { sprite: P.CRATE, x: 710, y: FLOOR - 8 },
    { sprite: P.CRATE, x: 722, y: FLOOR - 16 },
    { sprite: P.CRATE, x: 726, y: FLOOR - 8 },
    { sprite: P.cablePost(60), x: 742, y: FLOOR - 60 },
    { sprite: P.planter(36, 7), x: 754, y: FLOOR - 24 },
    { sprite: P.BEEHIVE, x: 792, y: FLOOR - 16 },
    { sprite: P.pots(16, 9), x: 802, y: FLOOR - 16 },
    { sprite: P.wovenArch(62, 72), x: 818, y: FLOOR - 72 },
    { sprite: P.bunting(56, 3), x: 822, y: FLOOR - 66 },
    // Along the branch's side, under the deck: the water pipe, and vines hanging off it.
    { sprite: P.pipeRun(W - 70), x: 66, y: FLOOR + 9 },
    { sprite: P.vines(60, 30, 12), x: 120, y: FLOOR + 12 },
    { sprite: P.vines(70, 34, 13), x: 380, y: FLOOR + 12 },
    { sprite: P.vines(50, 28, 14), x: 690, y: FLOOR + 12 },
  ],

  features: [
    // Chapter 4, Day 1: she leads you to the far end, people stopping to stare and mutter as you pass.
    { type: 'lead', person: 'master-lead', route: 'master', near: 60, speed: 42, says: ['This way.', 'Stay close.', 'Come on, love.'] },
    { type: 'trigger', x: 840, y: FLOOR, reach: 12, knot: 'c4day1_tube_walk', showIf: 'c4day1=led' },
    {
      type: 'barks',
      showIf: 'c4day1=led',
      lines: [
        { who: 'sorter-1', text: 'Up the tube? Today?' },
        { who: 'passer-1', text: 'Is that the carver?' },
        { who: 'sorter-2', text: 'Look at the hand.' },
        { who: 'sorter-1', text: "Nobody's come up for years..." },
        { who: 'passer-1', text: 'Poor thing. Look at it shaking.' },
      ],
    },
    ...tentacleLight(),
    // A basket of offerings riding up the cable to the great house, now and then.
    { type: 'pulse', points: [{ x: 750, y: 199 }, { x: 879, y: 154 }], speed: 26, every: 4200, sprite: P.CABLE_BASKET },
    // A turbine on the high platform, turning.
    { type: 'frames', frames: P.turbineFrames(30), x: 128, y: HIGH - 55, every: 160, power: 'any' },
    // Lanterns: one in the arch, one under the platform; a wind chime.
    { type: 'swing', sprite: P.LANTERN, x: 849, y: FLOOR - 52, ropeTop: FLOOR - 66, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.LANTERN, x: 170, y: LEDGE + 16, ropeTop: LEDGE + 6, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.CHIME, x: 100, y: LEDGE + 14, ropeTop: LEDGE + 6, quiet: true, ropeColour: S.wood },
  ],

  people: [
    // Chapter 4, Day 1, up the tube: the master, kneeling by the basin; then leading you out along the deck.
    inStory('master-lead', 'master', 638, FLOOR, 'c4day1=tube,led', 'c4day1_master_guide'),
    folk('sorter-1', 1, 616, FLOOR, 'c4_folk_tube', DAY),
    folk('sorter-2', 4, 700, FLOOR, 'c4_folk_tube', MORNING),
    strollingFolk('passer-1', 0, 250, 520, FLOOR, 'c4_folk_tube', DAY),
  ],

  interactables: [
    { id: 'basin', x: 668, y: FLOOR, reach: 20, label: 'Look', knot: 'c4_look_basin' },
    { id: 'tentacles', x: 440, y: FLOOR, reach: 22, label: 'Look', knot: 'c4_look_tentacles' },
    { id: 'crates', x: 724, y: FLOOR, reach: 10, label: 'Look', knot: 'c4_look_crates' },
    { id: 'birds', x: 140, y: LEDGE, reach: 30, label: 'Look', knot: 'c4_look_birds' },
    { id: 'view', x: 142, y: HIGH, reach: 20, label: 'Look', knot: 'c4_look_canopy' },
  ],

  // Chapter 4, Day 1: the master's way out along the deck.
  routes: { master: [{ x: 638, y: FLOOR }, { x: 700, y: FLOOR }, { x: 760, y: FLOOR }, { x: 810, y: FLOOR }, { x: 846, y: FLOOR }] },

  exits: [
    { id: 'to-ascended-hall', x: 16, y: FLOOR, reach: 14, to: 'ascended-hall' },
    { id: 'to-great-house', x: 572, y: FLOOR, reach: 8, to: 'great-house' },
    { id: 'to-walkways', x: 862, y: FLOOR, reach: 14, to: 'walkways' },
  ],
};
