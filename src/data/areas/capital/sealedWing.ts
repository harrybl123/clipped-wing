import { SHADES as S } from '../../../ui/pixelArt';
import * as P from './citadelProps';
import type { AreaDefinition } from '../types';
import { cast, guard, inStory } from './people';

// The sealed wing (Chapter 3): a door only your father goes through. It hums, and nobody explains it
// (docs/areas/capital/sealed-wing.md). A long corridor behind his study that gets plainer as it goes, the
// gold running out, ending at a seamless door with blue light round its edge. You never get through.

const W = 560;
const FLOOR = 226;
const TOP = 60;

export const sealedWing: AreaDefinition = {
  id: 'sealed-wing',
  name: 'the sealed wing',
  width: W,
  height: 270,
  walls: 'bare',
  cavity: { x: 16, y: TOP, width: W - 32, height: FLOOR - TOP, radius: 2 },
  ambient: 0.7,
  playerStart: { x: 40, y: FLOOR },
  surface: 'stone',
  acoustics: 'tunnel',
  ambience: [
    { sound: 'room', volume: 0.2 },
    { sound: 'hum', volume: 0.7 },
  ],

  solids: [
    { x: 0, y: FLOOR, width: W, height: 270 - FLOOR },
    { x: 0, y: 0, width: 16, height: 270, invisible: true },
    { x: W - 16, y: 0, width: 16, height: 270, invisible: true },
  ],

  lights: [
    { x: 524, y: 190, colour: S.cyan, radius: 100, radiusY: 70, strength: 1 }, // the door's glow, strong enough to show on the marble
    { x: 60, y: 190, colour: S.amber, radius: 60, radiusY: 40, strength: 0.12 }, // from the study behind you
  ],

  lines: [
    // Cables: along the ceiling and down into the door's frame; along the floor and into its foot.
    { from: { x: 16, y: TOP + 4 }, to: { x: 500, y: TOP + 4 }, colour: S.deep },
    { from: { x: 16, y: TOP + 5 }, to: { x: 500, y: TOP + 5 }, colour: S.cyanDeep },
    { from: { x: 500, y: TOP + 4 }, to: { x: 500, y: FLOOR - 68 }, colour: S.deep },
    { from: { x: 501, y: TOP + 5 }, to: { x: 501, y: FLOOR - 68 }, colour: S.cyanDeep },
    { from: { x: 140, y: FLOOR - 2 }, to: { x: 502, y: FLOOR - 2 }, colour: S.deep },
    { from: { x: 140, y: FLOOR - 3 }, to: { x: 502, y: FLOOR - 3 }, colour: S.cyanDeep },
    { from: { x: 260, y: FLOOR - 5 }, to: { x: 502, y: FLOOR - 5 }, colour: S.deep },
  ],

  props: [
    { sprite: P.doorway(24, 46), x: 22, y: FLOOR - 46 },
    // The gold runs out as you go.
    { sprite: P.rug(140), x: 18, y: FLOOR - 3 },
    { sprite: P.STATUE, x: 92, y: FLOOR - 46 },
    // Old doors from the castle, locked for good, set back in the wall.
    { sprite: P.closedDoor(26, 46), x: 210, y: FLOOR - 46 },
    { sprite: P.closedDoor(26, 46), x: 334, y: FLOOR - 46 },
    // The door.
    { sprite: P.SEALED_DOOR, x: 502, y: FLOOR - 68 },
  ],

  features: [
    // Chapter 3, Day 6's night: following your sister down the corridor (designer: the first try didn't work).
    // She looks back three times, each when you're about level with a hiding place behind you: the statue, then
    // the recess of each old door. Keep up between them; when she stops, get into the dark.
    {
      type: 'quarry', people: ['sister-6w'], y: FLOOR, speed: 18, range: 160, lose: 200, reset: { x: 40, y: FLOOR }, showIf: 'c3day6=sealed', done: 'sister_wing6', seen: "Who's there?",
      path: [{ x: 150 }, { x: 186, wait: 1800, look: true }, { x: 300, wait: 1800, look: true }, { x: 424, wait: 2000, look: true }, { x: 486 }],
    },
    { type: 'shadow', x: 82, y: FLOOR, width: 30, showIf: 'c3day6=sealed' }, // behind the statue
    { type: 'shadow', x: 208, y: FLOOR, width: 30, showIf: 'c3day6=sealed' }, // the first old door's recess
    { type: 'shadow', x: 332, y: FLOOR, width: 30, showIf: 'c3day6=sealed' }, // the second's
    { type: 'trigger', x: 430, y: FLOOR, reach: 20, knot: 'c3day6_door', showIf: 'sister_wing6', hideIf: 'door6' },
    // Light running along the cables into the door.
    { type: 'pulse', points: [{ x: 16, y: TOP + 4 }, { x: 500, y: TOP + 4 }, { x: 500, y: FLOOR - 68 }], speed: 150, every: 700, count: 3, colour: S.cyan },
    { type: 'pulse', points: [{ x: 140, y: FLOOR - 3 }, { x: 502, y: FLOOR - 3 }], speed: 130, every: 900, count: 2, colour: S.cyan },
  ],
  people: [
    guard('door-guard', 0, 472, FLOOR, 'c3_guard_sealed', undefined, { flipX: true, hideIf: 'c3day6=follow,sealed' }), // (not at the change of the guard)
    // Chapter 3, Day 6's night: your sister, ahead of you down the corridor; then at the door, her hand on it.
    inStory('sister-6w', 'sister', 150, FLOOR, 'c3day6=sealed', { hideIf: 'sister_wing6' }),
    inStory('sister-6d', 'sister', 488, FLOOR, 'sister_wing6', { hideIf: 'c3day6=done' }),
    // At night, your father, at the door.
    cast('father', 522, FLOOR, { knot: 'sealed_father', when: ['night'], flipX: true }),
    // In the afternoon, the engineer, seeing to the cables.
    cast('engineer', 300, FLOOR, { knot: 'sealed_engineer', when: ['afternoon'] }),
  ],
  interactables: [
    { id: 'statue', x: 102, y: FLOOR, reach: 14, label: 'Look', knot: 'sealed_statue' },
    { id: 'cables', x: 250, y: FLOOR, reach: 14, label: 'Look', knot: 'sealed_cables' },
    { id: 'door', x: 506, y: FLOOR, reach: 10, label: 'Look', knot: 'sealed_door' },
  ],

  exits: [{ id: 'to-study', x: 34, y: FLOOR, reach: 12, to: 'fathers-study' }],
};
