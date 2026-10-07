import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './brothelProps';
import { roof } from './shackProps';
import type { AreaDefinition, Solid } from '../types';

// The brothel (Chapter 2), shown with restraint: the front room and the madam, nothing explicit. The
// most comfortable room in the settlement, which says something: cloth hung over every wall, swags
// across the ceiling, cushions, lamps with coloured glass shades. The madam's seat and her ledger by the
// door; a couch; up the stairs, curtained doorways along a gallery; a back door to the alley (the scrap
// stacks). Quiet voices. Where secrets are traded and everyone pretends not to see each other.
// See docs/areas/borderland/brothel.md. The madam and the others come with the cast.

const FLOOR = 236;
const TOP = 84;
const GALLERY = { x: 220, y: 164, end: 464 };

function stairs(): Solid[] {
  const count = (FLOOR - GALLERY.y) / 8;
  return Array.from({ length: count - 1 }, (_, i) => {
    const top = FLOOR - 8 * (i + 1);
    const x = GALLERY.x - 8 * (count - 1 - i);
    return { x, y: top, width: GALLERY.x - x, height: FLOOR - top, oneWay: true };
  });
}

export const brothel: AreaDefinition = {
  id: 'brothel',
  name: 'the brothel',
  width: 480,
  height: 270,
  walls: 'scrap',
  cavity: { x: 16, y: TOP, width: 448, height: FLOOR - TOP, radius: 4 },
  ambient: 0.8,
  playerStart: { x: 40, y: FLOOR },
  surface: 'plank',
  acoustics: 'small',

  solids: [
    { x: 0, y: FLOOR, width: 480, height: 270 - FLOOR },
    { x: GALLERY.x, y: GALLERY.y, width: GALLERY.end - GALLERY.x, height: 5, oneWay: true },
    ...stairs(),
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: 464, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 240, y: 170, colour: S.amber, radius: 240, radiusY: 80, strength: 0.18 }, // the whole room, warm
    { x: 92, y: 200, colour: S.amber, radius: 50, radiusY: 40, strength: 0.32 }, // the madam's lamp
    { x: 300, y: 130, colour: S.cyan, radius: 40, radiusY: 30, strength: 0.14 }, // a cyan-shaded lamp
    { x: 400, y: 130, colour: S.amber, radius: 40, radiusY: 30, strength: 0.22 },
  ],

  lines: [
    { from: { x: 300, y: TOP }, to: { x: 300, y: 118 }, colour: S.dim },
    { from: { x: 400, y: TOP }, to: { x: 400, y: 118 }, colour: S.dim },
    { from: { x: GALLERY.x, y: GALLERY.y - 9 }, to: { x: GALLERY.end, y: GALLERY.y - 9 }, colour: S.dim },
  ],

  props: [
    { sprite: roof(472, 10), x: 4, y: TOP - 14 },
    // Cloth over every wall.
    { sprite: P.drape(60, 140, 'a'), x: 40, y: TOP + 2 },
    { sprite: P.drape(40, 100, 'e'), x: 104, y: TOP + 2 },
    { sprite: P.drape(70, 76, 'G'), x: 150, y: TOP + 2 },
    { sprite: P.drape(80, 44, 'a'), x: 230, y: TOP + 2 },
    { sprite: P.drape(90, 44, 'e'), x: 330, y: TOP + 2 },
    { sprite: P.swag(110, 'a'), x: 30, y: TOP + 2 },
    { sprite: P.swag(120, 'G'), x: 160, y: TOP + 4 },
    { sprite: P.swag(130, 'a'), x: 300, y: TOP + 2 },
    { sprite: P.shadedLamp('G'), x: 297, y: 118 },
    { sprite: P.shadedLamp('a'), x: 397, y: 118 },
    // The front room.
    { sprite: P.MADAMS_SEAT, x: 64, y: FLOOR - 36 },
    { sprite: P.rug(90), x: 130, y: FLOOR - 3 },
    { sprite: P.couch(66), x: 240, y: FLOOR - 16 },
    { sprite: P.drape(40, 60, 'G'), x: 330, y: 172 },
    { sprite: P.BACK_DOOR, x: 440, y: FLOOR - 34 },
    // The gallery's doorways.
    { sprite: P.curtainedDoor('a'), x: 250, y: GALLERY.y - 32 },
    { sprite: P.curtainedDoor('G'), x: 320, y: GALLERY.y - 32 },
    { sprite: P.curtainedDoor('e'), x: 390, y: GALLERY.y - 32 },
  ],

  features: [],
  people: [],

  interactables: [
    { id: 'seat', x: 76, y: FLOOR, reach: 12, label: 'Look', knot: 'brothel_seat' },
    { id: 'ledger', x: 96, y: FLOOR, reach: 8, label: 'Read', knot: 'brothel_ledger' },
    { id: 'couch', x: 272, y: FLOOR, reach: 20, label: 'Sit', knot: 'brothel_couch' },
    { id: 'doors', x: 340, y: GALLERY.y, reach: 70, label: 'Listen', knot: 'brothel_doors' },
  ],

  exits: [
    { id: 'to-bar', x: 26, y: FLOOR, reach: 10, to: 'bar' },
    { id: 'to-scrap-stacks', x: 448, y: FLOOR, reach: 10, to: 'scrap-stacks' },
  ],

  ambience: [
    { sound: 'room', volume: 0.3 },
    { sound: 'chatter', volume: 0.15, when: ['evening', 'night'] }, // quiet voices
  ],
};
