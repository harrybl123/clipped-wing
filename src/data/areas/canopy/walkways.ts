import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './canopyProps';
import { CANOPY_AMBIENCE, sides, stair, stairSide } from './canopyArea';
import type { AreaDefinition, Prop } from '../types';
import { AWAKE, DAY, colonist, folk, girlGuide, guide, strollingFolk } from './people';

// The walkways (Chapter 4): rope bridges and platforms linking the treehouses (doc;
// docs/areas/canopy/walkways.md); a village among the limbs (designer: more treehousey, like the Ewoks' in
// Return of the Jedi). Two of the tree's giant limbs, ring platforms round them at different heights, round
// huts with tall thatched roofs on the platforms, rope bridges between. The tube mouth off along a bridge to
// the left, the lowering platform along one to the right; up round the left limb to Grounded's house at the
// top; down under the right limb's platform to a low deck and the way to the great house.

const W = 720;
const H = 360;
/** The main level (both limbs, the bridges between and off each side). */
const MAIN = 260;
/** The left limb: its upper platform, and the top (Grounded's house). */
const UP = 180;
const TOP = 100;
/** The right limb: its upper platform, and the low deck under it. */
const UP2 = 196;
const LOW = 330;

/** A hut standing on a deck at `floor`, its walls `w` wide. */
const hut = (x: number, floor: number, w: number, h: number, seed: number): Prop => {
  const sprite = P.roundHut(w, h, seed);
  return { sprite, x, y: floor - sprite.rows.length };
};

export const walkways: AreaDefinition = {
  id: 'walkways',
  name: 'the walkways',
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 250, treeX: -9999, backdrop: 'canopy', ground: 'deck' },
  ambient: 1,
  playerStart: { x: 20, y: MAIN },
  surface: 'plank',
  acoustics: 'open',
  ambience: [...CANOPY_AMBIENCE, { sound: 'chatter', volume: 0.2 }, { sound: 'creaks', volume: 0.3 }],

  solids: [
    // The main level: the bridge in from the tube mouth, round the left limb, the bridge across, round the
    // right limb (you can drop through it to the low deck), the bridge out to the lowering platform.
    { x: 0, y: MAIN, width: 90, height: 4 },
    { x: 90, y: MAIN, width: 210, height: 8 },
    { x: 300, y: MAIN, width: 110, height: 4 },
    { x: 410, y: MAIN, width: 220, height: 8, oneWay: true },
    { x: 630, y: MAIN, width: 90, height: 4 },
    // Up round the left limb, and on up to the top.
    ...stair(100, MAIN, UP, 'right'),
    { x: 100, y: UP, width: 190, height: 6, oneWay: true },
    ...stair(290, UP, TOP, 'left'),
    { x: 120, y: TOP, width: 170, height: 6, oneWay: true },
    // The right limb's upper platform, up a stair from the main level.
    { x: 430, y: UP2, width: 180, height: 6, oneWay: true },
    ...stair(610, MAIN, UP2, 'left'),
    // Down under the right limb: the low deck, and the stair back up.
    { x: 410, y: LOW, width: 260, height: H - LOW },
    ...stair(410, LOW, MAIN, 'left'),
    ...sides(W, H),
  ],

  lights: [
    { x: 200, y: MAIN, colour: S.amber, radius: 90, radiusY: 8, strength: 0.2 },
    { x: 520, y: MAIN, colour: S.amber, radius: 90, radiusY: 8, strength: 0.2 },
    { x: 200, y: TOP, colour: S.amber, radius: 60, radiusY: 8, strength: 0.25 },
    { x: 540, y: LOW, colour: S.amber, radius: 70, radiusY: 8, strength: 0.15 },
  ],

  lines: [
    // The bridges' hand ropes, sagging between posts.
    ...[[0, 90], [300, 410], [630, 720]].flatMap(([a, b]) => [
      { from: { x: a!, y: MAIN - 14 }, to: { x: (a! + b!) / 2, y: MAIN - 9 }, colour: S.woodPale },
      { from: { x: (a! + b!) / 2, y: MAIN - 9 }, to: { x: b! - 1, y: MAIN - 14 }, colour: S.woodPale },
      { from: { x: a!, y: MAIN - 15 }, to: { x: a!, y: MAIN - 1 }, colour: S.wood },
      { from: { x: b! - 1, y: MAIN - 15 }, to: { x: b! - 1, y: MAIN - 1 }, colour: S.wood },
    ]),
  ],

  props: [
    // The leaves below; the two great limbs, going up out of sight.
    { sprite: P.leafFloor(W, 70, 1), x: 0, y: H - 70, behind: true },
    { sprite: P.giantTrunk(92, H, 11), x: 150, y: 0, behind: true },
    { sprite: P.giantTrunk(104, H, 12), x: 466, y: 0, behind: true },
    // The stairs' sides (the one up to the top hangs out past its platform: posts down to the bridge).
    stairSide(100, MAIN, UP, 'right'),
    stairSide(290, UP, TOP, 'left', MAIN),
    stairSide(610, MAIN, UP2, 'left'),
    stairSide(410, LOW, MAIN, 'left'),
    // The platforms' lips and struts.
    { sprite: P.ringDeck(210, 1), x: 90, y: MAIN },
    { sprite: P.ringDeck(220, 2), x: 410, y: MAIN },
    { sprite: P.ringDeck(190, 3), x: 100, y: UP },
    { sprite: P.ringDeck(170, 4), x: 120, y: TOP },
    { sprite: P.ringDeck(180, 5), x: 430, y: UP2 },
    // Huts round the limbs: on the main level either side, on the upper platforms, and Grounded's at the top.
    hut(92, MAIN, 44, 24, 1),
    hut(250, MAIN, 40, 22, 2),
    hut(570, MAIN, 44, 24, 3),
    hut(222, UP, 40, 20, 4),
    hut(540, UP2, 48, 22, 5),
    hut(132, TOP, 60, 30, 6),
    // Bunting between the limbs; signs; pots, a water tank, washing on the right limb's upper deck; a sail.
    { sprite: P.bunting(220, 1), x: 240, y: MAIN - 90 },
    { sprite: P.signpost('tube', 22), x: 18, y: MAIN - 22 },
    { sprite: P.signpost('down', 22), x: 682, y: MAIN - 22 },
    { sprite: P.signpost('house', 22), x: 250, y: TOP - 22 },
    { sprite: P.pots(30, 7), x: 150, y: MAIN - 16 },
    { sprite: P.WATER_TANK, x: 440, y: MAIN - 15 },
    { sprite: P.pots(26, 8), x: 160, y: UP - 16 },
    { sprite: P.washing(60, 9), x: 444, y: UP2 - 26 },
    { sprite: P.solarSail(20, 10, 1), x: 120, y: TOP - 22 - 28 },
    // The low deck under the right limb: a garden, the sign down to the great house.
    { sprite: P.planter(50, 11), x: 480, y: LOW - 24 },
    { sprite: P.signpost('house', 22), x: 640, y: LOW - 22 },
  ],

  features: [
    { type: 'swing', sprite: P.LANTERN, x: 355, y: MAIN - 50, ropeTop: MAIN - 86, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.LANTERN, x: 300, y: UP + 18, ropeTop: UP + 6, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.LANTERN, x: 600, y: UP2 + 18, ropeTop: UP2 + 6, quiet: true, ropeColour: S.wood },
    { type: 'swing', sprite: P.CHIME, x: 110, y: TOP + 18, ropeTop: TOP + 6, quiet: true, ropeColour: S.wood },
  ],

  people: [
    guide('master', 30, MAIN),
    guide('hunter', 690, MAIN),
    girlGuide(700, MAIN),
    strollingFolk('stroller-1', 7, 100, 290, MAIN, 'c4_folk_walkways', DAY),
    strollingFolk('stroller-2', 0, 420, 620, MAIN, 'c4_folk_walkways', AWAKE),
    folk('washer', 2, 500, UP2, 'c4_folk_walkways', DAY),
    folk('gardener', 1, 530, LOW, 'c4_folk_walkways', DAY),
    colonist('messenger', 'messenger', 340, MAIN, ['afternoon']),
  ],

  interactables: [
    { id: 'houses', x: 270, y: MAIN, reach: 12, label: 'Look', knot: 'c4_look_houses' },
    { id: 'washing', x: 474, y: UP2, reach: 16, label: 'Look', knot: 'c4_look_washing' },
    { id: 'drop', x: 355, y: MAIN, reach: 14, label: 'Look', knot: 'c4_look_drop' },
    { id: 'tank', x: 446, y: MAIN, reach: 8, label: 'Look', knot: 'c4_look_tank' },
  ],

  exits: [
    { id: 'to-tube-mouth', x: 12, y: MAIN, reach: 10, to: 'tube-mouth' },
    { id: 'to-lowering-platform', x: 708, y: MAIN, reach: 10, to: 'lowering-platform' },
    { id: 'to-groundeds-house', x: 162, y: TOP, reach: 12, to: 'groundeds-house' },
    { id: 'to-great-house', x: 650, y: LOW, reach: 12, to: 'great-house' },
  ],
};
