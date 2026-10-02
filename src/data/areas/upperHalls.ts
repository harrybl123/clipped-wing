import { ARCHIVIST, GIRL, GUARD, RESIDENTS } from '../../ui/characters';
import { SHADES as S } from '../../ui/pixelArt';
import { handrail } from './friendsHomeProps';
import { ARCHWAY } from './offeringFloorProps';
import { railing } from './rootsMarketProps';
import { CHANDELIER } from './tendersShrineProps';
import * as P from './upperHallsProps';
import type { AreaDefinition, Person, Solid } from './types';

// The upper halls: wealth and warmth high in the branches, where you meet the archivist (Day 5).
// The Canopy's white light falls through skylights; the most tech in the tree (a gear-driven
// fountain, light cells in the sconces); a laden feast table while the roots go hungry; and
// writing, which belongs to high society. Height is skill, so the carving is spectacular: a
// masterwork centrepiece, ornate columns, a frieze. Stairs up to a library on a mezzanine, where the
// archivist waits. See docs/areas/upper-halls.md.

const W = 720;
const FLOOR = 236;
const MEZZ = 156;
const MEZZ_X = 470;
const DAY: Person['when'] = ['morning', 'afternoon', 'evening'];

/** Stairs rising right to the mezzanine. */
function stairs(): Solid[] {
  const count = (FLOOR - MEZZ) / 8;
  return Array.from({ length: count - 1 }, (_, i) => {
    const top = FLOOR - 8 * (i + 1);
    const x = MEZZ_X - 8 * (count - 1 - i);
    return { x, y: top, width: MEZZ_X - x, height: FLOOR - top, oneWay: true };
  });
}
const STAIR_STEPS = (FLOOR - MEZZ) / 8 - 1;

const resident = (id: string, look: number, x: number, y: number, extra: Partial<Person> = {}): Person => ({
  id,
  sprite: RESIDENTS[look]!.idle[0]!,
  idleFrames: RESIDENTS[look]!.idle,
  x,
  y,
  when: DAY,
  ...extra,
});

const SKYLIGHTS = [96, 250, 416, 576]; // the second lights the masterwork

export const upperHalls: AreaDefinition = {
  id: 'upper-halls',
  name: 'the upper halls',
  width: W,
  height: 270,
  cavity: { x: 12, y: 12, width: W - 24, height: FLOOR - 12, radius: 30 },
  ambient: 1.05,
  playerStart: { x: 60, y: FLOOR },

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    ...stairs(),
    { x: MEZZ_X, y: MEZZ, width: W - 12 - MEZZ_X, height: 8, oneWay: true },
    { x: 0, y: 0, width: 12, height: 270, invisible: true },
    { x: W - 12, y: 0, width: 12, height: 270, invisible: true },
  ],

  lights: [
    ...SKYLIGHTS.map((x) => ({ x: x + 20, y: 70, colour: S.white, radius: 30, radiusY: 110, strength: 0.2 })), // the Canopy's light
    { x: 190, y: 90, colour: S.amber, radius: 90, radiusY: 60, strength: 0.3 }, // chandelier
    { x: 170, y: 220, colour: S.amber, radius: 70, radiusY: 24, strength: 0.24 }, // candles on the table
    { x: 330, y: 214, colour: S.cyan, radius: 30, radiusY: 26, strength: 0.3 }, // the fountain
    { x: 270, y: 170, colour: S.white, radius: 40, radiusY: 70, strength: 0.2 }, // the masterwork, in the light
    { x: 616, y: 132, colour: S.amber, radius: 36, radiusY: 30, strength: 0.32 }, // reading lamp
    { x: 560, y: 210, colour: S.amber, radius: 60, radiusY: 26, strength: 0.24 }, // the lounge
    ...[[58, 186], [370, 176], [690, 110], [480, 200]].map(([x, y]) => ({ x: x! + 2, y: y! + 2, colour: S.cyan, radius: 14, strength: 0.26 })), // cell sconces
  ],

  lines: [{ from: { x: 196, y: 12 }, to: { x: 196, y: 64 }, colour: S.dim }], // chandelier chain

  props: [
    ...SKYLIGHTS.map((x) => ({ sprite: P.skylight(40), x, y: 12 })),
    { sprite: CHANDELIER, x: 190, y: 64 },
    { sprite: P.TAPESTRY, x: 400, y: 40 },
    // Masterwork carving everywhere: a frieze along the walls, ornate columns, the centrepiece.
    { sprite: P.carvedFrieze(W - 72), x: 36, y: 26 },
    { sprite: P.ornateColumn(190), x: 88, y: 46 },
    { sprite: P.ornateColumn(190), x: 362, y: 46 },
    { sprite: P.MASTERWORK, x: 234, y: FLOOR - 128 },
    // The way in from the middle tiers, and a plaque of writing beside it.
    { sprite: ARCHWAY, x: 16, y: FLOOR - 38 },
    { sprite: P.PLAQUE, x: 44, y: 168 },
    // The feast.
    { sprite: P.feastTable(130), x: 104, y: FLOOR - 18 },
    // The fountain.
    { sprite: P.GEAR_FOUNTAIN, x: 310, y: FLOOR - 40 },
    // Stairs up to the library.
    { sprite: handrail(STAIR_STEPS, 8), x: MEZZ_X - STAIR_STEPS * 8, y: FLOOR - STAIR_STEPS * 8 - 20 },
    { sprite: railing(96), x: MEZZ_X + 116, y: MEZZ - 8 },
    // The library on the mezzanine.
    { sprite: P.bookcase(60, 58), x: 494, y: MEZZ - 58 },
    { sprite: P.bookcase(40, 58), x: 640, y: MEZZ - 58 },
    { sprite: P.READING_DESK, x: 596, y: MEZZ - 20 },
    // The lounge beneath it.
    { sprite: P.CUSHION_SEAT, x: 506, y: FLOOR - 14 },
    { sprite: P.CUSHION_SEAT, x: 560, y: FLOOR - 14 },
    // Ways on: out along the branch to the seed grove, up to the Ascension gate.
    { sprite: ARCHWAY, x: 686, y: FLOOR - 38 },
    { sprite: ARCHWAY, x: 684, y: MEZZ - 38 },
    // Light cells in brass sconces.
    ...[[58, 186], [370, 176], [690, 110], [480, 200]].map(([x, y]) => ({ sprite: P.CELL_SCONCE, x: x!, y: y! })),
  ],

  features: [
    { type: 'mob', delay: 2500, speed: 62, showIf: 'chased' }, // Day 7: the mob, on your heels all the way to the top
    { type: 'hint', x: 80, y: FLOOR, reach: 60, text: '"Don\'t touch anything," your escort mutters.', showIf: 'escorted' },
    { type: 'drip', x: 328, y: 208, floorY: FLOOR - 9 },
    { type: 'drip', x: 332, y: 210, floorY: FLOOR - 9 },
    { type: 'motes', x: 116, top: 20, bottom: FLOOR - 20, halfWidth: 14 }, // dust in the Canopy's light
  ],

  people: [
    // Day 7 (in custody, up): the girl, coming up with you to see you off at the gate.
    { id: 'girl-run', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 40, y: FLOOR, knot: 'day7_girl_runs', showIf: 'girl_runs', follow: true },
    resident('doorman', 1, 80, FLOOR, { knot: 'upper_doorman', flipX: true }),
    resident('diner-1', 0, 112, FLOOR),
    resident('diner-2', 3, 226, FLOOR, { flipX: true }),
    resident('diner-3', 2, 140, FLOOR, { flipX: true, when: ['evening'] }),
    { ...resident('stroller', 2, 360, FLOOR), walkFrames: RESIDENTS[2]!.walk, wander: { from: 280, to: 440 } },
    resident('lounger', 0, 546, FLOOR, { flipX: true }),
    resident('reader', 3, 520, MEZZ, { when: ['morning'] }),
    // Day 5: your escort.
    { id: 'escort', sprite: GUARD.idle[0]!, idleFrames: GUARD.idle, x: 40, y: FLOOR, knot: 'middle_escort', showIf: 'escorted', follow: true },
    { id: 'archivist', sprite: ARCHIVIST.idle[0]!, idleFrames: ARCHIVIST.idle, x: 588, y: MEZZ, knot: 'upper_archivist', flipX: true, when: ['afternoon', 'evening'] },
  ],

  interactables: [
    { id: 'plaque', x: 55, y: FLOOR, reach: 10, label: 'Look', knot: 'upper_plaque' },
    { id: 'feast', x: 168, y: FLOOR, reach: 14, label: 'Look', knot: 'upper_feast' },
    { id: 'masterwork', x: 270, y: FLOOR, reach: 12, label: 'Look', knot: 'upper_masterwork' },
    { id: 'fountain', x: 330, y: FLOOR, reach: 10, label: 'Look', knot: 'upper_fountain' },
    { id: 'books', x: 530, y: MEZZ, reach: 10, label: 'Look', knot: 'upper_books' },
  ],

  acoustics: 'hall',
  ambience: [{ sound: 'wind', volume: 0.3 }, { sound: 'clock', volume: 0.35 }, { sound: 'footfall', volume: 0.3, when: ['morning', 'afternoon', 'evening'] }, { sound: 'chatter', volume: 0.2, when: ['morning', 'afternoon', 'evening'] }],
  exits: [
    { id: 'to-middle-tiers', x: 27, y: FLOOR, reach: 12, to: 'middle-tiers' },
    { id: 'to-seed-grove', x: 697, y: FLOOR, reach: 12, to: 'seed-grove' },
    { id: 'to-ascension-gate', x: 695, y: MEZZ, reach: 12, to: 'ascension-gate' },
  ],
};
