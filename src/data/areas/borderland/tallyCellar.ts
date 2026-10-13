import { SHADES as S } from '../../../ui/pixelArt';
import type { AreaDefinition } from '../types';
import { cast } from './people';

// The cellar under the tally house (Chapter 2, Day 11): a dirt hole under the counter where they keep you
// to wait for the brand, and then for dusk. A hatch over your head with feet going over it all day; a drain
// grate in the floor, bolted into the stone, that comes out behind the scrap stacks. Inside the tally house
// (not on the map); you only come here through the story.

const FLOOR = 200;
const TOP = 70;

/** A drain grate set into the floor. */
const GRATE = {
  rows: ['dddddddddddddddddddd', 'dhdhdhdhdhdhdhdhdhdd', 'dXdXdXdXdXdXdXdXdXdd', 'dhdhdhdhdhdhdhdhdhdd', 'dddddddddddddddddddd'],
  colours: { d: S.deep, h: S.woodLight, X: S.shadow },
};
/** The hatch, overhead: planks with light coming through the cracks. */
const HATCH = {
  rows: ['dddddddddddddddddddddddddddd', 'dpppplpppplppppplppppplppppd', 'dpppplpppplppppplppppplppppd', 'dddddddddddddddddddddddddddd'],
  colours: { d: S.deep, p: S.wood, l: S.amber },
};
/** The ladder up to it. */
const LADDER = {
  rows: Array.from({ length: FLOOR - TOP - 4 }, (_, i) => (i % 8 === 0 ? 'wwwwwwwwww' : 'w........w')),
  colours: { w: S.woodLight },
};

export const tallyCellar: AreaDefinition = {
  id: 'tally-cellar',
  name: 'the tally house cellar',
  width: 480,
  height: 270,
  walls: 'scrap',
  cavity: { x: 60, y: TOP, width: 360, height: FLOOR - TOP, radius: 6 },
  underground: true,
  ambient: 0.45,
  playerStart: { x: 120, y: FLOOR },
  surface: 'dirt',
  acoustics: 'small',

  solids: [
    { x: 0, y: FLOOR, width: 480, height: 270 - FLOOR },
    { x: 52, y: 0, width: 8, height: 270, invisible: true },
    { x: 420, y: 0, width: 8, height: 270, invisible: true },
  ],

  lights: [
    { x: 200, y: TOP + 6, colour: S.amber, radius: 70, radiusY: 90, strength: 0.25 }, // daylight through the hatch's cracks
  ],

  lines: [],

  props: [
    { sprite: HATCH, x: 186, y: TOP },
    { sprite: LADDER, x: 222, y: TOP + 4 },
    { sprite: GRATE, x: 330, y: FLOOR - 3 },
  ],

  features: [],

  people: [
    cast('boss_son', 390, FLOOR, { id: 'son-cellar11', showIf: 'in_cellar11', flipX: true }),
    cast('watcher', 236, FLOOR, { id: 'watcher-cellar11', showIf: 'watcher_cellar11' }),
    cast('scav_friend', 340, FLOOR, { id: 'friend-cellar11', showIf: 'friend_cellar11', flipX: true }),
    cast('gambler', 250, FLOOR, { id: 'gambler-cellar11', showIf: 'gambler_cellar11' }),
  ],

  interactables: [
    { id: 'drain', x: 340, y: FLOOR, reach: 14, label: 'Drain', knot: 'tally_cellar_drain' },
    { id: 'hatch', x: 226, y: FLOOR, reach: 12, label: 'Look', knot: 'tally_cellar_hatch' },
  ],

  exits: [],
};
