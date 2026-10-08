import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './gamblingDenProps';
import type { AreaDefinition, Solid } from '../types';
import { ALWAYS, LATE, cast, local } from './people';

// The gambling den (Chapter 2): below ground, down from the bar, in a sunken compartment of something
// big. Low light over the tables, faces in shadow, the rattle of the game. Two tables (tokens cut from
// small identical parts), the house's cage where stakes are held, and the debt wall, names and amounts
// in signs. Where the gambler is drowning in debt. See docs/areas/borderland/gambling-den.md.
// The gambler, the house's man and the players come with the cast.

const FLOOR = 236;
const LANDING = 172;

/** Steps down from the landing to the floor, one-way blocks. */
function steps(): Solid[] {
  const count = (FLOOR - LANDING) / 8;
  return Array.from({ length: count - 1 }, (_, i) => {
    const top = FLOOR - 8 * (i + 1);
    const x = 80 + 8 * (count - 2 - i);
    return { x: 72, y: top, width: x - 72 + 8, height: FLOOR - top, oneWay: true };
  });
}

export const gamblingDen: AreaDefinition = {
  id: 'gambling-den',
  name: 'the gambling den',
  width: 480,
  height: 270,
  walls: 'hull',
  cavity: { x: 16, y: 110, width: 448, height: FLOOR - 110, radius: 30 },
  nooks: [{ x: 22, y: 0, width: 44, height: 140, radius: 2 }], // the shaft up to the bar
  underground: true,
  ambient: 0.55,
  playerStart: { x: 40, y: LANDING },
  surface: 'metal',
  acoustics: 'small',

  solids: [
    { x: 0, y: FLOOR, width: 480, height: 270 - FLOOR },
    { x: 16, y: LANDING, width: 56, height: FLOOR - LANDING }, // the landing at the foot of the way down
    ...steps(),
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: 464, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 182, y: 214, colour: S.amber, radius: 46, radiusY: 30, strength: 0.4 }, // over the first table
    { x: 282, y: 214, colour: S.amber, radius: 46, radiusY: 30, strength: 0.36 }, // over the second
    { x: 370, y: 200, colour: S.amber, radius: 30, radiusY: 26, strength: 0.18 }, // the cage
    { x: 44, y: 60, colour: S.amber, radius: 30, radiusY: 90, strength: 0.25 }, // light down the shaft from the bar
  ],

  lines: [
    { from: { x: 182, y: 110 }, to: { x: 182, y: 190 }, colour: S.dim },
    { from: { x: 282, y: 110 }, to: { x: 282, y: 190 }, colour: S.dim },
  ],

  props: [
    { sprite: P.LOW_LAMP, x: 179, y: 190 },
    { sprite: P.gameTable(50), x: 157, y: FLOOR - 16 },
    { sprite: P.STOOL, x: 146, y: FLOOR - 6 },
    { sprite: P.STOOL, x: 212, y: FLOOR - 6 },
    { sprite: P.LOW_LAMP, x: 279, y: 190 },
    { sprite: P.gameTable(44), x: 260, y: FLOOR - 16 },
    { sprite: P.STOOL, x: 250, y: FLOOR - 6 },
    { sprite: P.STOOL, x: 308, y: FLOOR - 6 },
    { sprite: P.HOUSE_CAGE, x: 340, y: FLOOR - 46 },
    { sprite: P.DEBT_WALL, x: 400, y: 150 },
  ],

  features: [{ type: 'motes', x: 230, top: 120, bottom: 220, halfWidth: 90 }], // smoke
  people: [
    local('dealer', 5, 204, FLOOR, ALWAYS, { flipX: true }), // the game never stops
    local('player-1', 2, 160, FLOOR, ALWAYS),
    local('player-3', 8, 262, FLOOR, ['morning', 'afternoon'], { flipX: true }),
    local('watcher-on', 1, 120, FLOOR, LATE),
    local('player-2', 9, 304, FLOOR, LATE, { flipX: true }),
    local('cage-keeper', 7, 392, FLOOR, ALWAYS, { flipX: true }),
    cast('gambler', 236, FLOOR, { knot: 'gambling_den_gambler' }), // never leaves
    // Chapter 2, Day 5: the enforcer at the bones table, out of place in daylight.
    cast('enforcer', 214, FLOOR, { id: 'enforcer-den', showIf: 'town_day', flipX: true }),
  ],

  interactables: [
    { id: 'game', x: 182, y: FLOOR, reach: 22, label: 'Watch', knot: 'gambling_den_game' },
    { id: 'play', x: 282, y: FLOOR, reach: 20, label: 'Play', knot: 'gambling_den_play' },
    { id: 'cage', x: 364, y: FLOOR, reach: 16, label: 'Look', knot: 'gambling_den_cage' },
    { id: 'debts', x: 428, y: FLOOR, reach: 18, label: 'Read', knot: 'gambling_den_debts' },
  ],

  exits: [{ id: 'up-to-bar', x: 32, y: LANDING, reach: 14, to: 'bar' }],

  ambience: [
    { sound: 'room', volume: 0.4 },
    { sound: 'chatter', volume: 0.3, when: ['afternoon', 'evening', 'night'] },
    { sound: 'workshop', volume: 0.12, when: ['afternoon', 'evening', 'night'] }, // the rattle of the game
  ],
};
