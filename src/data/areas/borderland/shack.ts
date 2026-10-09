import { SHADES as S } from '../../../ui/pixelArt';
import { asleep, CAST_LOOKS } from '../../../ui/borderlandFolk';
import * as P from './shackProps';
import type { AreaDefinition } from '../types';
import type { RowSprite } from '../../../ui/sprites';
import { cast, dog, local } from './people';

// Your shack (Chapter 2): home with your brother, on the settlement's outer edge. Small, cramped,
// kept tidy by someone who's trying, built from whatever could be carried home. Ground floor: the door
// and your kit, a fire in a cut-down casing, a hatch for a table, the loose floor panel over a hollow
// (where the dog will be kept out of sight), the water drum, the ration tally scratched on the wall,
// and a loose sheet at the back, a way out to the scrap stacks. Up on the loft, over crates: two beds
// with a cloth between, your brother's collection lined up by size, his night light (a dead part that
// still glows), and daylight through a hole in the roof. See docs/areas/borderland/shack.md.
// Your brother and the dog come with the cast.

const FLOOR = 236;
/** The dog's bed, once it's yours (designer: the house should change): a nest of sacking by the floor panel, a chewed rag, a bowl cut from a casing. */
const DOG_BED: RowSprite = {
  rows: [
    '..ssssssssss......',
    '.sSSSSSSSSSSs...bb',
    'sSSrrSSSSSSSSs.bBBb',
    'sSSSSSSSSSSSSs.bbbb',
  ].map((r) => r.padEnd(19, '.')),
  colours: { s: S.woodLight, S: S.dim, r: S.cyanMid, b: S.woodPale, B: S.deep },
};

/** Your brother asleep, under a blanket like the one on his bed. */
const BROTHER_ASLEEP = asleep(CAST_LOOKS.brother, S.amber);
const LOFT = 184;
/** The dog's bowl, cut from a casing (Day 8: to hide before the search). */
const DOG_BOWL: RowSprite = { rows: ['bBBBBb', '.bbbb.'], colours: { b: S.woodPale, B: S.deep } };
/** Grey hairs all over your blanket. */
const DOG_HAIR: RowSprite = { rows: ['.h..h.h..', 'h.hh..h.h'], colours: { h: S.light } };
/** Your satchel on the floor by the table, the drop's note in it. */
const SATCHEL: RowSprite = { rows: ['.ssssss.', 'sSSSSSSs', 'sSSnSSSs', 'sSSSSSSs', '.ssssss.'], colours: { s: S.woodLight, S: S.amberDeep, n: S.light } };
const TOP = 92;

export const shack: AreaDefinition = {
  id: 'shack',
  name: 'your shack',
  width: 480,
  height: 270,
  walls: 'scrap',
  cavity: { x: 60, y: TOP, width: 360, height: FLOOR - TOP, radius: 3 },
  ambient: 0.9,
  playerStart: { x: 90, y: FLOOR },
  surface: 'metal',
  acoustics: 'small',

  solids: [
    { x: 0, y: FLOOR, width: 480, height: 270 - FLOOR },
    { x: 232, y: LOFT, width: 188, height: 5, oneWay: true }, // the loft
    { x: 204, y: FLOOR - 24, width: 26, height: 24, oneWay: true }, // a crate to climb up from
    { x: 0, y: 0, width: 60, height: 270, invisible: true },
    { x: 420, y: 0, width: 60, height: 270, invisible: true },
  ],

  lights: [
    { x: 124, y: 226, colour: S.amber, radius: 80, radiusY: 46, strength: 0.4 }, // the fire
    { x: 168, y: 190, colour: S.white, radius: 26, radiusY: 16, strength: 0.22 }, // daylight at the window
    { x: 292, y: 160, colour: S.cyan, radius: 16, strength: 0.32 }, // his night light
    { x: 362, y: 110, colour: S.white, radius: 34, radiusY: 60, strength: 0.26 }, // daylight through the roof
  ],

  lines: [
    { from: { x: 316, y: 132 }, to: { x: 396, y: 132 }, colour: S.dim }, // the line the cloth hangs from
  ],

  props: [
    { sprite: P.chimney(FLOOR - 18 - TOP + 22), x: 122, y: TOP - 22 },
    { sprite: P.roof(392, 10), x: 44, y: TOP - 14 },
    { sprite: P.ROOF_JUNK, x: 200, y: TOP - 13 },
    { sprite: P.ROOF_JUNK, x: 300, y: TOP - 10 },
    { sprite: P.DOOR, x: 62, y: FLOOR - 36 },
    { sprite: P.PEGS, x: 82, y: 168 },
    { sprite: P.KIT, x: 82, y: FLOOR - 17 },
    { sprite: P.STOVE, x: 112, y: FLOOR - 18 },
    { sprite: P.POTS, x: 150, y: 160 },
    { sprite: P.WINDOW, x: 154, y: 180 },
    { sprite: P.rug(40), x: 150, y: FLOOR - 2 },
    { sprite: P.TABLE, x: 146, y: FLOOR - 14 },
    { sprite: P.crate(12, 10), x: 190, y: FLOOR - 10 },
    { sprite: P.crate(26, 24), x: 204, y: FLOOR - 24 },
    { sprite: P.FLOOR_PANEL, x: 262, y: FLOOR },
    { sprite: P.DRUM, x: 314, y: FLOOR - 22 },
    { sprite: P.tally(23), x: 340, y: 204 },
    { sprite: P.LOOSE_SHEET, x: 398, y: FLOOR - 30 },
    // The loft.
    { sprite: P.bed(34, 'a'), x: 238, y: LOFT - 9 },
    { sprite: P.COLLECTION, x: 252, y: 156 },
    { sprite: P.NIGHT_LIGHT, x: 289, y: 158 },
    { sprite: P.curtain(52), x: 326, y: 133 },
    { sprite: P.bed(40, 'G'), x: 360, y: LOFT - 9 },
    { sprite: P.roofHole(22), x: 352, y: TOP - 2 },
  ],

  features: [
    { type: 'fire', x: 124, y: FLOOR - 9 },
    // Chapter 2, Day 2: coming home with the dog.
    { type: 'trigger', x: 96, y: FLOOR, reach: 30, knot: 'c2day2_home', showIf: 'going_home' },
    // Chapter 2, Day 8: home just ahead of the enforcer's search.
    { type: 'trigger', x: 96, y: FLOOR, reach: 30, knot: 'c2day8_search_start', showIf: 'searchers_coming', hideIf: 'search_started' },
  ],
  people: [
    // Your brother: up and about by day, asleep in the loft at night.
    // (Unless he's gone to live at the compound: big choice 1.)
    cast('brother', 214, FLOOR, { knot: 'shack_brother', when: ['morning', 'evening'], flipX: true, hideIf: 'brother_moved' }),
    // The dog's bed by the floor panel, once it's yours (made a person so the story can bring it in).
    { id: 'dog-bed', sprite: DOG_BED, x: 300, y: FLOOR, showIf: 'dog_owned', hideIf: 'search_started', knot: 'shack_dog_bed', label: 'Look' },
    // Day 8: the search. The dog's things to hide (people, so the story can show and take them), the searchers, your brother in the doorway.
    { id: 'ev-bed', sprite: DOG_BED, x: 300, y: FLOOR, showIf: 'ev_bed', knot: 'c2day8_hide_bed', label: 'Hide' },
    { id: 'ev-bowl', sprite: DOG_BOWL, x: 334, y: FLOOR, showIf: 'ev_bowl', knot: 'c2day8_hide_bowl', label: 'Hide' },
    { id: 'ev-hair', sprite: DOG_HAIR, x: 376, y: LOFT, showIf: 'ev_hair', knot: 'c2day8_hide_hair', label: 'Hide' },
    { id: 'ev-note', sprite: SATCHEL, x: 150, y: FLOOR, showIf: 'ev_note', knot: 'c2day8_hide_note', label: 'Hide' },
    cast('brother', 168, FLOOR, { id: 'brother-search', when: ['afternoon'], showIf: 'searchers_coming', hideIf: 'brother_moved' }),
    cast('enforcer', 110, FLOOR, { id: 'enforcer-search', when: ['afternoon'], showIf: 'searchers_in' }),
    local('searcher-1', 7, 140, FLOOR, ['afternoon'], { showIf: 'searchers_in' }),
    local('searcher-2', 8, 196, FLOOR, ['afternoon'], { showIf: 'searchers_in', flipX: true }),
    // Asleep in his bed at night, under the blanket, one arm hanging off the edge (designer: he floated
    // beside it). Laid over the bed: its left edge on the bed's (x is the middle, the bottom its bottom).
    // Chapter 2, Day 2: the dog, home, nosing about the place before it goes under the floor.
    dog(186, FLOOR, { id: 'dog-home', showIf: 'dog_home', wander: { from: 130, to: 300 }, knot: 'dog_pet', label: 'Pet' }),
    { id: 'brother-asleep', sprite: BROTHER_ASLEEP[0]!, idleFrames: BROTHER_ASLEEP, x: 238 + 15, y: LOFT, knot: 'shack_brother_asleep', label: 'Look', when: ['night'], hideIf: 'brother_moved' },
  ],

  interactables: [
    { id: 'kit', x: 88, y: FLOOR, reach: 7, label: 'Look', knot: 'shack_kit' },
    { id: 'fire', x: 124, y: FLOOR, reach: 10, label: 'Look', knot: 'shack_fire' },
    { id: 'table', x: 168, y: FLOOR, reach: 12, label: 'Sit', knot: 'shack_table' },
    { id: 'floor-panel', x: 275, y: FLOOR, reach: 12, label: 'Lift', knot: 'shack_floor' },
    { id: 'drum', x: 322, y: FLOOR, reach: 8, label: 'Drink', knot: 'shack_drum' },
    { id: 'tally', x: 350, y: FLOOR, reach: 10, label: 'Look', knot: 'shack_tally' },
    { id: 'brothers-bed', x: 254, y: LOFT, reach: 14, label: 'Look', knot: 'shack_brothers_bed' },
    { id: 'collection', x: 292, y: LOFT, reach: 12, label: 'Look', knot: 'shack_collection' },
    { id: 'bed', x: 382, y: LOFT, reach: 18, label: 'Sleep', knot: 'shack_bed' },
  ],

  exits: [
    { id: 'door', x: 70, y: FLOOR, reach: 10, to: 'swap-yard' },
    { id: 'loose-sheet', x: 406, y: FLOOR, reach: 10, to: 'scrap-stacks' },
  ],

  ambience: [
    { sound: 'room', volume: 0.4 },
    { sound: 'hearth', volume: 0.25 },
    { sound: 'wind', volume: 0.2 }, // the plain outside, through the gaps
    { sound: 'chatter', volume: 0.12, when: ['morning', 'afternoon', 'evening'] }, // the settlement beyond the walls
  ],
};
