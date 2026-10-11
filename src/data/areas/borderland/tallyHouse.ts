import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './tallyHouseProps';
import type { AreaDefinition, Solid } from '../types';
import { AWAKE, DAY, cast, local } from './people';

// The tally house (Chapter 2): where finds are weighed and taxed each evening, this chapter's version
// of Act 1's evening ceremony. A long, low hall inside the hull of something enormous: ribbed walls
// curving overhead, lamps hung over the scale. The queue's rail on the left; the tallyman's counter
// and the great scale in the middle; the slate of names and hauls; the clan's share piled behind a
// grille under a raised walkway, where the boss's people watch, with a door through to the compound.
// See docs/areas/borderland/tally-house.md. The tallyman, the queue and the watchers come with the cast.

const W = 720;
const FLOOR = 236;
const WALK = { x: 430, y: 156, end: 620 };

/** Stairs up to the walkway from the right, one-way blocks like Act 1's. */
function stairs(): Solid[] {
  const count = (FLOOR - WALK.y) / 8;
  return Array.from({ length: count - 1 }, (_, i) => {
    const top = FLOOR - 8 * (i + 1);
    const width = 8 * (count - 1 - i);
    return { x: WALK.end, y: top, width, height: FLOOR - top, oneWay: true };
  });
}

export const tallyHouse: AreaDefinition = {
  id: 'tally-house',
  name: 'the tally house',
  width: W,
  height: 270,
  walls: 'hull',
  cavity: { x: 16, y: 28, width: W - 32, height: FLOOR - 28, radius: 90 },
  ambient: 0.8,
  playerStart: { x: 50, y: FLOOR },
  surface: 'metal',
  acoustics: 'hall',

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: WALK.x, y: WALK.y, width: WALK.end - WALK.x, height: 5, oneWay: true },
    ...stairs(),
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 350, y: 120, colour: S.amber, radius: 90, radiusY: 70, strength: 0.34 }, // the lamps over the scale
    { x: 350, y: 220, colour: S.amber, radius: 70, radiusY: 30, strength: 0.2 },
    { x: 520, y: 210, colour: S.amber, radius: 50, radiusY: 26, strength: 0.16 }, // the share catching the light
    { x: 150, y: 170, colour: S.amber, radius: 60, radiusY: 50, strength: 0.1 },
  ],

  lines: [
    // The queue's rail.
    { from: { x: 66, y: FLOOR - 13 }, to: { x: 272, y: FLOOR - 13 }, colour: S.dim },
    // The lamps' cords.
    { from: { x: 333, y: 40 }, to: { x: 333, y: 100 }, colour: S.dim },
    { from: { x: 373, y: 34 }, to: { x: 373, y: 92 }, colour: S.dim },
    // The walkway's railing.
    { from: { x: WALK.x, y: WALK.y - 10 }, to: { x: WALK.end, y: WALK.y - 10 }, colour: S.dim },
    { from: { x: WALK.x, y: WALK.y - 5 }, to: { x: WALK.end, y: WALK.y - 5 }, colour: S.woodLight },
  ],

  props: [
    { sprite: P.HATCH, x: 18, y: FLOOR - 40 },
    ...[66, 134, 202, 270].map((x) => ({ sprite: P.POST, x, y: FLOOR - 14 })),
    { sprite: P.SLATE, x: 130, y: 140 },
    { sprite: P.counter(124), x: 290, y: FLOOR - 22 },
    { sprite: P.GREAT_SCALE, x: 320, y: FLOOR - 22 - 66 },
    { sprite: P.LAMP, x: 330, y: 100 },
    { sprite: P.LAMP, x: 370, y: 92 },
    { sprite: P.grille(150, 60), x: 452, y: FLOOR - 60 },
    { sprite: P.WALK_DOOR, x: 436, y: WALK.y - 32 },
    ...[WALK.x, 500, 560, WALK.end - 2].map((x) => ({ sprite: { rows: ['h', 'm', 'm', 'm', 'm', 'm', 'm', 'm', 'm', 'm'], colours: { h: S.light, m: S.dim } }, x, y: WALK.y - 10 })),
  ],

  features: [
    // Chapter 2, the night of the first raid (Day 6): walking into it.
    { type: 'trigger', x: 90, y: FLOOR, reach: 40, knot: 'c2day6_tally', showIf: 'raid_night', hideIf: 'raid_told' },
  ],
  people: [
    // The tallyman, behind the counter.
    cast('tallyman', 336, FLOOR, { knot: 'tally_house_tallyman', when: AWAKE, flipX: true }),
    // The queue.
    local('queuer-1', 1, 192, FLOOR, DAY),
    local('queuer-2', 10, 208, FLOOR, DAY),
    local('queuer-3', 4, 226, FLOOR, ['morning']),
    local('queuer-4', 11, 240, FLOOR, ['afternoon']),
    // One of the boss's people, watching the weighing.
    cast('enforcer', 452, FLOOR, { knot: 'tally_house_enforcer', when: ['afternoon'], flipX: true }),
    // Tribute night (Chapter 2, Day 1): the queue down the rail, the enforcer on the wall, the boss and the
    // watcher by the grille, watching.
    cast('enforcer', 300, FLOOR, { id: 'enforcer-tribute', when: ['evening'], showIf: 'tribute_night', flipX: true }),
    cast('boss', 500, FLOOR, { id: 'boss-tribute', when: ['evening'], showIf: 'tribute_night', flipX: true }),
    cast('watcher', 520, FLOOR, { id: 'watcher-tribute', when: ['evening'], showIf: 'tribute_night', flipX: true }),
    cast('old_scav', 70, FLOOR, { id: 'old-scav-tally', when: ['evening'], showIf: 'raid_night' }),
    // Chapter 2, Day 10, night: the whole settlement, packed in to see you sentenced. The boss at the counter; the
    // enforcer, the watcher; your brother at the boss's side (if he moved in); the son held by the door; your friend.
    ...[1, 4, 10, 6, 8, 2, 11, 3, 5, 7, 9, 0].map((look, i) => local(`brand-${i}`, look, 150 + i * 11, FLOOR, ['night'], { showIf: 'brand_night', flipX: i % 3 === 0 })),
    cast('boss', 330, FLOOR, { id: 'boss-brand', when: ['night'], showIf: 'brand_night', flipX: true }),
    cast('watcher', 362, FLOOR, { id: 'watcher-brand', when: ['night'], showIf: 'brand_night', flipX: true }),
    cast('brother', 348, FLOOR, { id: 'brother-brand', when: ['night'], showIf: 'brother_brand10', flipX: true }),
    cast('boss_son', 60, FLOOR, { id: 'son-brand', when: ['night'], showIf: 'brand_night' }),
    local('son-guard-1', 7, 48, FLOOR, ['night'], { showIf: 'brand_night' }),
    local('son-guard-2', 10, 74, FLOOR, ['night'], { showIf: 'brand_night', flipX: true }),
    cast('old_scav', 136, FLOOR, { id: 'old-scav-brand', when: ['night'], showIf: 'brand_night' }),
    cast('scav_friend', 180, FLOOR, { id: 'friend-brand', when: ['night'], showIf: 'friend_back10' }),
    local('tribute-1', 1, 196, FLOOR, ['evening'], { showIf: 'tribute_night' }),
    local('tribute-2', 4, 214, FLOOR, ['evening'], { showIf: 'tribute_night' }),
    local('tribute-3', 10, 232, FLOOR, ['evening'], { showIf: 'tribute_night' }),
    local('tribute-4', 6, 250, FLOOR, ['evening'], { showIf: 'tribute_night' }),
    local('tribute-5', 8, 268, FLOOR, ['evening'], { showIf: 'tribute_night' }),
    local('tribute-6', 2, 178, FLOOR, ['evening'], { showIf: 'tribute_night' }),
    local('tribute-7', 11, 160, FLOOR, ['evening'], { showIf: 'tribute_night', flipX: true }),
    local('tribute-8', 3, 142, FLOOR, ['evening'], { showIf: 'tribute_night' }),
    local('tribute-9', 5, 124, FLOOR, ['evening'], { showIf: 'tribute_night' }),
  ],

  interactables: [
    { id: 'queue', x: 170, y: FLOOR, reach: 30, label: 'Queue', knot: 'tally_house_queue' },
    { id: 'slate', x: 157, y: FLOOR, reach: 6, label: 'Read', knot: 'tally_house_slate' },
    { id: 'counter', x: 310, y: FLOOR, reach: 12, label: 'Look', knot: 'tally_house_counter' },
    { id: 'scale', x: 360, y: FLOOR, reach: 14, label: 'Look', knot: 'tally_house_scale' },
    { id: 'grille', x: 527, y: FLOOR, reach: 30, label: 'Look', knot: 'tally_house_share' },
    { id: 'walkway', x: 540, y: WALK.y, reach: 30, label: 'Look', knot: 'tally_house_walkway' },
  ],

  exits: [
    { id: 'to-swap-yard', x: 29, y: FLOOR, reach: 12, to: 'swap-yard' },
    { id: 'to-compound', x: 444, y: WALK.y, reach: 10, to: 'compound-house' }, // the walkway, into the boss's house upstairs
  ],

  ambience: [
    { sound: 'room', volume: 0.45 },
    { sound: 'chatter', volume: 0.25, when: ['evening'] }, // the queue, keeping its voice down
    { sound: 'footfall', volume: 0.2, when: ['evening'] },
  ],
};
