import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition } from '../types';
import { cast, courtier, inStory, servant, strollingServant, MORNING } from './people';

// The banquet gallery (Chapter 3): dinners and balls, where you feel the tension: flat toasts, empty seats
// (docs/areas/capital/banquet-gallery.md). A long gallery: the dance floor at one end under a screen; the
// long table down the middle, gold everywhere, a high chair at its head for your father; a balcony at the
// far end, open over the city.

const W = 800;
const FLOOR = 230;
const TOP = 30;
/** Where the gallery opens onto its balcony. */
const BALCONY = 674;
/** The musicians' gallery, over the dance floor (out of reach). */
const GALLERY = FLOOR - 70;
const TABLE = { x: 250, width: 340 };

export const banquetGallery: AreaDefinition = {
  id: 'banquet-gallery',
  name: 'the banquet gallery',
  width: W,
  height: 270,
  walls: 'marble',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.86,
  playerStart: { x: 40, y: FLOOR },
  surface: 'stone',
  acoustics: 'hall',
  ambience: [
    { sound: 'room', volume: 0.35 },
    { sound: 'hum', volume: 0.15 },
    { sound: 'wind', volume: 0.15 },
  ],

  views: [{ x: BALCONY, y: 0, width: W - BALCONY, height: FLOOR, horizon: 124, treeX: 760, treeScale: 0.2 }],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 40, y: GALLERY, width: 168, height: 4, oneWay: true, invisible: true }, // the musicians' gallery
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 14, y: 0, width: 14, height: 270, invisible: true }, // the balcony's rail
  ],

  lights: [
    { x: 420, y: 170, colour: S.amber, radius: 200, radiusY: 50, strength: 0.18 }, // over the table
    { x: 110, y: 120, colour: S.cyan, radius: 90, radiusY: 60, strength: 0.16 }, // the screen over the dance floor
  ],

  lines: [
    // The musicians' gallery's ledge.
    { from: { x: 40, y: FLOOR - 70 }, to: { x: 207, y: FLOOR - 70 }, colour: S.amber },
    { from: { x: 40, y: FLOOR - 69 }, to: { x: 207, y: FLOOR - 69 }, colour: S.light },
    { from: { x: 40, y: FLOOR - 68 }, to: { x: 207, y: FLOOR - 68 }, colour: S.dim },
  ],

  props: [
    { sprite: P.doorway(24, 46), x: 22, y: FLOOR - 46 },
    // The dance floor, and over it the musicians' gallery: a harp, a drum.
    { sprite: P.rug(160), x: 56, y: FLOOR - 3 },
    { sprite: P.HARP, x: 74, y: FLOOR - 96 },
    { sprite: P.DRUM, x: 132, y: FLOOR - 77 },
    { sprite: P.rail(168, 12), x: 40, y: FLOOR - 82 },
    // The hall of mirrors, between gold frames, all down the wall behind the table.
    ...[250, 330, 410, 490, 570].map((x) => ({ sprite: P.mirrorPanel(118), x, y: TOP + 18 })),
    { sprite: P.column(FLOOR - TOP), x: 228, y: TOP },
    // The long table: chairs along its far side, every place empty.
    ...Array.from({ length: 8 }, (_, i) => ({ sprite: P.BANQUET_CHAIR, x: TABLE.x + 14 + i * 40, y: FLOOR - 26 })),
    { sprite: P.longTable(TABLE.width), x: TABLE.x, y: FLOOR - 20 },
    { sprite: P.HIGH_CHAIR, x: TABLE.x + TABLE.width + 4, y: FLOOR - 28 },
    // The balcony.
    { sprite: P.column(FLOOR - TOP), x: BALCONY - 10, y: TOP },
    { sprite: P.rail(W - BALCONY - 14, 16), x: BALCONY, y: FLOOR - 16 },
    { sprite: P.column(30), x: W - 14, y: FLOOR - 30 },
  ],

  features: [
    ...[330, 420, 510].map((x) => ({ type: 'swing' as const, sprite: P.CHANDELIER, x, y: TOP + 56, ropeTop: TOP, quiet: true, ropeColour: S.amberDeep })),
  ],
  people: [
    // The morning: servants laying the table.
    servant('server-1', 0, 300, FLOOR, 'c3_servant', MORNING),
    strollingServant('server-2', 1, 240, 600, FLOOR, 'c3_servant', MORNING),
    // The evening: music from the gallery, dancing, guests along the table (your father's chair at its head
    // empty), servants with trays; your friend out on the balcony.
    // (Chapter 3, Day 1: not until you've seated the table, when the doors open.)
    courtier('harpist', 5, 96, GALLERY, 'banquet_musician', ['evening'], { hideIf: 'c3day1=banquet,cards' }),
    courtier('drummer', 4, 150, GALLERY, 'banquet_musician', ['evening'], { flipX: true, hideIf: 'c3day1=banquet,cards' }),
    courtier('dancer-1', 0, 110, FLOOR, 'banquet_dancer', ['evening'], { hideIf: 'c3day1=banquet,cards' }),
    courtier('dancer-2', 3, 126, FLOOR, 'banquet_dancer', ['evening'], { flipX: true, hideIf: 'c3day1=banquet,cards' }),
    courtier('guest-1', 2, 300, FLOOR, 'banquet_guest', ['evening'], { hideIf: 'c3day1=banquet,cards' }),
    courtier('guest-2', 6, 372, FLOOR, 'banquet_guest', ['evening'], { flipX: true, hideIf: 'c3day1=banquet,cards' }),
    courtier('guest-3', 7, 480, FLOOR, 'banquet_guest', ['evening'], { hideIf: 'c3day1=banquet,cards' }),
    strollingServant('server-3', 0, 240, 600, FLOOR, 'c3_server', ['evening']),
    cast('salon_hostess', 420, FLOOR, { knot: 'banquet_hostess', when: ['evening'], flipX: true }),
    cast('heir', 726, FLOOR, { knot: 'banquet_heir', when: ['evening'] }),
    cast('councillor', 560, FLOOR, { knot: 'banquet_councillor', when: ['evening'], flipX: true }), // by your father's empty chair
    // Chapter 3's story. Day 1: the steward with the seating plan before anyone comes in; then the banquet,
    // your father at the head of the table and whoever you seated at his right, the other two further down;
    // your friend on the balcony.
    inStory('steward', 'steward', 120, FLOOR, 'c3day1=banquet,cards', { knot: 'c3day1_steward' }),
    inStory('father-1', 'father', 610, FLOOR, 'c3day1=toast,friend', { knot: 'c3day1_father_banquet', flipX: true }),
    ...(['councillor', 'salon_hostess', 'merchant'] as const).flatMap((who) => {
      const seat = who === 'salon_hostess' ? 'hostess' : who;
      const knot = `c3day1_${seat}`;
      const down = { councillor: 270, salon_hostess: 352, merchant: 414 }[who];
      return [
        inStory(`${seat}-right`, who, 556, FLOOR, `seated=${seat}`, { knot, hideIf: 'c3day1=banquet,cards,night,done', flipX: false }),
        inStory(`${seat}-down`, who, down, FLOOR, 'c3day1=toast,friend', { knot, hideIf: `seated=${seat}`, flipX: who === 'merchant' }),
      ];
    }),
    inStory('heir-1', 'heir', 730, FLOOR, 'c3day1=toast,friend', { knot: 'c3day1_friend', flipX: true }),
  ],
  interactables: [
    { id: 'mirrors', x: 330, y: FLOOR, reach: 10, label: 'Look', knot: 'banquet_mirrors' },
    { id: 'table', x: 440, y: FLOOR, reach: 10, label: 'Look', knot: 'banquet_table' },
    { id: 'chair', x: 604, y: FLOOR, reach: 10, label: 'Look', knot: 'banquet_chair', hideIf: 'c3day1=toast,friend' }, // (not while he's by it)
    { id: 'balcony', x: 760, y: FLOOR, reach: 14, label: 'Look', knot: 'banquet_balcony' },
    // Chapter 3, Day 1: the cards (the chair at your father's right, then two further down).
    { id: 'card-right', x: 558, y: FLOOR, reach: 10, label: 'Place card', knot: 'c3day1_card_right', showIf: 'c3day1=cards', hideIf: 'right_placed' },
    { id: 'card-down', x: 286, y: FLOOR, reach: 10, label: 'Place cards', knot: 'c3day1_card_down', showIf: 'right_placed', hideIf: 'cards_done' },
  ],

  exits: [{ id: 'to-halls', x: 34, y: FLOOR, reach: 12, to: 'citadel-halls' }],
};
