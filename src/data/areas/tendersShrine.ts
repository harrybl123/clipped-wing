import { ELDERS, GIRL, GUARD, PREACHER, TENDER } from '../../ui/characters';
import { SHADES as S } from '../../ui/pixelArt';
import { LAMP } from '../../ui/sprites';
import { beam } from './friendsHomeProps';
import { BOWL, CANDLE, JAR, shelf, STOOL, UNFINISHED_BIRD } from './homeProps';
import { ARCHWAY, BANNER } from './offeringFloorProps';
import * as P from './tendersShrineProps';
import type { AreaDefinition, Person } from './types';

// The Tender's shrine: where the Tender works and meets the elders (Day 6: you overhear a meeting;
// Night 6: the interrogation). Official and a little grand for the roots. Left: the Tender's desk
// and tally boards. Middle: a single stool under a lamp, facing the council (where you'll be
// questioned), beside a grate in the floor (the back routes are beneath). Right: a dais with the
// elders' high chairs under a blessing enshrined in the wall. Birds are carved along the beam, in bare wood.
// The Tender works here in the afternoon (rites on the offering floor morning and evening);
// the elders meet in the afternoon for now. Empty at night. See docs/areas/tenders-shrine.md.

const FLOOR = 236;
const DAIS = 220;
const AFTERNOON: Person['when'] = ['afternoon'];

const elder = (i: number, x: number): Person => ({
  id: `elder-${i}`,
  sprite: ELDERS[i]!.idle[0]!,
  idleFrames: ELDERS[i]!.idle,
  x,
  y: DAIS,
  flipX: true,
  when: AFTERNOON,
  ...(i === 1 ? { knot: 'shrine_elder' } : {}),
});

const CHAIRS = [300, 330, 360, 390];

export const tendersShrine: AreaDefinition = {
  id: 'tenders-shrine',
  name: "the Tender's shrine",
  width: 480,
  height: 270,
  cavity: { x: 12, y: 28, width: 456, height: FLOOR - 28, radius: 30 },
  ambient: 0.85,
  playerStart: { x: 120, y: FLOOR },

  solids: [
    { x: 0, y: FLOOR, width: 480, height: 270 - FLOOR },
    // The dais: two steps up.
    { x: 262, y: DAIS + 8, width: 206, height: 8, oneWay: true },
    { x: 270, y: DAIS, width: 198, height: 8, oneWay: true },
    { x: 0, y: 0, width: 12, height: 270, invisible: true },
    { x: 468, y: 0, width: 12, height: 270, invisible: true },
  ],

  lights: [
    { x: 360, y: 134, colour: S.cyan, radius: 60, radiusY: 50, strength: 0.32 }, // the enshrined blessing
    { x: 218, y: 196, colour: S.amber, radius: 32, radiusY: 44, strength: 0.4 }, // lamp over the stool
    { x: 364, y: 80, colour: S.amber, radius: 60, radiusY: 40, strength: 0.24 }, // chandelier
    { x: 74, y: 220, colour: S.amber, radius: 30, radiusY: 22, strength: 0.3 }, // candle on the desk
  ],

  lines: [
    { from: { x: 218, y: 28 }, to: { x: 218, y: 176 }, colour: S.deep }, // lamp cord over the stool
    { from: { x: 364, y: 28 }, to: { x: 364, y: 66 }, colour: S.deep }, // chandelier chain
  ],

  props: [
    // A beam with birds carved along it (bare wood: only real birds, the offerings, are red).
    { sprite: beam(420), x: 30, y: 56 },
    ...Array.from({ length: 12 }, (_, i) => ({ sprite: UNFINISHED_BIRD, x: 44 + i * 34, y: 50 })),
    { sprite: P.pillar(172), x: 150, y: 64 },
    { sprite: P.pillar(156), x: 272, y: 64 },
    // The way in, from the offering floor.
    { sprite: ARCHWAY, x: 16, y: FLOOR - 38 },
    // The Tender's desk and records.
    { sprite: P.tallyBoard(1), x: 46, y: 150 },
    { sprite: P.tallyBoard(2), x: 66, y: 146 },
    { sprite: P.tallyBoard(3), x: 86, y: 152 },
    { sprite: P.DESK, x: 52, y: FLOOR - 14 },
    { sprite: CANDLE, x: 72, y: FLOOR - 19 },
    { sprite: STOOL, x: 94, y: FLOOR - 8 },
    { sprite: shelf(34), x: 104, y: 186 },
    { sprite: JAR, x: 107, y: 180 },
    { sprite: JAR, x: 114, y: 180 },
    { sprite: BOWL, x: 122, y: 184 },
    { sprite: JAR, x: 129, y: 180 },
    { sprite: BANNER, x: 124, y: 96 },
    // The stool, alone under a lamp, facing the council; the grate in the floor beside it.
    { sprite: STOOL, x: 214, y: FLOOR - 8 },
    { sprite: LAMP, x: 217, y: 176 },
    { sprite: P.FLOOR_GRATE, x: 170, y: FLOOR },
    // The council: high chairs on the dais, the blessing enshrined above them.
    { sprite: P.ENSHRINED_BLESSING, x: 340, y: 118 },
    { sprite: P.CHANDELIER, x: 358, y: 66 },
    ...CHAIRS.map((x) => ({ sprite: P.HIGH_CHAIR, x: x - 7, y: DAIS - 34 })),
    { sprite: BANNER, x: 424, y: 96 },
    // The passage up towards the trunk.
    { sprite: ARCHWAY, x: 442, y: DAIS - 38 },
  ],

  features: [],

  people: [
    // Day 7 (in custody, up): the girl, coming up with you to see you off at the gate.
    { id: 'girl-run', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 182, y: FLOOR, knot: 'day7_girl_runs', showIf: 'girl_runs', follow: true },
    { id: 'tender', sprite: TENDER.idle[0]!, idleFrames: TENDER.idle, x: 110, y: FLOOR, knot: 'shrine_tender', flipX: true, when: AFTERNOON },
    // Day 4 morning: he's sent for you, and waits by the stool under the lamp.
    { id: 'tender-summons', sprite: TENDER.idle[0]!, idleFrames: TENDER.idle, x: 244, y: FLOOR, knot: 'shrine_tender_summons', flipX: true, when: ['morning'], showIf: 'tender_waiting' },
    ...CHAIRS.map((x, i) => elder(i, x)),
    // Night 6: the interrogation. The elders on the dais, the preacher, the Tender at his desk, guards at the door; the girl brought in.
    ...CHAIRS.map((x, i): Person => ({ ...elder(i, x), id: `elder-night-${i}`, knot: undefined, when: ['night'], showIf: 'interrogating' })),
    { id: 'preacher-night', sprite: PREACHER.idle[0]!, idleFrames: PREACHER.idle, x: 286, y: DAIS, flipX: true, when: ['night'], showIf: 'interrogating' },
    { id: 'tender-night', sprite: TENDER.idle[0]!, idleFrames: TENDER.idle, x: 96, y: FLOOR, when: ['night'], showIf: 'interrogating' },
    { id: 'guard-night-0', sprite: GUARD.idle[0]!, idleFrames: GUARD.idle, x: 44, y: FLOOR, when: ['night'], showIf: 'interrogating' },
    { id: 'guard-night-1', sprite: GUARD.idle[0]!, idleFrames: GUARD.idle, x: 196, y: FLOOR, flipX: true, when: ['night'], showIf: 'interrogating' },
    { id: 'girl-shrine', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 160, y: FLOOR, when: ['night'], hidden: true },
    { id: 'preacher', sprite: PREACHER.idle[0]!, idleFrames: PREACHER.idle, x: 286, y: DAIS, flipX: true, knot: 'shrine_preacher', when: AFTERNOON },
  ],

  interactables: [
    { id: 'tallies', x: 64, y: FLOOR, reach: 10, label: 'Look', knot: 'shrine_tallies' },
    { id: 'stool', x: 218, y: FLOOR, reach: 8, label: 'Look', knot: 'shrine_stool' },
    { id: 'blessing', x: 345, y: DAIS, reach: 8, label: 'Look', knot: 'shrine_blessing' },
  ],

  ambience: [{ sound: 'room', volume: 0.35 }, { sound: 'hum', volume: 0.18 }, { sound: 'creaks', volume: 0.15 }, { sound: 'crowd', volume: 0.3, showIf: 'interrogating' }],
  exits: [
    { id: 'to-offering-floor', x: 27, y: FLOOR, reach: 12, to: 'offering-floor' },
    { id: 'down-to-back-routes', x: 182, y: FLOOR, reach: 8, to: 'back-routes' },
    { id: 'up-to-trunk', x: 453, y: DAIS, reach: 12, to: 'trunk-climb' },
  ],
};
