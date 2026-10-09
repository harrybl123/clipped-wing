import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './swapYardProps';
import { casingPod, wireBundle } from './scrapProps';
import type { AreaDefinition } from '../types';
import type { RowSprite } from '../../../ui/sprites';
import { AWAKE, DAY, LATE, cast, dogFollowing, local, stroller } from './people';

// The swap yard (Chapter 2): the market, finds for food. Out in the open inside the settlement's walls,
// the rooftops crowding the horizon and the tree rising behind them. A row of stalls (upturned casings
// under striped awnings and cable-mesh): bright scrap that nobody cares about, poor food, a pot of
// something. The food stall's scales, where a meal is weighed against scrap; the board of prices in
// scavenger signs; a stack of crates to climb for a view over the crowd; the fence's alcove, half
// hidden at the far end. Ways to your shack, the tally house (through a gate), the scrap stacks (down
// an alley) and out through the wall to the picked fields. See docs/areas/borderland/swap-yard.md.
// The crowd, the traders and the fence come with the cast.

const W = 1120;
const FLOOR = 232;

/** The rat sign, chalked on your shack's front in the night (Chapter 2, Day 7), high on the wall (the rows under it are empty). */
const RAT_MARK: RowSprite = {
  rows: [
    '.....w.w.......',
    '..wwwwwwww.....',
    '.w.......ww...w',
    'w..w.......w.w.',
    '.w.......ww..w.',
    '..wwwwwwww....w',
    '...w..w........',
    ...Array.from({ length: 18 }, () => '...............'),
  ],
  colours: { w: S.white },
};
/** What's left of it, scrubbed: it goes grey, and stays grey. */
const RAT_SMUDGE: RowSprite = { rows: RAT_MARK.rows, colours: { w: S.dim } };

export const swapYard: AreaDefinition = {
  id: 'swap-yard',
  name: 'the swap yard',
  width: W,
  height: 270,
  cavity: { x: 0, y: 0, width: W, height: 270, radius: 0 },
  outdoor: { horizon: 160, treeX: 360, backdrop: 'settlement' },
  ambient: 1,
  playerStart: { x: 40, y: FLOOR },
  surface: 'dirt',
  acoustics: 'street',

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: -8, y: 0, width: 8, height: 270, invisible: true },
    { x: W, y: 0, width: 8, height: 270, invisible: true },
    // The crates: climb up for a view over the crowd.
    { x: 446, y: FLOOR - 20, width: 30, height: 20, oneWay: true, invisible: true },
    { x: 452, y: FLOOR - 38, width: 24, height: 18, oneWay: true, invisible: true },
  ],

  lights: [
    { x: 355, y: FLOOR, colour: S.amber, radius: 30, radiusY: 8, strength: 0.3 }, // the fire under the pot
  ],

  lines: [
    // Bunting of rags strung across between the stalls.
    { from: { x: 60, y: 168 }, to: { x: 300, y: 176 }, colour: S.dim },
    { from: { x: 590, y: 170 }, to: { x: 880, y: 166 }, colour: S.dim },
  ],

  props: [
    // Shack fronts along the back.
    { sprite: P.shackFront(58, 52, 1), x: 4, y: FLOOR - 52 },
    { sprite: P.shackFront(70, 44, 2), x: 180, y: FLOOR - 44 },
    { sprite: P.shackFront(64, 56, 3), x: 380, y: FLOOR - 56 },
    { sprite: P.shackFront(54, 48, 4), x: 600, y: FLOOR - 48 },
    { sprite: P.shackFront(44, 60, 5), x: 720, y: FLOOR - 60 },
    { sprite: P.shackFront(60, 52, 6), x: 790, y: FLOOR - 52 },
    { sprite: P.shackFront(48, 46, 7), x: 852, y: FLOOR - 46 },
    // Stalls.
    { sprite: P.stall(54, 0, 'scrap'), x: 70, y: FLOOR - 46 },
    { sprite: P.stall(48, 3, 'scrap'), x: 132, y: FLOOR - 46 },
    { sprite: P.stall(62, 2, 'food'), x: 230, y: FLOOR - 46 },
    { sprite: P.crate(16, 10), x: 302, y: FLOOR - 10 },
    { sprite: P.SCALES, x: 300, y: FLOOR - 23 },
    { sprite: P.POT, x: 349, y: FLOOR - 16 },
    { sprite: P.PRICE_BOARD, x: 384, y: FLOOR - 22 },
    { sprite: P.crate(30, 20), x: 446, y: FLOOR - 20 },
    { sprite: P.crate(24, 18), x: 452, y: FLOOR - 38 },
    { sprite: casingPod(18), x: 482, y: FLOOR - 10 },
    // The gate through to the tally house.
    { sprite: P.gate(44, 50), x: 530, y: FLOOR - 50 },
    { sprite: P.stall(50, 1, 'pots'), x: 594, y: FLOOR - 46 },
    { sprite: P.stall(56, 4, 'scrap'), x: 656, y: FLOOR - 46 },
    { sprite: wireBundle(20), x: 714, y: FLOOR - 9 },
    // The alley to the scrap stacks, between two fronts.
    { sprite: P.stall(50, 2, 'food'), x: 824, y: FLOOR - 46 },
    // The fence's alcove, half hidden.
    { sprite: P.ALCOVE, x: 902, y: FLOOR - 50 },
    // The wall, and the gate out to the picked fields.
    { sprite: P.wall(90, 60), x: 952, y: FLOOR - 60 },
    { sprite: P.gate(46, 54), x: 1042, y: FLOOR - 54 },
    { sprite: P.wall(32, 60), x: 1088, y: FLOOR - 60 },
  ],

  features: [
    // Chapter 2, Day 3: the fence comes out to meet you on your way to the tally house.
    { type: 'trigger', x: 1000, y: FLOOR, reach: 40, knot: 'c2day3_fence', showIf: 'day3_yard', hideIf: 'fence_met' },
    // Chapter 2, Day 7: the mark on your door; on the way home that night, your own people waiting.
    { type: 'trigger', x: 70, y: FLOOR, reach: 40, knot: 'c2day7_door', showIf: 'door_marked', hideIf: 'door_seen' },
    { type: 'trigger', x: 430, y: FLOOR, reach: 30, knot: 'c2day7_ambush', showIf: 'ambush_night', hideIf: 'ambush_done' },
    // Day 8: back at midday, the yard full of what came of the drop.
    { type: 'trigger', x: 980, y: FLOOR, reach: 40, knot: 'c2day8_noon', showIf: 'noon8', hideIf: 'noon8_seen' },{ type: 'fire', x: 355, y: FLOOR - 1 }],
  people: [
    dogFollowing(1040, FLOOR),
    // Behind the stalls.
    local('scrap-trader', 7, 112, FLOOR, AWAKE, { flipX: true }),
    local('food-trader', 5, 244, FLOOR, AWAKE),
    // The fence, in the alcove.
    cast('fence', 950, FLOOR, { knot: 'swap_yard_fencer', when: AWAKE, flipX: true }),
    // Your brother and the kid, underfoot.
    cast('brother', 646, FLOOR, { knot: 'swap_yard_brother', when: ['afternoon'] }),
    cast('lookout', 626, FLOOR, { knot: 'swap_yard_lookout', when: ['afternoon'] }),
    // Your friend, on the way out to the fields.
    cast('scav_friend', 1010, FLOOR, { knot: 'swap_yard_friend', when: ['morning'], flipX: true, hideIf: 'noon8_seen' }),
    // Chapter 2, Day 7: the rat on your door, chalked while you're at the tally; your brother out scrubbing it (if he's still at home).
    { id: 'rat-mark', sprite: RAT_MARK, x: 46, y: FLOOR, showIf: 'door_marked', hideIf: 'mark_scrubbed' },
    { id: 'rat-smudge', sprite: RAT_SMUDGE, x: 46, y: FLOOR, showIf: 'mark_scrubbed' },
    cast('brother', 40, FLOOR, { id: 'brother-door', when: ['night'], showIf: 'brother_scrubbing' }),
    // The lost picker's sister (if you told the bar the sunk town), or the son back from the deep ground.
    local('sister', 9, 300, FLOOR, ['morning'], { showIf: 'sister_here', flipX: true }),
    cast('boss_son', 330, FLOOR, { id: 'son-yard', when: ['morning'], showIf: 'son_in_yard', flipX: true }),
    // Day 8, midday: your friend, come to warn you; the enforcer and two of the circle's men, coming for your shack.
    cast('scav_friend', 900, FLOOR, { id: 'friend-noon', when: ['morning'], showIf: 'noon8_seen' }),
    cast('enforcer', 556, FLOOR, { id: 'enforcer-yard', when: ['afternoon'], showIf: 'searchers_coming', hideIf: 'search_started' }),
    local('searcher-yard-1', 7, 576, FLOOR, ['afternoon'], { showIf: 'searchers_coming', hideIf: 'search_started' }),
    local('searcher-yard-2', 8, 592, FLOOR, ['afternoon'], { showIf: 'searchers_coming', hideIf: 'search_started' }),
    // The gambler, out of the den in daylight, looking for you (Day 7).
    cast('gambler', 620, FLOOR, { id: 'gambler-yard', when: ['morning'], showIf: 'gambler_in_yard', flipX: true }),
    // Pickers waiting between the stalls on the way home from the tally (Day 7).
    local('mob-1', 10, 300, FLOOR, LATE, { showIf: 'ambush_set' }),
    local('mob-2', 0, 340, FLOOR, LATE, { showIf: 'ambush_set', flipX: true }),
    local('mob-3', 11, 360, FLOOR, LATE, { showIf: 'ambush_set' }),
    // The crowd.
    stroller('swapper-1', 0, 150, 420, FLOOR, AWAKE),
    stroller('swapper-2', 3, 600, 900, FLOOR, AWAKE),
    stroller('swapper-3', 8, 480, 760, FLOOR, ['afternoon', 'evening']),
    local('haggler', 4, 290, FLOOR, DAY, { flipX: true }),
    local('picker', 10, 820, FLOOR, ['morning']),
  ],

  interactables: [
    { id: 'scrap-stall', x: 96, y: FLOOR, reach: 14, label: 'Look', knot: 'swap_yard_scrap' },
    { id: 'food-stall', x: 260, y: FLOOR, reach: 16, label: 'Trade', knot: 'swap_yard_food' },
    { id: 'scales', x: 310, y: FLOOR, reach: 8, label: 'Look', knot: 'swap_yard_scales' },
    { id: 'pot', x: 355, y: FLOOR, reach: 8, label: 'Look', knot: 'swap_yard_pot' },
    { id: 'prices', x: 399, y: FLOOR, reach: 10, label: 'Read', knot: 'swap_yard_prices' },
    { id: 'crates', x: 464, y: FLOOR - 38, reach: 12, label: 'Look', knot: 'swap_yard_view' },
    { id: 'fence', x: 922, y: FLOOR, reach: 14, label: 'Look', knot: 'swap_yard_fence' },
  ],

  exits: [
    { id: 'to-shack', x: 30, y: FLOOR, reach: 12, to: 'shack' },
    { id: 'to-tally-house', x: 552, y: FLOOR, reach: 14, to: 'tally-house' },
    { id: 'to-scrap-stacks', x: 776, y: FLOOR, reach: 10, to: 'scrap-stacks' },
    { id: 'to-picked-fields', x: 1065, y: FLOOR, reach: 16, to: 'picked-fields' },
  ],

  ambience: [
    { sound: 'crowd', volume: 0.35, when: ['morning', 'afternoon'] },
    { sound: 'chatter', volume: 0.4, when: ['morning', 'afternoon', 'evening'] },
    { sound: 'footfall', volume: 0.35, when: ['morning', 'afternoon'] },
    { sound: 'wind', volume: 0.2 },
  ],
};
