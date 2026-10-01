import { FRIEND, GIRL, GUARD, MUM, TENDER, VILLAGERS } from '../../ui/characters';
import { SHADES as S } from '../../ui/pixelArt';
import { BIRD, FUNGI, LAMP } from '../../ui/sprites';
import * as P from './offeringFloorProps';
import type { AreaDefinition, Person, Solid } from './types';

// The offering floor: the base of the tube and the hub of the roots. A stepped platform rises
// from both sides to a landing where the tube comes down into a carved basin; the Tender stands
// there under a lamp. A crowd gathers for the morning rite and evening ceremony; otherwise it's
// quiet. See docs/areas/offering-floor.md. Layout is placeholder; story is in
// story/offering-floor.ink.

const FLOOR = 236;
const LANDING = { x: 206, y: 156, width: 68 };
const STEP = { rise: 8, run: 10, count: 9 };
const TUBE_X = 240;

/** Stairs up both sides of the landing: each step is a one-way block reaching down to the floor. */
function stairs(): Solid[] {
  const steps: Solid[] = [];
  for (let i = 0; i < STEP.count; i++) {
    const top = FLOOR - STEP.rise * (i + 1);
    const leftX = LANDING.x - STEP.run * (STEP.count - i);
    const rightEnd = LANDING.x + LANDING.width + STEP.run * (STEP.count - i);
    steps.push({ x: leftX, y: top, width: LANDING.x - leftX, height: FLOOR - top, oneWay: true });
    steps.push({ x: LANDING.x + LANDING.width, y: top, width: rightEnd - (LANDING.x + LANDING.width), height: FLOOR - top, oneWay: true });
  }
  return steps;
}

const CEREMONY: Person['when'] = ['morning', 'evening'];
/** Day 6: your bird with a bite out of it, teeth marks round the edge. */
const BITTEN_BIRD = {
  rows: ['......##..', '.....#o##.', '....d#####', '...d.####.', '....d###..', '..........'],
  colours: { '#': S.red, d: S.redDark, o: S.shadow },
};
/** Day 4: a ring chalked on the floor at the foot of the stairs, for you to stand in alone. */
const CHALK_RING = { rows: ['...wwwwwwwwww...', '.ww..........ww.', 'w..............w', '.ww..........ww.', '...wwwwwwwwww...'], colours: { w: S.light } };

/** The crowd for the rite and the ceremony: both sides of the floor, facing the tube. */
function crowd(): Person[] {
  const left = [44, 56, 68, 80];
  const right = [400, 412, 424, 436];
  return [...left.map((x) => ({ x, flipX: false })), ...right.map((x) => ({ x, flipX: true }))].map(({ x, flipX }, i) => {
    const look = VILLAGERS[(i * 3) % VILLAGERS.length]!;
    // A few of them you can talk to (what they say depends on the day).
    const knot = ({ 2: 'offering_floor_crowd_mother', 5: 'offering_floor_crowd_old_man' } as Record<number, string>)[i];
    return { id: `crowd-${i}`, sprite: look.idle[0]!, idleFrames: look.idle, x, y: FLOOR, flipX, when: CEREMONY, ...(knot ? { knot } : {}) };
  });
}

/** More people for the rites once word has got round (Day 3 on): on the lower stairs either side. */
function extraCrowd(): Person[] {
  return [1, 3, 5].flatMap((i, n) => {
    const top = FLOOR - STEP.rise * (i + 1);
    const leftX = LANDING.x - STEP.run * (STEP.count - i) + 5;
    const rightX = LANDING.x + LANDING.width + STEP.run * (STEP.count - i) - 5;
    const look = (k: number) => VILLAGERS[(n * 2 + k) % VILLAGERS.length]!;
    return [
      { id: `crowd-stairs-left-${n}`, sprite: look(0).idle[0]!, idleFrames: look(0).idle, x: leftX, y: top, when: CEREMONY, showIf: 'day3', ...(n === 0 ? { knot: 'offering_floor_crowd_zealot' } : {}) },
      { id: `crowd-stairs-right-${n}`, sprite: look(1).idle[0]!, idleFrames: look(1).idle, x: rightX, y: top, flipX: true, when: CEREMONY, showIf: 'day3' },
    ];
  });
}

export const offeringFloor: AreaDefinition = {
  id: 'offering-floor',
  name: 'the offering floor',
  width: 480,
  height: 270,
  cavity: { x: 12, y: 10, width: 456, height: FLOOR - 10, radius: 36 },
  ambient: 0.75,
  playerStart: { x: 108, y: FLOOR },

  solids: [
    { x: 0, y: FLOOR, width: 480, height: 270 - FLOOR },
    ...stairs(),
    { x: LANDING.x, y: LANDING.y, width: LANDING.width, height: FLOOR - LANDING.y, oneWay: true },
    { x: 0, y: 0, width: 12, height: 270, invisible: true },
    { x: 468, y: 0, width: 12, height: 270, invisible: true },
  ],

  lights: [
    { x: TUBE_X, y: 90, colour: S.cyan, radius: 60, radiusY: 110, strength: 0.4 }, // the tube
    { x: TUBE_X, y: LANDING.y, colour: S.white, radius: 40, radiusY: 14, strength: 0.35 }, // where it meets the basin
    { x: TUBE_X, y: FLOOR, colour: S.cyan, radius: 120, radiusY: 30, strength: 0.25 }, // spill across the floor
    { x: 262, y: 116, colour: S.amber, radius: 36, radiusY: 34, strength: 0.35 }, // the Tender's lamp
    { x: 108, y: 232, colour: S.green, radius: 14, radiusY: 10, strength: 0.3 }, // fungi at the stair feet
    { x: 385, y: 232, colour: S.green, radius: 14, radiusY: 10, strength: 0.3 },
  ],

  lines: [
    { from: { x: 262, y: 10 }, to: { x: 262, y: 113 }, colour: S.deep }, // lamp cord
    { from: { x: 150, y: 10 }, to: { x: 150, y: 13 }, colour: S.dim }, // banner cords
    { from: { x: 330, y: 10 }, to: { x: 330, y: 13 }, colour: S.dim },
  ],

  props: [
    { sprite: P.tubeColumn(16, LANDING.y - 10), x: TUBE_X - 8, y: 10 },
    { sprite: P.CEILING_RING, x: TUBE_X - 16, y: 10 },
    { sprite: P.BASIN, x: TUBE_X - 20, y: LANDING.y - 8 },
    { sprite: P.ARCHWAY, x: 16, y: FLOOR - 38 },
    { sprite: P.ARCHWAY, x: 442, y: FLOOR - 38 },
    { sprite: P.BANNER, x: 144, y: 13 },
    { sprite: P.BANNER, x: 324, y: 13 },
    { sprite: LAMP, x: 261, y: 113 },
    { sprite: P.BLESSING_BASKET, x: 88, y: FLOOR - 8 },
    { sprite: P.BLESSING_BASKET, x: 367, y: FLOOR - 8 },
    { sprite: P.MAT, x: 48, y: FLOOR - 2 },
    { sprite: P.MAT, x: 404, y: FLOOR - 2 },
    { sprite: FUNGI.cluster, x: 104, y: FLOOR - 7 },
    { sprite: FUNGI.droop, x: 383, y: FLOOR - 5 },
  ],

  features: [{ type: 'motes', x: TUBE_X, top: 10, bottom: LANDING.y, halfWidth: 5 }],

  people: [
    // Day 1: the girl in the roots watches you from the edge of the crowd at the morning rite, and slips away if you come close.
    { id: 'girl', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 436, y: FLOOR, flipX: true, when: ['morning'], hideIf: 'rite_done', shy: 70 },
    // The Tender, on the landing under the lamp, watching the tube.
    { id: 'tender', sprite: TENDER.idle[0]!, idleFrames: TENDER.idle, x: 262, y: LANDING.y, knot: 'offering_floor_tender', flipX: true, when: ['morning', 'evening'] }, // afternoons in the shrine
    ...crowd(),
    // Day 2: the thin man in the morning crowd (the outburst; the same man as the afternoon grumbler).
    { id: 'thin-man', sprite: VILLAGERS[2]!.idle[0]!, idleFrames: VILLAGERS[2]!.idle, x: 92, y: FLOOR, when: ['morning'], showIf: 'day2' },
    // Day 2 evening: Mum at the ceremony, and your bird, rejected, in the basin (#show:rejected-bird).
    { id: 'mum-ceremony', sprite: MUM.idle[0]!, idleFrames: MUM.idle, x: 124, y: FLOOR, when: ['evening'], showIf: 'mum_at_ceremony' },
    { id: 'rejected-bird', sprite: BIRD, x: TUBE_X, y: LANDING.y, when: ['evening'], hidden: true },
    // Day 3: word has got round, and the crowd fills the stairs too.
    ...extraCrowd(),
    // Day 3 morning: your friend across the floor (his father pulls him away), and the girl in the archway.
    { id: 'friend-rite', sprite: FRIEND.idle[0]!, idleFrames: FRIEND.idle, x: 412 - 18, y: FLOOR, flipX: true, when: ['morning'], hidden: true },
    { id: 'friend-parent-rite', sprite: VILLAGERS[3]!.idle[0]!, idleFrames: VILLAGERS[3]!.idle, x: 412 - 4, y: FLOOR, flipX: true, when: ['morning'], hidden: true },
    { id: 'girl-rite', sprite: GIRL.idle[0]!, idleFrames: GIRL.idle, x: 444, y: FLOOR, flipX: true, when: ['morning'], hidden: true, knot: 'offering_floor_girl_rite' },
    // Day 4 evening: the chalk ring.
    { id: 'chalk-ring', sprite: CHALK_RING, x: 104, y: FLOOR, when: ['evening'], showIf: 'chalk_ring', knot: 'offering_floor_chalk_ring', label: 'Stand in it' },
    { id: 'bitten-bird', sprite: BITTEN_BIRD, x: TUBE_X, y: LANDING.y, when: ['evening'], hidden: true },
    // Day 5 evening: the guard at your shoulder.
    { id: 'escort-floor', sprite: GUARD.idle[0]!, idleFrames: GUARD.idle, x: 92, y: FLOOR, when: ['evening'], showIf: 'escorted' },
    // Quieter in the afternoon: a couple of people passing through.
    { id: 'grumbler', sprite: VILLAGERS[2]!.idle[0]!, idleFrames: VILLAGERS[2]!.idle, x: 62, y: FLOOR, knot: 'offering_floor_grumbler', when: ['afternoon'] },
    { id: 'passer-by', sprite: VILLAGERS[5]!.idle[0]!, idleFrames: VILLAGERS[5]!.idle, x: 410, y: FLOOR, flipX: true, when: ['afternoon'] },
  ],

  interactables: [
    // The way up to the Ascension (on Ascension Day the whole tree climbs to the gate).
    { id: 'ascension-way', x: 224, y: LANDING.y, reach: 10, label: 'Go up', knot: 'offering_floor_ascension_way' },
    { id: 'tube', x: TUBE_X, y: LANDING.y, reach: 10, label: 'Look', knot: 'offering_floor_tube' },
    { id: 'baskets', x: 95, y: FLOOR, reach: 7, label: 'Look', knot: 'offering_floor_baskets' },
  ],

  exits: [
    { id: 'to-home', x: 27, y: FLOOR, reach: 12, to: 'home' },
    { id: 'to-market', x: 453, y: FLOOR, reach: 12, to: 'roots-market' },
  ],
};
