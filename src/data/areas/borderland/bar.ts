import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './barProps';
import { roof } from './shackProps';
import type { AreaDefinition, Solid } from '../types';
import { LATE, OPEN_LATE, cast, local, stroller } from './people';

// The bar (Chapter 2): where crews gather; gossip and suspicion spread here, and it's where you hear
// what the town thinks of you. Warm, smoky and loud. Ground floor: the music corner, crew tables with
// their marks scratched in, and the counter, one curved panel with no joins, bottles of odd glass behind
// it, lamps glowing amber through old cyan glass. Up the stairs, a gallery of booths behind curtains
// where quieter deals happen. Doors: out to the lane (the compound's way), down to the gambling den,
// through to the brothel. See docs/areas/borderland/bar.md. The barkeep and the crews come with the cast.

const W = 600;
const FLOOR = 236;
const GALLERY = { x: 300, y: 156, end: 584 };

/** Stairs up to the gallery's left end. */
function stairs(): Solid[] {
  const count = (FLOOR - GALLERY.y) / 8;
  return Array.from({ length: count - 1 }, (_, i) => {
    const top = FLOOR - 8 * (i + 1);
    const x = GALLERY.x - 8 * (count - 1 - i);
    return { x, y: top, width: GALLERY.x - x, height: FLOOR - top, oneWay: true };
  });
}

export const bar: AreaDefinition = {
  id: 'bar',
  name: 'the bar',
  width: W,
  height: 270,
  walls: 'scrap',
  cavity: { x: 16, y: 76, width: W - 32, height: FLOOR - 76, radius: 4 },
  ambient: 0.9,
  playerStart: { x: 44, y: FLOOR },
  surface: 'plank',
  acoustics: 'small',

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: GALLERY.x, y: GALLERY.y, width: GALLERY.end - GALLERY.x, height: 6, oneWay: true },
    ...stairs(),
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 300, y: 170, colour: S.amber, radius: 300, radiusY: 90, strength: 0.14 }, // the whole room, warm with lamps and smoke
    { x: 420, y: 196, colour: S.amber, radius: 90, radiusY: 46, strength: 0.42 }, // over the counter
    { x: 160, y: 200, colour: S.amber, radius: 80, radiusY: 50, strength: 0.28 }, // the tables
    { x: 64, y: 196, colour: S.amber, radius: 40, radiusY: 34, strength: 0.2 }, // the music corner
    { x: 440, y: 120, colour: S.amber, radius: 120, radiusY: 34, strength: 0.16 }, // the booths
    { x: 420, y: 180, colour: S.cyan, radius: 60, radiusY: 30, strength: 0.06 }, // the old glass
  ],

  lines: [
    { from: { x: 120, y: 76 }, to: { x: 120, y: 160 }, colour: S.dim },
    { from: { x: 210, y: 76 }, to: { x: 210, y: 166 }, colour: S.dim },
    // The gallery's railing.
    { from: { x: GALLERY.x, y: GALLERY.y - 9 }, to: { x: GALLERY.end, y: GALLERY.y - 9 }, colour: S.dim },
  ],

  props: [
    { sprite: roof(W - 8, 12), x: 4, y: 76 - 16 },
    { sprite: P.DOOR, x: 18, y: FLOOR - 36 },
    { sprite: P.STAGE, x: 42, y: FLOOR - 34 },
    { sprite: P.banner(40, 'a'), x: 96, y: 96 },
    { sprite: P.banner(34, 'G'), x: 150, y: 100 },
    { sprite: P.banner(44, 'e'), x: 250, y: 90 },
    { sprite: P.OIL_LAMP, x: 116, y: 160 },
    { sprite: P.OIL_LAMP, x: 206, y: 166 },
    { sprite: P.table(34, 1), x: 96, y: FLOOR - 18 },
    { sprite: P.STOOL, x: 88, y: FLOOR - 7 },
    { sprite: P.STOOL, x: 126, y: FLOOR - 7 },
    { sprite: P.table(36, 2), x: 160, y: FLOOR - 18 },
    { sprite: P.STOOL, x: 152, y: FLOOR - 7 },
    { sprite: P.STOOL, x: 194, y: FLOOR - 7 },
    // The counter and the bottles.
    { sprite: P.bottles(80), x: 374, y: 172 },
    { sprite: P.OIL_LAMP, x: 396, y: 168 },
    { sprite: P.OIL_LAMP, x: 456, y: 168 },
    { sprite: P.barCounter(150), x: 344, y: FLOOR - 26 },
    { sprite: P.STOOL, x: 352, y: FLOOR - 7 },
    { sprite: P.STOOL, x: 380, y: FLOOR - 7 },
    { sprite: P.STOOL, x: 424, y: FLOOR - 7 },
    { sprite: P.DEN_STAIRS, x: 538, y: FLOOR - 36 },
    // The gallery: booths behind curtains, the door through to the brothel.
    { sprite: P.booth(54, 1), x: 316, y: GALLERY.y - 34 },
    { sprite: P.booth(54, 2), x: 380, y: GALLERY.y - 34 },
    { sprite: P.booth(54, 3), x: 444, y: GALLERY.y - 34 },
    { sprite: P.CLOTH_DOOR, x: 556, y: GALLERY.y - 32 },
  ],

  features: [
    // Chapter 2, Day 4: walking in on the circle's night.
    { type: 'trigger', x: 60, y: FLOOR, reach: 40, knot: 'c2day4_bar_arrive', showIf: 'circle_night', hideIf: 'bar_arrived' },
    // Day 5: board night.
    { type: 'trigger', x: 60, y: FLOOR, reach: 40, knot: 'c2day5_bar_arrive', showIf: 'board_night5' },
    { type: 'motes', x: 230, top: 60, bottom: 220, halfWidth: 180 }, // smoke drifting up
  ],
  people: [
    cast('barkeep', 444, FLOOR, { knot: 'bar_barkeep', flipX: true }), // always behind the counter
    // The morning: last night's leftovers, and someone sweeping up.
    local('sleeper', 8, 214, FLOOR, ['morning'], { flipX: true }),
    stroller('sweeper', 6, 100, 340, FLOOR, ['morning']),
    local('regular', 4, 372, FLOOR, ['morning', 'afternoon']),
    // The music corner, the crews at their tables, the booths upstairs.
    local('player', 9, 82, FLOOR, OPEN_LATE),
    local('crew-1', 2, 150, FLOOR, OPEN_LATE),
    local('crew-2', 8, 200, FLOOR, LATE, { flipX: true }),
    local('crew-3', 7, 232, FLOOR, ['evening'], { flipX: true }),
    local('drinker', 0, 386, FLOOR, OPEN_LATE),
    local('booth-1', 11, 476, GALLERY.y, LATE),
    local('booth-2', 1, 360, GALLERY.y, ['night'], { flipX: true }),
    stroller('drifter', 3, 120, 360, FLOOR, LATE),
    // People you know.
    cast('scav_friend', 340, FLOOR, { knot: 'bar_friend', when: ['evening'], hideIf: 'circle_night' }),
    cast('old_scav', 300, FLOOR, { knot: 'bar_old_scav', when: ['night'] }),
    // Chapter 2, Day 4: the boss's circle, out for the evening, the floor cleared round them.
    cast('boss_son', 290, FLOOR, { id: 'son-bar', knot: 'circle_son', when: ['evening'], showIf: 'circle_night', flipX: true }),
    cast('enforcer', 308, FLOOR, { id: 'enforcer-bar', knot: 'circle_enforcer', when: ['evening'], showIf: 'circle_night', flipX: true }),
    cast('boss', 326, FLOOR, { id: 'boss-bar', knot: 'c2day4_bar', when: ['evening'], showIf: 'circle_night', flipX: true }),
    cast('watcher', 346, FLOOR, { id: 'watcher-bar', knot: 'circle_watcher', when: ['evening'], showIf: 'circle_night', flipX: true }),
  ],

  interactables: [
    { id: 'stage', x: 64, y: FLOOR, reach: 14, label: 'Look', knot: 'bar_stage' },
    { id: 'table', x: 175, y: FLOOR, reach: 16, label: 'Listen', knot: 'bar_table' },
    { id: 'counter', x: 420, y: FLOOR, reach: 30, label: 'Look', knot: 'bar_counter' },
    { id: 'booths', x: 410, y: GALLERY.y, reach: 40, label: 'Listen', knot: 'bar_booths' },
  ],

  exits: [
    { id: 'to-compound', x: 27, y: FLOOR, reach: 10, to: 'compound' },
    { id: 'to-gambling-den', x: 553, y: FLOOR, reach: 12, to: 'gambling-den' },
    { id: 'to-brothel', x: 564, y: GALLERY.y, reach: 10, to: 'brothel' },
  ],

  ambience: [
    { sound: 'room', volume: 0.35 },
    { sound: 'chatter', volume: 0.5, when: ['evening', 'night'] },
    { sound: 'crowd', volume: 0.2, when: ['evening', 'night'] },
    { sound: 'chatter', volume: 0.2, when: ['morning', 'afternoon'] },
  ],
};
