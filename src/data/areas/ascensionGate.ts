import { GUARD, MASTER, PREACHER, RESIDENTS, VILLAGERS } from '../../ui/characters';
import { SHADES as S } from '../../ui/pixelArt';
import * as P from './ascensionGateProps';
import { handrail } from './friendsHomeProps';
import { ARCHWAY, BANNER, tubeColumn } from './offeringFloorProps';
import { canopyOpening } from './seedGroveProps';
import type { AreaDefinition, Person, Solid } from './types';

// The Ascension gate: high on the tube, where the Ascension happens (Day 1 evening: a celebrated
// master is given to the tube; Day 7: you may jump in front of everyone). The tube rises through
// the middle into the Canopy's glare. Stairs climb both sides to a dais before the gate, a riveted
// metal opening in the tube's wall, lit from within and flanked by two great carved wings. Braziers
// burn on the dais; balconies either side hold the crowd for the ceremonies. The direction of the
// Day 7 chase is up, to here. See docs/areas/ascension-gate.md.

const W = 560;
const H = 330;
const FLOOR = 300;
const DAIS = 204;
const DAIS_L = 216;
const DAIS_R = 344;
const BALCONY = 236;
const TUBE_X = 264;
const CEREMONY: Person['when'] = ['evening'];

/** Stairs up to the dais: rising right on the left side, rising left on the right. */
function stairs(): Solid[] {
  const count = (FLOOR - DAIS) / 8;
  const out: Solid[] = [];
  for (let i = 0; i < count - 1; i++) {
    const top = FLOOR - 8 * (i + 1);
    const left = DAIS_L - 8 * (count - 1 - i);
    out.push({ x: left, y: top, width: DAIS_L - left, height: FLOOR - top, oneWay: true });
    out.push({ x: DAIS_R, y: top, width: 8 * (count - 1 - i), height: FLOOR - top, oneWay: true });
  }
  return out;
}
const STEPS = (FLOOR - DAIS) / 8 - 1;
const RAIL = handrail(STEPS, 8);
const RAIL_MIRRORED = { rows: RAIL.rows.map((r) => [...r].reverse().join('')), colours: RAIL.colours };

const onlooker = (id: string, x: number, y: number, i: number): Person => {
  const look = i % 2 === 0 ? RESIDENTS[i % RESIDENTS.length]! : VILLAGERS[i % VILLAGERS.length]!;
  return { id, sprite: look.idle[0]!, idleFrames: look.idle, x, y, flipX: x > TUBE_X, when: CEREMONY };
};

export const ascensionGate: AreaDefinition = {
  id: 'ascension-gate',
  name: 'the Ascension gate',
  width: W,
  height: H,
  cavity: { x: 12, y: 20, width: W - 24, height: FLOOR - 20, radius: 40 },
  ambient: 0.95,
  playerStart: { x: 60, y: FLOOR },

  solids: [
    { x: 0, y: FLOOR, width: W, height: H - FLOOR },
    ...stairs(),
    { x: DAIS_L, y: DAIS, width: DAIS_R - DAIS_L, height: 8, oneWay: true }, // the dais
    { x: 12, y: BALCONY, width: 88, height: 8, oneWay: true, invisible: true }, // balconies for the crowd
    { x: W - 100, y: BALCONY, width: 88, height: 8, oneWay: true, invisible: true },
    { x: 0, y: 0, width: 12, height: H, invisible: true },
    { x: W - 12, y: 0, width: 12, height: H, invisible: true },
  ],

  lights: [
    { x: TUBE_X + 16, y: 40, colour: S.white, radius: 150, radiusY: 60, strength: 0.34 }, // the Canopy's glare
    { x: TUBE_X + 16, y: 170, colour: S.cyan, radius: 90, radiusY: 110, strength: 0.34 }, // the tube and the gate
    { x: DAIS_L + 8, y: DAIS - 12, colour: S.amber, radius: 30, strength: 0.34 }, // braziers
    { x: DAIS_R - 8, y: DAIS - 12, colour: S.amber, radius: 30, strength: 0.34 },
    { x: 60, y: 260, colour: S.amber, radius: 50, radiusY: 30, strength: 0.2 },
    { x: W - 60, y: 260, colour: S.amber, radius: 50, radiusY: 30, strength: 0.2 },
  ],

  lines: [],

  props: [
    // The tube rising into the Canopy's glare, split around the dais plank.
    { sprite: canopyOpening(300), x: TUBE_X + 16 - 150, y: 20 },
    { sprite: tubeColumn(32, DAIS - 20), x: TUBE_X, y: 20 },
    { sprite: tubeColumn(32, FLOOR - DAIS - 8), x: TUBE_X, y: DAIS + 8 },
    // The gate and its wings.
    { sprite: P.carvedWing(false), x: TUBE_X - 72, y: 116 },
    { sprite: P.carvedWing(true), x: TUBE_X + 44, y: 116 },
    { sprite: P.ASCENSION_GATE, x: TUBE_X - 12, y: DAIS - 72 },
    { sprite: RAIL, x: DAIS_L - STEPS * 8, y: FLOOR - STEPS * 8 - 20 },
    { sprite: RAIL_MIRRORED, x: DAIS_R, y: FLOOR - STEPS * 8 - 20 },
    { sprite: P.BRAZIER, x: DAIS_L + 4, y: DAIS - 8 },
    { sprite: P.BRAZIER, x: DAIS_R - 12, y: DAIS - 8 },
    { sprite: BANNER, x: 150, y: 60 },
    { sprite: BANNER, x: W - 162, y: 60 },
    // Balconies for the crowd, and the ways in.
    { sprite: P.balcony(88), x: 12, y: BALCONY - 8 },
    { sprite: P.balcony(88), x: W - 100, y: BALCONY - 8 },
    { sprite: ARCHWAY, x: 16, y: FLOOR - 38 },
    { sprite: ARCHWAY, x: W - 38, y: FLOOR - 38 },
  ],

  features: [
    { type: 'mob', delay: 2500, speed: 62, showIf: 'chased' }, // Day 7: the mob, on your heels all the way to the top
    { type: 'motes', x: TUBE_X + 16, top: 20, bottom: FLOOR, halfWidth: 12 },
    { type: 'fire', x: DAIS_L + 8, y: DAIS - 8 },
    { type: 'fire', x: DAIS_R - 8, y: DAIS - 8 },
  ],

  people: [
    // Day 1: the master, brought on by the Ascension scene (story/day1.ink, #show:master).
    { id: 'master', sprite: MASTER.idle[0]!, idleFrames: MASTER.idle, x: 140, y: FLOOR, when: CEREMONY, hidden: true },
    // (Day 7: they've gone down to join the mob.)
    { id: 'gate-guard-left', sprite: GUARD.idle[0]!, idleFrames: GUARD.idle, x: 116, y: FLOOR, hideIf: 'chased' },
    { id: 'gate-guard-right', sprite: GUARD.idle[0]!, idleFrames: GUARD.idle, x: W - 116, y: FLOOR, flipX: true, knot: 'gate_guard', hideIf: 'chased' },
    { id: 'preacher', sprite: PREACHER.idle[0]!, idleFrames: PREACHER.idle, x: DAIS_R - 26, y: DAIS, flipX: true, when: CEREMONY },
    // The crowd, only for the ceremony.
    ...[40, 60, 80].map((x, i) => onlooker(`balcony-left-${i}`, x, BALCONY, i)),
    ...[W - 80, W - 60, W - 40].map((x, i) => onlooker(`balcony-right-${i}`, x, BALCONY, i + 3)),
    ...[40, 58, 76, 94].map((x, i) => onlooker(`floor-left-${i}`, x, FLOOR, i + 6)),
    ...[W - 94, W - 76, W - 58, W - 40].map((x, i) => onlooker(`floor-right-${i}`, x, FLOOR, i + 10)),
  ],

  interactables: [{ id: 'gate', x: TUBE_X + 16, y: DAIS, reach: 16, label: 'Look', knot: 'gate_gate' }],

  exits: [
    { id: 'to-upper-halls', x: 27, y: FLOOR, reach: 12, to: 'upper-halls' },
    { id: 'to-archive', x: W - 27, y: FLOOR, reach: 12, to: 'archive' },
  ],
};
