import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './scrapStacksProps';
import type { AreaDefinition, Line, Solid } from '../types';
import { DAY, cast, dogFollowing, rival, stroller } from './people';

// The scrap stacks (Chapter 2): towers of compacted junk two screens high between the shacks, for
// climbing and hiding; this chapter's back routes, a way across the settlement over the top, out of
// sight. Ledges zigzag up between the towers, a cable bridge spans a gap, and at the top is the kid
// lookout's perch, with the whole settlement below and the tree on the horizon. On the ground: the back
// of your shack, the brothel's back alley, and through to the swap yard.
// See docs/areas/borderland/scrap-stacks.md. The kid lookout (and your brother, sometimes) come with the cast.

const W = 640;
const H = 540;
const FLOOR = 510;

/** The ledges, bottom to top: [x, y, width]. Each is a short jump from the last, and jammed into a tower at one end at least (designer: some floated in the gaps). */
const LEDGES: [number, number, number][] = [
  [84, 470, 44], [150, 432, 36], [214, 396, 48], [300, 362, 36], [372, 328, 44], [300, 292, 36],
  [200, 258, 62], [150, 222, 36], [200, 186, 66], [310, 152, 40],
];
/** The cable bridge, from the top of one tower across to the perch's tower. */
const BRIDGE = { from: 350, to: 430, y: 130 };
const PERCH = { x: 430, y: 112, width: 76 };

/** A cable bridge: two lines (a walkway and a handrail) with hangers between. */
function bridgeLines(): Line[] {
  const out: Line[] = [
    { from: { x: BRIDGE.from, y: BRIDGE.y }, to: { x: BRIDGE.to, y: BRIDGE.y }, colour: S.dim },
    { from: { x: BRIDGE.from, y: BRIDGE.y - 10 }, to: { x: BRIDGE.to, y: BRIDGE.y - 10 }, colour: S.woodLight },
  ];
  for (let x = BRIDGE.from; x <= BRIDGE.to; x += 10) out.push({ from: { x, y: BRIDGE.y - 10 }, to: { x, y: BRIDGE.y }, colour: S.woodLight });
  return out;
}

export const scrapStacks: AreaDefinition = {
  id: 'scrap-stacks',
  name: 'the scrap stacks',
  width: W,
  height: H,
  cavity: { x: 0, y: 0, width: W, height: H, radius: 0 },
  outdoor: { horizon: 150, treeX: 300, backdrop: 'settlement' },
  ambient: 1,
  playerStart: { x: 40, y: FLOOR },
  surface: 'dirt',
  acoustics: 'street',

  solids: [
    { x: 0, y: FLOOR, width: W, height: H - FLOOR },
    { x: -8, y: 0, width: 8, height: H, invisible: true },
    { x: W, y: 0, width: 8, height: H, invisible: true },
    ...LEDGES.map(([x, y, width]): Solid => ({ x, y, width, height: 4, oneWay: true, invisible: true })),
    { x: BRIDGE.from, y: BRIDGE.y, width: BRIDGE.to - BRIDGE.from, height: 2, oneWay: true, invisible: true },
    { x: PERCH.x, y: PERCH.y, width: PERCH.width, height: 6, oneWay: true, invisible: true },
  ],

  lights: [],
  lines: bridgeLines(),

  props: [
    // The towers, leaning on each other.
    { sprite: P.junkTower(90, 330, 1), x: 20, y: FLOOR - 330 },
    { sprite: P.junkTower(110, 400, 2), x: 120, y: FLOOR - 400 },
    { sprite: P.junkTower(100, 300, 3), x: 250, y: FLOOR - 300 },
    { sprite: P.junkTower(80, 390, 4), x: 330, y: FLOOR - 390 },
    { sprite: P.junkTower(120, 400, 5), x: 420, y: FLOOR - 400 },
    { sprite: P.junkTower(80, 260, 6), x: 540, y: FLOOR - 260 },
    { sprite: P.HANGING_SHEET, x: 284, y: 300 }, // hung on the towers' faces
    { sprite: P.HANGING_SHEET, x: 470, y: 236 },
    // Ledges jammed into the stacks.
    ...LEDGES.map(([x, y, width]) => ({ sprite: P.ledge(width), x, y })),
    // The perch.
    { sprite: P.PERCH, x: PERCH.x + 2, y: PERCH.y - 16 },
  ],

  features: [
    // Chapter 2, Day 8, first light: the boss's son waiting at the foot of the stacks. Over the top, or he sees you.
    { type: 'trigger', x: 40, y: FLOOR, reach: 30, knot: 'c2day8_stacks', showIf: 'stacks8', hideIf: 'son_met8' },
    { type: 'watch', who: 'boss_son', from: 150, to: 400, y: FLOOR, speed: 24, range: 90, see: 50, pause: 1600, reset: { x: 40, y: FLOOR }, showIf: 'son_waiting', caught: 'c2day8_caught' },
    { type: 'trigger', x: 600, y: FLOOR, reach: 20, knot: 'c2day8_slipped', showIf: 'son_waiting' },
    // Day 9, night: the scout at the foot of the stacks, up and away to the perch; you after them.
    { type: 'trigger', x: 600, y: FLOOR, reach: 40, knot: 'c2day9_stacks', showIf: 'chase9', hideIf: 'chase_seen' },
    { type: 'trigger', x: 400, y: BRIDGE.y, reach: 34, knot: 'c2day9_cornered', showIf: 'chase_seen', hideIf: 'scout_cornered' },
  ],
  people: [
    cast('old_scav', 360, FLOOR, { knot: 'scrap_stacks_old_scav', when: DAY, flipX: true }),
    cast('lookout', 504, PERCH.y, { knot: 'scrap_stacks_lookout', when: ['evening'] }),
    // Day 9: the scout, at the foot of the stacks, then (cornered) on the perch.
    rival('scout-stacks', 1, 560, FLOOR, ['night'], { showIf: 'chase9', hideIf: 'scout_cornered' }),
    rival('scout-perch', 1, 482, PERCH.y, ['night'], { showIf: 'scout_cornered', hideIf: ['turnin9', 'letgo9'] }),
    dogFollowing(30, FLOOR),
    // Day 8: the son, when he's caught you (he comes up beside you).
    cast('boss_son', 300, FLOOR, { id: 'boss-son-dawn', when: ['morning'], showIf: 'son_confront' }),
    stroller('hauler-1', 1, 420, 600, FLOOR, DAY),
    stroller('hauler-2', 10, 60, 200, FLOOR, ['morning']),
  ],

  interactables: [
    { id: 'view', x: PERCH.x + 30, y: PERCH.y, reach: 26, label: 'Look', knot: 'scrap_stacks_view' },
    { id: 'tube', x: PERCH.x + 60, y: PERCH.y, reach: 8, label: 'Look', knot: 'scrap_stacks_tube' },
    { id: 'stacks', x: 300, y: FLOOR, reach: 20, label: 'Look', knot: 'scrap_stacks_stacks' },
  ],

  exits: [
    { id: 'to-shack', x: 16, y: FLOOR, reach: 12, to: 'shack' },
    { id: 'to-brothel', x: 230, y: FLOOR, reach: 10, to: 'brothel' },
    { id: 'to-swap-yard', x: 624, y: FLOOR, reach: 12, to: 'swap-yard' },
  ],

  ambience: [
    { sound: 'wind', volume: 0.4 },
    { sound: 'chatter', volume: 0.1, when: ['morning', 'afternoon', 'evening'] },
  ],
};
