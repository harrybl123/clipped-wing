import { ARCHIVIST, GUARD, RESIDENTS } from '../../ui/characters';
import { SHADES as S } from '../../ui/pixelArt';
import { LAMP } from '../../ui/sprites';
import * as P from './archiveProps';
import { handrail } from './friendsHomeProps';
import { ARCHWAY } from './offeringFloorProps';
import { CELL_LANTERN, railing } from './rootsMarketProps';
import { bookcase, READING_DESK } from './upperHallsProps';
import type { AreaDefinition, Person, Solid } from './types';

// The archive: the Ascension records (Night 5: with the archivist as an ally, a search through the
// records; without, a heist that fails). Quiet, dusty and lamplit. A gallery runs along the wall of
// records (a plaque for each of the Ascended, each with the maker's mark); beneath it, record
// drawers, reading desks and the archivist's desk. The scavenged index engine by the stairs finds
// records. The back hatch in the floor comes up from the trunk climb (the only unguarded way in);
// the gallery's far door leads to the Ascension gate. A watchman walks it at night.
// See docs/areas/archive.md.

const W = 640;
const FLOOR = 236;
const GALLERY = 140;
const GALLERY_X = 212;
const DAY: Person['when'] = ['morning', 'afternoon'];

/** Stairs rising right to the gallery. */
function stairs(): Solid[] {
  const count = (FLOOR - GALLERY) / 8;
  return Array.from({ length: count - 1 }, (_, i) => {
    const top = FLOOR - 8 * (i + 1);
    const x = GALLERY_X - 8 * (count - 1 - i);
    return { x, y: top, width: GALLERY_X - x, height: FLOOR - top, oneWay: true };
  });
}
const STAIR_STEPS = (FLOOR - GALLERY) / 8 - 1;

const scribe = (id: string, look: number, x: number): Person => ({
  id,
  sprite: RESIDENTS[look]!.idle[0]!,
  idleFrames: RESIDENTS[look]!.idle,
  x,
  y: FLOOR,
  when: DAY,
});

export const archive: AreaDefinition = {
  id: 'archive',
  name: 'the archive',
  width: W,
  height: 270,
  cavity: { x: 12, y: 12, width: W - 24, height: FLOOR - 12, radius: 30 },
  ambient: 0.85,
  playerStart: { x: 60, y: FLOOR },

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    ...stairs(),
    { x: GALLERY_X, y: GALLERY, width: W - 12 - GALLERY_X, height: 8, oneWay: true },
    { x: 0, y: 0, width: 12, height: 270, invisible: true },
    { x: W - 12, y: 0, width: 12, height: 270, invisible: true },
  ],

  lights: [
    { x: 420, y: 36, colour: S.white, radius: 50, radiusY: 60, strength: 0.26 }, // the round window
    { x: 88, y: 190, colour: S.cyan, radius: 30, strength: 0.28 }, // the index engine's lens
    { x: 300, y: 200, colour: S.amber, radius: 40, radiusY: 30, strength: 0.3 }, // reading lamps
    { x: 460, y: 200, colour: S.amber, radius: 40, radiusY: 30, strength: 0.3 },
    { x: 574, y: 208, colour: S.amber, radius: 30, radiusY: 24, strength: 0.3 }, // the archivist's desk
    { x: 124, y: 150, colour: S.amber, radius: 40, strength: 0.24 },
    { x: 360, y: 90, colour: S.amber, radius: 120, radiusY: 50, strength: 0.14 }, // over the records
  ],

  lines: [
    { from: { x: 300, y: GALLERY + 8 }, to: { x: 300, y: 176 }, colour: S.deep }, // lamp cords under the gallery
    { from: { x: 460, y: GALLERY + 8 }, to: { x: 460, y: 176 }, colour: S.deep },
    { from: { x: 124, y: 12 }, to: { x: 124, y: 140 }, colour: S.deep },
  ],

  props: [
    // The records: a wall of plaques above the gallery, the round window among them.
    { sprite: P.recordWall(10, 7), x: 226, y: 36 },
    { sprite: P.ROUND_WINDOW, x: 403, y: 16 },
    { sprite: P.recordWall(5, 7), x: 452, y: 36 },
    { sprite: bookcase(40, 90), x: 580, y: GALLERY - 90 },
    { sprite: P.libraryLadder(84), x: 560, y: GALLERY - 84 },
    { sprite: railing(W - 12 - GALLERY_X - 40), x: GALLERY_X + 20, y: GALLERY - 8 },
    // The way up from the trunk climb, and the index engine.
    { sprite: P.TRAPDOOR, x: 26, y: FLOOR },
    { sprite: LAMP, x: 123, y: 140 },
    { sprite: bookcase(76, 72), x: 32, y: 50 }, // wall shelves of older records
    { sprite: P.drawers(41, 29), x: 136, y: 70 },
    { sprite: P.RECORD_PILE, x: 20, y: FLOOR - 6 },
    { sprite: P.INDEX_ENGINE, x: 62, y: FLOOR - 64 },
    { sprite: handrail(STAIR_STEPS, 8), x: GALLERY_X - STAIR_STEPS * 8, y: FLOOR - STAIR_STEPS * 8 - 20 },
    // Beneath the gallery: record drawers, reading desks, the archivist's desk.
    { sprite: P.drawers(61, 50), x: 220, y: FLOOR - 50 },
    { sprite: READING_DESK, x: 286, y: FLOOR - 20 },
    { sprite: LAMP, x: 299, y: 176 },
    { sprite: P.drawers(51, 43), x: 330, y: FLOOR - 43 },
    { sprite: P.drawers(41, 36), x: 390, y: FLOOR - 36 },
    { sprite: READING_DESK, x: 446, y: FLOOR - 20 },
    { sprite: LAMP, x: 459, y: 176 },
    { sprite: P.RECORD_PILE, x: 490, y: FLOOR - 6 },
    { sprite: READING_DESK, x: 560, y: FLOOR - 20 },
    { sprite: CELL_LANTERN, x: 520, y: 170 },
    // The far door on the gallery, towards the Ascension gate.
    { sprite: ARCHWAY, x: 604, y: GALLERY - 38 },
  ],

  features: [
    // Day 5 night, stealing: the watchman's round with his lantern (seen: back to the hatch).
    { type: 'watch', from: 220, to: 600, y: FLOOR, speed: 22, range: 70, pause: 2000, reset: { x: 60, y: FLOOR }, showIf: 'stealing' },
    { type: 'motes', x: 420, top: 30, bottom: FLOOR - 10, halfWidth: 16 }, // dust in the window's light
  ],

  people: [
    { id: 'archivist', sprite: ARCHIVIST.idle[0]!, idleFrames: ARCHIVIST.idle, x: 590, y: FLOOR, knot: 'archive_archivist', flipX: true, when: ['morning'] },
    scribe('scribe-1', 3, 306),
    scribe('scribe-2', 0, 470),
    { id: 'watchman', sprite: GUARD.idle[0]!, idleFrames: GUARD.idle, x: 360, y: FLOOR, when: ['night'], wander: { from: 220, to: 600 }, walkFrames: GUARD.idle, hideIf: 'stealing' },
    // Day 5 night: the archivist, waiting for you by the index engine (you told him), or catching you at the drawers (you didn't).
    // Day 7 afternoon (at home under guard): he'll see you, if he's your ally.
    { id: 'archivist-goodbye', sprite: ARCHIVIST.idle[0]!, idleFrames: ARCHIVIST.idle, x: 590, y: FLOOR, knot: 'archive_archivist_goodbye', flipX: true, when: ['afternoon'], showIf: 'archivist_goodbye' },
    { id: 'archivist-night', sprite: ARCHIVIST.idle[0]!, idleFrames: ARCHIVIST.idle, x: 116, y: FLOOR, knot: 'archive_archivist', when: ['night'], showIf: 'archivist_waiting' },
    { id: 'archivist-catch', sprite: ARCHIVIST.idle[0]!, idleFrames: ARCHIVIST.idle, x: 400, y: FLOOR, knot: 'archive_archivist_catch', flipX: true, when: ['night'], hidden: true },
  ],

  interactables: [
    { id: 'index-engine', x: 86, y: FLOOR, reach: 12, label: 'Look', knot: 'archive_index_engine' },
    { id: 'drawers', x: 360, y: FLOOR, reach: 10, label: 'Search', knot: 'archive_drawers' },
    { id: 'records', x: 330, y: GALLERY, reach: 30, label: 'Look', knot: 'archive_records' },
    { id: 'newest-record', x: 520, y: GALLERY, reach: 10, label: 'Look', knot: 'archive_newest_record' },
  ],

  ambience: [{ sound: 'room', volume: 0.25 }, { sound: 'engine', volume: 0.4 }, { sound: 'creaks', volume: 0.15 }],
  exits: [
    { id: 'down-to-trunk-climb', x: 38, y: FLOOR, reach: 10, to: 'trunk-climb' },
    { id: 'to-ascension-gate', x: 615, y: GALLERY, reach: 12, to: 'ascension-gate' },
  ],
};
