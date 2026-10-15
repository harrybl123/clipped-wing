import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition, Solid } from '../types';
import { cast, councillor, guard, inStory, strollingServant, MORNING } from './people';

// The council chamber (Chapter 3): politics, and empty seats (docs/areas/capital/council-chamber.md). Black
// marble veined with gold, lamps hanging low on long chains. Tiers
// of marble seats rising on both sides, each with a small gold light on its back, dark where nobody sits;
// your father's seat at the top of the right-hand tiers; in the middle, the table of light, the city drawn
// above it in blue, its districts lit or dark.

const W = 480;
const FLOOR = 236;
const TOP = 30;

/** Tiers of seats: steps of 8 rising towards each wall; seats stand on every other one. */
function tiers(): Solid[] {
  const left = [112, 96, 64, 48].map((w, i) => ({ x: 16, y: FLOOR - 8 * (i + 1), width: w, height: 8 * (i + 1), oneWay: true }));
  const right = [112, 96, 64, 48, 24, 16].map((w, i) => ({ x: W - 16 - w, y: FLOOR - 8 * (i + 1), width: w, height: 8 * (i + 1), oneWay: true }));
  return [...left, ...right];
}

/** Seats along a tier: whether each is taken (lit) or empty (dark). */
const seats = (xs: number[], y: number, taken: boolean[]) => xs.map((x, i) => ({ sprite: P.councilSeat(taken[i]!), x, y: y - 18 }));

export const councilChamber: AreaDefinition = {
  id: 'council-chamber',
  name: 'the council chamber',
  width: W,
  height: 270,
  walls: 'darkMarble',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.82,
  playerStart: { x: 160, y: FLOOR },
  surface: 'stone',
  acoustics: 'hall',
  ambience: [
    { sound: 'room', volume: 0.35 },
    { sound: 'hum', volume: 0.25 },
  ],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    ...tiers(),
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 240, y: 180, colour: S.cyan, radius: 90, radiusY: 50, strength: 0.25 }, // the table of light
    { x: 240, y: 130, colour: S.amber, radius: 60, radiusY: 20, strength: 0.2 }, // the hanging lamps
    { x: 440, y: 160, colour: S.amber, radius: 50, radiusY: 30, strength: 0.12 }, // your father's seat
  ],

  lines: [],

  props: [
    { sprite: P.doorway(26, 46), x: 147, y: FLOOR - 46 },
    // The left tiers: some seats empty.
    ...seats([84, 98], FLOOR - 16, [true, false]),
    ...seats([22, 36, 50], FLOOR - 32, [false, true, false]),
    // The right tiers, and your father's seat at the top.
    ...seats([370, 384], FLOOR - 16, [true, true]),
    ...seats([418, 432], FLOOR - 32, [false, true]),
    { sprite: P.HEIR_SEAT, x: 446, y: FLOOR - 48 - 32 },
  ],

  features: [
    // Day 2: coming in, your father sets out what's to be decided.
    { type: 'trigger', x: 172, y: FLOOR, reach: 14, knot: 'c3day2_council', showIf: 'c3day2=council', hideIf: 'council2' },
    { type: 'frames', frames: P.HOLO_FRAMES, x: 192, y: FLOOR - 66, every: 240 },
    // Lamps hanging low over the table on long chains.
    ...[206, 240, 274].map((x, i) => ({ type: 'swing' as const, sprite: P.PENDANT, x, y: 120 + (i === 1 ? -10 : 0), ropeTop: TOP, quiet: true, ropeColour: S.amberDeep })),
    { type: 'frames', frames: P.scrollingScreen(70, 40), x: 205, y: TOP + 12, every: 500 },
  ],
  people: [
    // The afternoon's session: your father at the top, the council on its tiers (some seats empty), the
    // reformer on his feet in the well.
    cast('father', 456, FLOOR - 48, { knot: 'council_father', when: ['afternoon'], flipX: true }),
    cast('councillor', 91, FLOOR - 16, { knot: 'council_councillor', when: ['afternoon'] }),
    cast('reformer', 250, FLOOR, { knot: 'council_reformer', when: ['afternoon'] }),
    councillor('member-1', 0, 43, FLOOR - 32, 'council_member', ['afternoon']),
    councillor('member-2', 1, 425, FLOOR - 32, 'council_member', ['afternoon'], { flipX: true }),
    councillor('member-3', 2, 377, FLOOR - 16, 'council_member', ['afternoon'], { flipX: true }),
    guard('door-guard', 2, 192, FLOOR, 'c3_guard', ['afternoon'], { flipX: true }),
    // Chapter 3's story. Day 2: the power (big choice 1). Your father at the top; the reformer in the well;
    // the old councillor in his seat, or, if you passed him over at the banquet, the hostess's cousin in
    // it; your hand by the door.
    inStory('father-4', 'father', 456, FLOOR - 48, 'c3day2=council', { knot: 'c3day2_father_council', flipX: true }),
    inStory('reformer-2', 'reformer', 268, FLOOR, 'c3day2=council', { knot: 'c3day2_reformer' }),
    inStory('councillor-2', 'councillor', 91, FLOOR - 16, 'c3day2=council', { knot: 'c3day2_councillor', hideIf: 'seated=hostess,merchant' }),
    inStory('cousin-2', 'cousin', 91, FLOOR - 16, 'c3day2=council', { knot: 'c3day2_cousin', hideIf: 'seated=councillor,' }),
    inStory('hand-4', 'diplomat', 182, FLOOR, 'c3day2=council', { knot: 'c3day2_hand_council', flipX: true }),
    // The morning: a page laying out the papers.
    strollingServant('page', 1, 180, 330, FLOOR, 'c3_page', MORNING),
  ],
  interactables: [
    { id: 'table', x: 222, y: FLOOR, reach: 14, label: 'Look', knot: 'council_table', hideIf: 'c3day4=afternoon' },
    // Day 4, the afternoon: the city on the table, and a crowd gathering on it.
    { id: 'table-4', x: 222, y: FLOOR, reach: 14, label: 'Look', knot: 'c3day4_table_light', showIf: 'c3day4=afternoon', hideIf: 'table4' },
    { id: 'empty-seat', x: 36, y: FLOOR - 32, reach: 14, label: 'Look', knot: 'council_empty_seat' },
    { id: 'top-seat', x: 456, y: FLOOR - 48, reach: 10, label: 'Look', knot: 'council_top_seat', hideIf: 'c3day2=council' }, // (not while he's in it)
  ],

  exits: [{ id: 'to-halls', x: 160, y: FLOOR, reach: 12, to: 'citadel-halls' }],
};
