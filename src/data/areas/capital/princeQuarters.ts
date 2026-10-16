import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition } from '../types';
import { cast, inStory, servant, MORNING } from './people';

// Your quarters (Chapter 3): the prince's private rooms high in the citadel, and the first area of the
// capital, so it sets the look (docs/areas/capital/prince-quarters.md): white marble with grey veins, gold,
// blue light up the seams; calm and expensive, too quiet. The bedroom on the left, the door out to the
// halls, a canopied bed, his practice blades and a sparring dummy; a sitting room with a game left mid-game, a
// screen and a tall window; then the balcony, open to the sky, where you can
// stand at the rail over the whole city, the low district in shadow at the bottom, and the tree far off on
// the horizon. The view is painted for the time of day.

const W = 560;
const FLOOR = 226;
const TOP = 40;
/** Where the room ends and the balcony begins, open to the sky. */
const BALCONY = 394;

export const princeQuarters: AreaDefinition = {
  id: 'prince-quarters',
  name: 'your quarters',
  width: W,
  height: 270,
  walls: 'marble',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 1,
  playerStart: { x: 120, y: FLOOR },
  surface: 'stone',
  acoustics: 'small',
  ambience: [
    { sound: 'room', volume: 0.3 },
    { sound: 'hum', volume: 0.12 },
    { sound: 'wind', volume: 0.25 },
  ],

  views: [
    // The tall window in the sitting room.
    { x: 270, y: 78, width: 56, height: 96, horizon: 128, treeX: 640, mullions: 14 },
    // The balcony's open side: sky to the top, the city below, the tree on the horizon.
    { x: BALCONY, y: 0, width: W - BALCONY, height: FLOOR, horizon: 116, treeX: 500, treeScale: 0.22 },
  ],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 14, y: 0, width: 14, height: 270, invisible: true }, // the balcony's rail
  ],

  lights: [
    { x: 92, y: 188, colour: S.amber, radius: 80, radiusY: 40, strength: 0.14 }, // by the bed
    { x: 230, y: 196, colour: S.amber, radius: 70, radiusY: 34, strength: 0.18 }, // the lamp by the couch
    { x: 344, y: 116, colour: S.cyan, radius: 40, radiusY: 26, strength: 0.12 }, // the screen
    { x: BALCONY, y: 150, colour: S.white, radius: 60, radiusY: 110, strength: 0.1 }, // daylight in from the balcony
  ],

  lines: [],

  props: [
    // The door out to the halls.
    { sprite: P.doorway(24, 46), x: 24, y: FLOOR - 46 },
    // The bedroom: the canopied bed, the wardrobe and mirror, his practice blades and the dummy he spars with.
    { sprite: P.rug(64), x: 54, y: FLOOR - 3 },
    { sprite: P.CANOPY_BED, x: 54, y: FLOOR - 50 },
    { sprite: P.WARDROBE, x: 124, y: FLOOR - 52 },
    { sprite: P.MIRROR, x: 152, y: FLOOR - 48 },
    { sprite: P.BLADE_RACK, x: 172, y: FLOOR - 40 },
    { sprite: P.DUMMY, x: 198, y: FLOOR - 40 },
    // The sitting room: a couch, a game of rule left mid-game.
    { sprite: P.rug(110), x: 222, y: FLOOR - 3 },
    { sprite: P.LAMP, x: 224, y: FLOOR - 7 },
    { sprite: P.COUCH, x: 232, y: FLOOR - 16 },
    { sprite: P.GAME_TABLE, x: 276, y: FLOOR - 12 },
    // Curtains drawn back from the balcony.
    { sprite: P.curtain(FLOOR - TOP - 8), x: BALCONY, y: TOP + 7 },
    // The columns at the balcony's opening, and the rail along it.
    { sprite: P.column(FLOOR - TOP), x: BALCONY - 10, y: TOP },
    { sprite: P.TELESCOPE, x: 470, y: FLOOR - 26 },
    { sprite: P.rail(W - BALCONY - 14, 16), x: BALCONY, y: FLOOR - 16 },
    { sprite: P.column(30), x: W - 14, y: FLOOR - 30 },
  ],

  features: [
    { type: 'frames', frames: P.scrollingScreen(44, 28), x: 334, y: 100, every: 500 },
    // Chapter 3, Day 1: stepping out onto the balcony at dawn; coming in at night to someone at your telescope.
    { type: 'trigger', x: BALCONY + 8, y: FLOOR, reach: 6, knot: 'c3day1_tree', showIf: 'c3day1=spar', hideIf: 'tree_seen1' },
    { type: 'trigger', x: 50, y: FLOOR, reach: 14, knot: 'c3day1_home', showIf: 'c3day1=night', hideIf: 'sister_called1' },
    // Day 2: at dusk, from the balcony, you watch the district you chose go dark.
    { type: 'trigger', x: BALCONY + 8, y: FLOOR, reach: 6, knot: 'c3day2_dusk', showIf: 'c3day2=dusk', hideIf: 'dusk2' },
    // Day 4: in the evening, from the balcony, the riot starts.
    { type: 'trigger', x: BALCONY + 8, y: FLOOR, reach: 6, knot: 'c3day4_riot_start', showIf: 'c3day4=evening' },
    // Day 5: coming in at evening, the captain's list sent back to your desk (if you struck the cellar off).
    { type: 'trigger', x: 60, y: FLOOR, reach: 14, knot: 'c3day5_list', showIf: 'c3day5=evening', hideIf: 'list5' },
  ],
  people: [
    servant('maid', 0, 112, FLOOR, 'c3_maid', MORNING, { flipX: true }), // making the bed
    cast('sister', 452, FLOOR, { knot: 'quarters_sister', when: ['evening'] }), // at your telescope
    cast('heir', 300, FLOOR, { knot: 'quarters_heir', when: MORNING, flipX: true }), // come to fetch you
    // Chapter 3's story. Day 1: your hand at the door at dawn, then out on the balcony with the practice
    // blades; your sister at your telescope at night.
    // (He waits on the balcony; the morning opens with him at the door: `c3day1_start` puts him there.)
    inStory('hand', 'diplomat', 526, FLOOR, 'c3day1=wake,spar', { knot: 'c3day1_hand', flipX: true }),
    inStory('sister-1', 'sister', 452, FLOOR, 'c3day1=night', { knot: 'c3day1_sister' }),
    // Day 2: your hand at the door at dawn, and your father behind him (the story brings them to the door).
    inStory('hand-2', 'diplomat', 300, FLOOR, 'c3day2=wake', { knot: 'c3day1_hand_walk' }),
    inStory('father-2', 'father', 60, FLOOR, 'c3day2=wake', { hidden: true }),
    // Day 3: your hand at the door at dawn (the story brings him there), and with you from here.
    inStory('hand-3', 'diplomat', 300, FLOOR, 'c3day3=wake,audience', { follow: true, knot: 'c3day3_hand' }),
    // Day 4: your friend on the balcony at dawn, in your hand's place; the captain, running in when it breaks
    // out (the story brings him beside you); your sister at your telescope at night.
    inStory('heir-4', 'heir', 516, FLOOR, 'c3day4=wake,spar,sleeve', { knot: 'c3day4_heir', flipX: true }),
    inStory('captain-4e', 'captain', 300, FLOOR, 'c3day4=table'),
    inStory('sister-4n', 'sister', 452, FLOOR, 'c3day4=night', { knot: 'c3day4_sister_night' }),
    // Day 4, after the riot: your father, waiting at your window.
    inStory('father-4n', 'father', 300, FLOOR, 'c3day4=night', { knot: 'c3day4_father_night', hideIf: 'father4n', flipX: true }),
    // Day 5: the captain at the door at dawn, with the day (the story brings him in); your sister waiting on
    // the end of your bed at evening.
    inStory('captain-5', 'captain', 40, FLOOR, 'c3day5=wake', { hidden: true }),
    inStory('sister-5', 'sister', 112, FLOOR, 'c3day5=evening', { knot: 'c3day5_sister', flipX: true }),
    // Day 6: your friend on your couch at dawn, eating your breakfast; then with you, to the simulation room.
    inStory('heir-6', 'heir', 244, FLOOR, 'c3day6=wake', { knot: 'c3day6_heir' }),
    // Day 7, before it's light (if you didn't get your friend out): your sister at your door with the news if
    // she's your eyes, or the captain.
    inStory('sister-7d', 'sister', 56, FLOOR, 'c3day7=dawn', { hideIf: 'sister=told' }),
    inStory('captain-7d', 'captain', 56, FLOOR, 'c3day7=dawn', { hideIf: 'sister=covered' }),
    inStory('heir-f', 'heir', 230, FLOOR, 'heir_with_you', { follow: true, knot: 'c3day6_heir_walk' }),
  ],
  interactables: [
    { id: 'bed', x: 84, y: FLOOR, reach: 14, label: 'Look', knot: 'quarters_bed', hideIf: ['c3day1=night', 'c3day2=home', 'c3day3=home', 'c3day4=night', 'c3day5=home', 'c3day6=home', 'c3day7=night', 'c3day7=bed'] },
    { id: 'bed-7', x: 84, y: FLOOR, reach: 14, label: 'Wait', knot: 'c3day7_wait', showIf: 'c3day7=night' },
    { id: 'bed-7s', x: 84, y: FLOOR, reach: 14, label: 'Sleep', knot: 'c3day7_bed', showIf: 'c3day7=bed' },
    { id: 'bed-6', x: 84, y: FLOOR, reach: 14, label: 'Sleep', knot: 'c3day6_bed', showIf: 'c3day6=home' },
    { id: 'bed-5', x: 84, y: FLOOR, reach: 14, label: 'Sleep', knot: 'c3day5_bed', showIf: 'c3day5=home' },
    // (Only once your father's had his word: designer, you could go to bed before he spoke to you.)
    { id: 'bed-4', x: 84, y: FLOOR, reach: 14, label: 'Sleep', knot: 'c3day4_bed', showIf: 'father4n', hideIf: 'c3day4=done' },
    { id: 'bed-3', x: 84, y: FLOOR, reach: 14, label: 'Sleep', knot: 'c3day3_bed', showIf: 'c3day3=home' },
    { id: 'bed-2', x: 84, y: FLOOR, reach: 14, label: 'Sleep', knot: 'c3day2_bed', showIf: 'c3day2=home' },
    { id: 'bed-1', x: 84, y: FLOOR, reach: 14, label: 'Sleep', knot: 'c3day1_bed', showIf: 'c3day1=night' },
    { id: 'mirror', x: 160, y: FLOOR, reach: 10, label: 'Look', knot: 'quarters_mirror' },
    { id: 'blades', x: 202, y: FLOOR, reach: 10, label: 'Look', knot: 'quarters_blades' },
    { id: 'game', x: 272, y: FLOOR, reach: 10, label: 'Look', knot: 'quarters_game' },
    { id: 'telescope', x: 480, y: FLOOR, reach: 14, label: 'Look', knot: 'quarters_telescope' },
  ],

  exits: [{ id: 'to-halls', x: 36, y: FLOOR, reach: 12, to: 'citadel-halls' }],
};
