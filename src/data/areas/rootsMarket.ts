import { VILLAGERS } from '../../ui/characters';
import { SHADES as S } from '../../ui/pixelArt';
import { FUNGI, LAMP } from '../../ui/sprites';
import { post } from './homeProps';
import { ARCHWAY } from './offeringFloorProps';
import * as P from './rootsMarketProps';
import type { AreaDefinition, Person, Solid } from './types';

// The roots market: rations, gossip and trading. Working-class and energetic, with colour from
// awnings, cloth and bunting against the wood, and a little scavenged tech on the curiosities
// stall. Ground floor: food and fungi stalls, the ration hatch with its queue, a cloth stall.
// A balcony up some steps: curiosities and tools. Busy in the morning and afternoon, quieter in
// the evening (people are at the ceremony), empty at night. See docs/areas/roots-market.md.

const FLOOR = 236;
const BALCONY = { x: 256, y: 172, width: 208 };
const TRADING: Person['when'] = ['morning', 'afternoon'];
const OPEN: Person['when'] = ['morning', 'afternoon', 'evening'];

/** Steps up to the balcony from the left: one-way blocks the player walks up. */
function steps(): Solid[] {
  const out: Solid[] = [];
  const count = (FLOOR - BALCONY.y) / 8;
  for (let i = 0; i < count - 1; i++) {
    const top = FLOOR - 8 * (i + 1);
    const x = BALCONY.x - 8 * (count - 1 - i);
    out.push({ x, y: top, width: BALCONY.x - x, height: FLOOR - top, oneWay: true });
  }
  return out;
}

/** A villager standing still. */
const standing = (id: string, look: number, x: number, y: number, extra: Partial<Person> = {}): Person => ({
  id,
  sprite: VILLAGERS[look]!.idle[0]!,
  idleFrames: VILLAGERS[look]!.idle,
  x,
  y,
  ...extra,
});

/** A villager walking back and forth. */
const wandering = (id: string, look: number, from: number, to: number, y: number, when: Person['when']): Person => ({
  id,
  sprite: VILLAGERS[look]!.idle[0]!,
  idleFrames: VILLAGERS[look]!.idle,
  walkFrames: VILLAGERS[look]!.walk,
  x: from + Math.round((to - from) / 3),
  y,
  wander: { from, to },
  when,
});

export const rootsMarket: AreaDefinition = {
  id: 'roots-market',
  name: 'the roots market',
  width: 480,
  height: 270,
  cavity: { x: 12, y: 12, width: 456, height: FLOOR - 12, radius: 30 },
  ambient: 0.85,
  playerStart: { x: 172, y: FLOOR },

  solids: [
    { x: 0, y: FLOOR, width: 480, height: 270 - FLOOR },
    ...steps(),
    { x: BALCONY.x, y: BALCONY.y, width: BALCONY.width, height: 8, oneWay: true },
    { x: 0, y: 0, width: 12, height: 270, invisible: true },
    { x: 468, y: 0, width: 12, height: 270, invisible: true },
  ],

  lights: [
    { x: 100, y: 226, colour: S.amber, radius: 30, radiusY: 24, strength: 0.4 }, // food stall brazier
    { x: 70, y: 74, colour: S.amber, radius: 30, strength: 0.28 }, // lanterns
    { x: 184, y: 54, colour: S.amber, radius: 30, strength: 0.28 },
    { x: 400, y: 64, colour: S.amber, radius: 30, strength: 0.28 },
    { x: 240, y: 62, colour: S.cyan, radius: 22, strength: 0.28 }, // light-cell lantern
    { x: 322, y: 154, colour: S.cyan, radius: 20, strength: 0.3 }, // curiosities stall
    { x: 128, y: 216, colour: S.green, radius: 18, strength: 0.3 }, // fungus jars
    { x: 20, y: 232, colour: S.green, radius: 12, radiusY: 8, strength: 0.25 }, // fungi by the doorway
    ...[[45, 101], [117, 97], [219, 109], [305, 117], [357, 101], [451, 93]].map(([x, y]) => ({ x: x!, y: y!, colour: S.amber, radius: 14, strength: 0.22 })), // lit windows
  ],

  lines: [
    { from: { x: 70, y: 12 }, to: { x: 70, y: 69 }, colour: S.deep }, // lantern cords
    { from: { x: 184, y: 12 }, to: { x: 184, y: 49 }, colour: S.deep },
    { from: { x: 400, y: 12 }, to: { x: 400, y: 59 }, colour: S.deep },
    { from: { x: 240, y: 12 }, to: { x: 240, y: 58 }, colour: S.deep },
    { from: { x: 160, y: 12 }, to: { x: 160, y: 18 }, colour: S.dim }, // dried roots
    { from: { x: 166, y: 12 }, to: { x: 166, y: 22 }, colour: S.dim },
  ],

  props: [
    // Bunting across the top.
    { sprite: P.bunting(420, 10), x: 30, y: 22 },
    { sprite: P.bunting(300, 8), x: 96, y: 40 },
    { sprite: P.DRIED_ROOTS, x: 159, y: 18 },
    { sprite: P.DRIED_ROOTS, x: 165, y: 22 },
    { sprite: LAMP, x: 69, y: 69 },
    { sprite: LAMP, x: 183, y: 49 },
    { sprite: LAMP, x: 399, y: 59 },
    { sprite: P.CELL_LANTERN, x: 239, y: 58 },
    // Homes carved into the wall above the market: windows, some lit.
    ...[[40, 96, true], [78, 118, false], [112, 92, true], [214, 104, true], [262, 90, false], [300, 112, true], [352, 96, true], [418, 110, false], [446, 88, true]].map(
      ([x, y, lit]) => ({ sprite: P.wallWindow(lit as boolean), x: x as number, y: y as number }),
    ),
    // Doorways.
    { sprite: ARCHWAY, x: 16, y: FLOOR - 38 },
    { sprite: ARCHWAY, x: 442, y: FLOOR - 38 },
    { sprite: FUNGI.cluster, x: 36, y: FLOOR - 7 },
    // Food stall, with a brazier beside it.
    { sprite: P.stall(46, S.amber, S.amberDeep), x: 44, y: FLOOR - 34 },
    { sprite: P.SIGN_FOOD, x: 50, y: FLOOR - 25 },
    { sprite: P.COOK_POT, x: 58, y: FLOOR - 17 },
    { sprite: P.PRODUCE, x: 74, y: FLOOR - 16 },
    // Fungi stall.
    { sprite: P.stall(44, S.greenMid, S.woodPale), x: 106, y: FLOOR - 34 },
    { sprite: P.SIGN_FUNGUS, x: 134, y: FLOOR - 25 },
    { sprite: P.FUNGUS_JARS, x: 114, y: FLOOR - 17 },
    // Under the balcony: posts, the ration hatch, sacks and crates.
    { sprite: post(56), x: 258, y: BALCONY.y + 8 },
    { sprite: post(56), x: 400, y: BALCONY.y + 8 },
    { sprite: P.RATION_HATCH, x: 290, y: FLOOR - 40 },
    { sprite: P.SACK, x: 322, y: FLOOR - 6 },
    { sprite: P.CRATE, x: 380, y: FLOOR - 8 },
    { sprite: P.SACK, x: 391, y: FLOOR - 6 },
    // Cloth stall.
    { sprite: P.stall(44, S.cyanMid, S.woodPale), x: 330, y: FLOOR - 34 },
    { sprite: P.HANGING_CLOTH, x: 334, y: FLOOR - 27 },
    { sprite: P.HANGING_CLOTH, x: 365, y: FLOOR - 27 },
    { sprite: P.CLOTH_BOLTS, x: 344, y: FLOOR - 16 },
    // Balcony: curiosities (scavenged tech) and tools.
    { sprite: P.stall(44, S.cyanDeep, S.cyanMid), x: 300, y: BALCONY.y - 34 },
    { sprite: P.CURIO_SCREEN, x: 312, y: BALCONY.y - 19 },
    { sprite: P.CURIO_BITS, x: 328, y: BALCONY.y - 15 },
    { sprite: P.stall(40, S.woodPale, S.woodLight), x: 372, y: BALCONY.y - 34 },
    { sprite: P.TOOLS, x: 384, y: BALCONY.y - 16 },
  ],

  features: [
    { type: 'fire', x: 100, y: FLOOR - 1 },
    { type: 'swing', sprite: P.HAUL_BASKET, x: 150, y: 128, ropeTop: 12 },
    { type: 'swing', sprite: P.HAUL_BASKET, x: 280, y: 60, ropeTop: 12 },
  ],

  people: [
    // Stallholders.
    standing('food-seller', 3, 66, FLOOR, { knot: 'market_food_seller', when: OPEN }),
    standing('fungus-seller', 0, 128, FLOOR, { knot: 'market_fungus_seller', when: OPEN }),
    standing('cloth-seller', 1, 352, FLOOR, { knot: 'market_cloth_seller', when: TRADING }),
    standing('curio-seller', 5, 322, BALCONY.y, { knot: 'market_curio_seller', when: TRADING }),
    standing('tools-seller', 4, 392, BALCONY.y, { when: TRADING, flipX: true }),
    // The ration queue.
    standing('grumbler', 2, 270, FLOOR, { knot: 'market_grumbler', when: TRADING }),
    standing('queue-2', 6, 282, FLOOR, { when: TRADING }),
    standing('queue-1', 3, 296, FLOOR, { when: TRADING }),
    // People browsing.
    wandering('browser-1', 1, 150, 186, FLOOR, TRADING),
    wandering('browser-2', 5, 312, 430, FLOOR, TRADING),
    wandering('browser-3', 0, 270, 440, BALCONY.y, TRADING),
    wandering('evening-walker', 4, 60, 420, FLOOR, ['evening']),
  ],

  interactables: [{ id: 'ration-hatch', x: 310, y: FLOOR, reach: 7, label: 'Look', knot: 'market_ration_hatch' }],

  exits: [
    { id: 'to-offering-floor', x: 27, y: FLOOR, reach: 12, to: 'offering-floor' },
    { id: 'to-friends-home', x: 453, y: FLOOR, reach: 12, to: 'friends-home' },
  ],
};
