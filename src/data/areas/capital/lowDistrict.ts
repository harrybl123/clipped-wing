import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './cityProps';
import type { AreaDefinition, Solid } from '../types';
import { cast, citizen, guard, inStory, strollingCitizen, watch, AWAKE, DAY, LATE, MORNING } from './people';
import type { Person } from '../types';

// The low district (Chapter 3): cramped, at the bottom of the city (docs/areas/capital/low-district.md).
// Under a ceiling of cables slung between homes stacked and patched by hand; washing strung across, plants
// in pots, a cooking fire, steam; less power, so more amber from lamps and fires than blue, a dead screen.
// The towers and the citadel high above. Walkways along the stacks, stairs up to them. A low doorway at
// street level, steps going down into the dark: the way to the hideout. Where your hand takes you to see
// what's really going on (designer). The symbol chalked everywhere: the clipped wing over bare ground (designer).

const W = 960;
/** Chapter 3, Day 5's night below: the street's empty after the riot (and then raided). */
const NIGHT5 = 'c3day5=below,hideout,raid,hide,out,home';
const FLOOR = 236;
/** The walkways along the stacks: on the left, and on the right. */
const LEFT_WALK = 168;
const RIGHT_WALK = 150;

/** Stairs up to a walkway: from `foot` (where they start on the street), climbing towards `top` (where the walkway ends). */
function stairs(top: number, foot: number, level: number): Solid[] {
  const steps = (FLOOR - level) / 8;
  const dir = Math.sign(foot - top); // +1: the walkway is to the left, the stairs climb leftwards
  return Array.from({ length: steps - 1 }, (_, i) => {
    const y = FLOOR - 8 * (i + 1);
    const front = foot - dir * 8 * i; // this step's front edge
    const x = dir > 0 ? top : front;
    return { x, y, width: Math.abs(front - top), height: FLOOR - y, oneWay: true };
  });
}

export const lowDistrict: AreaDefinition = {
  id: 'low-district',
  name: 'the low district',
  width: W,
  height: 270,
  cavity: { x: 0, y: 0, width: W, height: 270, radius: 0 },
  outdoor: { horizon: 214, treeX: 60, treeScale: 0.16, backdrop: 'city', citadelX: 300, ground: 'street' },
  ambient: 1,
  playerStart: { x: 60, y: FLOOR },
  surface: 'stone',
  acoustics: 'street',
  ambience: [
    { sound: 'chatter', volume: 0.2 },
    { sound: 'hearth', volume: 0.2 },
    { sound: 'drips', volume: 0.2 },
  ],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 20, y: LEFT_WALK, width: 230, height: 6, oneWay: true },
    ...stairs(250, 314, LEFT_WALK),
    { x: 700, y: RIGHT_WALK, width: 240, height: 6, oneWay: true },
    ...stairs(700, 620, RIGHT_WALK),
    { x: 0, y: 0, width: 4, height: 270, invisible: true },
    { x: W - 4, y: 0, width: 4, height: 270, invisible: true },
  ],

  lights: [
    { x: 470, y: FLOOR, colour: S.amber, radius: 90, radiusY: 12, strength: 0.5 }, // the cooking fire
    { x: 140, y: LEFT_WALK, colour: S.amber, radius: 100, radiusY: 8, strength: 0.25 },
    { x: 820, y: RIGHT_WALK, colour: S.amber, radius: 100, radiusY: 8, strength: 0.25 },
  ],

  lines: [
    // The ceiling of cables, slung every way between the stacks.
    ...[[0, 30, 320, 52], [0, 60, 480, 40], [200, 20, 700, 46], [300, 70, 640, 30], [480, 36, 960, 64], [620, 18, 960, 40], [100, 90, 300, 74], [660, 84, 900, 96]].map(([x1, y1, x2, y2]) => ({ from: { x: x1!, y: y1! }, to: { x: x2!, y: y2! }, colour: S.deep })),
    { from: { x: 280, y: 50 }, to: { x: 680, y: 58 }, colour: S.cyanDeep },
    // The walkways' rails.
    { from: { x: 20, y: LEFT_WALK - 8 }, to: { x: 249, y: LEFT_WALK - 8 }, colour: S.woodPale },
    { from: { x: 700, y: RIGHT_WALK - 8 }, to: { x: 939, y: RIGHT_WALK - 8 }, colour: S.woodPale },
  ],

  props: [
    // The stacks, both sides: homes on homes over the walkways, shops along the street under them, right up
    // to the walkway (nothing floating, no gaps).
    { sprite: P.homes(250, LEFT_WALK - 20, 3), x: 16, y: 20 },
    { sprite: P.streetShop(62, 'noodles', 1, FLOOR - LEFT_WALK - 6), x: 18, y: LEFT_WALK + 6 },
    { sprite: P.streetShop(60, 'repairs', 2, FLOOR - LEFT_WALK - 6), x: 82, y: LEFT_WALK + 6 },
    { sprite: P.streetShop(58, 'cloth', 3, FLOOR - LEFT_WALK - 6), x: 144, y: LEFT_WALK + 6 },
    { sprite: P.homes(48, FLOOR - LEFT_WALK - 6, 8, { roof: false }), x: 202, y: LEFT_WALK + 6 },
    { sprite: P.homes(250, RIGHT_WALK - 10, 5), x: 700, y: 10 },
    { sprite: P.homes(150, FLOOR - RIGHT_WALK - 6, 6, { roof: false }), x: 704, y: RIGHT_WALK + 6 },
    { sprite: P.streetShop(82, 'grocer', 4, FLOOR - RIGHT_WALK - 6), x: 856, y: RIGHT_WALK + 6 },
    // Behind the street, between the stairs: more homes, further back (darker), so it's cramped; the towers
    // only over the rooftops. At the street, homes and two shops.
    { sprite: P.homes(304, FLOOR - 56 - 100, 7, { back: true }), x: 316, y: 100 },
    { sprite: P.homes(102, 56, 9, { roof: false }), x: 316, y: FLOOR - 56 },
    { sprite: P.streetShop(66, 'grocer', 5), x: 418, y: FLOOR - 56 },
    { sprite: P.streetShop(58, 'lamps', 6), x: 504, y: FLOOR - 56 },
    { sprite: P.homes(58, 56, 10, { roof: false }), x: 562, y: FLOOR - 56 },
    // Washing strung across the street and along the left walkway; plants by a door.
    { sprite: P.washing(150), x: 270, y: 90 },
    { sprite: P.washing(90), x: 40, y: LEFT_WALK - 26 },
    { sprite: P.POTS, x: 200, y: LEFT_WALK - 14 },
    { sprite: P.cableBundle(FLOOR - 20), x: 690, y: 20 },
    // The cooking stall and a vent steaming.
    { sprite: P.FOOD_STALL, x: 372, y: FLOOR - 40 },
    { sprite: P.VENT, x: 330, y: FLOOR - 8 },
    // The symbol, chalked on the walls (one half scrubbed off).
    { sprite: P.symbolMark('chalk'), x: 340, y: 116 },
    { sprite: P.symbolMark('chalk'), x: 580, y: 124 },
    { sprite: P.symbolMark('scrubbed'), x: 214, y: 192 },
    // The way down to the hideout.
    { sprite: P.CELLAR_DOOR, x: 586, y: FLOOR - 34 },
  ],

  features: [
    { type: 'rain' },
    { type: 'fire', x: 470, y: FLOOR - 1 },
    { type: 'smoke', x: 470, y: FLOOR - 10, top: 60 },
    { type: 'smoke', x: 386, y: FLOOR - 22, top: 90 },
    { type: 'smoke', x: 335, y: FLOOR - 8, top: 120 },
    { type: 'frames', frames: P.signFrames(24, 10, 21), x: 120, y: LEFT_WALK + 20, every: 330 },
    // The woman's street's lift (Day 1's petition), up the stack from the right walkway: running if you had it
    // mended (and stopped dead when the power's cut), broken if not.
    { type: 'frames', frames: P.STREET_LIFT_RUNNING, x: 752, y: RIGHT_WALK - 110, every: 260, showIf: 'lift_mended' },
    { type: 'frames', frames: P.STREET_LIFT_BROKEN, x: 752, y: RIGHT_WALK - 110, every: 1000, showIf: 'lift_mended', power: 'without' },
    { type: 'frames', frames: P.STREET_LIFT_BROKEN, x: 752, y: RIGHT_WALK - 110, every: 1000, showIf: 'lift_mended=false', power: 'any' },
    // Day 2, below at night with your hand: coming in.
    { type: 'trigger', x: 60, y: FLOOR, reach: 16, knot: 'c3day2_dark_low', showIf: 'c3day2=below', hideIf: 'dark_seen2' },
    // Day 3 on: the reward notice on the screens (your father's: kept lit where the power's cut, the only light
    // in the street), under the wing chalked on the wall, and along by the walkway's stairs.
    { type: 'frames', frames: P.REWARD_FRAMES, x: 328, y: 146, every: 260, showIf: 'rewards', power: 'any' },
    { type: 'frames', frames: P.REWARD_FRAMES, x: 772, y: 170, every: 260, showIf: 'rewards', power: 'any' },
    // Day 3, below at night: coming in, the watch take a man on the word of his neighbour; then your hand goes
    // on ahead to the hideout, openly (they know him), and you follow without being seen by anyone who'd
    // report a face (designer: informants, not your own guards): a man walking the street, and an old woman
    // on her step who looks back up the street every so often (seen by her, you only go back as far as the
    // lamp shop). Dark doorways to stand in. (Designer: it was too hard; it's gentler now.)
    { type: 'trigger', x: 60, y: FLOOR, reach: 16, knot: 'c3day3_low', showIf: 'c3day3=below', hideIf: 'low3' },
    { type: 'watch', id: 'informant-1', who: 'capital-citizen-12', from: 150, to: 420, y: FLOOR, speed: 18, range: 64, pause: 2000, reset: { x: 56, y: FLOOR }, showIf: 'c3day3=sneak', call: 'Highness...?' },
    { type: 'watch', id: 'informant-2', who: 'capital-citizen-3', from: 664, to: 664, y: FLOOR, speed: 0, range: 50, face: 1, glance: { every: 5200, for: 1800, range: 96 }, reset: { x: 530, y: FLOOR }, showIf: 'c3day3=sneak', call: 'Highness...?' },
    // Back up out of the hideout: your hand, waiting by the door, has something to say.
    { type: 'trigger', x: 601, y: FLOOR, reach: 16, knot: 'c3day3_outside', showIf: 'c3day3=home', hideIf: 'outside3' },
    { type: 'shadow', x: 204, y: FLOOR, width: 24, showIf: 'c3day3=sneak' },
    { type: 'shadow', x: 316, y: FLOOR, width: 24, showIf: 'c3day3=sneak' },
    { type: 'shadow', x: 504, y: FLOOR, width: 24, showIf: 'c3day3=sneak' },
    // Day 4, the riot (if the low district rose): the barricade burning across the street.
    { type: 'fire', x: 912, y: FLOOR - 1, showIf: 'c3day4=square' },
    { type: 'fire', x: 944, y: FLOOR - 1, showIf: 'c3day4=square' },
    { type: 'smoke', x: 928, y: FLOOR - 12, top: 30, showIf: 'c3day4=square' },
    // Day 5 on: the word on the screens, and your father's hand on your shoulder (the face of the man you let go).
    ...P.terrorScreens(320, 146),
    ...P.terrorScreens(764, 170),
    // Day 5, below at night: coming in, nobody out; then the raid. If you went out the back way, you come out
    // at the far end of the street: one of the guard walks it with his lamp up, another on the cellar door
    // (looking up the street, the way they'll take them), and you get to a dark doorway across from it to
    // watch, unseen. Back up out of the cellar (if you stepped in), your hand.
    { type: 'trigger', x: 60, y: FLOOR, reach: 16, knot: 'c3day5_low', showIf: 'c3day5=below', hideIf: 'low5' },
    { type: 'watch', id: 'watch-5', who: 'capital-guard-0', from: 700, to: 880, y: FLOOR, speed: 20, range: 60, pause: 1800, reset: { x: 910, y: FLOOR }, showIf: 'c3day5=hide', call: 'Who\'s there?' },
    { type: 'shadow', x: 754, y: FLOOR, width: 22, showIf: 'c3day5=hide' },
    { type: 'shadow', x: 836, y: FLOOR, width: 22, showIf: 'c3day5=hide' },
    { type: 'shadow', x: 660, y: FLOOR, width: 26, showIf: 'c3day5=hide' },
    { type: 'trigger', x: 601, y: FLOOR, reach: 16, knot: 'c3day5_after', showIf: 'c3day5=out', hideIf: 'after5' },
  ],
  people: [
    // The street: the cook at the stall, the repairer outside his shop, the grocer's girl; people about.
    citizen('cook', 10, 392, FLOOR, 'low_cook', AWAKE, { flipX: true }),
    citizen('repairer', 1, 112, FLOOR, 'low_repairer', AWAKE),
    citizen('grocer', 13, 880, FLOOR, 'low_grocer', DAY, { flipX: true }),
    strollingCitizen('mechanic', 7, 420, 680, FLOOR, 'low_folk', DAY, { hideIf: 'c3day5=speech' }),
    strollingCitizen('walker', 5, 260, 560, FLOOR, 'low_folk', MORNING, { hideIf: 'c3day5=speech' }),
    // Day 5, the address (a cutaway): the whole street stopped under its screen.
    ...([[306, 2], [322, 12], [338, 4], [362, 9], [378, 0], [400, 11]] as const).map(([x, look], i) =>
      citizen(`low-5${'abcdef'[i]}`, look, x, FLOOR, 'c3day5_watching', undefined, { showIf: 'c3day5=speech', flipX: x > 351 })),
    strollingCitizen('kids', 6, 330, 520, FLOOR, 'c3_kid', ['afternoon']),
    // Up on the walkways: an old woman by her door, neighbours.
    citizen('old-woman', 3, 120, LEFT_WALK, 'c3_old', ['afternoon', 'evening']),
    citizen('neighbour', 12, 770, RIGHT_WALK, 'low_folk', DAY, { flipX: true }),
    citizen('hooded-1', 9, 820, RIGHT_WALK, 'low_night', LATE, { hideIf: ['c3day3=below,sneak,hideout,home', 'c3day4=square', NIGHT5] }),
    // The evening and the night: round the fire, out in the rain; the watch, watching. (Not Day 3's night:
    // the street's empty but for whoever's watching it.)
    citizen('by-fire-1', 4, 456, FLOOR, 'low_fire', LATE, { hideIf: ['c3day3=below,sneak,hideout,home', 'c3day4=square', NIGHT5] }),
    citizen('by-fire-2', 11, 486, FLOOR, 'low_fire', ['night'], { flipX: true, hideIf: ['c3day3=below,sneak,hideout,home', 'c3day4=square', NIGHT5] }),
    strollingCitizen('young', 0, 300, 640, FLOOR, 'low_night', LATE, { hideIf: ['c3day3=below,sneak,hideout,home', 'c3day4=square', NIGHT5] }),
    strollingCitizen('hooded-2', 2, 640, 900, FLOOR, 'low_night', ['night'], { hideIf: ['c3day3=below,sneak,hideout,home', 'c3day4=square', NIGHT5] }),
    watch('watch', 1, 530, FLOOR, 'low_watch', ['evening'], { flipX: true, hideIf: 'c3day4=square' }),
    // The kid who chalks the symbol.
    cast('painter', 300, FLOOR, { knot: 'low_painter', when: ['afternoon', 'evening'] }),
    cast('painter', 566, FLOOR, { id: 'painter-night', knot: 'low_painter_night', when: ['night'] }), // out chalking
    // Chapter 3's story. Day 2, below at night (if the low district went without): people who know you,
    // and want to tell you; the painter chalking by a dead lamp; and either way, the woman at her street's
    // lift up on the right walkway. Your hand with you.
    citizen('cold-2', 4, 430, FLOOR, 'c3day2_cold', undefined, { showIf: 'c3day2=below', hideIf: 'energy=people' }),
    citizen('stairs-2', 3, 276, FLOOR, 'c3day2_stairs', undefined, { showIf: 'c3day2=below', hideIf: 'energy=people', flipX: true }),
    citizen('food-2', 10, 700, FLOOR, 'c3day2_food', undefined, { showIf: 'c3day2=below', hideIf: 'energy=people' }),
    inStory('painter-2', 'painter', 520, FLOOR, 'c3day2=below', { knot: 'c3day2_painter', hideIf: 'energy=people' }),
    inStory('woman-2', 'petitioner', 790, RIGHT_WALK, 'c3day2=below', { knot: 'c3day2_woman', flipX: true }),
    // (If you gave them the power: the street out in the light, glad of it, and they know whose it was.)
    citizen('glad-1', 12, 300, FLOOR, 'c3day2_glad', undefined, { showIf: 'c3day2=below', hideIf: 'energy=high' }),
    strollingCitizen('glad-kids', 6, 330, 520, FLOOR, 'c3day2_glad', undefined, { showIf: 'c3day2=below', hideIf: 'energy=high' }),
    citizen('glad-2', 5, 716, FLOOR, 'c3day2_glad', undefined, { showIf: 'c3day2=below', hideIf: 'energy=high', flipX: true }),
    inStory('hand', 'diplomat', 40, FLOOR, 'hand_with_you', { follow: true, knot: 'c3day1_hand_walk' }),
    // Day 3, below at night: the man on his step (the painter's brother), the neighbour who points him out,
    // and the watch who take him (the story brings them on).
    inStory('brother-3', 'painter_brother', 400, FLOOR, 'c3day3=below'),
    citizen('informer', 10, 444, FLOOR, 'low_night', undefined, { showIf: 'c3day3=below', hidden: true, flipX: true }),
    watch('watch-3a', 0, 930, FLOOR, 'low_watch', undefined, { showIf: 'c3day3=below', hidden: true, flipX: true }),
    watch('watch-3b', 1, 950, FLOOR, 'low_watch', undefined, { showIf: 'c3day3=below', hidden: true, flipX: true }),
    // Day 4, the square after the fight (if the low district rose): your hand beside you; the captain; the
    // painter's brother held down by two of the guard; the guard's line of pikes across the street, the crowd
    // held back behind it, the barricade burning (the story shows the leader and the captain).
    ...riotSquare('painter_brother', 'riot_leader=reformer'),
    // Day 5, the raid, from the dark: the guard on the cellar door; the people they bring up, each with one of
    // the guard, the kid last, between two (the story brings them up and walks them off towards the lifts);
    // your hand, after.
    guard('door-5', 1, 610, FLOOR, 'c3_guard', undefined, { showIf: 'c3day5=hide,out', flipX: true, knot: undefined }),
    citizen('taken-1', 12, 594, FLOOR, 'c3day5_crowd', undefined, { showIf: 'c3day5=hide', hidden: true, flipX: true, knot: undefined }),
    citizen('taken-2', 5, 594, FLOOR, 'c3day5_crowd', undefined, { showIf: 'c3day5=hide', hidden: true, flipX: true, knot: undefined }),
    inStory('painter-5t', 'painter', 594, FLOOR, 'c3day5=hide', { hidden: true, flipX: true, knot: undefined }),
    guard('escort-5a', 0, 580, FLOOR, 'c3_guard', undefined, { showIf: 'c3day5=hide', hidden: true, flipX: true, knot: undefined }),
    guard('escort-5b', 0, 608, FLOOR, 'c3_guard', undefined, { showIf: 'c3day5=hide', hidden: true, flipX: true, knot: undefined }),
    inStory('hand-5w', 'diplomat', 620, FLOOR, 'c3day5=out,home', { hidden: true }),
  ],
  interactables: [
    { id: 'mark', x: 350, y: FLOOR, reach: 10, label: 'Look', knot: 'low_mark', hideIf: 'c3day5=speech' },
    { id: 'scrubbed', x: 226, y: FLOOR, reach: 10, label: 'Look', knot: 'low_scrubbed' },
    { id: 'homes', x: 660, y: FLOOR, reach: 14, label: 'Look', knot: 'low_homes' },
    { id: 'washing', x: 140, y: LEFT_WALK, reach: 14, label: 'Look', knot: 'low_washing' },
    { id: 'noodles', x: 48, y: FLOOR, reach: 14, label: 'Look', knot: 'low_noodles' },
    // Day 5, out the back way: the dark doorway across from the cellar, to watch from.
    { id: 'doorway-5', x: 673, y: FLOOR, reach: 10, label: 'Hide', knot: 'c3day5_watch', showIf: 'c3day5=hide' },
  ],

  exits: [
    { id: 'to-lifts', x: 24, y: FLOOR, reach: 14, to: 'lifts' },
    { id: 'to-hideout', x: 601, y: FLOOR, reach: 12, to: 'hideout' },
    { id: 'to-promenade', x: 940, y: FLOOR, reach: 14, to: 'promenade' },
  ],
};

/**
 * The square at the end of the riot (Chapter 3, Day 4), in whichever district rose (`hideIf`: the other
 * leader): you come out of the fight at x 720.
 */
export function riotSquare(leader: 'painter_brother' | 'reformer', hideIf: string, y = FLOOR): Person[] {
  const at = (p: Person): Person => ({ ...p, hideIf });
  const show = 'c3day4=square';
  return [
    inStory('hand-4q', 'diplomat', 700, y, show, { hideIf }),
    inStory('captain-4q', 'captain', 744, y, show, { hidden: true, hideIf, flipX: true }),
    inStory('leader-4', leader, 792, y, show, { hidden: true, hideIf, flipX: true }),
    at(guard('guard-4a', 0, 776, y, 'c3_guard', undefined, { showIf: show })),
    at(guard('guard-4b', 1, 808, y, 'c3_guard', undefined, { showIf: show, flipX: true })),
    ...[832, 848, 864, 880].map((x, i) => at(guard(`line-4${i}`, i % 2, x, y, 'c3_guard', undefined, { showIf: show }))),
    ...[[900, 4], [912, 9], [922, 2], [934, 11], [944, 7], [954, 0]].map(([x, look], i) =>
      at(citizen(`crowd-4${'abcdef'[i]}`, look!, x!, y, 'c3day4_crowd', undefined, { showIf: show, flipX: true }))),
  ];
}
